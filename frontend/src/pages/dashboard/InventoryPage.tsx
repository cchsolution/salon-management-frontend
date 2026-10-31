import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, Search, RefreshCw, IndianRupee } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';

export const InventoryPage: React.FC = () => {
  const { branch } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => {
    const c = api.getCached<{ results?: Product[] } | Product[]>('/inventory/products/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(() => products.length === 0);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deltaQty, setDeltaQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('ADJUSTMENT');
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pCost, setPCost] = useState('650.00');
  const [pPrice, setPPrice] = useState('950.00');
  const [pIsRetail, setPIsRetail] = useState(true);
  const [pLowStock, setPLowStock] = useState(5);

  useEffect(() => {
    fetchProducts();
  }, [branch?.id]);

  const fetchProducts = async () => {
    if (products.length === 0) {
      setIsLoading(true);
    }
    try {
      const res = await api.get<{ results?: Product[] } | Product[]>('/inventory/products/');
      const list = Array.isArray(res) ? res : res.results || [];
      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || deltaQty === 0) return;
    try {
      await api.post(`/inventory/products/${adjustingProduct.id}/adjust_stock/`, {
        branch_id: branch?.id,
        quantity_change: deltaQty,
        movement_type: adjustmentReason,
        notes: adjustmentNotes,
      });
      setAdjustingProduct(null);
      setDeltaQty(0);
      setAdjustmentNotes('');
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock.');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pSku) return;
    try {
      await api.post('/inventory/products/', {
        name: pName,
        sku: pSku,
        brand: pBrand,
        purchase_price: parseFloat(pCost),
        selling_price: parseFloat(pPrice),
        is_retail: pIsRetail,
        low_stock_threshold: pLowStock,
      });
      setIsAddModalOpen(false);
      setPName('');
      setPSku('');
      setPBrand('');
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product.');
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());

    if (filterLowStock) {
      return matchesSearch && p.total_stock <= p.low_stock_threshold;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Inventory & Consumables
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Track retail product stocks, salon consumables, threshold alerts, and adjustments in Indian Rupees (₹).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary btn-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by product name, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 ${
              filterLowStock
                ? 'bg-amber-50 dark:bg-amber-950/40 border-[#D97706] text-[#D97706] shadow-sm'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
            Low Stock Only
          </button>
          <button
            onClick={fetchProducts}
            aria-label="Refresh inventory"
            className="p-2 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)]">No inventory products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold border-b border-[var(--border)] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Product & SKU</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Cost / Sell Price</th>
                  <th className="py-3.5 px-4">On Hand Stock</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((prod) => {
                  const isLow = prod.total_stock <= prod.low_stock_threshold;
                  return (
                    <tr key={prod.id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[var(--text-primary)]">
                        <p className="font-bold text-[var(--text-primary)]">{prod.name}</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">{prod.sku}</p>
                      </td>
                      <td className="py-4 px-4 text-[var(--text-secondary)]">{prod.brand || '—'}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                            prod.is_retail
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800/40'
                              : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
                          }`}
                        >
                          {prod.is_retail ? 'Retail Sale' : 'Consumable'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-[var(--text-primary)]">₹{Number(prod.selling_price || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">Cost: ₹{Number(prod.purchase_price || 0).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)] text-sm">{prod.total_stock}</span>
                          <span className="text-[11px] text-[var(--text-secondary)]">{prod.unit}</span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#DC2626]/15 text-[#DC2626] rounded flex items-center gap-1 border border-[#DC2626]/20">
                              <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setAdjustingProduct(prod)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#059669] dark:text-[#10B981] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all border border-emerald-200 dark:border-emerald-800/40 active:scale-95"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                  Adjust Stock: {adjustingProduct.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Current Stock: {adjustingProduct.total_stock} {adjustingProduct.unit}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">
                  Stock Change (e.g. +10 or -5)
                </label>
                <input
                  type="number"
                  value={deltaQty}
                  onChange={(e) => setDeltaQty(parseInt(e.target.value, 10) || 0)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Movement Type</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="select-field"
                >
                  <option value="PURCHASE_IN">Purchase Received (+)</option>
                  <option value="SALE_OUT">Manual Sale / Out (-)</option>
                  <option value="SERVICE_USAGE">Used in Salon Service (-)</option>
                  <option value="ADJUSTMENT">Reconciliation Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Notes / Invoice Ref</label>
                <textarea
                  rows={2}
                  placeholder="Reason for adjustment, supplier po..."
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  className="textarea-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="btn-ghost btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Add New Inventory Item</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. L’Oréal Professionnel Hair Spa Cream"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">SKU *</label>
                  <input
                    type="text"
                    placeholder="LOR-SPA-500"
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="L’Oréal Professionnel"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={pCost}
                    onChange={(e) => setPCost(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    value={pLowStock}
                    onChange={(e) => setPLowStock(parseInt(e.target.value, 10) || 5)}
                    className="input-field"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="retailCheck"
                    checked={pIsRetail}
                    onChange={(e) => setPIsRetail(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6D28D9] focus:ring-[#6D28D9] cursor-pointer"
                  />
                  <label htmlFor="retailCheck" className="text-[var(--text-primary)] font-medium cursor-pointer">
                    Available for Retail
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-ghost btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
