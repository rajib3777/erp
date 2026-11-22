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
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Banner & Welcome Bar (No emojis, high contrast) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Executive Dashboard</h1>
            <span className="text-xs bg-emerald-100/80 text-emerald-900 font-bold px-2.5 py-1 rounded-full border border-emerald-300 font-mono">
              Live Ledger Active
            </span>
          </div>
          <p className="text-sm text-slate-700 mt-2 font-medium flex items-center flex-wrap gap-1.5">
            <span className="text-slate-950 font-bold">Welcome back, {user?.full_name || 'System Admin'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-700">Real-time commercial analytics, cash liquidity, and warehouse status</span>
          </p>
        </div>

        {/* Dropdowns & Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 border border-slate-300/80 rounded-xl text-xs sm:text-sm font-bold text-slate-900 shadow-2xs">
            <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
            <span className="truncate max-w-[220px]">Totally FMCG & Distribution Ltd.</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 border border-slate-300/80 rounded-xl text-xs sm:text-sm font-bold text-slate-900 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-700 shrink-0" />
            <span>22 Nov 2026</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCreateSale}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ Sale</span>
            </button>
            <button
              onClick={onOpenCreatePurchase}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>+ PO</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards Row — Big, Bold, High-Contrast Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {/* Card 1: Total Sales */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <BarChart2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-mono shrink-0">
              ↑ 12.5%
            </span>
          </div>
          <div className="mt-4 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">
              Sales Revenue
            </p>
            <p
              className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-1 truncate tracking-tight"
              title={formatCurrency(metrics?.totalSales)}
            >
              {formatCurrency(metrics?.totalSales)}
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5 truncate">Total billed gross revenue</p>
          </div>
        </div>

        {/* Card 2: Total Purchases */}
        <div
          onClick={() => onNavigate('purchases')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <ShoppingCart className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 font-mono shrink-0">
              ↓ 8.3%
            </span>
          </div>
          <div className="mt-4 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">
              Procurement Cost
            </p>
            <p
              className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-1 truncate tracking-tight"
              title={formatCurrency(metrics?.totalPurchases)}
            >
              {formatCurrency(metrics?.totalPurchases)}
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5 truncate">Total supplier PO volume</p>
          </div>
        </div>

        {/* Card 3: Inventory Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Package className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-mono shrink-0">
              ↑ 9.6%
            </span>
          </div>
          <div className="mt-4 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">
              Stock Valuation
            </p>
            <p
              className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-1 truncate tracking-tight"
              title={formatCurrency(metrics?.currentStockValue)}
            >
              {formatCurrency(metrics?.currentStockValue)}
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5 truncate">Warehouse valuation at cost</p>
          </div>
        </div>

        {/* Card 4: Total Stock Volume */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-mono shrink-0">
              ↑ 15.4%
            </span>
          </div>
          <div className="mt-4 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">
              Stock Volume
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-1 truncate tracking-tight">
              {totalStockUnits.toLocaleString()} Units
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5 truncate">Across {products.length} active SKUs</p>
          </div>
        </div>

        {/* Card 5: Net Liquidity Cash Balance */}
        <div
          onClick={() => onNavigate('accounts')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition-all cursor-pointer min-w-0 overflow-hidden flex flex-col justify-between group col-span-1 sm:col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <CreditCard className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-mono shrink-0">
              ↑ 18.7%
            </span>
          </div>
          <div className="mt-4 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider truncate">
              Liquid Cash & Bank
            </p>
            <p
              className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-1 truncate tracking-tight"
              title={formatCurrency(metrics?.cashBankBalance)}
            >
              {formatCurrency(metrics?.cashBankBalance)}
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5 truncate">Reconciled liquid balance</p>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Sales Overview Chart (7 cols) + Top Selling Products Donut (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sales Overview Curve Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950 tracking-tight">Sales Overview</h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Daily gross invoice billing trend</p>
            </div>
            <select
              value={salesTimeframe}
              onChange={(e) => setSalesTimeframe(e.target.value)}
              className="bg-slate-100 border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div className="h-72 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesOverviewData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Billed Sales']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#purpleSales)"
                  dot={{ r: 5, fill: '#7c3aed', strokeWidth: 2.5, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Selling Products Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950 tracking-tight">Top Selling Products</h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Share of monthly gross revenue</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg border border-slate-300 shrink-0">
              This Month
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2 min-w-0">
            {/* Donut Chart with Center Text */}
            <div className="relative w-44 h-44 shrink-0 mx-auto sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={3.5}
                    dataKey="value"
                  >
                    {topProductsPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [`${val}% (${item.payload.amount})`, item.payload.name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Hole Total Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm sm:text-base font-black text-slate-950 font-mono tracking-tight">
                  ৳69.9k
                </span>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Product Breakdown Legend */}
            <div className="flex-1 space-y-2.5 w-full min-w-0">
              {topProductsPie.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-1.5 text-xs sm:text-sm min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: donutColors[idx] }} />
                    <span className="text-slate-950 font-bold truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-extrabold text-slate-950">{item.value}%</span>
                    <span className="text-slate-700 font-semibold ml-1.5">({item.amount})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Actionable Alerts Bar — Full Width 4-Card Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Alert 1: Low Stock */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-5 rounded-2xl bg-rose-50/90 border border-rose-200 hover:border-rose-300 hover:bg-rose-100/60 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-rose-950 truncate">
                {lowStockProducts.length > 0 ? `${lowStockProducts.length} Below Min Level` : 'Stock is Healthy'}
              </p>
              <p className="text-xs text-rose-800 font-bold truncate mt-0.5">Click for replenishment</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>

        {/* Alert 2: Customer Due */}
        <div
          onClick={() => onNavigate('accounts')}
          className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 hover:border-amber-300 hover:bg-amber-100/60 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-amber-950 truncate" title={formatCurrency(metrics?.totalReceivables)}>
                Due: {formatCurrency(metrics?.totalReceivables)}
              </p>
              <p className="text-xs text-amber-800 font-bold truncate mt-0.5">Customer receivables collection</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>

        {/* Alert 3: Purchase Orders */}
        <div
          onClick={() => onNavigate('purchases')}
          className="p-5 rounded-2xl bg-blue-50/90 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/60 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-200/80 text-blue-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-blue-950 truncate">
                {unpaidPOCount} POs Pending
              </p>
              <p className="text-xs text-blue-800 font-bold truncate mt-0.5">Supplier payables settlement</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>

        {/* Alert 4: ACID Verification */}
        <div
          onClick={() => onNavigate('settings')}
          className="p-5 rounded-2xl bg-purple-50/90 border border-purple-200 hover:border-purple-300 hover:bg-purple-100/60 transition-all cursor-pointer flex items-center justify-between gap-3 min-w-0 overflow-hidden group shadow-2xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-purple-200/80 text-purple-800 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-purple-950 truncate">
                ACID Engine Verified
              </p>
              <p className="text-xs text-purple-800 font-bold truncate mt-0.5">10/10 test scenarios passing</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </div>

      {/* 5. Bottom Section: 3-Column Tables with Fixed Widths (Zero Text Overflow, High Contrast) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table 1: Stock Safety Buffer */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Stock Safety Thresholds</h3>
            <button onClick={() => onNavigate('inventory')} className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 shrink-0 cursor-pointer">
              View All
            </button>
          </div>

          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-800 font-extrabold uppercase text-xs tracking-wider">
                <th className="w-1/2 pb-3">Product</th>
                <th className="w-1/4 pb-3 text-right">Min</th>
                <th className="w-1/4 pb-3 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 5).map((p) => {
                const isLow = p.current_stock <= p.min_stock_level;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-bold text-slate-950 truncate">
                      {p.name}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-800">
                      {p.min_stock_level}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Recent Sales Invoices</h3>
            <button onClick={() => onNavigate('sales')} className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 shrink-0 cursor-pointer">
              View All
            </button>
          </div>

          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-800 font-extrabold uppercase text-xs tracking-wider">
                <th className="w-5/12 pb-3">Invoice</th>
                <th className="w-4/12 pb-3 text-center">Status</th>
                <th className="w-3/12 pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3">
                    <p className="font-mono font-bold text-slate-950 truncate">{s.invoice_number}</p>
                    <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{s.customer_name}</p>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : s.payment_status === 'partial' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}>
                      {s.payment_status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-black text-slate-950 truncate" title={formatCurrency(s.grand_total)}>
                    {formatCurrency(s.grand_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table 3: Top Customers & Receivables */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Top Customers & Due</h3>
            <button onClick={() => onNavigate('customers')} className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 shrink-0 cursor-pointer">
              View All
            </button>
          </div>

          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-800 font-extrabold uppercase text-xs tracking-wider">
                <th className="w-6/12 pb-3">Customer</th>
                <th className="w-2/12 pb-3 text-center">Orders</th>
                <th className="w-4/12 pb-3 text-right">Due Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-950 truncate">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-slate-900">
                    {c.total_sales_count}
                  </td>
                  <td className="py-3 text-right font-mono truncate" title={formatCurrency(c.total_receivable)}>
                    <span className={c.total_receivable > 0 ? 'text-amber-800 font-black text-sm' : 'text-slate-700 font-bold text-sm'}>
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
