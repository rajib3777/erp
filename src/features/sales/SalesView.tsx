import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, ShoppingCart, Filter } from 'lucide-react';
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
          <p className="font-medium text-slate-900">{row.customer_name}</p>
          <p className="text-[10px] text-slate-400">{row.customer_phone}</p>
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'sale_date',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-600">{formatDate(row.sale_date)}</span>,
    },
    {
      header: 'Total Amount',
      accessorKey: 'grand_total',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-semibold text-slate-900">
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
        <span className="font-mono text-emerald-700">{formatCurrency(row.paid_amount)}</span>
      ),
    },
    {
      header: 'Due',
      accessorKey: 'due_amount',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className={`font-mono ${row.due_amount > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
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
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Invoice</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Sales & Invoices"
        description="Process orders, generate tax invoices, track receivables, and enforce stock availability."
        breadcrumb="Commercial Operations"
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Invoice</span>
        </button>
      </PageHeader>

      {/* Mini KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoiced</p>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Settled (Paid)</p>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding Due</p>
          <p className="text-xl font-bold font-mono text-rose-600 mt-1">{formatCurrency(totalDue)}</p>
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
