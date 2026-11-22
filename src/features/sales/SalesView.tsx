import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, ShoppingCart, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Sale } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, Column } from '@/components/common/DataTable';
import { CreateSaleModal } from './CreateSaleModal';
import { SaleInvoiceModal } from './SaleInvoiceModal';

export const SalesView: React.FC = () => {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => dataService.getSales(),
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.customer_phone?.includes(search);

      const matchStatus =
        statusFilter === 'all' ||
        s.payment_status === statusFilter ||
        s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [sales, search, statusFilter]);

  // Aggregate stats
  const activeSales = sales.filter((s) => s.status !== 'cancelled');
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.grand_total, 0);
  const totalPaid = activeSales.reduce((sum, s) => sum + s.paid_amount, 0);
  const totalDue = activeSales.reduce((sum, s) => sum + s.due_amount, 0);

  const columns: Column<Sale>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoice_number',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-medium text-slate-900">{row.invoice_number}</span>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customer_name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-950">{row.customer_name}</p>
          <p className="text-xs font-medium text-slate-700">{row.customer_phone}</p>
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'sale_date',
      sortable: true,
      cell: (row) => <span className="text-xs font-medium text-slate-800">{formatDate(row.sale_date)}</span>,
    },
    {
      header: 'Total Amount',
      accessorKey: 'grand_total',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-950">
          {formatCurrency(row.grand_total)}
        </span>
      ),
    },
    {
      header: 'Paid',
      accessorKey: 'paid_amount',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-emerald-800">{formatCurrency(row.paid_amount)}</span>
      ),
    },
    {
      header: 'Due',
      accessorKey: 'due_amount',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className={`font-mono font-bold ${row.due_amount > 0 ? 'text-rose-700 font-black' : 'text-slate-700'}`}>
          {formatCurrency(row.due_amount)}
        </span>
      ),
    },
    {
      header: 'Payment',
      accessorKey: 'payment_status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.payment_status} size="sm" />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSale(row);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-700" />
          <span>Invoice</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Sales Invoices & Commercial Orders"
        description="Process orders, generate tax invoices, track receivables, and enforce stock availability."
        breadcrumb="Commercial Operations"
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ New Sales Invoice</span>
        </button>
      </PageHeader>

      {/* Large High-Contrast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">Total Invoiced Gross</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-1 truncate" title={formatCurrency(totalRevenue)}>{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">All customer billing volume</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-2xs">
            <ShoppingCart className="w-6 h-6 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">Settled Collections</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 mt-1 truncate" title={formatCurrency(totalPaid)}>{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">Realized cash receipts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition-all min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">Outstanding Due (Receivables)</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-rose-700 mt-1 truncate" title={formatCurrency(totalDue)}>{formatCurrency(totalDue)}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">Pending customer balances</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by invoice # or customer..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-auto"
          >
            <option value="all">All Payment & Order Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partial Payment</option>
            <option value="unpaid">Unpaid (Full Due)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSales}
        isLoading={isLoading}
        emptyTitle="No sales found"
        emptyDescription="Create your first sales invoice to record customer transactions."
        onRowClick={(row) => setSelectedSale(row)}
      />

      {/* Create Sale Modal */}
      <CreateSaleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => {
          const created = sales.find((s) => s.id === id);
          if (created) setSelectedSale(created);
        }}
      />

      {/* View / Print Invoice Modal */}
      <SaleInvoiceModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
      />
    </div>
  );
};
