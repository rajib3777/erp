import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Eye,
  Truck,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  Table as TableIcon,
  AlignJustify,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'collapsed' | 'expanded' | 'table'>('collapsed');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
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

  // Aggregate stats matching Screenshot 1
  const totalPOs = purchases.length;
  const pendingCount = purchases.filter((p) => p.payment_status === 'unpaid' && p.status !== 'cancelled').length;
  const partialCount = purchases.filter((p) => p.payment_status === 'partial' && p.status !== 'cancelled').length;
  const completedCount = purchases.filter((p) => p.payment_status === 'paid' && p.status !== 'cancelled').length;

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
      header: 'Order Date',
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
      header: 'Payment Status',
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
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPurchase(row);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Voucher</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Purchase Orders & Procurement</h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1.5 font-medium">
            Manage, verify, and track all inbound supplier purchase orders and stock receipts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all self-start sm:self-auto hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ New PO</span>
        </button>
      </div>

      {/* 4 Large KPI Cards Row — High Contrast */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-300 transition-all min-w-0">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Total POs</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-950 mt-1 font-mono">{totalPOs}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">All purchase vouchers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
            <FileText className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-amber-300 transition-all min-w-0">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Pending Due</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-1 font-mono">{pendingCount}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">Unpaid supplier dues</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-purple-300 transition-all min-w-0">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Partially Paid</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-800 mt-1 font-mono">{partialCount}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">Split disbursements</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-2xs">
            <Truck className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-emerald-300 transition-all min-w-0">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Completed</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 font-mono">{completedCount}</p>
            <p className="text-xs text-slate-600 font-semibold mt-1 truncate">Reconciled & in stock</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Segmented View Controls matching Screenshot 1 */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Left: Search Bar */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by PO ID or supplier..."
          className="w-full lg:max-w-md"
        />

        {/* Right: Dropdowns & View Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Completed (Paid)</option>
            <option value="partial">Partial Payment</option>
            <option value="unpaid">Pending (Unpaid)</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Segmented View Switcher matching Screenshot 1 */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('collapsed')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'collapsed'
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Collapsed</span>
            </button>
            <button
              onClick={() => setViewMode('expanded')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'expanded'
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Expanded</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table View OR Collapsed/Expanded Card Rows */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredPurchases}
          isLoading={isLoading}
          emptyTitle="No purchase orders found"
          emptyDescription="Create a purchase order to receive inventory stock from suppliers."
          onRowClick={(row) => setSelectedPurchase(row)}
        />
      ) : (
        <div className="space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-500">
              <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">No purchase orders found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new purchase order.</p>
            </div>
          ) : (
            filteredPurchases.map((po) => {
              const isExpanded = viewMode === 'expanded' || !!expandedRows[po.id];
              const itemCount = po.items?.length || 1;

              return (
                <div
                  key={po.id}
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all cursor-pointer group"
                  onClick={() => toggleRow(po.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Chevron + PO Number + Badge + Supplier */}
                    <div className="flex items-start sm:items-center gap-3">
                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 group-hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 mt-0.5 sm:mt-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {po.invoice_number}
                          </span>
                          <StatusBadge status={po.payment_status} size="sm" />
                          {po.status === 'cancelled' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Cancelled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {po.supplier_name}
                        </p>
                      </div>
                    </div>

                    {/* Right: Meta columns (Total, Items, Delivery Date, Menu) */}
                    <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Total Amount
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(po.grand_total)}
                        </span>
                      </div>

                      <div className="hidden sm:block">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Items
                        </span>
                        <span className="font-mono font-semibold text-slate-700 text-sm">
                          {itemCount}
                        </span>
                      </div>

                      <div className="hidden md:block">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Order Date
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                          {formatDate(po.purchase_date)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPurchase(po);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View PO Voucher"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Line Items Detail Drawer */}
                  {isExpanded && (
                    <div
                      className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Line Items Received</span>
                        <button
                          onClick={() => setSelectedPurchase(po)}
                          className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                        >
                          <span>Open Full Voucher</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl overflow-hidden text-xs">
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100/60 font-semibold text-slate-600 border-b border-slate-200/60">
                          <div className="col-span-5">Product Name</div>
                          <div className="col-span-2 text-right">Quantity</div>
                          <div className="col-span-2 text-right">Cost Price</div>
                          <div className="col-span-3 text-right">Subtotal</div>
                        </div>

                        {po.items && po.items.length > 0 ? (
                          po.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-slate-100 last:border-none text-slate-700 items-center"
                            >
                              <div className="col-span-5 font-medium text-slate-900 truncate">
                                {item.product_name}
                              </div>
                              <div className="col-span-2 text-right font-mono font-semibold">
                                {item.quantity}
                              </div>
                              <div className="col-span-2 text-right font-mono text-slate-600">
                                {formatCurrency(item.unit_cost)}
                              </div>
                              <div className="col-span-3 text-right font-mono font-bold text-slate-900">
                                {formatCurrency(item.subtotal || item.quantity * item.unit_cost)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2.5 text-slate-500">
                            Single batch procurement item • Total: {formatCurrency(po.grand_total)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

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
