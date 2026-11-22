import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, ArrowDownLeft, X, AlertCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Customer } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, Column } from '@/components/common/DataTable';
import { CollectPaymentModal } from '@/features/accounts/CollectPaymentModal';

export const CustomersView: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => dataService.getCustomers(),
  });

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      dataService.createCustomer({
        name,
        phone,
        email,
        address,
        city: 'Dhaka',
        is_active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setIsCreateOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to create customer');
    },
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-[10px] text-slate-400">{row.email || 'No email registered'}</p>
        </div>
      ),
    },
    {
      header: 'Phone Number',
      accessorKey: 'phone',
      cell: (row) => <span className="font-mono text-xs text-slate-700">{row.phone}</span>,
    },
    {
      header: 'Address / Location',
      accessorKey: 'address',
      cell: (row) => <span className="text-xs text-slate-600">{row.address || 'Dhaka'}</span>,
    },
    {
      header: 'Total Orders',
      accessorKey: 'total_sales_count',
      sortable: true,
      align: 'center',
      cell: (row) => <span className="font-mono text-xs">{row.total_sales_count}</span>,
    },
    {
      header: 'Receivable Due',
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
      header: 'Actions',
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
          <span className="text-[11px] text-slate-400 italic">No Dues</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Wholesale and retail client profiles, contact directory, and accounts receivable tracking."
        breadcrumb="Client Relations"
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </PageHeader>

      <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search customers by name, phone or location..."
          className="w-full sm:max-w-xs"
        />
        <span className="text-xs text-slate-500 font-medium">
          Total: {filtered.length} customers
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle="No customers found"
        emptyDescription="Add customers to maintain credit ledgers and sales invoices."
      />

      {/* Add Customer Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full my-6 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Add New Customer</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="p-6 space-y-4 text-xs"
            >
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Customer / Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Al-Madina Super Store"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@store.com"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Market Address / Location</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Shop number, market name, street, area..."
                  className="w-full border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        isOpen={isCollectOpen}
        onClose={() => setIsCollectOpen(false)}
        defaultCustomer={selectedCustomer}
      />
    </div>
  );
};
