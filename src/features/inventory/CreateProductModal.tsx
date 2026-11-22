import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Package, AlertCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Product } from '@/types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => dataService.getCategories(),
  });

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStockLevel, setMinStockLevel] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setCategoryId(productToEdit.category_id || '');
      setUnit(productToEdit.unit);
      setPurchaseCost(productToEdit.purchase_cost);
      setSellingPrice(productToEdit.selling_price);
      setCurrentStock(productToEdit.current_stock);
      setMinStockLevel(productToEdit.min_stock_level);
      setDescription(productToEdit.description || '');
    } else {
      setSku('');
      setName('');
      setCategoryId(categories[0]?.id || '');
      setUnit('pcs');
      setPurchaseCost(0);
      setSellingPrice(0);
      setCurrentStock(0);
      setMinStockLevel(10);
      setDescription('');
    }
  }, [productToEdit, categories]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (productToEdit) {
        return dataService.updateProduct(productToEdit.id, {
          sku,
          name,
          category_id: categoryId,
          unit,
          purchase_cost: Number(purchaseCost) || 0,
          selling_price: Number(sellingPrice) || 0,
          min_stock_level: Number(minStockLevel) || 10,
          description,
        });
      } else {
        return dataService.createProduct({
          sku,
          name,
          category_id: categoryId,
          unit,
          purchase_cost: Number(purchaseCost) || 0,
          selling_price: Number(sellingPrice) || 0,
          current_stock: Number(currentStock) || 0,
          min_stock_level: Number(minStockLevel) || 10,
          description,
          is_active: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save product');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-xl w-full my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-slate-100 text-slate-800">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500">Configure SKU, pricing, unit of measure, and thresholds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="p-6 space-y-4 text-xs"
        >
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Product SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. SKU-RIC-25KG"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Product Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Miniket Premium Rice 25kg Bag"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="bag">Bag / Sack</option>
                <option value="pack">Pack</option>
                <option value="can">Can / Drum</option>
                <option value="bottle">Bottle</option>
                <option value="ltr">Liter (ltr)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Purchase Cost (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Selling Price (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!productToEdit && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Opening Physical Stock
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Automatically logs opening stock movement ledger.</p>
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Minimum Stock Alert Level
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">Triggers low stock warnings when reached.</p>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description / Specification</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Packaging details, manufacturer brand, storage conditions..."
              className="w-full border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Saving...' : productToEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
