import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Printer, Ban, CheckCircle, FileText } from 'lucide-react';
import { Sale } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { dataService } from '@/lib/data-service';

interface SaleInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const SaleInvoiceModal: React.FC<SaleInvoiceModalProps> = ({
  isOpen,
  onClose,
  sale,
}) => {
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested order return / cancellation');

  const cancelMutation = useMutation({
    mutationFn: () => dataService.cancelSale(sale!.id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowCancelDialog(false);
      onClose();
    },
  });

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-3xl w-full my-6 flex flex-col max-h-[95vh]">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Invoice {sale.invoice_number}
                </h3>
                <p className="text-xs text-slate-500">Official Commercial Tax Invoice</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-md shadow-2xs transition-colors"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              {sale.status !== 'cancelled' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-medium rounded-md transition-colors"
                  title="Cancel Sale & Restore Stock"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Sale</span>
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

          {/* Printable Invoice Container */}
          <div className="p-8 overflow-y-auto printable-invoice">
            {/* Company & Invoice Metadata */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                    N
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">Nexus Trade & Distribution Ltd.</h1>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Plot 14, Block C, Tejgaon Industrial Area, Dhaka - 1208, Bangladesh
                  <br />
                  Phone: +880 1711-000000 | BIN: 002345678-0101
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Invoice Number
                </span>
                <p className="text-base font-mono font-bold text-slate-900">{sale.invoice_number}</p>
                <p className="text-xs text-slate-500 mt-1">Date: {formatDateTime(sale.sale_date)}</p>
                <div className="mt-2 flex items-center sm:justify-end gap-2">
                  <StatusBadge status={sale.status} size="sm" />
                  <StatusBadge status={sale.payment_status} size="sm" />
                </div>
              </div>
            </div>

            {/* Bill To & Settlement Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Billed To
                </h4>
                <p className="font-semibold text-slate-900 text-sm">{sale.customer_name}</p>
                <p className="text-slate-600 mt-0.5">Phone: {sale.customer_phone}</p>
                <p className="text-slate-500">Dhaka, Bangladesh</p>
              </div>

              <div className="sm:text-right">
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payment Details
                </h4>
                <p className="text-slate-700">
                  Method:{' '}
                  <span className="font-medium capitalize text-slate-900">
                    {sale.payment_method}
                  </span>
                </p>
                {sale.account_name && (
                  <p className="text-slate-500 mt-0.5">Settlement Account: {sale.account_name}</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6 border-b border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2.5">Item & SKU</th>
                    <th className="pb-2.5 text-center w-20">Unit</th>
                    <th className="pb-2.5 text-right w-24">Qty</th>
                    <th className="pb-2.5 text-right w-28">Rate</th>
                    <th className="pb-2.5 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((item, idx) => (
                      <tr key={idx} className="py-2.5">
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.product_sku}</p>
                        </td>
                        <td className="py-3 text-center text-slate-600">{item.product_unit || 'pcs'}</td>
                        <td className="py-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
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
                    {formatCurrency(sale.subtotal)}
                  </span>
                </div>

                {sale.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono text-emerald-600">
                      - {formatCurrency(sale.discount)}
                    </span>
                  </div>
                )}

                {sale.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax / VAT:</span>
                    <span className="font-mono">{formatCurrency(sale.tax)}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(sale.grand_total)}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Paid Amount:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatCurrency(sale.paid_amount)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-xs text-rose-600">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(sale.due_amount)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Footer Notes */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-400">
              <div>
                <p className="font-medium text-slate-500">Terms & Conditions:</p>
                <p>Goods once sold can only be returned within 7 days with valid inspection.</p>
                <p className="mt-1">System Generated by Nexus ERP. No physical signature required.</p>
              </div>
              <div className="text-right">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <p className="font-medium text-slate-600">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Sales Invoice?"
        message={`Are you sure you want to cancel Invoice #${sale.invoice_number}? This will automatically return all sold items back to product inventory and reverse any recorded customer receivables and cash receipts.`}
        confirmLabel="Yes, Cancel Sale"
        isDestructive
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setShowCancelDialog(false)}
      />
    </>
  );
};
