import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Sliders, AlertCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { StockAdjustmentInput } from '@/types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: string;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  defaultProductId,
}) => {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => dataService.getProducts(),
  });

  const [productId, setProductId] = useState(defaultProductId || '');
  const [adjustmentType, setAdjustmentType] = useState<'addition' | 'deduction'>('deduction');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('Physical audit count discrepancy');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (defaultProductId) setProductId(defaultProductId);
    else if (products.length > 0 && !productId) setProductId(products[0].id);
  }, [defaultProductId, products]);

  const selectedProduct = products.find((p) => p.id === productId);

  const mutation = useMutation({
    mutationFn: (input: StockAdjustmentInput) => dataService.processStockAdjustment(input),
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to adjust stock');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!productId) {
      setErrorMessage('Please select a product');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('Quantity must be greater than 0');
      return;
    }

    if (adjustmentType === 'deduction' && selectedProduct && selectedProduct.current_stock < quantity) {
      setErrorMessage(
        `Cannot deduct ${quantity} ${selectedProduct.unit}. Current stock is only ${selectedProduct.current_stock} ${selectedProduct.unit}.`
      );
      return;
    }

    mutation.mutate({
      product_id: productId,
      adjustment_type: adjustmentType,
      quantity: Number(quantity),
      reason,
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
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Manual Stock Adjustment</h2>
              <p className="text-xs text-slate-500">Post audited adjustment entry to the inventory ledger</p>
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
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}] — In Stock: {p.current_stock} {p.unit}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="text-[11px] text-slate-500 mt-1">
                Current ledger balance: <span className="font-semibold text-slate-900 font-mono">{selectedProduct.current_stock} {selectedProduct.unit}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Adjustment Type</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="deduction">Deduction (-) Reduction</option>
                <option value="addition">Addition (+) Increase</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Reason / Audit Memo <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 mb-2"
            >
              <option value="Physical audit count discrepancy">Physical audit count discrepancy</option>
              <option value="Packaging damage in warehouse">Packaging damage in warehouse</option>
              <option value="Expired / shelf-life write-off">Expired / shelf-life write-off</option>
              <option value="Sample demonstration dispatch">Sample demonstration dispatch</option>
              <option value="Supplier surplus bonus delivery">Supplier surplus bonus delivery</option>
            </select>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Or enter custom reason..."
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            />
          </div>

          {selectedProduct && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs flex justify-between items-center">
              <span className="text-slate-600">Projected stock balance after adjustment:</span>
              <span className="font-mono font-bold text-slate-900">
                {adjustmentType === 'addition'
                  ? selectedProduct.current_stock + (Number(quantity) || 0)
                  : selectedProduct.current_stock - (Number(quantity) || 0)}{' '}
                {selectedProduct.unit}
              </span>
            </div>
          )}

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
              {mutation.isPending ? 'Posting...' : 'Post Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
