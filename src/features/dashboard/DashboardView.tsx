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
  PlusCircle,
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

  // Monthly Chart Mock aggregation for visual representation
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
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Nexus Operations Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrated multi-module ledger for Sales, Procurement, Inventory & Financial settlement.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenCreateSale}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            New Sales Invoice
          </button>
          <button
            onClick={onOpenCreatePurchase}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(metrics?.totalSales)}
          subtitle={`${metrics?.salesCount || 0} active orders`}
          icon={TrendingUp}
          onClick={() => onNavigate('sales')}
        />

        <StatCard
          title="Total Purchases"
          value={formatCurrency(metrics?.totalPurchases)}
          subtitle={`${metrics?.purchasesCount || 0} active POs`}
          icon={TrendingDown}
          onClick={() => onNavigate('purchases')}
        />

        <StatCard
          title="Stock Asset Value"
          value={formatCurrency(metrics?.currentStockValue)}
          subtitle={`${products?.length || 0} active SKUs`}
          icon={Package}
          onClick={() => onNavigate('inventory')}
        />

        <StatCard
          title="Cash & Bank Balance"
          value={formatCurrency(metrics?.cashBankBalance)}
          subtitle="All accounts combined"
          icon={Landmark}
          onClick={() => onNavigate('accounts')}
        />

        <StatCard
          title="Receivables (Due)"
          value={formatCurrency(metrics?.totalReceivables)}
          subtitle="Pending customer collections"
          icon={ArrowDownLeft}
          onClick={() => onNavigate('accounts')}
        />

        <StatCard
          title="Payables (Due)"
          value={formatCurrency(metrics?.totalPayables)}
          subtitle="Pending supplier payouts"
          icon={ArrowUpRight}
          onClick={() => onNavigate('accounts')}
        />
      </div>

      {/* Main Charts & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Comparison Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sales vs. Purchases Trend</h3>
              <p className="text-xs text-slate-500">Monthly procurement vs billing comparison in BDT</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Last 5 Months
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Purchases" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900">Low Stock Warnings</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {lowStockProducts.length} items
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-3 max-h-56 overflow-y-auto">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">All inventory items are above safe minimum threshold.</p>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                    </div>
                    <div className="text-right">
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
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
          >
            <span>Manage Inventory & Stock Adjustments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feeds: Recent Sales & Recent Purchases & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Sales Invoices</h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {recentSales.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-medium text-slate-800">{s.invoice_number}</p>
                    <StatusBadge status={s.payment_status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[140px]">{s.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-900 font-mono">{formatCurrency(s.grand_total)}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(s.sale_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Purchase Orders</h3>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {recentPurchases.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-medium text-slate-800">{p.invoice_number}</p>
                    <StatusBadge status={p.payment_status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[140px]">{p.supplier_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-900 font-mono">{formatCurrency(p.grand_total)}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(p.purchase_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Cashflow & Ledger</h3>
            <button
              onClick={() => onNavigate('accounts')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-800 truncate max-w-[150px]">{tx.notes}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{tx.account_name}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold font-mono ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
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
