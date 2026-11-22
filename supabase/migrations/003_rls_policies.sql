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
