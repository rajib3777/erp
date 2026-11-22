import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Customer, CustomerPaymentInput } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomer?: Customer | null;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultCustomer,
}) => {
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => dataService.getCustomers(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => dataService.getAccounts(),
  });

  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (defaultCustomer) {
      setCustomerId(defaultCustomer.id);
      setAmount(defaultCustomer.total_receivable);
    } else if (customers.length > 0 && !customerId) {
      const withReceivables = customers.find((c) => c.total_receivable > 0) || customers[0];
      setCustomerId(withReceivables.id);
      setAmount(withReceivables.total_receivable);
    }

    if (accounts.length > 0 && !accountId) {
      const defAcc = accounts.find((a) => a.is_default) || accounts[0];
      setAccountId(defAcc.id);
    }
  }, [defaultCustomer, customers, accounts]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const mutation = useMutation({
    mutationFn: (input: CustomerPaymentInput) => dataService.processCustomerPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Payment collection failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerId) {
      setErrorMessage('Please select a customer');
      return;
    }

    if (amount <= 0) {
      setErrorMessage('Amount must be strictly greater than 0');
      return;
    }

    if (!accountId) {
      setErrorMessage('Please select a deposit account');
      return;
    }

    if (selectedCustomer && amount > selectedCustomer.total_receivable) {
      setErrorMessage(
        `Amount (৳${amount}) exceeds customer outstanding balance (৳${selectedCustomer.total_receivable})`
      );
      return;
    }

    mutation.mutate({
      customer_id: customerId,
      amount: Number(amount),
      account_id: accountId,
      payment_method: paymentMethod,
      notes: notes || `Customer payment from ${selectedCustomer?.name}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-emerald-50 text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Collect Customer Payment</h2>
              <p className="text-xs text-slate-500">Atomic receivable reduction and account deposit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Select Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const cust = customers.find((c) => c.id === e.target.value);
                if (cust) setAmount(cust.total_receivable);
              }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Outstanding Due: ৳{c.total_receivable.toFixed(2)}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <p className="text-[11px] text-slate-500 mt-1">
                Outstanding receivable balance:{' '}
                <span className="font-semibold text-rose-600 font-mono">
                  {formatCurrency(selectedCustomer.total_receivable)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Collected Amount (৳) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={selectedCustomer?.total_receivable || undefined}
              step="any"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="bkash">bKash Merchant</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Deposit Into Account <span className="text-rose-500">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (৳{a.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Receipt Remarks / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cheque #, deposit slip reference, money receipt #..."
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Recording Collection...' : 'Confirm Payment Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
