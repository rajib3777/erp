import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Sliders, History, Edit, Package, Filter } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, Column } from '@/components/common/DataTable';
import { CreateProductModal } from './CreateProductModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { ProductLedgerModal } from './ProductLedgerModal';

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

  // Totals
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.current_stock * p.purchase_cost,
    0
  );
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock_level).length;

  const columns: Column<Product>[] = [
    {
      header: 'SKU',
      accessorKey: 'sku',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{row.sku}</span>
      ),
    },
    {
      header: 'Product Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-[10px] text-slate-400">{row.category_name}</p>
        </div>
      ),
    },
    {
      header: 'Cost (৳)',
      accessorKey: 'purchase_cost',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-slate-600">{formatCurrency(row.purchase_cost)}</span>
      ),
    },
    {
      header: 'Price (৳)',
      accessorKey: 'selling_price',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-medium text-slate-900">
          {formatCurrency(row.selling_price)}
        </span>
      ),
    },
    {
      header: 'Current Stock',
      accessorKey: 'current_stock',
      sortable: true,
      align: 'right',
      cell: (row) => {
        const isLow = row.current_stock <= row.min_stock_level;
        return (
          <div className="text-right">
            <span
              className={`font-mono font-bold text-xs ${
                isLow ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {row.current_stock} {row.unit}
            </span>
            <p className="text-[10px] text-slate-400">Min: {row.min_stock_level}</p>
          </div>
        );
      },
    },
    {
      header: 'Asset Value',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          {formatCurrency(row.current_stock * row.purchase_cost)}
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => {
        const status =
          row.current_stock <= 0
            ? 'out_of_stock'
            : row.current_stock <= row.min_stock_level
            ? 'low_stock'
            : 'in_stock';
        return <StatusBadge status={status} size="sm" />;
      },
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedForLedger(row)}
            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
            title="Stock Movement Ledger"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setAdjustProductId(row.id);
              setIsAdjustOpen(true);
            }}
            className="p-1 text-slate-500 hover:text-amber-700 rounded hover:bg-slate-100"
            title="Manual Stock Adjustment"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setProductToEdit(row);
              setIsCreateOpen(true);
            }}
            className="p-1 text-slate-500 hover:text-indigo-700 rounded hover:bg-slate-100"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Ledger"
        description="Catalog items, real-time quantity on hand, minimum stock thresholds, and audited movement trails."
        breadcrumb="Operations & Warehouse"
      >
        <button
          onClick={() => {
            setAdjustProductId(undefined);
            setIsAdjustOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium shadow-2xs transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manual Adjustment</span>
        </button>
        <button
          onClick={() => {
            setProductToEdit(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </PageHeader>

      {/* Mini KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total Product SKUs</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1 truncate">{products.length} Items</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total Stock Asset Value</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1 truncate" title={formatCurrency(totalStockValue)}>{formatCurrency(totalStockValue)}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Low Stock Warnings</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 mt-1 truncate">{lowStockCount} items</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by SKU or product name..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (Healthy)</option>
            <option value="low_stock">Low Stock (Alert)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        emptyTitle="No products found"
        emptyDescription="Add products to your catalog to begin sales and inventory management."
        onRowClick={(row) => setSelectedForLedger(row)}
      />

      {/* Add / Edit Product Modal */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        defaultProductId={adjustProductId}
      />

      {/* Product Stock Movement History Modal */}
      <ProductLedgerModal
        isOpen={!!selectedForLedger}
        onClose={() => setSelectedForLedger(null)}
        product={selectedForLedger}
      />
    </div>
  );
};
