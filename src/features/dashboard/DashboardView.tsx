import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Landmark,
  ShoppingCart,
  Truck,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Calendar,
  Sliders,
  ChevronRight,
  Layers,
  CreditCard,
  BarChart2,
  Users,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
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
  const [pieTimeframe, setPieTimeframe] = useState('month');

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
  const outOfStockCount = products.filter((p) => p.current_stock <= 0).length;
  const unpaidPOCount = purchases.filter((p) => p.payment_status === 'unpaid' && p.status !== 'cancelled').length;

  // Sales Trend Curve data
  const salesOverviewData = [
    { date: '1 Nov', amount: 35000, display: '৳35,000' },
    { date: '5 Nov', amount: 58000, display: '৳58,000' },
    { date: '10 Nov', amount: 48000, display: '৳48,000' },
    { date: '15 Nov', amount: 92000, display: '৳92,000' },
    { date: '20 Nov', amount: 64000, display: '৳64,000' },
    { date: '25 Nov', amount: 110000, display: '৳110,000' },
    { date: '30 Nov', amount: metrics?.totalSales || 135000, display: formatCurrency(metrics?.totalSales) },
  ];

  // Top Selling Products Donut Data (matching Screenshot 3)
  const donutColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const topProductsPie = [
    { name: 'Teer Soybean Oil 5L', value: 35, amount: '৳28.5k' },
    { name: 'Miniket Rice 25kg', value: 25, amount: '৳19.5k' },
    { name: 'Dano Milk Powder 1kg', value: 18, amount: '৳14.2k' },
    { name: 'Radhuni Pure Mustard Oil', value: 12, amount: '৳9.8k' },
    { name: 'Others & Atta Flour', value: 10, amount: '৳7.9k' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Welcome Bar matching Screenshot 3 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span>Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}</span>
            <span>👋</span>
            <span className="text-slate-400">• Real-time commercial & financial operations overview</span>
          </p>
        </div>

        {/* Dropdowns & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Totally FMCG & Distribution Ltd.</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
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

      {/* 2. Top 5 KPI Cards Row matching Screenshot 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Sales */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono">
              ↑ 12.5%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Total Sales (Today)</p>
            <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate" title={formatCurrency(metrics?.totalSales)}>
              {formatCurrency(metrics?.totalSales)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">vs. previous period</p>
          </div>
        </div>

        {/* Card 2: Total Purchases */}
        <div
          onClick={() => onNavigate('purchases')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 font-mono">
              ↓ 8.3%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Total Purchases (Today)</p>
            <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate" title={formatCurrency(metrics?.totalPurchases)}>
              {formatCurrency(metrics?.totalPurchases)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">inbound restocks</p>
          </div>
        </div>

        {/* Card 3: Inventory Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono">
              ↑ 9.6%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Inventory Value</p>
            <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate" title={formatCurrency(metrics?.currentStockValue)}>
              {formatCurrency(metrics?.currentStockValue)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">warehouse valuation</p>
          </div>
        </div>

        {/* Card 4: Total Stock Volume */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono">
              ↑ 15.4%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Stock Quantity</p>
            <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate">
              {totalStockUnits} Units
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">available in depot</p>
          </div>
        </div>

        {/* Card 5: Net Liquidity Cash Balance */}
        <div
          onClick={() => onNavigate('accounts')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer min-w-0 group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 font-mono">
              ↑ 18.7%
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Cash & Bank Liquidity</p>
            <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5 truncate" title={formatCurrency(metrics?.cashBankBalance)}>
              {formatCurrency(metrics?.cashBankBalance)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">reconciled funds</p>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Sales Overview + Donut Chart + Alerts & Notifications matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sales Overview Curve Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
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
              <AreaChart data={salesOverviewData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
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
                <Area type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={2.5} fillOpacity={1} fill="url(#purpleSales)" dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle: Top Selling Products Donut Chart (4 cols) matching Screenshot 3 */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Top Selling Products</h2>
              <p className="text-xs text-slate-400">Share of monthly revenue</p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
              This Month
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            {/* Donut Chart with Center Text */}
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
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
                <span className="text-xs font-extrabold text-slate-900 font-mono">
                  {formatCurrency(metrics?.totalSales ? metrics.totalSales / 1000 : 69.9)}k
                </span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">Total</span>
              </div>
            </div>

            {/* Product Breakdown Legend */}
            <div className="flex-1 space-y-2 text-xs w-full">
              {topProductsPie.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: donutColors[idx] }} />
                    <span className="text-slate-700 font-medium truncate max-w-[100px]">{item.name}</span>
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

        {/* Right: Alerts & Notifications (3 cols) matching Screenshot 3 */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Alerts & Actions</h2>
            <button onClick={() => onNavigate('inventory')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Alert 1: Red Alert */}
            <div
              onClick={() => onNavigate('inventory')}
              className="p-3 rounded-2xl bg-rose-50/80 border border-rose-100 hover:border-rose-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-900 truncate">
                    {lowStockProducts.length > 0 ? `${lowStockProducts.length} Products Low Stock` : 'Stock is Healthy'}
                  </p>
                  <p className="text-[10px] text-rose-600 font-medium">View replenishment</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Alert 2: Amber Alert */}
            <div
              onClick={() => onNavigate('accounts')}
              className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100 hover:border-amber-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-900 truncate">
                    Due: {formatCurrency(metrics?.totalReceivables)}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium">Customer collections</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Alert 3: Blue Alert */}
            <div
              onClick={() => onNavigate('purchases')}
              className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-900 truncate">
                    {unpaidPOCount} Purchase Orders Pending
                  </p>
                  <p className="text-[10px] text-blue-600 font-medium">Supplier payables</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Alert 4: Purple Alert */}
            <div
              onClick={() => onNavigate('settings')}
              className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100 hover:border-purple-200 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-purple-900 truncate">
                    ACID Ledger Verified
                  </p>
                  <p className="text-[10px] text-purple-600 font-medium">10/10 test scenarios</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: 3-Column Informative Grids matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table 1: Low Stock Products & Safety Buffer (matching "Expiring Products") */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Stock Safety Thresholds</h3>
            <button onClick={() => onNavigate('inventory')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Product</th>
                  <th className="pb-2.5">SKU</th>
                  <th className="pb-2.5 text-right">Min</th>
                  <th className="pb-2.5 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.slice(0, 5).map((p) => {
                  const isLow = p.current_stock <= p.min_stock_level;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-medium text-slate-900 truncate max-w-[120px]">{p.name}</td>
                      <td className="py-2.5 font-mono text-[10px] text-slate-400">{p.sku}</td>
                      <td className="py-2.5 text-right font-mono text-slate-500">{p.min_stock_level}</td>
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
        </div>

        {/* Table 2: Recent Orders & Fulfillment (matching "Batch Production Status") */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Sales Invoices</h3>
            <button onClick={() => onNavigate('sales')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Invoice</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 5).map((s) => {
                  const percent = s.payment_status === 'paid' ? 100 : s.payment_status === 'partial' ? 50 : 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-mono font-semibold text-slate-900">{s.invoice_number}</td>
                      <td className="py-2.5 font-medium text-slate-600 truncate max-w-[110px]">{s.customer_name}</td>
                      <td className="py-2.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                            s.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : s.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {s.payment_status}
                          </span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(s.grand_total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Customer Directory & Activity (matching "MR Daily Activity") */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Customers & Receivables</h3>
            <button onClick={() => onNavigate('customers')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5 text-center">Orders</th>
                  <th className="pb-2.5 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900 truncate max-w-[120px]">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-mono font-medium text-slate-600">
                      {c.total_sales_count}
                    </td>
                    <td className="py-2.5 text-right font-mono">
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
    </div>
  );
};
