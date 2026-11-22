import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowUpRight, AlertCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Supplier, SupplierPaymentInput } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface PaySupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSupplier?: Supplier | null;
}

export const PaySupplierModal: React.FC<PaySupplierModalProps> = ({
  isOpen,
  onClose,
  defaultSupplier,
}) => {
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => dataService.getSuppliers(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => dataService.getAccounts(),
  });

  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (defaultSupplier) {
      setSupplierId(defaultSupplier.id);
      setAmount(defaultSupplier.total_payable);
    } else if (suppliers.length > 0 && !supplierId) {
      const withPayables = suppliers.find((s) => s.total_payable > 0) || suppliers[0];
      setSupplierId(withPayables.id);
      setAmount(withPayables.total_payable);
    }

    if (accounts.length > 0 && !accountId) {
      const defAcc = accounts.find((a) => a.is_default) || accounts[0];
      setAccountId(defAcc.id);
    }
  }, [defaultSupplier, suppliers, accounts]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const mutation = useMutation({
    mutationFn: (input: SupplierPaymentInput) => dataService.processSupplierPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Supplier payment disbursement failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!supplierId) {
      setErrorMessage('Please select a supplier');
      return;
    }

    if (amount <= 0) {
      setErrorMessage('Amount must be strictly greater than 0');
      return;
    }

    if (!accountId) {
      setErrorMessage('Please select a disbursement account');
      return;
    }

    if (selectedSupplier && amount > selectedSupplier.total_payable) {
      setErrorMessage(
        `Amount (৳${amount}) exceeds supplier outstanding balance (৳${selectedSupplier.total_payable})`
      );
      return;
    }

    mutation.mutate({
      supplier_id: supplierId,
      amount: Number(amount),
      account_id: accountId,
      payment_method: paymentMethod,
      notes: notes || `Payment disbursed to ${selectedSupplier?.name}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-amber-50 text-amber-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Disburse Supplier Payment</h2>
              <p className="text-xs text-slate-500">Atomic payable deduction and account withdrawal</p>
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
              Select Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                const sup = suppliers.find((s) => s.id === e.target.value);
                if (sup) setAmount(sup.total_payable);
              }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Outstanding Payable: ৳{s.total_payable.toFixed(2)}
                </option>
              ))}
            </select>
            {selectedSupplier && (
              <p className="text-[11px] text-slate-500 mt-1">
                Outstanding payable balance:{' '}
                <span className="font-semibold text-amber-600 font-mono">
                  {formatCurrency(selectedSupplier.total_payable)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Payment Amount (৳) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={selectedSupplier?.total_payable || undefined}
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
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Corporate Cheque</option>
                <option value="bkash">bKash Commercial</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Disburse From Account <span className="text-rose-500">*</span>
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
            <label className="block font-medium text-slate-700 mb-1">Voucher Remarks / Cheque No.</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cheque #, bank transaction reference..."
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
              className="px-5 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Processing Payout...' : 'Confirm Supplier Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
