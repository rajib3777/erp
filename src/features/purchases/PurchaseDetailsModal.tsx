import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Printer, Ban, Truck } from 'lucide-react';
import { Purchase } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { dataService } from '@/lib/data-service';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
}

export const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({
  isOpen,
  onClose,
  purchase,
}) => {
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const cancelMutation = useMutation({
    mutationFn: () =>
      dataService.cancelPurchase(purchase!.id, 'Defective shipment return to supplier'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowCancelDialog(false);
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Cannot cancel purchase');
      setShowCancelDialog(false);
    },
  });

  if (!isOpen || !purchase) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-3xl w-full my-6 flex flex-col max-h-[95vh]">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 text-slate-800 rounded-md">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Purchase Order #{purchase.invoice_number}
                </h3>
                <p className="text-xs text-slate-500">Inbound Procurement & Restock Record</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-md shadow-2xs transition-colors"
                title="Print PO"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              {purchase.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    setErrorMessage('');
                    setShowCancelDialog(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-medium rounded-md transition-colors"
                  title="Cancel Purchase & Deduct Stock"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel PO</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Printable PO Container */}
          <div className="p-8 overflow-y-auto printable-invoice">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Purchase Order Voucher</h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Receiver: Nexus Trade & Distribution Ltd.
                  <br />
                  Tejgaon Central Receiving Warehouse, Dhaka
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  PO Number
                </span>
                <p className="text-base font-mono font-bold text-slate-900">{purchase.invoice_number}</p>
                <p className="text-xs text-slate-500 mt-1">Date: {formatDateTime(purchase.purchase_date)}</p>
                <div className="mt-2 flex items-center sm:justify-end gap-2">
                  <StatusBadge status={purchase.status} size="sm" />
                  <StatusBadge status={purchase.payment_status} size="sm" />
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Supplier / Vendor
                </h4>
                <p className="font-semibold text-slate-900 text-sm">{purchase.supplier_name}</p>
                <p className="text-slate-600 mt-0.5">Contact Phone: {purchase.supplier_phone}</p>
                <p className="text-slate-500">Dhaka, Bangladesh</p>
              </div>

              <div className="sm:text-right">
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Disbursement Details
                </h4>
                <p className="text-slate-700">
                  Payment Mode:{' '}
                  <span className="font-medium capitalize text-slate-900">
                    {purchase.payment_method}
                  </span>
                </p>
                {purchase.account_name && (
                  <p className="text-slate-500 mt-0.5">Disbursed From: {purchase.account_name}</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6 border-b border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2.5">Purchased Item & SKU</th>
                    <th className="pb-2.5 text-center w-20">Unit</th>
                    <th className="pb-2.5 text-right w-24">Qty Received</th>
                    <th className="pb-2.5 text-right w-28">Unit Cost</th>
                    <th className="pb-2.5 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((item, idx) => (
                      <tr key={idx} className="py-2.5">
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.product_sku}</p>
                        </td>
                        <td className="py-3 text-center text-slate-600">{item.product_unit || 'pcs'}</td>
                        <td className="py-3 text-right font-mono font-semibold">{item.quantity}</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(item.unit_cost)}</td>
                        <td className="py-3 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        Item breakdown records archived.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="pt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(purchase.subtotal)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(purchase.grand_total)}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Paid (Disbursed):</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatCurrency(purchase.paid_amount)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-xs text-rose-600">
                  <span>Supplier Balance Due (Payable):</span>
                  <span className="font-mono">{formatCurrency(purchase.due_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for PO Cancellation */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Purchase Order?"
        message={`Cancelling PO #${purchase.invoice_number} will reverse product inventory deductions and refund any disbursed payment. NOTE: The system will verify that purchased goods have not already been sold or consumed.`}
        confirmLabel="Yes, Cancel Purchase"
        isDestructive
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setShowCancelDialog(false)}
      />
    </>
  );
};
