# Totally — Professional Integrated Mini ERP System

> **Technical Recruitment Assessment — Code Bondhu IT**  
> Role: Senior Full-Stack Software Engineer / ERP Solution Architect  
> Currency: Bangladeshi Taka (BDT ৳) | Target Domain: FMCG Wholesale & Distribution

---

## 1. Project Overview

**Totally** is a fully functional, integrated enterprise resource planning system engineered for small-to-medium-sized trading and wholesale businesses.

Unlike disjointed CRUD applications, Totally unifies **Sales, Procurement, Inventory, and Financial Accounting** on top of a shared relational schema and transactional ledger. Every sale, purchase order, customer receivable collection, and supplier payment executes with atomic consistency, preventing negative stock, duplicate submissions, and unbalanced ledger postings.

### Key Engineering Principles
- **True Cross-Module Integration**: Purchases directly update product stock, cost averages, and supplier payables. Sales directly validate and deduct inventory, increase customer receivables, and log financial transactions.
- **Atomic Operations & ACID Compliance**: Core business transactions run via PostgreSQL stored procedures (RPCs) wrapped in explicit transaction locks (`FOR UPDATE`).
- **Human-Made SaaS Aesthetic**: Inspired by Linear, Stripe, and modern enterprise consoles. Restrained typography, tabular numerals, clean status badges, and no gratuitous animations or AI clichés.
- **Zero-Friction Evaluation**: Runs either connected to a live Supabase Cloud database or with an integrated, zero-configuration local ACID engine holding realistic Bangladeshi seed data.

---

## 2. Technology Stack

### Frontend
- **React 18 / 19** with **TypeScript**
- **Vite** with **Tailwind CSS v4**
- **Lucide React** (Consistent line iconography)
- **TanStack Query (React Query v5)** (Server state management & cache invalidation)
- **React Hook Form** & **Zod** (Validation)
- **Recharts** (Interactive trend and comparison analytics)

### Backend & Database
- **Supabase Cloud**
- **PostgreSQL 15+** with Relational Schema
- **Supabase Authentication & Role-Based Access Control (RBAC)**
- **PostgreSQL Stored Functions (RPC)** for atomic multi-table transactions
- **Row Level Security (RLS)** policies

---

## 3. Modular Feature-Based Architecture

```
nexus-erp/
├── src/
│   ├── app/
│   │   └── App.tsx                      # Root application & provider tree
│   ├── components/
│   │   ├── common/                      # Reusable UI primitives
│   │   │   ├── DataTable.tsx            # Data table with sorting & pagination
│   │   │   ├── PageHeader.tsx           # Page headers & breadcrumbs
│   │   │   ├── StatCard.tsx             # Metric KPI cards
│   │   │   ├── StatusBadge.tsx          # Consistent status pills
│   │   │   ├── SearchInput.tsx          # Debounced search bar
│   │   │   ├── ConfirmDialog.tsx        # Destructive confirmation modal
│   │   │   ├── EmptyState.tsx           # Empty dataset presentation
│   │   │   └── LoadingState.tsx         # Spinner and loading state
│   │   └── layout/
│   │       ├── AppSidebar.tsx           # Dark corporate sidebar with role switcher
│   │       ├── AppHeader.tsx            # Header with sync pill & re-seed action
│   │       └── MainLayout.tsx           # Shell layout container
│   ├── features/
│   │   ├── authentication/
│   │   │   ├── AuthContext.tsx          # RBAC provider & session management
│   │   │   └── LoginView.tsx            # Clean corporate login & 1-click presets
│   │   ├── dashboard/
│   │   │   └── DashboardView.tsx        # Real-time KPIs, charts & quick actions
│   │   ├── sales/
│   │   │   ├── SalesView.tsx            # Sales order management
│   │   │   ├── CreateSaleModal.tsx      # Stock-validated POS invoice generator
│   │   │   └── SaleInvoiceModal.tsx     # Printable commercial invoice
│   │   ├── purchases/
│   │   │   ├── PurchasesView.tsx        # Purchase orders and vendor receipts
│   │   │   ├── CreatePurchaseModal.tsx  # Inbound restock with cost tracking
│   │   │   └── PurchaseDetailsModal.tsx # Printable PO voucher & cancellation
│   │   ├── inventory/
│   │   │   ├── InventoryView.tsx        # Product catalog & stock assets
│   │   │   ├── CreateProductModal.tsx   # Product & SKU management
│   │   │   ├── StockAdjustmentModal.tsx # Audited manual stock adjustments
│   │   │   └── ProductLedgerModal.tsx   # Item movement audit ledger
│   │   ├── accounts/
│   │   │   ├── AccountsView.tsx         # Chart of accounts, receivables & payables
│   │   │   ├── CollectPaymentModal.tsx  # Customer receivable collection
│   │   │   ├── PaySupplierModal.tsx     # Supplier payable disbursement
│   │   │   └── DirectExpenseModal.tsx   # Overhead operating expenses
│   │   ├── customers/
│   │   │   └── CustomersView.tsx        # Client directory & credit limits
│   │   ├── suppliers/
│   │   │   └── SuppliersView.tsx        # Vendor directory & supply agreements
│   │   └── settings/
│   │       └── SettingsView.tsx         # Migrations viewer & test suite runner
│   ├── lib/
│   │   ├── supabase.ts                  # Supabase client initialization
│   │   ├── query-client.ts              # TanStack Query client configuration
│   │   └── data-service.ts              # Unified ACID transactional engine
│   ├── types/
│   │   └── index.ts                     # TypeScript domain models & DTOs
│   └── utils/
│       ├── currency.ts                  # Bangladeshi Taka (৳) formatter
│       ├── date.ts                      # Clean date formatting
│       └── cn.ts                        # Tailwind class merge utility
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql       # Tables, foreign keys, numeric precision
│       ├── 002_functions.sql            # Atomic transaction RPC stored procedures
│       ├── 003_rls_policies.sql         # Multi-role Row Level Security policies
│       └── 004_seed_data.sql            # Realistic Bangladeshi FMCG seed data
└── scripts/
    └── verify-suite.mjs                 # Automated 10-point scenario tester
```

---

## 4. Demo Credentials & Access Simulator

The system includes pre-configured corporate accounts for role testing. You can sign in using credentials or switch roles instantly using the **Role Simulator** in the sidebar.

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@nexuserp.bd` | `Nexus@2026` | Complete access to all modules, settings & SQL |
| **Operations Manager** | `manager@nexuserp.bd` | `Nexus@2026` | Full access to Sales, Purchases, Stock; view Accounts |
| **Head Accountant** | `accountant@nexuserp.bd` | `Nexus@2026` | Accounts, Receivables, Payables, General Ledger |
| **Sales Staff** | `sales@nexuserp.bd` | `Nexus@2026` | Create & view Sales invoices, Customer directory |
| **Procurement Staff**| `purchase@nexuserp.bd` | `Nexus@2026` | Create & view Purchase orders, Supplier directory |

---

## 5. Critical Business Logic & Integrated Workflows

### Workflow A: Inbound Purchase & Restock
1. Staff selects vendor and adds product lines with cost prices and quantities.
2. The transaction executes atomically:
   - Increments product inventory quantity (`current_stock = current_stock + qty`).
   - Updates latest unit purchase cost.
   - Logs `purchase_in` in `stock_movements`.
   - If payment is made, decrements the chosen cash/bank account and creates an expense record.
   - If unpaid/partial, increments supplier `total_payable`.

### Workflow B: Sales & Stock Deduction
1. Customer is chosen and products added to the invoice.
2. The engine executes atomic pre-validation:
   - **Negative Stock Prevention**: Verifies `current_stock >= requested_qty`. If any item is short, the entire invoice aborts.
   - Deducts sold quantities (`current_stock = current_stock - qty`).
   - Logs `sales_out` in `stock_movements`.
   - If paid, increments cash/bank balance and creates `sales_income` transaction.
   - If unpaid/partial, increments customer `total_receivable`.

### Workflow C: Customer Payment Collection
1. Customer payment reduces customer `total_receivable`.
2. Increases selected cash/bank account balance.
3. Records `customer_payment` in the financial ledger.
4. Updates referenced sale invoice `paid_amount` and `payment_status`.

### Workflow D: Supplier Payment Disbursement
1. Payment reduces vendor `total_payable`.
2. Decreases selected cash/bank account balance.
3. Records `supplier_payment` in the financial ledger.
4. Updates referenced purchase order `paid_amount` and `payment_status`.

### Workflow E: Transaction Cancellation & Reversals
- **Sales Cancellation**: Restores product stock (`sales_return`), reverses customer receivables, and issues refund transaction if cash was collected.
- **Purchase Cancellation**: Validates that stock has not already been consumed below required return quantity; then reverses inventory and financial disbursements.

---

## 6. Installation & Local Development

### Prerequisites
- Node.js 20+
- npm 10+

### Step-by-Step Setup
```bash
# 1. Clone repository
git clone https://github.com/your-username/nexus-erp.git
cd nexus-erp

# 2. Install dependencies
npm install

# 3. (Optional) Configure Supabase Cloud credentials
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY if connecting to remote cluster.
# If left blank, the app will run in local high-fidelity ACID mode.

# 4. Start local development server
npm run dev

# 5. Execute technical assessment test suite
npm test
```

---

## 7. Database Setup (Supabase Cloud)

If deploying to Supabase Cloud:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase dashboard.
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_functions.sql`
   - `supabase/migrations/003_rls_policies.sql`
   - `supabase/migrations/004_seed_data.sql`
4. Copy your **Project URL** and **anon public API Key** into `.env`.

---

## 8. Assessment Verification Test Results

Execute `npm test` or open the **Database & SQL** tab in the UI and click **Run All 10 Tests**.

```
------------------------------------------------------------
NEXUS ERP: 10-POINT TECHNICAL RECRUITMENT VERIFICATION SUITE
Candidate: Software Engineer Assessment
------------------------------------------------------------

[PASS] TEST 1: Inbound Restock
       -> Stock increased from 65 to 115 (+50 units verified)
[PASS] TEST 2: Outbound Sales Deduction
       -> Stock decreased from 115 to 105 (-10 units verified)
[PASS] TEST 3: Negative Stock Prevention
       -> Attempt to oversell was intercepted with Insufficient Stock exception. Stock unchanged.
[PASS] TEST 4: Credit Sale & Receivables
       -> Customer receivables increased by ৳5000. Cash balance remained exactly ৳45000.
[PASS] TEST 5: Partial Customer Payment Collection
       -> Receivables reduced by ৳2500 and cash balance increased by exactly ৳2500.
[PASS] TEST 6: Unpaid Purchase & Payables
       -> Supplier payables increased by ৳15000 without cash reduction.
[PASS] TEST 7: Partial Supplier Payment Disbursement
       -> Payables decreased by ৳7000 and cash decreased by exactly ৳7000.
[PASS] TEST 8: Duplicate Submission Guard
       -> Unique constraint enforced: duplicate SKU submission was blocked.
[PASS] TEST 9: Transaction Cancellation Reversal
       -> Cancelled sale restored inventory stock from 105 to 115.
[PASS] TEST 10: Multi-Role Access Control
       -> Verified RLS & client routing guards strictly segregate module permissions.

------------------------------------------------------------
ALL 10/10 ASSESSMENT VERIFICATION SCENARIOS PASSED!
------------------------------------------------------------
```

---

## 9. Vercel Deployment Instructions

1. Push code to your GitHub repository.
2. Import project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

---

*Submitted for Code Bondhu IT Technical Assessment.*
