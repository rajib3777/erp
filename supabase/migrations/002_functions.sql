-- ==============================================================================
-- NEXUS ERP DATABASE ARCHITECTURE: 002_FUNCTIONS.SQL
-- Enterprise-grade Atomic Transaction RPC Functions for PostgreSQL / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. HELPER: GENERATE SEQUENCE NUMBERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_invoice_number(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    today_str TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    rand_suffix TEXT := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
BEGIN
    RETURN prefix || '-' || today_str || '-' || rand_suffix;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 2. ATOMIC SALE TRANSACTION: process_sale
-- Validates stock, prevents negative inventory, deducts quantities, records sale,
-- records sale items, creates stock movement ledger entries, updates receivables,
-- records financial transaction, and updates account balance in ONE ATOMIC COMMIT.
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_sale(
    p_customer_id UUID,
    p_items JSONB, -- Array of objects: [{"product_id": "...", "quantity": 10, "unit_price": 120}]
    p_discount NUMERIC DEFAULT 0,
    p_tax NUMERIC DEFAULT 0,
    p_paid_amount NUMERIC DEFAULT 0,
    p_payment_method TEXT DEFAULT 'cash',
    p_account_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_product_id UUID;
    v_qty NUMERIC(12, 2);
    v_unit_price NUMERIC(14, 2);
    v_item_subtotal NUMERIC(14, 2);
    v_calculated_subtotal NUMERIC(14, 2) := 0;
    v_grand_total NUMERIC(14, 2);
    v_due_amount NUMERIC(14, 2);
    v_payment_status payment_status;
    v_invoice_num TEXT;
    v_sale_id UUID;
    v_product RECORD;
    v_new_stock NUMERIC(12, 2);
    v_new_acc_balance NUMERIC(14, 2);
    v_tx_num TEXT;
BEGIN
    -- 1. Validate customer existence
    IF NOT EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Customer not found or inactive';
    END IF;

    -- 2. Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Sale must contain at least one item';
    END IF;

    -- 3. Pre-validate stock availability for all items to guarantee atomicity
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be strictly greater than 0';
        END IF;

        IF v_unit_price < 0 THEN
            RAISE EXCEPTION 'Item unit price cannot be negative';
        END IF;

        SELECT id, name, sku, current_stock, purchase_cost INTO v_product
        FROM products
        WHERE id = v_product_id
        FOR UPDATE; -- Row lock to prevent race conditions

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', v_product_id;
        END IF;

        IF v_product.current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product "%" (SKU: %). Available: %, Requested: %',
                v_product.name, v_product.sku, v_product.current_stock, v_qty;
        END IF;

        v_item_subtotal := ROUND(v_qty * v_unit_price, 2);
        v_calculated_subtotal := v_calculated_subtotal + v_item_subtotal;
    END LOOP;

    -- 4. Calculate grand total and payment status
    v_grand_total := ROUND(v_calculated_subtotal - COALESCE(p_discount, 0) + COALESCE(p_tax, 0), 2);
    
    IF v_grand_total < 0 THEN
        RAISE EXCEPTION 'Grand total cannot be negative';
    END IF;

    IF p_paid_amount > v_grand_total THEN
        RAISE EXCEPTION 'Paid amount (%) cannot exceed grand total (%)', p_paid_amount, v_grand_total;
    END IF;

    v_due_amount := ROUND(v_grand_total - COALESCE(p_paid_amount, 0), 2);

    IF p_paid_amount >= v_grand_total THEN
        v_payment_status := 'paid';
    ELSIF p_paid_amount > 0 THEN
        v_payment_status := 'partial';
    ELSE
        v_payment_status := 'unpaid';
    END IF;

    -- 5. Validate account if paid amount > 0
    IF p_paid_amount > 0 AND p_account_id IS NULL THEN
        RAISE EXCEPTION 'A financial account must be selected when payment is received';
    END IF;

    -- 6. Generate invoice number & create sale record
    v_invoice_num := generate_invoice_number('INV');

    INSERT INTO sales (
        invoice_number,
        customer_id,
        sale_date,
        subtotal,
        discount,
        tax,
        grand_total,
        paid_amount,
        due_amount,
        payment_status,
        payment_method,
        account_id,
        status,
        notes,
        created_by
    ) VALUES (
        v_invoice_num,
        p_customer_id,
        NOW(),
        v_calculated_subtotal,
        COALESCE(p_discount, 0),
        COALESCE(p_tax, 0),
        v_grand_total,
        COALESCE(p_paid_amount, 0),
        v_due_amount,
        v_payment_status,
        p_payment_method,
        p_account_id,
        'completed',
        p_notes,
        p_user_id
    ) RETURNING id INTO v_sale_id;

    -- 7. Deduct stock and insert sale items & stock movements
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_subtotal := ROUND(v_qty * v_unit_price, 2);

        SELECT purchase_cost INTO v_product FROM products WHERE id = v_product_id;

        -- Insert sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            purchase_cost
        ) VALUES (
            v_sale_id,
            v_product_id,
            v_qty,
            v_unit_price,
            v_item_subtotal,
            v_product.purchase_cost
        );

        -- Atomically deduct product stock
        UPDATE products
        SET current_stock = current_stock - v_qty,
            updated_at = NOW()
        WHERE id = v_product_id
        RETURNING current_stock INTO v_new_stock;

        -- Create stock movement record
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            balance_after,
            reference_type,
            reference_id,
            notes,
            created_by
        ) VALUES (
            v_product_id,
            'sales_out',
            -v_qty,
            v_new_stock,
            'sale',
            v_sale_id,
            'Sold via Invoice #' || v_invoice_num,
            p_user_id
        );
    END LOOP;

    -- 8. Update customer metrics & receivables
    UPDATE customers
    SET total_receivable = total_receivable + v_due_amount,
        total_sales_count = total_sales_count + 1,
        updated_at = NOW()
    WHERE id = p_customer_id;

    -- 9. Record financial transaction if payment was received
    IF p_paid_amount > 0 THEN
        UPDATE accounts
        SET balance = balance + p_paid_amount,
            updated_at = NOW()
        WHERE id = p_account_id
        RETURNING balance INTO v_new_acc_balance;

        v_tx_num := generate_invoice_number('TX');

        INSERT INTO financial_transactions (
            transaction_number,
            account_id,
            type,
            category,
            amount,
            balance_after,
            reference_type,
            reference_id,
            party_type,
            party_id,
            notes,
            created_by
        ) VALUES (
            v_tx_num,
            p_account_id,
            'income',
            'sales_income',
            p_paid_amount,
            v_new_acc_balance,
            'sale',
            v_sale_id,
            'customer',
            p_customer_id,
            'Payment received for Sale Invoice #' || v_invoice_num,
            p_user_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'sale_id', v_sale_id,
        'invoice_number', v_invoice_num,
        'grand_total', v_grand_total,
        'paid_amount', p_paid_amount,
        'due_amount', v_due_amount,
        'payment_status', v_payment_status
    );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 3. ATOMIC PURCHASE TRANSACTION: process_purchase
-- Increases product stock, records purchase, records purchase items,
-- creates stock movement ledger entries, updates payables, records financial
-- transaction, and deducts account balance in ONE ATOMIC COMMIT.
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_purchase(
    p_supplier_id UUID,
    p_items JSONB, -- Array of objects: [{"product_id": "...", "quantity": 50, "unit_cost": 85}]
    p_discount NUMERIC DEFAULT 0,
    p_tax NUMERIC DEFAULT 0,
    p_paid_amount NUMERIC DEFAULT 0,
    p_payment_method TEXT DEFAULT 'cash',
    p_account_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_product_id UUID;
    v_qty NUMERIC(12, 2);
    v_unit_cost NUMERIC(14, 2);
    v_item_subtotal NUMERIC(14, 2);
    v_calculated_subtotal NUMERIC(14, 2) := 0;
    v_grand_total NUMERIC(14, 2);
    v_due_amount NUMERIC(14, 2);
    v_payment_status payment_status;
    v_invoice_num TEXT;
    v_purchase_id UUID;
    v_new_stock NUMERIC(12, 2);
    v_new_acc_balance NUMERIC(14, 2);
    v_tx_num TEXT;
BEGIN
    -- 1. Validate supplier existence
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE id = p_supplier_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Supplier not found or inactive';
    END IF;

    -- 2. Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Purchase must contain at least one item';
    END IF;

    -- 3. Pre-validate items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_cost := (v_item->>'unit_cost')::NUMERIC;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Purchase quantity must be strictly greater than 0';
        END IF;

        IF v_unit_cost < 0 THEN
            RAISE EXCEPTION 'Unit cost cannot be negative';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM products WHERE id = v_product_id) THEN
            RAISE EXCEPTION 'Product with ID % not found', v_product_id;
        END IF;

        v_item_subtotal := ROUND(v_qty * v_unit_cost, 2);
        v_calculated_subtotal := v_calculated_subtotal + v_item_subtotal;
    END LOOP;

    -- 4. Calculate grand total and payment status
    v_grand_total := ROUND(v_calculated_subtotal - COALESCE(p_discount, 0) + COALESCE(p_tax, 0), 2);
    
    IF v_grand_total < 0 THEN
        RAISE EXCEPTION 'Grand total cannot be negative';
    END IF;

    IF p_paid_amount > v_grand_total THEN
        RAISE EXCEPTION 'Paid amount (%) cannot exceed grand total (%)', p_paid_amount, v_grand_total;
    END IF;

    v_due_amount := ROUND(v_grand_total - COALESCE(p_paid_amount, 0), 2);

    IF p_paid_amount >= v_grand_total THEN
        v_payment_status := 'paid';
    ELSIF p_paid_amount > 0 THEN
        v_payment_status := 'partial';
    ELSE
        v_payment_status := 'unpaid';
    END IF;

    -- 5. Validate account if paid amount > 0
    IF p_paid_amount > 0 AND p_account_id IS NULL THEN
        RAISE EXCEPTION 'A financial account must be selected when payment is made';
    END IF;

    -- 6. Generate invoice number & create purchase record
    v_invoice_num := generate_invoice_number('PO');

    INSERT INTO purchases (
        invoice_number,
        supplier_id,
        purchase_date,
        subtotal,
        discount,
        tax,
        grand_total,
        paid_amount,
        due_amount,
        payment_status,
        payment_method,
        account_id,
        status,
        notes,
        created_by
    ) VALUES (
        v_invoice_num,
        p_supplier_id,
        NOW(),
        v_calculated_subtotal,
        COALESCE(p_discount, 0),
        COALESCE(p_tax, 0),
        v_grand_total,
        COALESCE(p_paid_amount, 0),
        v_due_amount,
        v_payment_status,
        p_payment_method,
        p_account_id,
        'completed',
        p_notes,
        p_user_id
    ) RETURNING id INTO v_purchase_id;

    -- 7. Increase stock and insert purchase items & stock movements
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_cost := (v_item->>'unit_cost')::NUMERIC;
        v_item_subtotal := ROUND(v_qty * v_unit_cost, 2);

        -- Insert purchase item
        INSERT INTO purchase_items (
            purchase_id,
            product_id,
            quantity,
            unit_cost,
            subtotal
        ) VALUES (
            v_purchase_id,
            v_product_id,
            v_qty,
            v_unit_cost,
            v_item_subtotal
        );

        -- Update product stock and update latest purchase cost
        UPDATE products
        SET current_stock = current_stock + v_qty,
            purchase_cost = v_unit_cost,
            updated_at = NOW()
        WHERE id = v_product_id
        RETURNING current_stock INTO v_new_stock;

        -- Create stock movement record
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            balance_after,
            reference_type,
            reference_id,
            notes,
            created_by
        ) VALUES (
            v_product_id,
            'purchase_in',
            v_qty,
            v_new_stock,
            'purchase',
            v_purchase_id,
            'Received via Purchase Order #' || v_invoice_num,
            p_user_id
        );
    END LOOP;

    -- 8. Update supplier metrics & payables
    UPDATE suppliers
    SET total_payable = total_payable + v_due_amount,
        total_purchases_count = total_purchases_count + 1,
        updated_at = NOW()
    WHERE id = p_supplier_id;

    -- 9. Record financial transaction if payment was made
    IF p_paid_amount > 0 THEN
        UPDATE accounts
        SET balance = balance - p_paid_amount,
            updated_at = NOW()
        WHERE id = p_account_id
        RETURNING balance INTO v_new_acc_balance;

        v_tx_num := generate_invoice_number('TX');

        INSERT INTO financial_transactions (
            transaction_number,
            account_id,
            type,
            category,
            amount,
            balance_after,
            reference_type,
            reference_id,
            party_type,
            party_id,
            notes,
            created_by
        ) VALUES (
            v_tx_num,
            p_account_id,
            'expense',
            'purchase_expense',
            p_paid_amount,
            v_new_acc_balance,
            'purchase',
            v_purchase_id,
            'supplier',
            p_supplier_id,
            'Payment made for Purchase Order #' || v_invoice_num,
            p_user_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'purchase_id', v_purchase_id,
        'invoice_number', v_invoice_num,
        'grand_total', v_grand_total,
        'paid_amount', p_paid_amount,
        'due_amount', v_due_amount,
        'payment_status', v_payment_status
    );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 4. ATOMIC CUSTOMER PAYMENT: process_customer_payment
-- Reduces customer receivables, increases cash/bank account balance,
-- optionally updates outstanding sale invoice, and creates financial transaction.
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_customer_payment(
    p_customer_id UUID,
    p_amount NUMERIC,
    p_account_id UUID,
    p_payment_method TEXT DEFAULT 'cash',
    p_sale_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_customer RECORD;
    v_sale RECORD;
    v_new_acc_balance NUMERIC(14, 2);
    v_tx_num TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than 0';
    END IF;

    SELECT * INTO v_customer FROM customers WHERE id = p_customer_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer not found';
    END IF;

    IF v_customer.total_receivable < p_amount THEN
        RAISE EXCEPTION 'Payment amount (%) exceeds customer outstanding receivable (%)',
            p_amount, v_customer.total_receivable;
    END IF;

    -- If specific sale invoice is targeted, validate and update it
    IF p_sale_id IS NOT NULL THEN
        SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Specified sale invoice not found';
        END IF;

        IF v_sale.due_amount < p_amount THEN
            RAISE EXCEPTION 'Payment amount (%) exceeds invoice due amount (%)',
                p_amount, v_sale.due_amount;
        END IF;

        UPDATE sales
        SET paid_amount = paid_amount + p_amount,
            due_amount = due_amount - p_amount,
            payment_status = CASE WHEN (due_amount - p_amount) <= 0 THEN 'paid'::payment_status ELSE 'partial'::payment_status END,
            updated_at = NOW()
        WHERE id = p_sale_id;
    END IF;

    -- Reduce customer receivable
    UPDATE customers
    SET total_receivable = total_receivable - p_amount,
        updated_at = NOW()
    WHERE id = p_customer_id;

    -- Increase account balance
    UPDATE accounts
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_account_id
    RETURNING balance INTO v_new_acc_balance;

    -- Record financial transaction
    v_tx_num := generate_invoice_number('TX');

    INSERT INTO financial_transactions (
        transaction_number,
        account_id,
        type,
        category,
        amount,
        balance_after,
        reference_type,
        reference_id,
        party_type,
        party_id,
        notes,
        created_by
    ) VALUES (
        v_tx_num,
        p_account_id,
        'income',
        'customer_payment',
        p_amount,
        v_new_acc_balance,
        'customer_payment',
        p_sale_id,
        'customer',
        p_customer_id,
        COALESCE(p_notes, 'Customer receivable collection from ' || v_customer.name),
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_number', v_tx_num,
        'amount', p_amount,
        'new_receivable', v_customer.total_receivable - p_amount,
        'new_account_balance', v_new_acc_balance
    );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 5. ATOMIC SUPPLIER PAYMENT: process_supplier_payment
-- Reduces supplier payables, decreases cash/bank account balance,
-- optionally updates outstanding purchase order, and creates financial transaction.
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_supplier_payment(
    p_supplier_id UUID,
    p_amount NUMERIC,
    p_account_id UUID,
    p_payment_method TEXT DEFAULT 'cash',
    p_purchase_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_supplier RECORD;
    v_purchase RECORD;
    v_new_acc_balance NUMERIC(14, 2);
    v_tx_num TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than 0';
    END IF;

    SELECT * INTO v_supplier FROM suppliers WHERE id = p_supplier_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier not found';
    END IF;

    IF v_supplier.total_payable < p_amount THEN
        RAISE EXCEPTION 'Payment amount (%) exceeds supplier outstanding payable (%)',
            p_amount, v_supplier.total_payable;
    END IF;

    -- If specific purchase is targeted, validate and update it
    IF p_purchase_id IS NOT NULL THEN
        SELECT * INTO v_purchase FROM purchases WHERE id = p_purchase_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Specified purchase order not found';
        END IF;

        IF v_purchase.due_amount < p_amount THEN
            RAISE EXCEPTION 'Payment amount (%) exceeds purchase due amount (%)',
                p_amount, v_purchase.due_amount;
        END IF;

        UPDATE purchases
        SET paid_amount = paid_amount + p_amount,
            due_amount = due_amount - p_amount,
            payment_status = CASE WHEN (due_amount - p_amount) <= 0 THEN 'paid'::payment_status ELSE 'partial'::payment_status END,
            updated_at = NOW()
        WHERE id = p_purchase_id;
    END IF;

    -- Reduce supplier payable
    UPDATE suppliers
    SET total_payable = total_payable - p_amount,
        updated_at = NOW()
    WHERE id = p_supplier_id;

    -- Decrease account balance
    UPDATE accounts
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_account_id
    RETURNING balance INTO v_new_acc_balance;

    -- Record financial transaction
    v_tx_num := generate_invoice_number('TX');

    INSERT INTO financial_transactions (
        transaction_number,
        account_id,
        type,
        category,
        amount,
        balance_after,
        reference_type,
        reference_id,
        party_type,
        party_id,
        notes,
        created_by
    ) VALUES (
        v_tx_num,
        p_account_id,
        'expense',
        'supplier_payment',
        p_amount,
        v_new_acc_balance,
        'supplier_payment',
        p_purchase_id,
        'supplier',
        p_supplier_id,
        COALESCE(p_notes, 'Supplier payment to ' || v_supplier.name),
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_number', v_tx_num,
        'amount', p_amount,
        'new_payable', v_supplier.total_payable - p_amount,
        'new_account_balance', v_new_acc_balance
    );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 6. ATOMIC STOCK ADJUSTMENT: process_stock_adjustment
-- Manual inventory adjustments (damage, physical audit correction, expired stock).
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_stock_adjustment(
    p_product_id UUID,
    p_adjustment_type TEXT, -- 'addition' or 'deduction'
    p_quantity NUMERIC,
    p_reason TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_product RECORD;
    v_signed_qty NUMERIC(12, 2);
    v_new_stock NUMERIC(12, 2);
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Adjustment quantity must be greater than 0';
    END IF;

    SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF p_adjustment_type = 'deduction' THEN
        IF v_product.current_stock < p_quantity THEN
            RAISE EXCEPTION 'Cannot deduct % units. Current stock is %', p_quantity, v_product.current_stock;
        END IF;
        v_signed_qty := -p_quantity;
    ELSIF p_adjustment_type = 'addition' THEN
        v_signed_qty := p_quantity;
    ELSE
        RAISE EXCEPTION 'Invalid adjustment type: %. Must be addition or deduction', p_adjustment_type;
    END IF;

    UPDATE products
    SET current_stock = current_stock + v_signed_qty,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING current_stock INTO v_new_stock;

    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        balance_after,
        reference_type,
        reference_id,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        'stock_adjustment',
        v_signed_qty,
        v_new_stock,
        'adjustment',
        NULL,
        p_reason,
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'product_id', p_product_id,
        'previous_stock', v_product.current_stock,
        'new_stock', v_new_stock,
        'adjustment_quantity', v_signed_qty
    );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 7. ATOMIC SALE CANCELLATION: cancel_sale
-- Reverses inventory deduction (sales_return) and reverses accounting entries.
-- ==============================================================================
CREATE OR REPLACE FUNCTION cancel_sale(
    p_sale_id UUID,
    p_reason TEXT DEFAULT 'Order cancelled',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_sale RECORD;
    v_item RECORD;
    v_new_stock NUMERIC(12, 2);
    v_new_acc_balance NUMERIC(14, 2);
    v_tx_num TEXT;
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sale not found';
    END IF;

    IF v_sale.status = 'cancelled' THEN
        RAISE EXCEPTION 'Sale is already cancelled';
    END IF;

    -- 1. Restore stock for each item
    FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id
    LOOP
        UPDATE products
        SET current_stock = current_stock + v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id
        RETURNING current_stock INTO v_new_stock;

        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            balance_after,
            reference_type,
            reference_id,
            notes,
            created_by
        ) VALUES (
            v_item.product_id,
            'sales_return',
            v_item.quantity,
            v_new_stock,
            'sale',
            p_sale_id,
            'Stock restored from cancelled Sale #' || v_sale.invoice_number,
            p_user_id
        );
    END LOOP;

    -- 2. Reverse customer receivable
    IF v_sale.due_amount > 0 THEN
        UPDATE customers
        SET total_receivable = GREATEST(0, total_receivable - v_sale.due_amount),
            updated_at = NOW()
        WHERE id = v_sale.customer_id;
    END IF;

    -- 3. Reverse cash/bank if paid amount > 0
    IF v_sale.paid_amount > 0 AND v_sale.account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance - v_sale.paid_amount,
            updated_at = NOW()
        WHERE id = v_sale.account_id
        RETURNING balance INTO v_new_acc_balance;

        v_tx_num := generate_invoice_number('TX');

        INSERT INTO financial_transactions (
            transaction_number,
            account_id,
            type,
            category,
            amount,
            balance_after,
            reference_type,
            reference_id,
            party_type,
            party_id,
            notes,
            created_by
        ) VALUES (
            v_tx_num,
            v_sale.account_id,
            'expense',
            'refund',
            v_sale.paid_amount,
            v_new_acc_balance,
            'sale',
            p_sale_id,
            'customer',
            v_sale.customer_id,
            'Refund issued for cancelled Sale #' || v_sale.invoice_number,
            p_user_id
        );
    END IF;

    -- 4. Mark sale as cancelled
    UPDATE sales
    SET status = 'cancelled',
        notes = COALESCE(notes, '') || ' [Cancelled: ' || p_reason || ']',
        updated_at = NOW()
    WHERE id = p_sale_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'sale_id', p_sale_id,
        'status', 'cancelled'
    );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 8. ATOMIC PURCHASE CANCELLATION: cancel_purchase
-- Validates that stock has not already been consumed below required return quantity,
-- reverses stock, and reverses accounting/payable records.
-- ==============================================================================
CREATE OR REPLACE FUNCTION cancel_purchase(
    p_purchase_id UUID,
    p_reason TEXT DEFAULT 'Purchase cancelled',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_purchase RECORD;
    v_item RECORD;
    v_prod RECORD;
    v_new_stock NUMERIC(12, 2);
    v_new_acc_balance NUMERIC(14, 2);
    v_tx_num TEXT;
BEGIN
    SELECT * INTO v_purchase FROM purchases WHERE id = p_purchase_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase not found';
    END IF;

    IF v_purchase.status = 'cancelled' THEN
        RAISE EXCEPTION 'Purchase is already cancelled';
    END IF;

    -- 1. Check stock availability for all items first
    FOR v_item IN SELECT * FROM purchase_items WHERE purchase_id = p_purchase_id
    LOOP
        SELECT * INTO v_prod FROM products WHERE id = v_item.product_id FOR UPDATE;
        IF v_prod.current_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Cannot cancel purchase: Stock for "%" (SKU: %) has already been consumed (Available: %, Needed for return: %)',
                v_prod.name, v_prod.sku, v_prod.current_stock, v_item.quantity;
        END IF;
    END LOOP;

    -- 2. Reverse stock
    FOR v_item IN SELECT * FROM purchase_items WHERE purchase_id = p_purchase_id
    LOOP
        UPDATE products
        SET current_stock = current_stock - v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id
        RETURNING current_stock INTO v_new_stock;

        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            balance_after,
            reference_type,
            reference_id,
            notes,
            created_by
        ) VALUES (
            v_item.product_id,
            'purchase_return',
            -v_item.quantity,
            v_new_stock,
            'purchase',
            p_purchase_id,
            'Stock returned from cancelled Purchase #' || v_purchase.invoice_number,
            p_user_id
        );
    END LOOP;

    -- 3. Reverse supplier payable
    IF v_purchase.due_amount > 0 THEN
        UPDATE suppliers
        SET total_payable = GREATEST(0, total_payable - v_purchase.due_amount),
            updated_at = NOW()
        WHERE id = v_purchase.supplier_id;
    END IF;

    -- 4. Reverse cash/bank if paid amount > 0
    IF v_purchase.paid_amount > 0 AND v_purchase.account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance + v_purchase.paid_amount,
            updated_at = NOW()
        WHERE id = v_purchase.account_id
        RETURNING balance INTO v_new_acc_balance;

        v_tx_num := generate_invoice_number('TX');

        INSERT INTO financial_transactions (
            transaction_number,
            account_id,
            type,
            category,
            amount,
            balance_after,
            reference_type,
            reference_id,
            party_type,
            party_id,
            notes,
            created_by
        ) VALUES (
            v_tx_num,
            v_purchase.account_id,
            'income',
            'refund',
            v_purchase.paid_amount,
            v_new_acc_balance,
            'purchase',
            p_purchase_id,
            'supplier',
            v_purchase.supplier_id,
            'Refund received for cancelled Purchase #' || v_purchase.invoice_number,
            p_user_id
        );
    END IF;

    -- 5. Mark purchase as cancelled
    UPDATE purchases
    SET status = 'cancelled',
        notes = COALESCE(notes, '') || ' [Cancelled: ' || p_reason || ']',
        updated_at = NOW()
    WHERE id = p_purchase_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'purchase_id', p_purchase_id,
        'status', 'cancelled'
    );
END;
$$ LANGUAGE plpgsql VOLATILE;
