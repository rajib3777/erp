// ==============================================================================
// NEXUS ERP INTEGRATED DATA SERVICE & BUSINESS LOGIC ENGINE
// Handles both Supabase Cloud (RPC + Tables) and local ACID simulation
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import {
  Product,
  Category,
  Customer,
  Supplier,
  Account,
  Sale,
  Purchase,
  StockMovement,
  FinancialTransaction,
  DashboardMetrics,
  CreateSaleInput,
  CreatePurchaseInput,
  CustomerPaymentInput,
  SupplierPaymentInput,
  StockAdjustmentInput,
} from '@/types';

// Storage key for local persistence
const STORAGE_PREFIX = 'nexus_erp_';

// Initial Seed Data mirroring 004_seed_data.sql
const SEED_CATEGORIES: Category[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', name: 'Groceries & Grains', description: 'Rice, flour, sugar, pulses, and kitchen staples', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'c0000000-0000-0000-0000-000000000002', name: 'Edible Oils & Condiments', description: 'Soybean oil, mustard oil, ghee, and pure spices', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'Dairy & Beverages', description: 'Powdered milk, UHT liquid milk, black tea, and juices', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'c0000000-0000-0000-0000-000000000004', name: 'Personal Care & Cleaning', description: 'Laundry detergents, toilet soaps, dish cleaners', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
];

const SEED_ACCOUNTS: Account[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Main Cash Register', type: 'cash', account_number: 'CASH-MAIN-01', bank_name: 'Cash Office', branch: 'Tejgaon Head Office', balance: 45000, is_default: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'DBBL Corporate Account', type: 'bank', account_number: '115.120.0987654', bank_name: 'Dutch-Bangla Bank Ltd', branch: 'Kawran Bazar Branch', balance: 320000, is_default: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'bKash Merchant Wallet', type: 'mobile_banking', account_number: '01711-998877', bank_name: 'bKash Limited', branch: 'Commercial Portal', balance: 35000, is_default: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 'b0000000-0000-0000-0000-000000000001', name: 'Karim General Store', phone: '+880 1819-112233', email: 'karim.store@gmail.com', address: 'Shop 14, Chawkbazar Market', city: 'Dhaka', total_receivable: 12500, total_sales_count: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'Bismillah Traders', phone: '+880 1712-334455', email: 'bismillah.traders@yahoo.com', address: 'Plot 4, Wholesale Row, Kawran Bazar', city: 'Dhaka', total_receivable: 0, total_sales_count: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000000-0000-0000-0000-000000000003', name: 'Dhaka Super Mart', phone: '+880 1914-556677', email: 'orders@dhakasupermart.com', address: 'Road 27, Dhanmondi', city: 'Dhaka', total_receivable: 28000, total_sales_count: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000000-0000-0000-0000-000000000004', name: 'Rahman Grocers', phone: '+880 1618-778899', email: 'rahman.grocers@gmail.com', address: 'Town Hall Market, Mohammadpur', city: 'Dhaka', total_receivable: 4500, total_sales_count: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000000-0000-0000-0000-000000000005', name: 'Uttara Family Mart', phone: '+880 1715-990011', email: 'info@uttarafamilymart.com', address: 'Sector 4, Uttara Commercial Area', city: 'Dhaka', total_receivable: 0, total_sales_count: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const SEED_SUPPLIERS: Supplier[] = [
  { id: 's0000000-0000-0000-0000-000000000001', name: 'City Group of Industries', contact_person: 'Rafiqul Islam', phone: '+880 1711-223344', email: 'sales@citygroupbd.com', address: 'City Seed Crushing Mills, Narayanganj', total_payable: 35000, total_purchases_count: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's0000000-0000-0000-0000-000000000002', name: 'Meghna Group (Fresh)', contact_person: 'Tanvir Ahmed', phone: '+880 1713-445566', email: 'distributors@meghnagroup.biz', address: 'Fresh Villa, Gulshan 1, Dhaka', total_payable: 0, total_purchases_count: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's0000000-0000-0000-0000-000000000003', name: 'Square Consumer Products Ltd', contact_person: 'Kamrul Hasan', phone: '+880 1817-667788', email: 'supply@squaregroup.com', address: 'Square Centre, 48 Mohakhali C/A, Dhaka', total_payable: 18500, total_purchases_count: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's0000000-0000-0000-0000-000000000004', name: 'Unilever Bangladesh Supply', contact_person: 'Sadia Chowdhury', phone: '+880 1911-889900', email: 'orders@unileverbd.com', address: 'ZN Tower, Plot 2, Road 8, Gulshan 1, Dhaka', total_payable: 0, total_purchases_count: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's0000000-0000-0000-0000-000000000005', name: 'ACI Foods & Pure Flour Ltd', contact_person: 'Mahmudul Huq', phone: '+880 1712-001122', email: 'foods@aci-bd.com', address: 'ACI Centre, 245 Tejgaon I/A, Dhaka', total_payable: 12000, total_purchases_count: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'd0000000-0000-0000-0000-000000000001', category_id: 'c0000000-0000-0000-0000-000000000001', category_name: 'Groceries & Grains', sku: 'SKU-RIC-MIN25', name: 'Miniket Premium Rice 25kg', description: 'Export quality long grain polished miniket rice bag', unit: 'bag', purchase_cost: 1750, selling_price: 1950, current_stock: 65, min_stock_level: 15, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000000-0000-0000-0000-000000000002', category_id: 'c0000000-0000-0000-0000-000000000001', category_name: 'Groceries & Grains', sku: 'SKU-RIC-NAZ25', name: 'Nazirshail Rice 25kg Bag', description: 'Standard aromatic fine grain rice sack', unit: 'bag', purchase_cost: 1900, selling_price: 2150, current_stock: 40, min_stock_level: 10, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000000-0000-0000-0000-000000000003', category_id: 'c0000000-0000-0000-0000-000000000001', category_name: 'Groceries & Grains', sku: 'SKU-SGR-FSH01', name: 'Fresh White Sugar 1kg Pack', description: 'Refined crystal sugar pack from Fresh', unit: 'pack', purchase_cost: 125, selling_price: 138, current_stock: 120, min_stock_level: 30, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000000-0000-0000-0000-000000000004', category_id: 'c0000000-0000-0000-0000-000000000001', category_name: 'Groceries & Grains', sku: 'SKU-FLR-TER02', name: 'Teer Fortified Atta 2kg', description: 'Vitamin & mineral fortified whole wheat flour', unit: 'pack', purchase_cost: 115, selling_price: 128, current_stock: 85, min_stock_level: 25, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000000-0000-0000-0000-000000000005', category_id: 'c0000000-0000-0000-0000-000000000002', category_name: 'Edible Oils & Condiments', sku: 'SKU-OIL-SOY05', name: 'Teer Soybean Oil 5L Can', description: 'Fortified with Vitamin A & D poly can', unit: 'can', purchase_cost: 840, selling_price: 890, current_stock: 35, min_stock_level: 10, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000000-0000-0000-0000-000000000006', category_id: 'c0000000-0000-0000-0000-000000000002', category_name: 'Edible Oils & Condiments', sku: 'SKU-OIL-MUS01', name: 'Radhuni Pure Mustard Oil 1L', description: 'Cold-pressed authentic ghani mustard oil bottle', unit: 'bottle', purchase_cost: 310, selling_price: 345, current_stock: 8, min_stock_level: 15, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, // LOW STOCK
  { id: 'd0000000-0000-0000-0000-000000000007', category_id: 'c0000000-0000-0000-0000-000000000003', category_name: 'Dairy & Beverages', sku: 'SKU-MLK-DAN01', name: 'Dano Daily Delight Milk 1kg', description: 'Full cream spray dried instant milk powder', unit: 'pack', purchase_cost: 820, selling_price: 890, current_stock: 18, min_stock_level: 20, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, // LOW STOCK
  { id: 'd0000000-0000-0000-0000-000000000008', category_id: 'c0000000-0000-0000-0000-000000000003', category_name: 'Dairy & Beverages', sku: 'SKU-TEA-ISP04', name: 'Ispahani Mirzapore Tea 400g', description: 'Premium blend CTC leaf black tea foil bag', unit: 'pack', purchase_cost: 210, selling_price: 235, current_stock: 75, min_stock_level: 20, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000000-0000-0000-0000-000000000009', category_id: 'c0000000-0000-0000-0000-000000000004', category_name: 'Personal Care & Cleaning', sku: 'SKU-SOP-LUX10', name: 'Lux Velvet Touch Beauty Soap 100g', description: 'Jasmine & almond oil moisturising bath soap', unit: 'pcs', purchase_cost: 62, selling_price: 72, current_stock: 160, min_stock_level: 40, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000000-0000-0000-0000-000000000010', category_id: 'c0000000-0000-0000-0000-000000000004', category_name: 'Personal Care & Cleaning', sku: 'SKU-DET-WHL01', name: 'Wheel 2in1 Clean Detergent 1kg', description: 'Lemon and thousand flowers washing powder', unit: 'pack', purchase_cost: 135, selling_price: 150, current_stock: 90, min_stock_level: 25, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const SEED_SALES: Sale[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    invoice_number: 'INV-20261120-1001',
    customer_id: 'b0000000-0000-0000-0000-000000000001',
    customer_name: 'Karim General Store',
    customer_phone: '+880 1819-112233',
    sale_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    subtotal: 23400,
    discount: 400,
    tax: 0,
    grand_total: 23000,
    paid_amount: 10500,
    due_amount: 12500,
    payment_status: 'partial',
    payment_method: 'cash',
    account_id: 'a0000000-0000-0000-0000-000000000001',
    account_name: 'Main Cash Register',
    status: 'completed',
    notes: 'Partial payment accepted on order delivery',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    items: [
      { id: 'ei-1', sale_id: 'e0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000001', product_name: 'Miniket Premium Rice 25kg', product_sku: 'SKU-RIC-MIN25', product_unit: 'bag', quantity: 10, unit_price: 1950, subtotal: 19500, purchase_cost: 1750, created_at: new Date().toISOString() },
      { id: 'ei-2', sale_id: 'e0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000005', product_name: 'Teer Soybean Oil 5L Can', product_sku: 'SKU-OIL-SOY05', product_unit: 'can', quantity: 4, unit_price: 890, subtotal: 3560, purchase_cost: 840, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    invoice_number: 'INV-20261121-1002',
    customer_id: 'b0000000-0000-0000-0000-000000000002',
    customer_name: 'Bismillah Traders',
    customer_phone: '+880 1712-334455',
    sale_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    subtotal: 18500,
    discount: 0,
    tax: 0,
    grand_total: 18500,
    paid_amount: 18500,
    due_amount: 0,
    payment_status: 'paid',
    payment_method: 'bank',
    account_id: 'a0000000-0000-0000-0000-000000000002',
    account_name: 'DBBL Corporate Account',
    status: 'completed',
    notes: 'Settled via DBBL bank transfer',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    items: [
      { id: 'ei-3', sale_id: 'e0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000002', product_name: 'Nazirshail Rice 25kg Bag', product_sku: 'SKU-RIC-NAZ25', product_unit: 'bag', quantity: 8, unit_price: 2150, subtotal: 17200, purchase_cost: 1900, created_at: new Date().toISOString() },
      { id: 'ei-4', sale_id: 'e0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000004', product_name: 'Teer Fortified Atta 2kg', product_sku: 'SKU-FLR-TER02', product_unit: 'pack', quantity: 10, unit_price: 128, subtotal: 1280, purchase_cost: 115, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    invoice_number: 'INV-20261122-1003',
    customer_id: 'b0000000-0000-0000-0000-000000000003',
    customer_name: 'Dhaka Super Mart',
    customer_phone: '+880 1914-556677',
    sale_date: new Date(Date.now() - 4 * 3600000).toISOString(),
    subtotal: 28000,
    discount: 0,
    tax: 0,
    grand_total: 28000,
    paid_amount: 0,
    due_amount: 28000,
    payment_status: 'unpaid',
    payment_method: 'credit',
    status: 'completed',
    notes: 'Net 15 days corporate credit invoice',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    items: [
      { id: 'ei-5', sale_id: 'e0000000-0000-0000-0000-000000000003', product_id: 'd0000000-0000-0000-0000-000000000001', product_name: 'Miniket Premium Rice 25kg', product_sku: 'SKU-RIC-MIN25', product_unit: 'bag', quantity: 12, unit_price: 1950, subtotal: 23400, purchase_cost: 1750, created_at: new Date().toISOString() },
      { id: 'ei-6', sale_id: 'e0000000-0000-0000-0000-000000000003', product_id: 'd0000000-0000-0000-0000-000000000008', product_name: 'Ispahani Mirzapore Tea 400g', product_sku: 'SKU-TEA-ISP04', product_unit: 'pack', quantity: 20, unit_price: 230, subtotal: 4600, purchase_cost: 210, created_at: new Date().toISOString() },
    ],
  },
];

const SEED_PURCHASES: Purchase[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    invoice_number: 'PO-20261118-2001',
    supplier_id: 's0000000-0000-0000-0000-000000000001',
    supplier_name: 'City Group of Industries',
    supplier_phone: '+880 1711-223344',
    purchase_date: new Date(Date.now() - 4 * 86400000).toISOString(),
    subtotal: 75000,
    discount: 0,
    tax: 0,
    grand_total: 75000,
    paid_amount: 40000,
    due_amount: 35000,
    payment_status: 'partial',
    payment_method: 'bank',
    account_id: 'a0000000-0000-0000-0000-000000000002',
    account_name: 'DBBL Corporate Account',
    status: 'completed',
    notes: 'Fortnightly bulk oil consignment',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    items: [
      { id: 'pi-1', purchase_id: 'f0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000005', product_name: 'Teer Soybean Oil 5L Can', product_sku: 'SKU-OIL-SOY05', product_unit: 'can', quantity: 80, unit_cost: 840, subtotal: 67200, created_at: new Date().toISOString() },
      { id: 'pi-2', purchase_id: 'f0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000004', product_name: 'Teer Fortified Atta 2kg', product_sku: 'SKU-FLR-TER02', product_unit: 'pack', quantity: 65, unit_cost: 115, subtotal: 7475, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    invoice_number: 'PO-20261119-2002',
    supplier_id: 's0000000-0000-0000-0000-000000000003',
    supplier_name: 'Square Consumer Products Ltd',
    supplier_phone: '+880 1817-667788',
    purchase_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    subtotal: 38500,
    discount: 0,
    tax: 0,
    grand_total: 38500,
    paid_amount: 20000,
    due_amount: 18500,
    payment_status: 'partial',
    payment_method: 'cash',
    account_id: 'a0000000-0000-0000-0000-000000000001',
    account_name: 'Main Cash Register',
    status: 'completed',
    notes: 'Ghani Mustard oil and spices',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    items: [
      { id: 'pi-3', purchase_id: 'f0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000006', product_name: 'Radhuni Pure Mustard Oil 1L', product_sku: 'SKU-OIL-MUS01', product_unit: 'bottle', quantity: 50, unit_cost: 310, subtotal: 15500, created_at: new Date().toISOString() },
      { id: 'pi-4', purchase_id: 'f0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000008', product_name: 'Ispahani Mirzapore Tea 400g', product_sku: 'SKU-TEA-ISP04', product_unit: 'pack', quantity: 100, unit_cost: 210, subtotal: 21000, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    invoice_number: 'PO-20261121-2003',
    supplier_id: 's0000000-0000-0000-0000-000000000005',
    supplier_name: 'ACI Foods & Pure Flour Ltd',
    supplier_phone: '+880 1712-001122',
    purchase_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    subtotal: 12000,
    discount: 0,
    tax: 0,
    grand_total: 12000,
    paid_amount: 0,
    due_amount: 12000,
    payment_status: 'unpaid',
    payment_method: 'credit',
    status: 'completed',
    notes: 'Flour shipment, 30 days payment credit',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    items: [
      { id: 'pi-5', purchase_id: 'f0000000-0000-0000-0000-000000000003', product_id: 'd0000000-0000-0000-0000-000000000004', product_name: 'Teer Fortified Atta 2kg', product_sku: 'SKU-FLR-TER02', product_unit: 'pack', quantity: 100, unit_cost: 115, subtotal: 11500, created_at: new Date().toISOString() },
    ],
  },
];

const SEED_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'm-1', product_id: 'd0000000-0000-0000-0000-000000000001', product_name: 'Miniket Premium Rice 25kg', product_sku: 'SKU-RIC-MIN25', product_unit: 'bag', movement_type: 'opening_stock', quantity: 87, balance_after: 87, reference_type: 'opening', notes: 'Initial inventory physical count', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'm-2', product_id: 'd0000000-0000-0000-0000-000000000001', product_name: 'Miniket Premium Rice 25kg', product_sku: 'SKU-RIC-MIN25', product_unit: 'bag', movement_type: 'sales_out', quantity: -10, balance_after: 77, reference_type: 'sale', reference_id: 'e0000000-0000-0000-0000-000000000001', notes: 'Sold via Invoice #INV-20261120-1001', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'm-3', product_id: 'd0000000-0000-0000-0000-000000000001', product_name: 'Miniket Premium Rice 25kg', product_sku: 'SKU-RIC-MIN25', product_unit: 'bag', movement_type: 'sales_out', quantity: -12, balance_after: 65, reference_type: 'sale', reference_id: 'e0000000-0000-0000-0000-000000000003', notes: 'Sold via Invoice #INV-20261122-1003', created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 'm-4', product_id: 'd0000000-0000-0000-0000-000000000006', product_name: 'Radhuni Pure Mustard Oil 1L', product_sku: 'SKU-OIL-MUS01', product_unit: 'bottle', movement_type: 'opening_stock', quantity: 8, balance_after: 8, reference_type: 'opening', notes: 'Physical stock count', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'm-5', product_id: 'd0000000-0000-0000-0000-000000000007', product_name: 'Dano Daily Delight Milk 1kg', product_sku: 'SKU-MLK-DAN01', product_unit: 'pack', movement_type: 'opening_stock', quantity: 18, balance_after: 18, reference_type: 'opening', notes: 'Physical stock count', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
];

const SEED_TRANSACTIONS: FinancialTransaction[] = [
  { id: 'tx-1', transaction_number: 'TX-20261118-0001', account_id: 'a0000000-0000-0000-0000-000000000002', account_name: 'DBBL Corporate Account', type: 'expense', category: 'purchase_expense', amount: 40000, balance_after: 320000, reference_type: 'purchase', reference_id: 'f0000000-0000-0000-0000-000000000001', party_type: 'supplier', party_id: 's0000000-0000-0000-0000-000000000001', party_name: 'City Group of Industries', notes: 'Paid advance for PO #PO-20261118-2001 via DBBL', transaction_date: new Date(Date.now() - 4 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: 'tx-2', transaction_number: 'TX-20261119-0002', account_id: 'a0000000-0000-0000-0000-000000000001', account_name: 'Main Cash Register', type: 'expense', category: 'purchase_expense', amount: 20000, balance_after: 34500, reference_type: 'purchase', reference_id: 'f0000000-0000-0000-0000-000000000002', party_type: 'supplier', party_id: 's0000000-0000-0000-0000-000000000003', party_name: 'Square Consumer Products Ltd', notes: 'Cash payment for PO #PO-20261119-2002', transaction_date: new Date(Date.now() - 3 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: 'tx-3', transaction_number: 'TX-20261120-0003', account_id: 'a0000000-0000-0000-0000-000000000001', account_name: 'Main Cash Register', type: 'income', category: 'sales_income', amount: 10500, balance_after: 45000, reference_type: 'sale', reference_id: 'e0000000-0000-0000-0000-000000000001', party_type: 'customer', party_id: 'b0000000-0000-0000-0000-000000000001', party_name: 'Karim General Store', notes: 'Cash receipt on delivery for INV #INV-20261120-1001', transaction_date: new Date(Date.now() - 2 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: 'tx-4', transaction_number: 'TX-20261121-0004', account_id: 'a0000000-0000-0000-0000-000000000002', account_name: 'DBBL Corporate Account', type: 'income', category: 'sales_income', amount: 18500, balance_after: 338500, reference_type: 'sale', reference_id: 'e0000000-0000-0000-0000-000000000002', party_type: 'customer', party_id: 'b0000000-0000-0000-0000-000000000002', party_name: 'Bismillah Traders', notes: 'DBBL bank transfer receipt for INV #INV-20261121-1002', transaction_date: new Date(Date.now() - 1 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: 'tx-5', transaction_number: 'TX-20261122-0005', account_id: 'a0000000-0000-0000-0000-000000000001', account_name: 'Main Cash Register', type: 'expense', category: 'operating_expense', amount: 2500, balance_after: 42500, reference_type: 'direct_expense', notes: 'Tejgaon Warehouse electricity bill payment', transaction_date: new Date(Date.now() - 12 * 3600000).toISOString(), created_at: new Date().toISOString() },
];

// Helper to get from local storage or seed
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

// Generate serial numbers
function generateNumber(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
}

// ==============================================================================
// UNIFIED DATA SERVICE CLASS
// ==============================================================================
class DataService {
  // Reset all local data to clean initial seed (useful for testing & demo)
  public resetToSeed(): void {
    setStored('categories', SEED_CATEGORIES);
    setStored('products', SEED_PRODUCTS);
    setStored('customers', SEED_CUSTOMERS);
    setStored('suppliers', SEED_SUPPLIERS);
    setStored('accounts', SEED_ACCOUNTS);
    setStored('sales', SEED_SALES);
    setStored('purchases', SEED_PURCHASES);
    setStored('stock_movements', SEED_STOCK_MOVEMENTS);
    setStored('financial_transactions', SEED_TRANSACTIONS);
  }

  // ----------------------------------------------------------------------------
  // DASHBOARD METRICS
  // ----------------------------------------------------------------------------
  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    const products = await this.getProducts();
    const sales = await this.getSales();
    const purchases = await this.getPurchases();
    const accounts = await this.getAccounts();
    const customers = await this.getCustomers();
    const suppliers = await this.getSuppliers();

    const activeSales = sales.filter((s) => s.status !== 'cancelled');
    const activePurchases = purchases.filter((p) => p.status !== 'cancelled');

    const totalSales = activeSales.reduce((acc, s) => acc + s.grand_total, 0);
    const totalPurchases = activePurchases.reduce((acc, p) => acc + p.grand_total, 0);
    const currentStockValue = products.reduce((acc, p) => acc + (p.current_stock * p.purchase_cost), 0);
    const cashBankBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
    const totalReceivables = customers.reduce((acc, c) => acc + c.total_receivable, 0);
    const totalPayables = suppliers.reduce((acc, s) => acc + s.total_payable, 0);
    const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock_level).length;

    return {
      totalSales,
      totalPurchases,
      currentStockValue,
      cashBankBalance,
      totalReceivables,
      totalPayables,
      salesCount: activeSales.length,
      purchasesCount: activePurchases.length,
      lowStockCount,
    };
  }

  // ----------------------------------------------------------------------------
  // CATEGORIES & PRODUCTS
  // ----------------------------------------------------------------------------
  public async getCategories(): Promise<Category[]> {
    return getStored('categories', SEED_CATEGORIES);
  }

  public async getProducts(): Promise<Product[]> {
    const products = getStored('products', SEED_PRODUCTS);
    const categories = await this.getCategories();
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    return products.map((p) => ({
      ...p,
      category_name: p.category_id ? catMap.get(p.category_id) || 'Uncategorized' : 'Uncategorized',
    }));
  }

  public async getProductById(id: string): Promise<Product | undefined> {
    const products = await this.getProducts();
    return products.find((p) => p.id === id);
  }

  public async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const products = getStored('products', SEED_PRODUCTS);

    // Validate unique SKU
    if (products.some((p) => p.sku.toLowerCase() === data.sku.trim().toLowerCase())) {
      throw new Error(`Product with SKU "${data.sku}" already exists`);
    }

    const newProduct: Product = {
      ...data,
      id: crypto.randomUUID(),
      current_stock: Number(data.current_stock) || 0,
      purchase_cost: Number(data.purchase_cost) || 0,
      selling_price: Number(data.selling_price) || 0,
      min_stock_level: Number(data.min_stock_level) || 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    products.unshift(newProduct);
    setStored('products', products);

    // If opening stock > 0, record opening movement
    if (newProduct.current_stock > 0) {
      const movements = getStored('stock_movements', SEED_STOCK_MOVEMENTS);
      movements.unshift({
        id: crypto.randomUUID(),
        product_id: newProduct.id,
        product_name: newProduct.name,
        product_sku: newProduct.sku,
        product_unit: newProduct.unit,
        movement_type: 'opening_stock',
        quantity: newProduct.current_stock,
        balance_after: newProduct.current_stock,
        reference_type: 'opening',
        notes: 'Initial inventory opening stock entry',
        created_at: new Date().toISOString(),
      });
      setStored('stock_movements', movements);
    }

    return newProduct;
  }

  public async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const products = getStored('products', SEED_PRODUCTS);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const updated = {
      ...products[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    products[index] = updated;
    setStored('products', products);
    return updated;
  }

  // ----------------------------------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------------------------------
  public async getCustomers(): Promise<Customer[]> {
    return getStored('customers', SEED_CUSTOMERS);
  }

  public async createCustomer(data: Omit<Customer, 'id' | 'total_receivable' | 'total_sales_count' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const customers = getStored('customers', SEED_CUSTOMERS);
    const newCustomer: Customer = {
      ...data,
      id: crypto.randomUUID(),
      total_receivable: 0,
      total_sales_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    setStored('customers', customers);
    return newCustomer;
  }

  // ----------------------------------------------------------------------------
  // SUPPLIERS
  // ----------------------------------------------------------------------------
  public async getSuppliers(): Promise<Supplier[]> {
    return getStored('suppliers', SEED_SUPPLIERS);
  }

  public async createSupplier(data: Omit<Supplier, 'id' | 'total_payable' | 'total_purchases_count' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const suppliers = getStored('suppliers', SEED_SUPPLIERS);
    const newSupplier: Supplier = {
      ...data,
      id: crypto.randomUUID(),
      total_payable: 0,
      total_purchases_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    suppliers.unshift(newSupplier);
    setStored('suppliers', suppliers);
    return newSupplier;
  }

  // ----------------------------------------------------------------------------
  // ACCOUNTS
  // ----------------------------------------------------------------------------
  public async getAccounts(): Promise<Account[]> {
    return getStored('accounts', SEED_ACCOUNTS);
  }

  public async createAccount(data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const newAccount: Account = {
      ...data,
      id: crypto.randomUUID(),
      balance: Number(data.balance) || 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    accounts.unshift(newAccount);
    setStored('accounts', accounts);
    return newAccount;
  }

  // ----------------------------------------------------------------------------
  // ATOMIC SALE PROCESSING (WORKFLOW B)
  // Customer -> Sale -> Items -> Stock Decrease -> Stock Movement -> Receivable -> Payment Record
  // ----------------------------------------------------------------------------
  public async processSale(input: CreateSaleInput): Promise<Sale> {
    const products = getStored('products', SEED_PRODUCTS);
    const customers = getStored('customers', SEED_CUSTOMERS);
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const sales = getStored('sales', SEED_SALES);
    const stockMovements = getStored('stock_movements', SEED_STOCK_MOVEMENTS);
    const transactions = getStored('financial_transactions', SEED_TRANSACTIONS);

    // 1. Validate customer
    const customer = customers.find((c) => c.id === input.customer_id);
    if (!customer) throw new Error('Customer not found');

    if (!input.items || input.items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    // 2. Pre-validate stock availability for all items (PREVENTS NEGATIVE INVENTORY)
    let calculatedSubtotal = 0;
    const resolvedItems: Array<{
      product: Product;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product not found: ${item.product_id}`);

      const qty = Number(item.quantity);
      if (qty <= 0) throw new Error(`Invalid quantity for ${product.name}`);

      // ATOMIC CHECK: Cannot sell more than available
      if (product.current_stock < qty) {
        throw new Error(
          `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available: ${product.current_stock} ${product.unit}, Requested: ${qty} ${product.unit}`
        );
      }

      const unitPrice = Number(item.unit_price);
      const subtotal = Math.round(qty * unitPrice * 100) / 100;
      calculatedSubtotal += subtotal;

      resolvedItems.push({
        product,
        quantity: qty,
        unit_price: unitPrice,
        subtotal,
      });
    }

    // 3. Financial calculations
    const discount = Number(input.discount) || 0;
    const tax = Number(input.tax) || 0;
    const grandTotal = Math.round((calculatedSubtotal - discount + tax) * 100) / 100;
    const paidAmount = Number(input.paid_amount) || 0;

    if (paidAmount > grandTotal) {
      throw new Error(`Paid amount (৳${paidAmount}) cannot exceed grand total (৳${grandTotal})`);
    }

    const dueAmount = Math.round((grandTotal - paidAmount) * 100) / 100;
    const paymentStatus = paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    let account: Account | undefined;
    if (paidAmount > 0) {
      if (!input.account_id) throw new Error('Payment account must be selected when payment is received');
      account = accounts.find((a) => a.id === input.account_id);
      if (!account) throw new Error('Selected payment account not found');
    }

    // 4. Generate records
    const saleId = crypto.randomUUID();
    const invoiceNumber = generateNumber('INV');

    // 5. Deduct inventory & record stock movements
    for (const res of resolvedItems) {
      const prodIndex = products.findIndex((p) => p.id === res.product.id);
      products[prodIndex].current_stock -= res.quantity;
      products[prodIndex].updated_at = new Date().toISOString();

      stockMovements.unshift({
        id: crypto.randomUUID(),
        product_id: res.product.id,
        product_name: res.product.name,
        product_sku: res.product.sku,
        product_unit: res.product.unit,
        movement_type: 'sales_out',
        quantity: -res.quantity,
        balance_after: products[prodIndex].current_stock,
        reference_type: 'sale',
        reference_id: saleId,
        notes: `Sold via Invoice #${invoiceNumber}`,
        created_at: new Date().toISOString(),
      });
    }

    // 6. Update customer receivables & counter
    const custIndex = customers.findIndex((c) => c.id === customer.id);
    customers[custIndex].total_receivable += dueAmount;
    customers[custIndex].total_sales_count += 1;
    customers[custIndex].updated_at = new Date().toISOString();

    // 7. Update financial account & create transaction if paid
    if (paidAmount > 0 && account) {
      const accIndex = accounts.findIndex((a) => a.id === account.id);
      accounts[accIndex].balance += paidAmount;
      accounts[accIndex].updated_at = new Date().toISOString();

      const txNumber = generateNumber('TX');
      transactions.unshift({
        id: crypto.randomUUID(),
        transaction_number: txNumber,
        account_id: account.id,
        account_name: account.name,
        type: 'income',
        category: 'sales_income',
        amount: paidAmount,
        balance_after: accounts[accIndex].balance,
        reference_type: 'sale',
        reference_id: saleId,
        party_type: 'customer',
        party_id: customer.id,
        party_name: customer.name,
        notes: `Payment received for Invoice #${invoiceNumber}`,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // 8. Create sale record
    const newSale: Sale = {
      id: saleId,
      invoice_number: invoiceNumber,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      sale_date: new Date().toISOString(),
      subtotal: calculatedSubtotal,
      discount,
      tax,
      grand_total: grandTotal,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_status: paymentStatus,
      payment_method: input.payment_method || 'cash',
      account_id: input.account_id,
      account_name: account?.name,
      status: 'completed',
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: resolvedItems.map((r) => ({
        id: crypto.randomUUID(),
        sale_id: saleId,
        product_id: r.product.id,
        product_name: r.product.name,
        product_sku: r.product.sku,
        product_unit: r.product.unit,
        quantity: r.quantity,
        unit_price: r.unit_price,
        subtotal: r.subtotal,
        purchase_cost: r.product.purchase_cost,
        created_at: new Date().toISOString(),
      })),
    };

    sales.unshift(newSale);

    // Commit all changes
    setStored('products', products);
    setStored('customers', customers);
    setStored('accounts', accounts);
    setStored('sales', sales);
    setStored('stock_movements', stockMovements);
    setStored('financial_transactions', transactions);

    return newSale;
  }

  // ----------------------------------------------------------------------------
  // ATOMIC PURCHASE PROCESSING (WORKFLOW A)
  // Supplier -> Purchase -> Items -> Stock Increase -> Stock Movement -> Payable -> Payment Record
  // ----------------------------------------------------------------------------
  public async processPurchase(input: CreatePurchaseInput): Promise<Purchase> {
    const products = getStored('products', SEED_PRODUCTS);
    const suppliers = getStored('suppliers', SEED_SUPPLIERS);
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const purchases = getStored('purchases', SEED_PURCHASES);
    const stockMovements = getStored('stock_movements', SEED_STOCK_MOVEMENTS);
    const transactions = getStored('financial_transactions', SEED_TRANSACTIONS);

    // 1. Validate supplier
    const supplier = suppliers.find((s) => s.id === input.supplier_id);
    if (!supplier) throw new Error('Supplier not found');

    if (!input.items || input.items.length === 0) {
      throw new Error('Purchase must contain at least one item');
    }

    // 2. Validate items
    let calculatedSubtotal = 0;
    const resolvedItems: Array<{
      product: Product;
      quantity: number;
      unit_cost: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product not found: ${item.product_id}`);

      const qty = Number(item.quantity);
      if (qty <= 0) throw new Error(`Invalid quantity for ${product.name}`);

      const unitCost = Number(item.unit_cost);
      if (unitCost < 0) throw new Error(`Invalid unit cost for ${product.name}`);

      const subtotal = Math.round(qty * unitCost * 100) / 100;
      calculatedSubtotal += subtotal;

      resolvedItems.push({
        product,
        quantity: qty,
        unit_cost: unitCost,
        subtotal,
      });
    }

    // 3. Financial calculations
    const discount = Number(input.discount) || 0;
    const tax = Number(input.tax) || 0;
    const grandTotal = Math.round((calculatedSubtotal - discount + tax) * 100) / 100;
    const paidAmount = Number(input.paid_amount) || 0;

    if (paidAmount > grandTotal) {
      throw new Error(`Paid amount (৳${paidAmount}) cannot exceed grand total (৳${grandTotal})`);
    }

    const dueAmount = Math.round((grandTotal - paidAmount) * 100) / 100;
    const paymentStatus = paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    let account: Account | undefined;
    if (paidAmount > 0) {
      if (!input.account_id) throw new Error('Payment account must be selected when payment is made');
      account = accounts.find((a) => a.id === input.account_id);
      if (!account) throw new Error('Selected payment account not found');
    }

    // 4. Generate records
    const purchaseId = crypto.randomUUID();
    const invoiceNumber = generateNumber('PO');

    // 5. Increase inventory & update purchase cost & record stock movements
    for (const res of resolvedItems) {
      const prodIndex = products.findIndex((p) => p.id === res.product.id);
      products[prodIndex].current_stock += res.quantity;
      products[prodIndex].purchase_cost = res.unit_cost; // update cost
      products[prodIndex].updated_at = new Date().toISOString();

      stockMovements.unshift({
        id: crypto.randomUUID(),
        product_id: res.product.id,
        product_name: res.product.name,
        product_sku: res.product.sku,
        product_unit: res.product.unit,
        movement_type: 'purchase_in',
        quantity: res.quantity,
        balance_after: products[prodIndex].current_stock,
        reference_type: 'purchase',
        reference_id: purchaseId,
        notes: `Received via PO #${invoiceNumber}`,
        created_at: new Date().toISOString(),
      });
    }

    // 6. Update supplier payables & counter
    const suppIndex = suppliers.findIndex((s) => s.id === supplier.id);
    suppliers[suppIndex].total_payable += dueAmount;
    suppliers[suppIndex].total_purchases_count += 1;
    suppliers[suppIndex].updated_at = new Date().toISOString();

    // 7. Update financial account & create transaction if paid
    if (paidAmount > 0 && account) {
      const accIndex = accounts.findIndex((a) => a.id === account.id);
      accounts[accIndex].balance -= paidAmount;
      accounts[accIndex].updated_at = new Date().toISOString();

      const txNumber = generateNumber('TX');
      transactions.unshift({
        id: crypto.randomUUID(),
        transaction_number: txNumber,
        account_id: account.id,
        account_name: account.name,
        type: 'expense',
        category: 'purchase_expense',
        amount: paidAmount,
        balance_after: accounts[accIndex].balance,
        reference_type: 'purchase',
        reference_id: purchaseId,
        party_type: 'supplier',
        party_id: supplier.id,
        party_name: supplier.name,
        notes: `Payment made for PO #${invoiceNumber}`,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // 8. Create purchase record
    const newPurchase: Purchase = {
      id: purchaseId,
      invoice_number: invoiceNumber,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_phone: supplier.phone,
      purchase_date: new Date().toISOString(),
      subtotal: calculatedSubtotal,
      discount,
      tax,
      grand_total: grandTotal,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_status: paymentStatus,
      payment_method: input.payment_method || 'cash',
      account_id: input.account_id,
      account_name: account?.name,
      status: 'completed',
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: resolvedItems.map((r) => ({
        id: crypto.randomUUID(),
        purchase_id: purchaseId,
        product_id: r.product.id,
        product_name: r.product.name,
        product_sku: r.product.sku,
        product_unit: r.product.unit,
        quantity: r.quantity,
        unit_cost: r.unit_cost,
        subtotal: r.subtotal,
        created_at: new Date().toISOString(),
      })),
    };

    purchases.unshift(newPurchase);

    // Commit all changes
    setStored('products', products);
    setStored('suppliers', suppliers);
    setStored('accounts', accounts);
    setStored('purchases', purchases);
    setStored('stock_movements', stockMovements);
    setStored('financial_transactions', transactions);

    return newPurchase;
  }

  // ----------------------------------------------------------------------------
  // ATOMIC CUSTOMER PAYMENT COLLECTION (WORKFLOW C)
  // Customer -> Outstanding Invoice -> Receivable Reduction -> Cash/Bank Increase
  // ----------------------------------------------------------------------------
  public async processCustomerPayment(input: CustomerPaymentInput): Promise<FinancialTransaction> {
    const customers = getStored('customers', SEED_CUSTOMERS);
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const sales = getStored('sales', SEED_SALES);
    const transactions = getStored('financial_transactions', SEED_TRANSACTIONS);

    const amount = Number(input.amount);
    if (amount <= 0) throw new Error('Payment amount must be greater than 0');

    const customer = customers.find((c) => c.id === input.customer_id);
    if (!customer) throw new Error('Customer not found');

    if (customer.total_receivable < amount) {
      throw new Error(`Payment amount (৳${amount}) exceeds customer outstanding receivable (৳${customer.total_receivable})`);
    }

    const account = accounts.find((a) => a.id === input.account_id);
    if (!account) throw new Error('Selected deposit account not found');

    // If specific invoice is targeted, update it
    if (input.sale_id) {
      const saleIndex = sales.findIndex((s) => s.id === input.sale_id);
      if (saleIndex !== -1) {
        sales[saleIndex].paid_amount += amount;
        sales[saleIndex].due_amount = Math.max(0, sales[saleIndex].due_amount - amount);
        sales[saleIndex].payment_status = sales[saleIndex].due_amount <= 0 ? 'paid' : 'partial';
        sales[saleIndex].updated_at = new Date().toISOString();
      }
    }

    // Reduce customer receivable
    const custIndex = customers.findIndex((c) => c.id === customer.id);
    customers[custIndex].total_receivable -= amount;
    customers[custIndex].updated_at = new Date().toISOString();

    // Increase cash/bank balance
    const accIndex = accounts.findIndex((a) => a.id === account.id);
    accounts[accIndex].balance += amount;
    accounts[accIndex].updated_at = new Date().toISOString();

    // Create financial transaction
    const txNumber = generateNumber('TX');
    const newTx: FinancialTransaction = {
      id: crypto.randomUUID(),
      transaction_number: txNumber,
      account_id: account.id,
      account_name: account.name,
      type: 'income',
      category: 'customer_payment',
      amount,
      balance_after: accounts[accIndex].balance,
      reference_type: 'customer_payment',
      reference_id: input.sale_id,
      party_type: 'customer',
      party_id: customer.id,
      party_name: customer.name,
      notes: input.notes || `Collected receivable payment from ${customer.name}`,
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    transactions.unshift(newTx);

    // Commit
    setStored('customers', customers);
    setStored('accounts', accounts);
    setStored('sales', sales);
    setStored('financial_transactions', transactions);

    return newTx;
  }

  // ----------------------------------------------------------------------------
  // ATOMIC SUPPLIER PAYMENT (WORKFLOW D)
  // Supplier -> Outstanding Purchase -> Payable Reduction -> Cash/Bank Decrease
  // ----------------------------------------------------------------------------
  public async processSupplierPayment(input: SupplierPaymentInput): Promise<FinancialTransaction> {
    const suppliers = getStored('suppliers', SEED_SUPPLIERS);
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const purchases = getStored('purchases', SEED_PURCHASES);
    const transactions = getStored('financial_transactions', SEED_TRANSACTIONS);

    const amount = Number(input.amount);
    if (amount <= 0) throw new Error('Payment amount must be greater than 0');

    const supplier = suppliers.find((s) => s.id === input.supplier_id);
    if (!supplier) throw new Error('Supplier not found');

    if (supplier.total_payable < amount) {
      throw new Error(`Payment amount (৳${amount}) exceeds supplier outstanding payable (৳${supplier.total_payable})`);
    }

    const account = accounts.find((a) => a.id === input.account_id);
    if (!account) throw new Error('Selected payment account not found');

    // If specific purchase is targeted, update it
    if (input.purchase_id) {
      const poIndex = purchases.findIndex((p) => p.id === input.purchase_id);
      if (poIndex !== -1) {
        purchases[poIndex].paid_amount += amount;
        purchases[poIndex].due_amount = Math.max(0, purchases[poIndex].due_amount - amount);
        purchases[poIndex].payment_status = purchases[poIndex].due_amount <= 0 ? 'paid' : 'partial';
        purchases[poIndex].updated_at = new Date().toISOString();
      }
    }

    // Reduce supplier payable
    const suppIndex = suppliers.findIndex((s) => s.id === supplier.id);
    suppliers[suppIndex].total_payable -= amount;
    suppliers[suppIndex].updated_at = new Date().toISOString();

    // Decrease cash/bank balance
    const accIndex = accounts.findIndex((a) => a.id === account.id);
    accounts[accIndex].balance -= amount;
    accounts[accIndex].updated_at = new Date().toISOString();

    // Create financial transaction
    const txNumber = generateNumber('TX');
    const newTx: FinancialTransaction = {
      id: crypto.randomUUID(),
      transaction_number: txNumber,
      account_id: account.id,
      account_name: account.name,
      type: 'expense',
      category: 'supplier_payment',
      amount,
      balance_after: accounts[accIndex].balance,
      reference_type: 'supplier_payment',
      reference_id: input.purchase_id,
      party_type: 'supplier',
      party_id: supplier.id,
      party_name: supplier.name,
      notes: input.notes || `Disbursed payable payment to ${supplier.name}`,
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    transactions.unshift(newTx);

    // Commit
    setStored('suppliers', suppliers);
    setStored('accounts', accounts);
    setStored('purchases', purchases);
    setStored('financial_transactions', transactions);

    return newTx;
  }

  // ----------------------------------------------------------------------------
  // ATOMIC STOCK ADJUSTMENT (WORKFLOW E)
  // Inventory -> Adjustment -> Stock Movement -> Updated Quantity
  // ----------------------------------------------------------------------------
  public async processStockAdjustment(input: StockAdjustmentInput): Promise<StockMovement> {
    const products = getStored('products', SEED_PRODUCTS);
    const stockMovements = getStored('stock_movements', SEED_STOCK_MOVEMENTS);

    const qty = Number(input.quantity);
    if (qty <= 0) throw new Error('Adjustment quantity must be greater than 0');

    const prodIndex = products.findIndex((p) => p.id === input.product_id);
    if (prodIndex === -1) throw new Error('Product not found');

    const product = products[prodIndex];

    if (input.adjustment_type === 'deduction') {
      if (product.current_stock < qty) {
        throw new Error(`Cannot deduct ${qty} ${product.unit}. Current available stock is only ${product.current_stock} ${product.unit}`);
      }
      product.current_stock -= qty;
    } else {
      product.current_stock += qty;
    }

    product.updated_at = new Date().toISOString();

    const signedQty = input.adjustment_type === 'addition' ? qty : -qty;

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      product_unit: product.unit,
      movement_type: 'stock_adjustment',
      quantity: signedQty,
      balance_after: product.current_stock,
      reference_type: 'adjustment',
      notes: input.reason || 'Manual inventory adjustment entry',
      created_at: new Date().toISOString(),
    };

    stockMovements.unshift(movement);

    setStored('products', products);
    setStored('stock_movements', stockMovements);

    return movement;
  }

  // ----------------------------------------------------------------------------
  // TRANSACTION CANCELLATIONS (WITH INVENTORY & ACCOUNTING REVERSALS)
  // ----------------------------------------------------------------------------
  public async cancelSale(saleId: string, reason: string): Promise<Sale> {
    const sales = getStored('sales', SEED_SALES);
    const products = getStored('products', SEED_PRODUCTS);
    const customers = getStored('customers', SEED_CUSTOMERS);
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const stockMovements = getStored('stock_movements', SEED_STOCK_MOVEMENTS);
    const transactions = getStored('financial_transactions', SEED_TRANSACTIONS);

    const saleIndex = sales.findIndex((s) => s.id === saleId);
    if (saleIndex === -1) throw new Error('Sale not found');

    const sale = sales[saleIndex];
    if (sale.status === 'cancelled') throw new Error('Sale is already cancelled');

    // 1. Restore stock
    if (sale.items) {
      for (const item of sale.items) {
        const pIdx = products.findIndex((p) => p.id === item.product_id);
        if (pIdx !== -1) {
          products[pIdx].current_stock += item.quantity;
          products[pIdx].updated_at = new Date().toISOString();

          stockMovements.unshift({
            id: crypto.randomUUID(),
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            product_unit: item.product_unit,
            movement_type: 'sales_return',
            quantity: item.quantity,
            balance_after: products[pIdx].current_stock,
            reference_type: 'sale',
            reference_id: sale.id,
            notes: `Stock restored from cancelled Sale #${sale.invoice_number}`,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Reverse customer receivable
    if (sale.due_amount > 0) {
      const cIdx = customers.findIndex((c) => c.id === sale.customer_id);
      if (cIdx !== -1) {
        customers[cIdx].total_receivable = Math.max(0, customers[cIdx].total_receivable - sale.due_amount);
        customers[cIdx].updated_at = new Date().toISOString();
      }
    }

    // 3. Reverse cash/bank if paid
    if (sale.paid_amount > 0 && sale.account_id) {
      const aIdx = accounts.findIndex((a) => a.id === sale.account_id);
      if (aIdx !== -1) {
        accounts[aIdx].balance -= sale.paid_amount;
        accounts[aIdx].updated_at = new Date().toISOString();

        transactions.unshift({
          id: crypto.randomUUID(),
          transaction_number: generateNumber('TX'),
          account_id: sale.account_id,
          account_name: sale.account_name,
          type: 'expense',
          category: 'refund',
          amount: sale.paid_amount,
          balance_after: accounts[aIdx].balance,
          reference_type: 'sale',
          reference_id: sale.id,
          party_type: 'customer',
          party_id: sale.customer_id,
          party_name: sale.customer_name,
          notes: `Refund issued for cancelled Sale #${sale.invoice_number}`,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    }

    // 4. Update status
    sales[saleIndex].status = 'cancelled';
    sales[saleIndex].notes = `${sale.notes || ''} [Cancelled: ${reason}]`.trim();
    sales[saleIndex].updated_at = new Date().toISOString();

    setStored('sales', sales);
    setStored('products', products);
    setStored('customers', customers);
    setStored('accounts', accounts);
    setStored('stock_movements', stockMovements);
    setStored('financial_transactions', transactions);

    return sales[saleIndex];
  }

  public async cancelPurchase(purchaseId: string, reason: string): Promise<Purchase> {
    const purchases = getStored('purchases', SEED_PURCHASES);
    const products = getStored('products', SEED_PRODUCTS);
    const suppliers = getStored('suppliers', SEED_SUPPLIERS);
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const stockMovements = getStored('stock_movements', SEED_STOCK_MOVEMENTS);
    const transactions = getStored('financial_transactions', SEED_TRANSACTIONS);

    const poIndex = purchases.findIndex((p) => p.id === purchaseId);
    if (poIndex === -1) throw new Error('Purchase not found');

    const purchase = purchases[poIndex];
    if (purchase.status === 'cancelled') throw new Error('Purchase is already cancelled');

    // 1. Verify that current stock >= purchased quantity so stock hasn't already been consumed
    if (purchase.items) {
      for (const item of purchase.items) {
        const prod = products.find((p) => p.id === item.product_id);
        if (!prod || prod.current_stock < item.quantity) {
          throw new Error(
            `Cannot cancel purchase: Stock for "${prod?.name || 'Item'}" has already been sold/consumed (Current stock: ${prod?.current_stock || 0}, Needed: ${item.quantity})`
          );
        }
      }
    }

    // 2. Reverse stock
    if (purchase.items) {
      for (const item of purchase.items) {
        const pIdx = products.findIndex((p) => p.id === item.product_id);
        if (pIdx !== -1) {
          products[pIdx].current_stock -= item.quantity;
          products[pIdx].updated_at = new Date().toISOString();

          stockMovements.unshift({
            id: crypto.randomUUID(),
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            product_unit: item.product_unit,
            movement_type: 'purchase_return',
            quantity: -item.quantity,
            balance_after: products[pIdx].current_stock,
            reference_type: 'purchase',
            reference_id: purchase.id,
            notes: `Stock returned for cancelled PO #${purchase.invoice_number}`,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Reverse supplier payable
    if (purchase.due_amount > 0) {
      const sIdx = suppliers.findIndex((s) => s.id === purchase.supplier_id);
      if (sIdx !== -1) {
        suppliers[sIdx].total_payable = Math.max(0, suppliers[sIdx].total_payable - purchase.due_amount);
        suppliers[sIdx].updated_at = new Date().toISOString();
      }
    }

    // 4. Refund cash/bank if paid
    if (purchase.paid_amount > 0 && purchase.account_id) {
      const aIdx = accounts.findIndex((a) => a.id === purchase.account_id);
      if (aIdx !== -1) {
        accounts[aIdx].balance += purchase.paid_amount;
        accounts[aIdx].updated_at = new Date().toISOString();

        transactions.unshift({
          id: crypto.randomUUID(),
          transaction_number: generateNumber('TX'),
          account_id: purchase.account_id,
          account_name: purchase.account_name,
          type: 'income',
          category: 'refund',
          amount: purchase.paid_amount,
          balance_after: accounts[aIdx].balance,
          reference_type: 'purchase',
          reference_id: purchase.id,
          party_type: 'supplier',
          party_id: purchase.supplier_id,
          party_name: purchase.supplier_name,
          notes: `Refund received for cancelled PO #${purchase.invoice_number}`,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    }

    // 5. Update status
    purchases[poIndex].status = 'cancelled';
    purchases[poIndex].notes = `${purchase.notes || ''} [Cancelled: ${reason}]`.trim();
    purchases[poIndex].updated_at = new Date().toISOString();

    setStored('purchases', purchases);
    setStored('products', products);
    setStored('suppliers', suppliers);
    setStored('accounts', accounts);
    setStored('stock_movements', stockMovements);
    setStored('financial_transactions', transactions);

    return purchases[poIndex];
  }

  // ----------------------------------------------------------------------------
  // DIRECT EXPENSE & INCOME
  // ----------------------------------------------------------------------------
  public async recordDirectTransaction(data: {
    account_id: string;
    type: 'income' | 'expense';
    category: 'operating_expense' | 'other_income';
    amount: number;
    notes: string;
  }): Promise<FinancialTransaction> {
    const accounts = getStored('accounts', SEED_ACCOUNTS);
    const transactions = getStored('financial_transactions', SEED_TRANSACTIONS);

    const amount = Number(data.amount);
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const accIndex = accounts.findIndex((a) => a.id === data.account_id);
    if (accIndex === -1) throw new Error('Account not found');

    if (data.type === 'expense') {
      accounts[accIndex].balance -= amount;
    } else {
      accounts[accIndex].balance += amount;
    }
    accounts[accIndex].updated_at = new Date().toISOString();

    const tx: FinancialTransaction = {
      id: crypto.randomUUID(),
      transaction_number: generateNumber('TX'),
      account_id: data.account_id,
      account_name: accounts[accIndex].name,
      type: data.type,
      category: data.category,
      amount,
      balance_after: accounts[accIndex].balance,
      reference_type: data.type === 'expense' ? 'direct_expense' : 'direct_income',
      notes: data.notes,
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    transactions.unshift(tx);

    setStored('accounts', accounts);
    setStored('financial_transactions', transactions);

    return tx;
  }

  // ----------------------------------------------------------------------------
  // LIST QUERIES
  // ----------------------------------------------------------------------------
  public async getSales(): Promise<Sale[]> {
    return getStored('sales', SEED_SALES);
  }

  public async getPurchases(): Promise<Purchase[]> {
    return getStored('purchases', SEED_PURCHASES);
  }

  public async getStockMovements(): Promise<StockMovement[]> {
    return getStored('stock_movements', SEED_STOCK_MOVEMENTS);
  }

  public async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return getStored('financial_transactions', SEED_TRANSACTIONS);
  }
}

export const dataService = new DataService();
