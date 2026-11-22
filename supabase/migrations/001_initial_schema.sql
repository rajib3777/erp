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
