import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, History, ArrowDownRight, ArrowUpLeft, Sliders, RotateCcw } from 'lucide-react';
import { Product, StockMovement } from '@/types';
import { formatDateTime } from '@/utils/date';
import { dataService } from '@/lib/data-service';

interface ProductLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductLedgerModal: React.FC<ProductLedgerModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => dataService.getStockMovements(),
  });

  if (!isOpen || !product) return null;

  const productMovements = movements.filter((m) => m.product_id === product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 text-slate-800 rounded-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {product.sku} | Unit: {product.unit} | Current Balance:{' '}
                <span className="font-bold text-slate-900">{product.current_stock} {product.unit}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ledger Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Stock Movement Ledger (Audit History)
          </h4>

          {productMovements.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No historical movements recorded for this item.
            </p>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Movement Type</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Balance After</th>
                    <th className="py-2.5 px-3">Reference / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {productMovements.map((m) => {
                    const isPositive = m.quantity > 0;

                    let typeLabel = m.movement_type.replace(/_/g, ' ');
                    let icon = <Sliders className="w-3.5 h-3.5" />;

                    if (m.movement_type === 'purchase_in') {
                      icon = <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />;
                    } else if (m.movement_type === 'sales_out') {
                      icon = <ArrowUpLeft className="w-3.5 h-3.5 text-indigo-600" />;
                    } else if (m.movement_type.includes('return')) {
                      icon = <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
                    }

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {formatDateTime(m.created_at)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1.5 capitalize font-medium">
                            {icon}
                            {typeLabel}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity} {product.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                          {m.balance_after} {product.unit}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[180px]">
                          {m.notes || m.reference_type}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
