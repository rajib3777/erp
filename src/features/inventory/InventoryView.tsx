import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Sliders,
  History,
  Edit,
  Package,
  Filter,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart2,
  Box,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { CreateProductModal } from './CreateProductModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { ProductLedgerModal } from './ProductLedgerModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';

export const InventoryView: React.FC = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => dataService.getProducts(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => dataService.getCategories(),
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string | undefined>(undefined);
  const [selectedForLedger, setSelectedForLedger] = useState<Product | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || p.category_id === selectedCategory;

      let matchStock = true;
      if (stockStatusFilter === 'low_stock') {
        matchStock = p.current_stock <= p.min_stock_level && p.current_stock > 0;
      } else if (stockStatusFilter === 'out_of_stock') {
        matchStock = p.current_stock <= 0;
      } else if (stockStatusFilter === 'in_stock') {
        matchStock = p.current_stock > p.min_stock_level;
      }

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, search, selectedCategory, stockStatusFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Totals
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.current_stock * p.purchase_cost,
    0
  );
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock_level).length;

  // Top products for Screenshot 2 right-side bar chart
  const topMovingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.current_stock - a.current_stock)
      .slice(0, 5)
      .map((p) => ({
        name: p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name,
        fullName: p.name,
        units: p.current_stock,
        sku: p.sku,
      }));
  }, [products]);

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Cost', 'Price', 'Stock', 'Unit', 'Value'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      `"${p.name}"`,
      p.category_name,
      p.purchase_cost,
      p.selling_price,
      p.current_stock,
      p.unit,
      p.current_stock * p.purchase_cost,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `totally_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock valuation, minimum safety thresholds, and audited movement trail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setAdjustProductId(undefined);
              setIsAdjustOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Products */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0 group hover:shadow-md transition-all">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Box className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Products</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 font-mono mt-0.5 truncate">
                {products.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total in catalog</p>
            </div>
          </div>
          <div className="p-2 rounded-xl text-blue-500 bg-blue-50/60 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Low Stock */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0 group hover:shadow-md transition-all">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Low Stock Alert</p>
              <p className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono mt-0.5 truncate">
                {lowStockCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Below threshold</p>
            </div>
          </div>
          <div className="p-2 rounded-xl text-rose-500 bg-rose-50/60 shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Total Value */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0 group hover:shadow-md transition-all">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Wallet className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stock Asset Value</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono mt-0.5 truncate" title={formatCurrency(totalStockValue)}>
                {formatCurrency(totalStockValue)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Valuation ledger</p>
            </div>
          </div>
          <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50/60 shrink-0">
            <Package className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Two-Column Responsive Content Split matching Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stock by Product Table (7 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Stock by Product</h2>
              <p className="text-xs text-slate-400">Current quantities across warehouse depots</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search product..."
                  className="w-44 sm:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Product</th>
                  <th className="pb-3">Depot</th>
                  <th className="pb-3 text-right">Current Stock</th>
                  <th className="pb-3 text-right">Min</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading inventory items...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching products found
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const isLow = p.current_stock <= p.min_stock_level;
                    const isOut = p.current_stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Product with thumbnail */}
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0 group-hover:scale-105 transition-transform">
                              <Package className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate max-w-[170px] sm:max-w-[220px]">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                            </div>
                          </div>
                        </td>

                        {/* Depot */}
                        <td className="py-3 text-slate-600 font-medium">
                          {p.category_name || 'Central Hub'}
                        </td>

                        {/* Stock actual */}
                        <td className="py-3 text-right font-mono font-bold text-xs">
                          <span
                            className={
                              isOut
                                ? 'text-rose-600 font-bold'
                                : isLow
                                ? 'text-amber-600 font-bold'
                                : 'text-blue-600'
                            }
                          >
                            {p.current_stock} {p.unit}
                          </span>
                        </td>

                        {/* Min */}
                        <td className="py-3 text-right font-mono text-slate-500">
                          {p.min_stock_level}
                        </td>

                        {/* Status */}
                        <td className="py-3 text-center">
                          {isOut ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              OK
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 pr-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setSelectedForLedger(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Stock Movements"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setProductToEdit(p);
                                setIsCreateOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination matching Screenshot 2 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min(filteredProducts.length, (currentPage - 1) * pageSize + 1)} to{' '}
              {Math.min(filteredProducts.length, currentPage * pageSize)} of {filteredProducts.length} items
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Top Moving Products Bar Chart (5 cols) matching Screenshot 2 */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Top Stock Movers</h2>
              <p className="text-xs text-slate-400">Inventory volume distribution</p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
              Active Stock
            </span>
          </div>

          {/* Bar Chart with numbers on top of bars */}
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMovingProducts} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg">
                          <p className="font-semibold">{data.fullName}</p>
                          <p className="text-blue-300 font-mono mt-0.5">Stock: {data.units} units</p>
                          <p className="text-[10px] text-slate-400">SKU: {data.sku}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="units" fill="#2563eb" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="units" position="top" fill="#1e293b" fontSize={11} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Footer link matching Screenshot 2 */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setSelectedForLedger(products[0] || null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>View Full Stock Ledger & Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        defaultProductId={adjustProductId}
      />

      <ProductLedgerModal
        isOpen={!!selectedForLedger}
        onClose={() => setSelectedForLedger(null)}
        product={selectedForLedger}
      />
    </div>
  );
};
