-- ==============================================================================
-- NEXUS ERP DATABASE ARCHITECTURE: 001_INITIAL_SCHEMA.SQL
-- Enterprise-grade Relational Schema for PostgreSQL / Supabase
-- Currency: BDT (৳) | Precision: NUMERIC(14, 2)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES & ROLES
-- ==============================================================================
CREATE TYPE user_role AS ENUM (
    'admin',
    'manager',
    'accountant',
    'sales_staff',
    'purchase_staff'
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'sales_staff',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for profile lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ==============================================================================
-- 2. CATEGORIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. PRODUCTS & INVENTORY LEDGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'pcs', -- 'kg', 'ltr', 'pcs', 'pack', 'bag'
    purchase_cost NUMERIC(14, 2) NOT NULL CHECK (purchase_cost >= 0),
    selling_price NUMERIC(14, 2) NOT NULL CHECK (selling_price >= 0),
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_level NUMERIC(12, 2) NOT NULL DEFAULT 10 CHECK (min_stock_level >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock, min_stock_level);

-- ==============================================================================
-- 4. CUSTOMERS & RECEIVABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Dhaka',
    total_receivable NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_receivable >= 0),
    total_sales_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_receivable ON customers(total_receivable);

-- ==============================================================================
-- 5. SUPPLIERS & PAYABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    total_payable NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_payable >= 0),
    total_purchases_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_payable ON suppliers(total_payable);

-- ==============================================================================
-- 6. CHART OF ACCOUNTS (FINANCIAL ACCOUNTS)
-- ==============================================================================
CREATE TYPE account_type AS ENUM (
    'cash',
    'bank',
    'mobile_banking'
);

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type account_type NOT NULL DEFAULT 'cash',
    account_number TEXT,
    bank_name TEXT,
    branch TEXT,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- ==============================================================================
-- 7. SALES TRANSACTIONS & SALE ITEMS
-- ==============================================================================
CREATE TYPE payment_status AS ENUM (
    'paid',
    'partial',
    'unpaid'
);

CREATE TYPE transaction_status AS ENUM (
    'completed',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    grand_total NUMERIC(14, 2) NOT NULL CHECK (grand_total >= 0),
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    due_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (due_amount >= 0),
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    payment_method TEXT DEFAULT 'cash',
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    status transaction_status NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_sale_amounts CHECK (grand_total = (subtotal - discount + tax)),
    CONSTRAINT check_sale_settlement CHECK (grand_total = (paid_amount + due_amount))
);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    purchase_cost NUMERIC(14, 2) NOT NULL DEFAULT 0, -- snapshot of cost for gross margin calculation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ==============================================================================
-- 8. PURCHASE TRANSACTIONS & PURCHASE ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    grand_total NUMERIC(14, 2) NOT NULL CHECK (grand_total >= 0),
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    due_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (due_amount >= 0),
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    payment_method TEXT DEFAULT 'cash',
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    status transaction_status NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_purchase_amounts CHECK (grand_total = (subtotal - discount + tax)),
    CONSTRAINT check_purchase_settlement CHECK (grand_total = (paid_amount + due_amount))
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(14, 2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);

-- ==============================================================================
-- 9. STOCK MOVEMENTS (INVENTORY LEDGER)
-- ==============================================================================
CREATE TYPE stock_movement_type AS ENUM (
    'opening_stock',
    'purchase_in',
    'sales_out',
    'sales_return',
    'purchase_return',
    'stock_adjustment'
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type stock_movement_type NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL, -- positive for in/return, negative for out/deduction
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0),
    reference_type TEXT NOT NULL, -- 'sale', 'purchase', 'adjustment', 'opening'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- ==============================================================================
-- 10. FINANCIAL TRANSACTIONS (DOUBLE-ENTRY & CASH FLOW LEDGER)
-- ==============================================================================
CREATE TYPE financial_type AS ENUM (
    'income',
    'expense',
    'transfer'
);

CREATE TYPE transaction_category AS ENUM (
    'sales_income',
    'purchase_expense',
    'customer_payment',
    'supplier_payment',
    'operating_expense',
    'other_income',
    'refund',
    'adjustment'
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT NOT NULL UNIQUE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    type financial_type NOT NULL,
    category transaction_category NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    balance_after NUMERIC(14, 2) NOT NULL,
    reference_type TEXT, -- 'sale', 'purchase', 'customer_payment', 'supplier_payment', 'direct_expense', 'direct_income'
    reference_id UUID,
    party_type TEXT, -- 'customer', 'supplier', 'other'
    party_id UUID,
    notes TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_tx_account ON financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_fin_tx_date ON financial_transactions(transaction_date);

-- ==============================================================================
-- 11. BUSINESS SETTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'Nexus Trade & Distribution Ltd.',
    tagline TEXT DEFAULT 'Enterprise FMCG & Wholesale Distribution',
    currency TEXT NOT NULL DEFAULT 'BDT',
    currency_symbol TEXT NOT NULL DEFAULT '৳',
    phone TEXT DEFAULT '+880 1711-000000',
    email TEXT DEFAULT 'contact@nexuserp.bd',
    address TEXT DEFAULT 'Plot 14, Block C, Tejgaon Industrial Area, Dhaka - 1208, Bangladesh',
    tax_number TEXT DEFAULT 'BIN: 002345678-0101',
    invoice_footer TEXT DEFAULT 'Thank you for choosing Nexus ERP. System-generated invoice.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
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
-- ==============================================================================
-- NEXUS ERP DATABASE ARCHITECTURE: 003_RLS_POLICIES.SQL
-- Enterprise Row Level Security (RLS) & Multi-Role Access Control
-- ==============================================================================

-- Helper function to fetch requesting user's role from profiles
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- ENABLE RLS ON ALL TABLES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 1. PROFILES POLICIES
-- ==============================================================================
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id OR get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admin can update profiles"
    ON profiles FOR ALL
    USING (get_current_user_role() = 'admin');

-- ==============================================================================
-- 2. CATEGORIES & PRODUCTS POLICIES
-- ==============================================================================
CREATE POLICY "Authenticated users can read categories"
    ON categories FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Admin and manager can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Authenticated users can read products"
    ON products FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Admin and manager can manage products"
    ON products FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager'));

-- ==============================================================================
-- 3. CUSTOMERS POLICIES
-- ==============================================================================
CREATE POLICY "Authorized roles can read customers"
    ON customers FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant', 'sales_staff'));

CREATE POLICY "Admin, manager, sales staff can manage customers"
    ON customers FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'sales_staff'));

-- ==============================================================================
-- 4. SUPPLIERS POLICIES
-- ==============================================================================
CREATE POLICY "Authorized roles can read suppliers"
    ON suppliers FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant', 'purchase_staff'));

CREATE POLICY "Admin, manager, purchase staff can manage suppliers"
    ON suppliers FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'purchase_staff'));

-- ==============================================================================
-- 5. ACCOUNTS & FINANCIAL TRANSACTIONS POLICIES
-- ==============================================================================
CREATE POLICY "Accountant, manager, admin can view accounts"
    ON accounts FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant'));

CREATE POLICY "Admin and accountant can manage accounts"
    ON accounts FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'accountant'));

CREATE POLICY "Accountant, manager, admin can view transactions"
    ON financial_transactions FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant'));

CREATE POLICY "Admin and accountant can manage transactions"
    ON financial_transactions FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'accountant'));

-- ==============================================================================
-- 6. SALES & SALE ITEMS POLICIES
-- ==============================================================================
CREATE POLICY "Sales can be viewed by authorized roles"
    ON sales FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant', 'sales_staff'));

CREATE POLICY "Sales can be created by admin, manager, sales staff"
    ON sales FOR INSERT
    TO authenticated
    WITH CHECK (get_current_user_role() IN ('admin', 'manager', 'sales_staff'));

CREATE POLICY "Sale items can be viewed by authorized roles"
    ON sale_items FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant', 'sales_staff'));

CREATE POLICY "Sale items can be inserted by authorized roles"
    ON sale_items FOR INSERT
    TO authenticated
    WITH CHECK (get_current_user_role() IN ('admin', 'manager', 'sales_staff'));

-- ==============================================================================
-- 7. PURCHASES & PURCHASE ITEMS POLICIES
-- ==============================================================================
CREATE POLICY "Purchases can be viewed by authorized roles"
    ON purchases FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant', 'purchase_staff'));

CREATE POLICY "Purchases can be created by admin, manager, purchase staff"
    ON purchases FOR INSERT
    TO authenticated
    WITH CHECK (get_current_user_role() IN ('admin', 'manager', 'purchase_staff'));

CREATE POLICY "Purchase items can be viewed by authorized roles"
    ON purchase_items FOR SELECT
    TO authenticated
    USING (get_current_user_role() IN ('admin', 'manager', 'accountant', 'purchase_staff'));

CREATE POLICY "Purchase items can be inserted by authorized roles"
    ON purchase_items FOR INSERT
    TO authenticated
    WITH CHECK (get_current_user_role() IN ('admin', 'manager', 'purchase_staff'));

-- ==============================================================================
-- 8. STOCK MOVEMENTS POLICIES
-- ==============================================================================
CREATE POLICY "Stock movements can be viewed by all staff"
    ON stock_movements FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Stock movements can be created via RPC or admin/manager"
    ON stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (get_current_user_role() IN ('admin', 'manager'));

-- ==============================================================================
-- 9. BUSINESS SETTINGS POLICIES
-- ==============================================================================
CREATE POLICY "All authenticated users can read settings"
    ON business_settings FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Only admin can update business settings"
    ON business_settings FOR ALL
    TO authenticated
    USING (get_current_user_role() = 'admin');
-- ==============================================================================
-- NEXUS ERP DATABASE ARCHITECTURE: 004_SEED_DATA.SQL
-- Realistic Bangladeshi Business Seed Data (FMCG Wholesale & Distribution)
-- Currency: BDT (৳)
-- ==============================================================================

-- 1. Insert Categories
INSERT INTO categories (id, name, description) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Groceries & Grains', 'Rice, flour, sugar, pulses, and kitchen staples'),
    ('c0000000-0000-0000-0000-000000000002', 'Edible Oils & Condiments', 'Soybean oil, mustard oil, ghee, and pure spices'),
    ('c0000000-0000-0000-0000-000000000003', 'Dairy & Beverages', 'Powdered milk, UHT liquid milk, black tea, and juices'),
    ('c0000000-0000-0000-0000-000000000004', 'Personal Care & Cleaning', 'Laundry detergents, toilet soaps, dish cleaners')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Accounts (Chart of Accounts)
INSERT INTO accounts (id, name, type, account_number, bank_name, branch, balance, is_default) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Main Cash Register', 'cash', 'CASH-MAIN-01', 'Cash Office', 'Tejgaon Head Office', 45000.00, TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'DBBL Corporate Account', 'bank', '115.120.0987654', 'Dutch-Bangla Bank Ltd', 'Kawran Bazar Branch', 320000.00, FALSE),
    ('a0000000-0000-0000-0000-000000000003', 'bKash Merchant Wallet', 'mobile_banking', '01711-998877', 'bKash Limited', 'Commercial Portal', 35000.00, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Customers
INSERT INTO customers (id, name, phone, email, address, city, total_receivable, total_sales_count) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Karim General Store', '+880 1819-112233', 'karim.store@gmail.com', 'Shop 14, Chawkbazar Market', 'Dhaka', 12500.00, 3),
    ('b0000000-0000-0000-0000-000000000002', 'Bismillah Traders', '+880 1712-334455', 'bismillah.traders@yahoo.com', 'Plot 4, Wholesale Row, Kawran Bazar', 'Dhaka', 0.00, 2),
    ('b0000000-0000-0000-0000-000000000003', 'Dhaka Super Mart', '+880 1914-556677', 'orders@dhakasupermart.com', 'Road 27, Dhanmondi', 'Dhaka', 28000.00, 4),
    ('b0000000-0000-0000-0000-000000000004', 'Rahman Grocers', '+880 1618-778899', 'rahman.grocers@gmail.com', 'Town Hall Market, Mohammadpur', 'Dhaka', 4500.00, 1),
    ('b0000000-0000-0000-0000-000000000005', 'Uttara Family Mart', '+880 1715-990011', 'info@uttarafamilymart.com', 'Sector 4, Uttara Commercial Area', 'Dhaka', 0.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, total_payable, total_purchases_count) VALUES
    ('s0000000-0000-0000-0000-000000000001', 'City Group of Industries', 'Rafiqul Islam', '+880 1711-223344', 'sales@citygroupbd.com', 'City Seed Crushing Mills, Narayanganj', 35000.00, 3),
    ('s0000000-0000-0000-0000-000000000002', 'Meghna Group (Fresh)', 'Tanvir Ahmed', '+880 1713-445566', 'distributors@meghnagroup.biz', 'Fresh Villa, Gulshan 1, Dhaka', 0.00, 2),
    ('s0000000-0000-0000-0000-000000000003', 'Square Consumer Products Ltd', 'Kamrul Hasan', '+880 1817-667788', 'supply@squaregroup.com', 'Square Centre, 48 Mohakhali C/A, Dhaka', 18500.00, 2),
    ('s0000000-0000-0000-0000-000000000004', 'Unilever Bangladesh Supply', 'Sadia Chowdhury', '+880 1911-889900', 'orders@unileverbd.com', 'ZN Tower, Plot 2, Road 8, Gulshan 1', 'Dhaka', 0.00, 1),
    ('s0000000-0000-0000-0000-000000000005', 'ACI Foods & Pure Flour Ltd', 'Mahmudul Huq', '+880 1712-001122', 'foods@aci-bd.com', 'ACI Centre, 245 Tejgaon I/A, Dhaka', 12000.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Products
INSERT INTO products (id, category_id, sku, name, description, unit, purchase_cost, selling_price, current_stock, min_stock_level) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'SKU-RIC-MIN25', 'Miniket Premium Rice 25kg', 'Export quality long grain polished miniket rice bag', 'bag', 1750.00, 1950.00, 65.00, 15.00),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'SKU-RIC-NAZ25', 'Nazirshail Rice 25kg Bag', 'Standard aromatic fine grain rice sack', 'bag', 1900.00, 2150.00, 40.00, 10.00),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'SKU-SGR-FSH01', 'Fresh White Sugar 1kg Pack', 'Refined crystal sugar pack from Fresh', 'pack', 125.00, 138.00, 120.00, 30.00),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'SKU-FLR-TER02', 'Teer Fortified Atta 2kg', 'Vitamin & mineral fortified whole wheat flour', 'pack', 115.00, 128.00, 85.00, 25.00),
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'SKU-OIL-SOY05', 'Teer Soybean Oil 5L Can', 'Fortified with Vitamin A & D poly can', 'can', 840.00, 890.00, 35.00, 10.00),
    ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'SKU-OIL-MUS01', 'Radhuni Pure Mustard Oil 1L', 'Cold-pressed authentic ghani mustard oil bottle', 'bottle', 310.00, 345.00, 8.00, 15.00), -- LOW STOCK ALERT!
    ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'SKU-MLK-DAN01', 'Dano Daily Delight Milk 1kg', 'Full cream spray dried instant milk powder', 'pack', 820.00, 890.00, 18.00, 20.00), -- LOW STOCK ALERT!
    ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'SKU-TEA-ISP04', 'Ispahani Mirzapore Tea 400g', 'Premium blend CTC leaf black tea foil bag', 'pack', 210.00, 235.00, 75.00, 20.00),
    ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 'SKU-SOP-LUX10', 'Lux Velvet Touch Beauty Soap 100g', 'Jasmine & almond oil moisturising bath soap', 'pcs', 62.00, 72.00, 160.00, 40.00),
    ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000004', 'SKU-DET-WHL01', 'Wheel 2in1 Clean Detergent 1kg', 'Lemon and thousand flowers washing powder', 'pack', 135.00, 150.00, 90.00, 25.00)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Stock Movements for Opening Stock
INSERT INTO stock_movements (product_id, movement_type, quantity, balance_after, reference_type, notes) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'opening_stock', 65.00, 65.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000002', 'opening_stock', 40.00, 40.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000003', 'opening_stock', 120.00, 120.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000004', 'opening_stock', 85.00, 85.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000005', 'opening_stock', 35.00, 35.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000006', 'opening_stock', 8.00, 8.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000007', 'opening_stock', 18.00, 18.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000008', 'opening_stock', 75.00, 75.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000009', 'opening_stock', 160.00, 160.00, 'opening', 'Warehouse inventory physical audit opening count'),
    ('d0000000-0000-0000-0000-000000000010', 'opening_stock', 90.00, 90.00, 'opening', 'Warehouse inventory physical audit opening count');

-- 7. Insert Initial Completed Sales
INSERT INTO sales (
    id, invoice_number, customer_id, sale_date, subtotal, discount, tax,
    grand_total, paid_amount, due_amount, payment_status, payment_method, account_id, status, notes
) VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'INV-20261120-1001',
        'b0000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '2 days',
        23400.00, 400.00, 0.00,
        23000.00, 10500.00, 12500.00,
        'partial', 'cash', 'a0000000-0000-0000-0000-000000000001', 'completed',
        'Partial payment accepted on order delivery'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'INV-20261121-1002',
        'b0000000-0000-0000-0000-000000000002',
        NOW() - INTERVAL '1 day',
        18500.00, 0.00, 0.00,
        18500.00, 18500.00, 0.00,
        'paid', 'bank', 'a0000000-0000-0000-0000-000000000002', 'completed',
        'Settled via DBBL bank transfer'
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'INV-20261122-1003',
        'b0000000-0000-0000-0000-000000000003',
        NOW() - INTERVAL '4 hours',
        28000.00, 0.00, 0.00,
        28000.00, 0.00, 28000.00,
        'unpaid', 'credit', NULL, 'completed',
        'Net 15 days corporate credit invoice'
    )
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Sale Items
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, purchase_cost) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 10.00, 1950.00, 19500.00, 1750.00),
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 4.00, 890.00, 3560.00, 840.00),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 8.00, 2150.00, 17200.00, 1900.00),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 10.00, 128.00, 1280.00, 115.00),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 12.00, 1950.00, 23400.00, 1750.00),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000008', 20.00, 230.00, 4600.00, 210.00);

-- 9. Insert Initial Purchases
INSERT INTO purchases (
    id, invoice_number, supplier_id, purchase_date, subtotal, discount, tax,
    grand_total, paid_amount, due_amount, payment_status, payment_method, account_id, status, notes
) VALUES
    (
        'f0000000-0000-0000-0000-000000000001',
        'PO-20261118-2001',
        's0000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '4 days',
        75000.00, 0.00, 0.00,
        75000.00, 40000.00, 35000.00,
        'partial', 'bank', 'a0000000-0000-0000-0000-000000000002', 'completed',
        'Fortnightly bulk oil consignment'
    ),
    (
        'f0000000-0000-0000-0000-000000000002',
        'PO-20261119-2002',
        's0000000-0000-0000-0000-000000000003',
        NOW() - INTERVAL '3 days',
        38500.00, 0.00, 0.00,
        38500.00, 20000.00, 18500.00,
        'partial', 'cash', 'a0000000-0000-0000-0000-000000000001', 'completed',
        'Ghani Mustard oil and spices'
    ),
    (
        'f0000000-0000-0000-0000-000000000003',
        'PO-20261121-2003',
        's0000000-0000-0000-0000-000000000005',
        NOW() - INTERVAL '1 day',
        12000.00, 0.00, 0.00,
        12000.00, 0.00, 12000.00,
        'unpaid', 'credit', NULL, 'completed',
        'Flour shipment, 30 days payment credit'
    )
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Purchase Items
INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 80.00, 840.00, 67200.00),
    ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 65.00, 115.00, 7475.00),
    ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 50.00, 310.00, 15500.00),
    ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000008', 100.00, 210.00, 21000.00),
    ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 100.00, 115.00, 11500.00);

-- 11. Insert Financial Transactions
INSERT INTO financial_transactions (
    transaction_number, account_id, type, category, amount, balance_after,
    reference_type, reference_id, party_type, party_id, notes, transaction_date
) VALUES
    (
        'TX-20261118-0001',
        'a0000000-0000-0000-0000-000000000002',
        'expense', 'purchase_expense',
        40000.00, 320000.00,
        'purchase', 'f0000000-0000-0000-0000-000000000001',
        'supplier', 's0000000-0000-0000-0000-000000000001',
        'Paid advance for PO #PO-20261118-2001 via DBBL',
        NOW() - INTERVAL '4 days'
    ),
    (
        'TX-20261119-0002',
        'a0000000-0000-0000-0000-000000000001',
        'expense', 'purchase_expense',
        20000.00, 34500.00,
        'purchase', 'f0000000-0000-0000-0000-000000000002',
        'supplier', 's0000000-0000-0000-0000-000000000003',
        'Cash payment for PO #PO-20261119-2002',
        NOW() - INTERVAL '3 days'
    ),
    (
        'TX-20261120-0003',
        'a0000000-0000-0000-0000-000000000001',
        'income', 'sales_income',
        10500.00, 45000.00,
        'sale', 'e0000000-0000-0000-0000-000000000001',
        'customer', 'b0000000-0000-0000-0000-000000000001',
        'Cash receipt on delivery for INV #INV-20261120-1001',
        NOW() - INTERVAL '2 days'
    ),
    (
        'TX-20261121-0004',
        'a0000000-0000-0000-0000-000000000002',
        'income', 'sales_income',
        18500.00, 338500.00,
        'sale', 'e0000000-0000-0000-0000-000000000002',
        'customer', 'b0000000-0000-0000-0000-000000000002',
        'DBBL bank transfer receipt for INV #INV-20261121-1002',
        NOW() - INTERVAL '1 day'
    ),
    (
        'TX-20261122-0005',
        'a0000000-0000-0000-0000-000000000001',
        'expense', 'operating_expense',
        2500.00, 42500.00,
        'direct_expense', NULL,
        'other', NULL,
        'Tejgaon Warehouse electricity bill payment',
        NOW() - INTERVAL '12 hours'
    );
