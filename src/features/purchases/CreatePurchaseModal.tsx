import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, AlertCircle, Truck } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { CreatePurchaseInput } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (purchaseId: string) => void;
}

interface PurchaseRowItem {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export const CreatePurchaseModal: React.FC<CreatePurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => dataService.getSuppliers(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => dataService.getProducts(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => dataService.getAccounts(),
  });

  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseRowItem[]>([
    { product_id: '', quantity: 10, unit_cost: 0 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      const defaultAcc = accounts.find((a) => a.is_default) || accounts[0];
      setAccountId(defaultAcc.id);
    }
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [accounts, suppliers]);

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...items];
    updated[index] = {
      product_id: prodId,
      quantity: updated[index].quantity || 10,
      unit_cost: prod ? prod.purchase_cost : 0,
    };
    setItems(updated);
  };

  const handleRowChange = (index: number, field: 'quantity' | 'unit_cost', val: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const addRow = () => {
    setItems([...items, { product_id: '', quantity: 10, unit_cost: 0 }]);
  };

  const removeRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));
  const dueAmount = Math.max(0, grandTotal - (Number(paidAmount) || 0));

  // Mutation
  const purchaseMutation = useMutation({
    mutationFn: (data: CreatePurchaseInput) => dataService.processPurchase(data),
    onSuccess: (newPurchase) => {
      queryClient.invalidateQueries();
      onSuccess(newPurchase.id);
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to process purchase order');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!supplierId) {
      setErrorMessage('Please select a supplier');
      return;
    }

    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one product with valid quantity');
      return;
    }

    purchaseMutation.mutate({
      supplier_id: supplierId,
      items: validItems,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      paid_amount: Number(paidAmount) || 0,
      payment_method: paymentMethod,
      account_id: Number(paidAmount) > 0 ? accountId : undefined,
      notes,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-3xl w-full my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-slate-100 text-slate-800">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">New Purchase Order</h2>
              <p className="text-xs text-slate-500">Atomic inventory replenishment and accounts payable update</p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Supplier Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Supplier <span className="text-rose-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contact_person}) — Payable: ৳{s.total_payable.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="bank">Bank Transfer / Cheque</option>
                <option value="cash">Cash in Hand</option>
                <option value="bkash">bKash Commercial</option>
                <option value="credit">Supplier Credit (Pay Later)</option>
              </select>
            </div>
          </div>

          {/* Product Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Purchased Products
              </label>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Product Name & SKU</th>
                    <th className="py-2.5 px-3 w-28">Quantity</th>
                    <th className="py-2.5 px-3 w-32">Unit Cost (৳)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Subtotal (৳)</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row, idx) => {
                    const rowSubtotal = (Number(row.quantity) || 0) * (Number(row.unit_cost) || 0);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <select
                            value={row.product_id}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            required
                          >
                            <option value="">Select product to restock...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} [{p.sku}] — Current Stock: {p.current_stock} {p.unit}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={row.quantity}
                            onChange={(e) =>
                              handleRowChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.unit_cost}
                            onChange={(e) =>
                              handleRowChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                            required
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-medium text-slate-900 pr-3">
                          {formatCurrency(rowSubtotal)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Settlement Calculation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier PO Notes / Tracking Ref
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Consignment tracking number, truck delivery slip, etc..."
                className="w-full text-xs bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />

              {paidAmount > 0 && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Disburse Payment From Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) — Available: ৳{a.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Calculations Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Discount Received (৳):</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right font-mono bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Freight / Tax (৳):</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right font-mono bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-semibold text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-700">
                <span className="font-medium">Paid Amount (৳):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal)}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    Full Payment
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-28 text-right font-mono bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs font-medium text-rose-600">
                <span>Supplier Payable (Due):</span>
                <span className="font-mono">{formatCurrency(dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={purchaseMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={purchaseMutation.isPending}
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs disabled:opacity-50 transition-colors"
            >
              {purchaseMutation.isPending ? 'Confirming Restock...' : 'Confirm & Increase Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
