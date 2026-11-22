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
