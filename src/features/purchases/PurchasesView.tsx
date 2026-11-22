import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Truck, Filter } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Purchase } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, Column } from '@/components/common/DataTable';
import { CreatePurchaseModal } from './CreatePurchaseModal';
import { PurchaseDetailsModal } from './PurchaseDetailsModal';

export const PurchasesView: React.FC = () => {
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => dataService.getPurchases(),
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier_phone?.includes(search);

      const matchStatus =
        statusFilter === 'all' ||
        p.payment_status === statusFilter ||
        p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [purchases, search, statusFilter]);

  // Aggregate stats
  const activePurchases = purchases.filter((p) => p.status !== 'cancelled');
  const totalProcurement = activePurchases.reduce((sum, p) => sum + p.grand_total, 0);
  const totalPaid = activePurchases.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalDue = activePurchases.reduce((sum, p) => sum + p.due_amount, 0);

  const columns: Column<Purchase>[] = [
    {
      header: 'PO #',
      accessorKey: 'invoice_number',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-medium text-slate-900">{row.invoice_number}</span>
      ),
    },
    {
      header: 'Supplier / Vendor',
      accessorKey: 'supplier_name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.supplier_name}</p>
          <p className="text-[10px] text-slate-400">{row.supplier_phone}</p>
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'purchase_date',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-600">{formatDate(row.purchase_date)}</span>,
    },
    {
      header: 'Grand Total',
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
      header: 'Disbursed',
      accessorKey: 'paid_amount',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-slate-700">{formatCurrency(row.paid_amount)}</span>
      ),
    },
    {
      header: 'Payable Due',
      accessorKey: 'due_amount',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className={`font-mono ${row.due_amount > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
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
            setSelectedPurchase(row);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Voucher</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Purchases & Procurement"
        description="Manage vendor purchase orders, inventory restocking, unit cost records, and supplier payables."
        breadcrumb="Supply Chain Operations"
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </PageHeader>

      {/* Mini KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Procurement</p>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{formatCurrency(totalProcurement)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Settled Payouts</p>
          <p className="text-xl font-bold font-mono text-slate-800 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Payables</p>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">{formatCurrency(totalDue)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by PO # or supplier..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-auto"
          >
            <option value="all">All Payment & PO Statuses</option>
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
        data={filteredPurchases}
        isLoading={isLoading}
        emptyTitle="No purchase orders found"
        emptyDescription="Create a purchase order to receive inventory stock from suppliers."
        onRowClick={(row) => setSelectedPurchase(row)}
      />

      {/* Create Purchase Modal */}
      <CreatePurchaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => {
          const created = purchases.find((p) => p.id === id);
          if (created) setSelectedPurchase(created);
        }}
      />

      {/* View PO Voucher Modal */}
      <PurchaseDetailsModal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        purchase={selectedPurchase}
      />
    </div>
  );
};
