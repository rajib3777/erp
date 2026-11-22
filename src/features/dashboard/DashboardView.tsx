import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  ShoppingCart,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenCreateSale: () => void;
  onOpenCreatePurchase: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCreateSale,
  onOpenCreatePurchase,
}) => {
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dataService.getDashboardMetrics(),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => dataService.getProducts(),
  });

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => dataService.getSales(),
  });

  const { data: purchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => dataService.getPurchases(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: () => dataService.getFinancialTransactions(),
  });

  if (loadingMetrics) {
    return <LoadingState message="Calculating business KPIs..." />;
  }

  const lowStockProducts = products?.filter((p) => p.current_stock <= p.min_stock_level) || [];
  const recentSales = sales?.slice(0, 5) || [];
  const recentPurchases = purchases?.slice(0, 5) || [];
  const recentTransactions = transactions?.slice(0, 5) || [];

  const monthlyData = [
    { month: 'Jul', Sales: 42000, Purchases: 55000 },
    { month: 'Aug', Sales: 58000, Purchases: 48000 },
    { month: 'Sep', Sales: 64000, Purchases: 60000 },
    { month: 'Oct', Sales: 72000, Purchases: 68000 },
    { month: 'Nov', Sales: metrics?.totalSales || 69900, Purchases: metrics?.totalPurchases || 125500 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider font-mono">
            Totally Commercial Ledger
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Executive Overview</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Totally Cloud ERP Suite: Real-time balance synchronization across Sales Invoices, Purchase Orders, Warehouses, and Cash Accounts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={onOpenCreateSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ New Sale</span>
          </button>
          <button
            onClick={onOpenCreatePurchase}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:-translate-y-0.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>+ New Purchase</span>
          </button>
        </div>
      </div>

      {/* 6 Core KPI Cards: 3 columns x 2 rows with vibrant pastel icon containers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        <StatCard
          title="Total Gross Revenue"
          value={formatCurrency(metrics?.totalSales)}
          subtitle={`${metrics?.salesCount || 0} completed invoices`}
          icon={TrendingUp}
          badge="Sales"
          colorScheme="emerald"
          onClick={() => onNavigate('sales')}
        />

        <StatCard
          title="Total Procurement Cost"
          value={formatCurrency(metrics?.totalPurchases)}
          subtitle={`${metrics?.purchasesCount || 0} purchase orders placed`}
          icon={TrendingDown}
          badge="Procurement"
          colorScheme="purple"
          onClick={() => onNavigate('purchases')}
        />

        <StatCard
          title="Stock Asset Value"
          value={formatCurrency(metrics?.currentStockValue)}
          subtitle={`${products?.length || 0} registered active SKUs`}
          icon={Package}
          badge="Warehouse"
          colorScheme="blue"
          onClick={() => onNavigate('inventory')}
        />

        <StatCard
          title="Cash & Bank Liquidity"
          value={formatCurrency(metrics?.cashBankBalance)}
          subtitle="Combined register, DBBL & bKash"
          icon={Landmark}
          badge="Liquidity"
          colorScheme="emerald"
          onClick={() => onNavigate('accounts')}
        />

        <StatCard
          title="Customer Receivables (Due)"
          value={formatCurrency(metrics?.totalReceivables)}
          subtitle="Pending customer collections"
          icon={ArrowDownLeft}
          badge="Receivables"
          colorScheme="amber"
          onClick={() => onNavigate('accounts')}
        />

        <StatCard
          title="Supplier Payables (Due)"
          value={formatCurrency(metrics?.totalPayables)}
          subtitle="Pending supplier disbursements"
          icon={ArrowUpRight}
          badge="Payables"
          colorScheme="rose"
          onClick={() => onNavigate('accounts')}
        />
      </div>

      {/* Main Charts & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Comparison Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sales vs. Purchases Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly procurement vs billing comparison in BDT (৳)</p>
            </div>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 font-mono">
              Last 5 Months
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Sales" fill="#4f46e5" radius={[5, 5, 0, 0]} maxBarSize={48} />
                <Bar dataKey="Purchases" fill="#94a3b8" radius={[5, 5, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Low Stock Warnings</h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {lowStockProducts.length} items
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-64 overflow-y-auto">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  All warehouse stock counts are above minimum safe thresholds.
                </p>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-600 font-mono">
                        {p.current_stock} {p.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">Min: {p.min_stock_level}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <span>Manage Inventory & Stock Adjustments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feeds: Recent Sales & Recent Purchases & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Sales Invoices</h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {recentSales.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-mono font-medium text-slate-900 truncate">{s.invoice_number}</p>
                    <StatusBadge status={s.payment_status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{s.customer_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 font-mono">{formatCurrency(s.grand_total)}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(s.sale_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Purchase Orders</h3>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {recentPurchases.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-mono font-medium text-slate-900 truncate">{p.invoice_number}</p>
                    <StatusBadge status={p.payment_status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.supplier_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 font-mono">{formatCurrency(p.grand_total)}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(p.purchase_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Cashflow & Ledger</h3>
            <button
              onClick={() => onNavigate('accounts')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{tx.notes}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{tx.account_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-xs font-bold font-mono ${
                      tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatDate(tx.transaction_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
