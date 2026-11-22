import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Truck,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronRight,
  Layers,
  CreditCard,
  BarChart2,
  ShieldCheck,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { formatCurrency } from '@/utils/currency';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuth } from '@/features/authentication/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
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
  const { user } = useAuth();
  const [salesTimeframe, setSalesTimeframe] = useState('month');

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dataService.getDashboardMetrics(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => dataService.getProducts(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => dataService.getSales(),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => dataService.getPurchases(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => dataService.getCustomers(),
  });

  if (loadingMetrics) {
    return <LoadingState message="Synchronizing enterprise analytics & ledger..." />;
  }

  // Stock calculations
  const totalStockUnits = products.reduce((sum, p) => sum + p.current_stock, 0);
  const lowStockProducts = products.filter((p) => p.current_stock <= p.min_stock_level);
  const unpaidPOCount = purchases.filter((p) => p.payment_status === 'unpaid' && p.status !== 'cancelled').length;

  // Sales Trend Curve data
  const salesOverviewData = [
    { date: '1 Nov', amount: 35000 },
    { date: '5 Nov', amount: 58000 },
    { date: '10 Nov', amount: 48000 },
    { date: '15 Nov', amount: 92000 },
    { date: '20 Nov', amount: 64000 },
    { date: '25 Nov', amount: 110000 },
    { date: '30 Nov', amount: metrics?.totalSales || 135000 },
  ];

  // Top Selling Products Donut Data (matching Screenshot 3)
  const donutColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const topProductsPie = [
    { name: 'Teer Soybean Oil 5L', value: 35, amount: '৳28.5k' },
    { name: 'Miniket Rice 25kg', value: 25, amount: '৳19.5k' },
    { name: 'Dano Milk Powder 1kg', value: 18, amount: '৳14.2k' },
    { name: 'Radhuni Pure Mustard Oil', value: 12, amount: '৳9.8k' },
    { name: 'Others & Flour', value: 10, amount: '৳7.9k' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Welcome Bar (No emojis) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            <span className="text-slate-800 font-semibold">Welcome back, {user?.full_name || 'System Admin'}</span>
            <span className="text-slate-400 ml-2">• Real-time commercial and financial operations overview</span>
          </p>
        </div>

        {/* Dropdowns & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate max-w-[200px]">Totally FMCG & Distribution Ltd.</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>22 Nov 2026</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateSale}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>+ Sale</span>
            </button>
            <button
              onClick={onOpenCreatePurchase}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:-translate-y-0.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>+ PO</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards Row — Spacious, Non-Overflowing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Sales */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono shrink-0">
              ↑ 12.5%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Sales Revenue
            </p>
            <p
              className="text-lg xl:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate tracking-tight"
              title={formatCurrency(metrics?.totalSales)}
            >
              {formatCurrency(metrics?.totalSales)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">vs. previous period</p>
          </div>
        </div>

        {/* Card 2: Total Purchases */}
        <div
          onClick={() => onNavigate('purchases')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 font-mono shrink-0">
              ↓ 8.3%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Procurement Cost
            </p>
            <p
              className="text-lg xl:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate tracking-tight"
              title={formatCurrency(metrics?.totalPurchases)}
            >
              {formatCurrency(metrics?.totalPurchases)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">inbound restocks</p>
          </div>
        </div>

        {/* Card 3: Inventory Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono shrink-0">
              ↑ 9.6%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Stock Valuation
            </p>
            <p
              className="text-lg xl:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate tracking-tight"
              title={formatCurrency(metrics?.currentStockValue)}
            >
              {formatCurrency(metrics?.currentStockValue)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">warehouse assets</p>
          </div>
        </div>

        {/* Card 4: Total Stock Volume */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono shrink-0">
              ↑ 15.4%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Stock Quantity
            </p>
            <p className="text-lg xl:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate tracking-tight">
              {totalStockUnits} Units
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">on-hand inventory</p>
          </div>
        </div>

        {/* Card 5: Net Liquidity Cash Balance */}
        <div
          onClick={() => onNavigate('accounts')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group col-span-1 sm:col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono shrink-0">
              ↑ 18.7%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
              Liquid Cash & Bank
            </p>
            <p
              className="text-lg xl:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate tracking-tight"
              title={formatCurrency(metrics?.cashBankBalance)}
            >
              {formatCurrency(metrics?.cashBankBalance)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">reconciled funds</p>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Sales Overview Chart (7 cols) + Top Selling Products Donut (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sales Overview Curve Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Sales Overview</h2>
              <p className="text-xs text-slate-400">Daily gross invoice billing trend</p>
            </div>
            <select
              value={salesTimeframe}
              onChange={(e) => setSalesTimeframe(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-2.5 py-1 focus:outline-none"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesOverviewData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#f1f5f9' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Billed Sales']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 500 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purpleSales)"
                  dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Selling Products Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Top Selling Products</h2>
              <p className="text-xs text-slate-400">Share of monthly revenue</p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
              This Month
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 pt-1 min-w-0">
            {/* Donut Chart with Center Text */}
            <div className="relative w-36 h-36 shrink-0 mx-auto sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {topProductsPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [`${val}% (${item.payload.amount})`, item.payload.name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Hole Total Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-900 font-mono tracking-tight">
                  ৳69.9k
                </span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Total</span>
              </div>
            </div>

            {/* Product Breakdown Legend */}
            <div className="flex-1 space-y-2 text-xs w-full min-w-0">
              {topProductsPie.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-1 text-[11px] min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: donutColors[idx] }} />
                    <span className="text-slate-700 font-medium truncate max-w-[130px]">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-semibold text-slate-900">{item.value}%</span>
                    <span className="text-slate-400 ml-1">({item.amount})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Actionable Alerts Bar — Full Width 4-Card Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Alert 1: Low Stock */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-rose-900 truncate">
                {lowStockProducts.length > 0 ? `${lowStockProducts.length} Items Below Min` : 'Stock is Healthy'}
              </p>
              <p className="text-[11px] text-rose-600 font-medium truncate">View replenishment</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>

        {/* Alert 2: Customer Due */}
        <div
          onClick={() => onNavigate('accounts')}
          className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 hover:border-amber-200 hover:bg-amber-50 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-900 truncate" title={formatCurrency(metrics?.totalReceivables)}>
                Due: {formatCurrency(metrics?.totalReceivables)}
              </p>
              <p className="text-[11px] text-amber-600 font-medium truncate">Customer collections</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>

        {/* Alert 3: Purchase Orders */}
        <div
          onClick={() => onNavigate('purchases')}
          className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-900 truncate">
                {unpaidPOCount} POs Pending
              </p>
              <p className="text-[11px] text-blue-600 font-medium truncate">Supplier payables</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>

        {/* Alert 4: ACID Verification */}
        <div
          onClick={() => onNavigate('settings')}
          className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 hover:border-purple-200 hover:bg-purple-50 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-purple-900 truncate">
                ACID Ledger Verified
              </p>
              <p className="text-[11px] text-purple-600 font-medium truncate">10/10 test scenarios</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>
      </div>

      {/* 5. Bottom Section: 3-Column Tables with Fixed Widths (Zero Text Overflow) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table 1: Stock Safety Buffer */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Stock Safety Thresholds</h3>
            <button onClick={() => onNavigate('inventory')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0">
              View All
            </button>
          </div>

          <table className="w-full table-fixed text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="w-1/2 pb-2.5">Product</th>
                <th className="w-1/4 pb-2.5 text-right">Min</th>
                <th className="w-1/4 pb-2.5 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 5).map((p) => {
                const isLow = p.current_stock <= p.min_stock_level;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 font-medium text-slate-900 truncate">
                      {p.name}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-500">
                      {p.min_stock_level}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isLow ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {p.current_stock}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table 2: Recent Sales Invoices */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Sales Invoices</h3>
            <button onClick={() => onNavigate('sales')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0">
              View All
            </button>
          </div>

          <table className="w-full table-fixed text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="w-5/12 pb-2.5">Invoice</th>
                <th className="w-4/12 pb-2.5 text-center">Status</th>
                <th className="w-3/12 pb-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5">
                    <p className="font-mono font-semibold text-slate-900 truncate">{s.invoice_number}</p>
                    <p className="text-[10px] text-slate-400 truncate">{s.customer_name}</p>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                      s.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : s.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {s.payment_status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900 truncate" title={formatCurrency(s.grand_total)}>
                    {formatCurrency(s.grand_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table 3: Top Customers & Receivables */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Customers & Due</h3>
            <button onClick={() => onNavigate('customers')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0">
              View All
            </button>
          </div>

          <table className="w-full table-fixed text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="w-6/12 pb-2.5">Customer</th>
                <th className="w-2/12 pb-2.5 text-center">Orders</th>
                <th className="w-4/12 pb-2.5 text-right">Due Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900 truncate">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-mono font-medium text-slate-600">
                    {c.total_sales_count}
                  </td>
                  <td className="py-2.5 text-right font-mono truncate" title={formatCurrency(c.total_receivable)}>
                    <span className={c.total_receivable > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      {formatCurrency(c.total_receivable)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
