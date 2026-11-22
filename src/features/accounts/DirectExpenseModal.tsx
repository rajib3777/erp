import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Receipt, AlertCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';

interface DirectExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectExpenseModal: React.FC<DirectExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => dataService.getAccounts(),
  });

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<'operating_expense' | 'other_income'>('operating_expense');
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      const def = accounts.find((a) => a.is_default) || accounts[0];
      setAccountId(def.id);
    }
  }, [accounts]);

  const mutation = useMutation({
    mutationFn: (data: {
      account_id: string;
      type: 'income' | 'expense';
      category: 'operating_expense' | 'other_income';
      amount: number;
      notes: string;
    }) => dataService.recordDirectTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to record transaction');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (amount <= 0) {
      setErrorMessage('Amount must be greater than 0');
      return;
    }

    if (!accountId) {
      setErrorMessage('Please select an account');
      return;
    }

    if (!notes.trim()) {
      setErrorMessage('Please enter an expense description or voucher reference');
      return;
    }

    mutation.mutate({
      account_id: accountId,
      type,
      category,
      amount: Number(amount),
      notes,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-slate-100 text-slate-800">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Record Direct Expense / Income</h2>
              <p className="text-xs text-slate-500">Operating overheads, utilities, logistics, or non-sales income</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Transaction Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as 'expense' | 'income';
                  setType(newType);
                  setCategory(newType === 'expense' ? 'operating_expense' : 'other_income');
                }}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="expense">Operating Expense (-)</option>
                <option value="income">Other Income (+)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Select Financial Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type}) — Bal: ৳{a.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Description / Voucher Note <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Warehouse electricity bill, monthly internet, office supplies..."
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
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
              {mutation.isPending ? 'Posting Entry...' : 'Post to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
