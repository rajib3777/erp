import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Plus,
  Wallet,
  CreditCard,
  Building2,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Account, Customer, Supplier, FinancialTransaction } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDate, formatDateTime } from '@/utils/date';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, Column } from '@/components/common/DataTable';
import { CollectPaymentModal } from './CollectPaymentModal';
import { PaySupplierModal } from './PaySupplierModal';
import { DirectExpenseModal } from './DirectExpenseModal';

export const AccountsView: React.FC = () => {
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => dataService.getAccounts(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => dataService.getCustomers(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => dataService.getSuppliers(),
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: () => dataService.getFinancialTransactions(),
  });

  const [activeTab, setActiveTab] = useState<'accounts' | 'receivables' | 'payables' | 'ledger'>('accounts');
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Financial aggregates
  const totalLiquidity = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + c.total_receivable, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.total_payable, 0);
  const netWorkingCapital = totalLiquidity + totalReceivables - totalPayables;

  // Receivables table columns
  const customerColumns: Column<Customer>[] = [
    {
      header: 'Customer Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-[10px] text-slate-400">{row.address || 'Dhaka'}</p>
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: (row) => <span className="font-mono text-xs text-slate-600">{row.phone}</span>,
    },
    {
      header: 'Total Invoices',
      accessorKey: 'total_sales_count',
      align: 'center',
      cell: (row) => <span className="font-mono text-xs">{row.total_sales_count}</span>,
    },
    {
      header: 'Outstanding Balance',
      accessorKey: 'total_receivable',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.total_receivable > 0 ? 'text-rose-600' : 'text-slate-400'
          }`}
        >
          {formatCurrency(row.total_receivable)}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: (row) =>
        row.total_receivable > 0 ? (
          <button
            onClick={() => {
              setSelectedCustomer(row);
              setIsCollectOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors shadow-2xs"
          >
            <ArrowDownLeft className="w-3 h-3" />
            <span>Collect</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Settled</span>
        ),
    },
  ];

  // Payables table columns
  const supplierColumns: Column<Supplier>[] = [
    {
      header: 'Supplier / Company',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-[10px] text-slate-400">{row.contact_person}</p>
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: (row) => <span className="font-mono text-xs text-slate-600">{row.phone}</span>,
    },
    {
      header: 'Total Orders',
      accessorKey: 'total_purchases_count',
      align: 'center',
      cell: (row) => <span className="font-mono text-xs">{row.total_purchases_count}</span>,
    },
    {
      header: 'Outstanding Payable',
      accessorKey: 'total_payable',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.total_payable > 0 ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          {formatCurrency(row.total_payable)}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: (row) =>
        row.total_payable > 0 ? (
          <button
            onClick={() => {
              setSelectedSupplier(row);
              setIsPayOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors shadow-2xs"
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>Pay</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Settled</span>
        ),
    },
  ];

  // Financial transactions ledger columns
  const ledgerColumns: Column<FinancialTransaction>[] = [
    {
      header: 'Voucher #',
      accessorKey: 'transaction_number',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs font-medium text-slate-900">{row.transaction_number}</span>
      ),
    },
    {
      header: 'Date & Time',
      accessorKey: 'transaction_date',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-500 font-mono">{formatDateTime(row.transaction_date)}</span>
      ),
    },
    {
      header: 'Account',
      accessorKey: 'account_name',
      sortable: true,
      cell: (row) => <span className="font-medium text-slate-800 text-xs">{row.account_name}</span>,
    },
    {
      header: 'Category / Note',
      accessorKey: 'notes',
      cell: (row) => (
        <div>
          <p className="text-xs font-medium text-slate-900">{row.notes}</p>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            {row.category.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Flow',
      accessorKey: 'type',
      align: 'center',
      cell: (row) => <StatusBadge status={row.type} size="sm" />,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
          }`}
        >
          {row.type === 'income' ? '+' : '-'} {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: 'Balance After',
      accessorKey: 'balance_after',
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-slate-600 text-xs">{formatCurrency(row.balance_after)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Accounts & Financial Ledger"
        description="Unified financial ledger managing cash registers, bank accounts, customer collections, and supplier settlements."
        breadcrumb="Treasury & Accounting"
      >
        <button
          onClick={() => setIsExpenseOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium shadow-2xs transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Direct Expense</span>
        </button>
        <button
          onClick={() => {
            setSelectedSupplier(null);
            setIsPayOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium shadow-2xs transition-colors"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Disburse Payment</span>
        </button>
        <button
          onClick={() => {
            setSelectedCustomer(null);
            setIsCollectOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Collect Payment</span>
        </button>
      </PageHeader>

      {/* 4 Core Financial KPI Bar — Large & High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">Cash & Bank Liquidity</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-1 truncate" title={formatCurrency(totalLiquidity)}>{formatCurrency(totalLiquidity)}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">{accounts.length} active financial accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
            <CreditCard className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">Customer Receivables</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 mt-1 truncate" title={formatCurrency(totalReceivables)}>{formatCurrency(totalReceivables)}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">Owed to company by customers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <ArrowDownLeft className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition-all min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">Supplier Payables</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-rose-700 mt-1 truncate" title={formatCurrency(totalPayables)}>{formatCurrency(totalPayables)}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">Owed by company to vendors</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
            <ArrowUpRight className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">Net Working Capital</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-purple-900 mt-1 truncate" title={formatCurrency(netWorkingCapital)}>{formatCurrency(netWorkingCapital)}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">(Liquidity + Dues - Debts)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-2xs">
            <Building2 className="w-6 h-6 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'accounts'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('receivables')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'receivables'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Receivables ({customers.filter((c) => c.total_receivable > 0).length})
          </button>
          <button
            onClick={() => setActiveTab('payables')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'payables'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Supplier Payables ({suppliers.filter((s) => s.total_payable > 0).length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            General Cashflow Ledger ({transactions.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: Chart of Accounts */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            let Icon = Landmark;
            if (acc.type === 'cash') Icon = Wallet;
            else if (acc.type === 'mobile_banking') Icon = CreditCard;

            return (
              <div
                key={acc.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between min-w-0"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    {acc.is_default && (
                      <span className="text-[10px] uppercase font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                        Primary Default
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight mt-4 truncate">{acc.name}</h3>
                  <p className="text-xs text-slate-500 capitalize font-mono mt-0.5 truncate">
                    {acc.bank_name || acc.type} {acc.account_number ? `• ${acc.account_number}` : ''}
                  </p>
                  {acc.branch && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{acc.branch}</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-1 min-w-0">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Available Balance
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight truncate" title={formatCurrency(acc.balance)}>
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Customer Receivables */}
      {activeTab === 'receivables' && (
        <DataTable
          columns={customerColumns}
          data={customers}
          emptyTitle="No customers registered"
          emptyDescription="Customer receivables will show up as sales invoices are issued."
        />
      )}

      {/* Tab 3: Supplier Payables */}
      {activeTab === 'payables' && (
        <DataTable
          columns={supplierColumns}
          data={suppliers}
          emptyTitle="No suppliers registered"
          emptyDescription="Supplier payables will show up as purchase orders are generated."
        />
      )}

      {/* Tab 4: General Cashflow Ledger */}
      {activeTab === 'ledger' && (
        <DataTable
          columns={ledgerColumns}
          data={transactions}
          isLoading={loadingTx}
          emptyTitle="No financial transactions recorded"
          emptyDescription="Sales payments, procurement disbursements, and operating expenses will be logged here."
        />
      )}

      {/* Modals */}
      <CollectPaymentModal
        isOpen={isCollectOpen}
        onClose={() => setIsCollectOpen(false)}
        defaultCustomer={selectedCustomer}
      />

      <PaySupplierModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        defaultSupplier={selectedSupplier}
      />

      <DirectExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
      />
    </div>
  );
};
