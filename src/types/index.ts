// ==============================================================================
// NEXUS ERP TYPES & DOMAIN INTERFACES
// ==============================================================================

export type UserRole =
  | 'admin'
  | 'manager'
  | 'accountant'
  | 'sales_staff'
  | 'purchase_staff';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  category_id?: string;
  category_name?: string;
  sku: string;
  name: string;
  description?: string;
  unit: string; // 'kg', 'ltr', 'pcs', 'pack', 'bag', 'can', 'bottle'
  purchase_cost: number;
  selling_price: number;
  current_stock: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  total_receivable: number;
  total_sales_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  total_payable: number;
  total_purchases_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AccountType = 'cash' | 'bank' | 'mobile_banking';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  account_number?: string;
  bank_name?: string;
  branch?: string;
  balance: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type TransactionStatus = 'completed' | 'cancelled';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  purchase_cost?: number;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  payment_method: string;
  account_id?: string;
  account_name?: string;
  status: TransactionStatus;
  notes?: string;
  created_by?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name?: string;
  supplier_phone?: string;
  purchase_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  payment_method: string;
  account_id?: string;
  account_name?: string;
  status: TransactionStatus;
  notes?: string;
  created_by?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  items?: PurchaseItem[];
}

export type StockMovementType =
  | 'opening_stock'
  | 'purchase_in'
  | 'sales_out'
  | 'sales_return'
  | 'purchase_return'
  | 'stock_adjustment';

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  movement_type: StockMovementType;
  quantity: number; // positive or negative
  balance_after: number;
  reference_type: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export type FinancialType = 'income' | 'expense' | 'transfer';
export type TransactionCategory =
  | 'sales_income'
  | 'purchase_expense'
  | 'customer_payment'
  | 'supplier_payment'
  | 'operating_expense'
  | 'other_income'
  | 'refund'
  | 'adjustment';

export interface FinancialTransaction {
  id: string;
  transaction_number: string;
  account_id: string;
  account_name?: string;
  type: FinancialType;
  category: TransactionCategory;
  amount: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  party_type?: 'customer' | 'supplier' | 'other';
  party_id?: string;
  party_name?: string;
  notes?: string;
  transaction_date: string;
  created_by?: string;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  company_name: string;
  tagline: string;
  currency: string;
  currency_symbol: string;
  phone: string;
  email: string;
  address: string;
  tax_number: string;
  invoice_footer: string;
  created_at: string;
  updated_at: string;
}

// DTOs for Creation & Actions
export interface CreateSaleItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreateSaleInput {
  customer_id: string;
  items: CreateSaleItemInput[];
  discount: number;
  tax: number;
  paid_amount: number;
  payment_method: string;
  account_id?: string;
  notes?: string;
}

export interface CreatePurchaseItemInput {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export interface CreatePurchaseInput {
  supplier_id: string;
  items: CreatePurchaseItemInput[];
  discount: number;
  tax: number;
  paid_amount: number;
  payment_method: string;
  account_id?: string;
  notes?: string;
}

export interface CustomerPaymentInput {
  customer_id: string;
  amount: number;
  account_id: string;
  payment_method: string;
  sale_id?: string;
  notes?: string;
}

export interface SupplierPaymentInput {
  supplier_id: string;
  amount: number;
  account_id: string;
  payment_method: string;
  purchase_id?: string;
  notes?: string;
}

export interface StockAdjustmentInput {
  product_id: string;
  adjustment_type: 'addition' | 'deduction';
  quantity: number;
  reason: string;
}

export interface DashboardMetrics {
  totalSales: number;
  totalPurchases: number;
  currentStockValue: number;
  cashBankBalance: number;
  totalReceivables: number;
  totalPayables: number;
  salesCount: number;
  purchasesCount: number;
  lowStockCount: number;
}
