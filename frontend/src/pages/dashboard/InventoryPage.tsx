import React, { useState, useMemo } from 'react';
import { Package, Plus, AlertTriangle, Search, RefreshCw, IndianRupee, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { formatINR } from '../../utils/currency';
import { useInventoryProducts, useInvalidateQueries } from '../../hooks/useQueries';
import { useDebounce } from '../../hooks/useDebounce';
import { FormField } from '../../components/ui/FormField';
import { Validation, extractBackendErrors } from '../../utils/validation';
import { useFormValidation } from '../../hooks/useFormValidation';

export const InventoryPage: React.FC = () => {
  const { branch } = useAuth();
  const { data: products = [], isLoading: isProdsLoading } = useInventoryProducts(branch?.id);
  const { invalidateProducts } = useInvalidateQueries();
  const isLoading = isProdsLoading && products.length === 0;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Stock Adjustment Modal & Validation
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const adjustForm = useFormValidation({
    initialValues: {
      deltaQty: '',
      adjustmentReason: 'ADJUSTMENT',
      adjustmentNotes: '',
    },
    validationSchema: {
      deltaQty: (val: string) => {
        const trimmed = (val ?? '').trim();
        if (!trimmed) return 'Stock change quantity is required.';
        const num = Number(trimmed);
        if (isNaN(num)) return 'Please enter a valid numeric change.';
        if (num === 0) return 'Change cannot be 0 (e.g. enter +10 to add or -5 to deduct).';
        if (!Number.isInteger(num)) return 'Stock quantity must be a whole integer.';
        return null;
      },
    },
    onSubmit: async (values) => {
      if (!adjustingProduct) return;
      await api.post(`/inventory/products/${adjustingProduct.id}/adjust_stock/`, {
        branch_id: branch?.id,
        quantity_change: parseInt(values.deltaQty, 10),
        movement_type: values.adjustmentReason,
        notes: values.adjustmentNotes.trim(),
      });
      invalidateProducts();
      setAdjustingProduct(null);
      adjustForm.reset();
    },
  });

  // Add Product Modal & Validation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const addProductForm = useFormValidation({
    initialValues: {
      name: '',
      sku: '',
      brand: '',
      purchase_price: '650.00',
      selling_price: '950.00',
      is_retail: true,
      low_stock_threshold: '5',
    },
    validationSchema: {
      name: Validation.name('Product name', 2, 100, true),
      sku: Validation.code('SKU code', 2, 30, true),
      brand: (val: string) => (val && val.trim().length > 60 ? 'Brand name cannot exceed 60 characters.' : null),
      purchase_price: Validation.price('Cost price', 0, false),
      selling_price: Validation.price('Selling price', 1, true),
      low_stock_threshold: Validation.quantity('Low stock alert threshold', 1, true),
    },
    onSubmit: async (values) => {
      await api.post('/inventory/products/', {
        name: values.name.trim(),
        sku: values.sku.trim(),
        brand: values.brand.trim(),
        purchase_price: parseFloat(values.purchase_price) || 0,
        selling_price: parseFloat(values.selling_price),
        is_retail: values.is_retail,
        low_stock_threshold: parseInt(values.low_stock_threshold, 10) || 5,
      });
      invalidateProducts();
      setIsAddModalOpen(false);
      addProductForm.reset();
    },
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);

      if (filterLowStock) {
        return matchesSearch && p.total_stock <= p.low_stock_threshold;
      }
      return matchesSearch;
    });
  }, [products, debouncedSearch, filterLowStock]);

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Inventory & Consumables
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Track retail product stocks, salon consumables, threshold alerts, and adjustments in Indian Rupees (₹).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary btn-md shadow-sm"
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
            onClick={() => invalidateProducts()}
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
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            prod.is_retail
                              ? 'bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20'
                              : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
                          }`}
                        >
                          {prod.is_retail ? 'Retail Sale' : 'Consumable'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-[var(--text-primary)] tabular-nums">{formatINR(prod.selling_price || 0)}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] tabular-nums">Cost: {formatINR(prod.purchase_price || 0)}</p>
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
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Adjust Stock: {adjustingProduct.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Current Stock: {adjustingProduct.total_stock} {adjustingProduct.unit || 'units'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdjustingProduct(null);
                  adjustForm.reset();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {adjustForm.submitError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{adjustForm.submitError}</span>
              </div>
            )}

            <form onSubmit={adjustForm.handleSubmit} noValidate className="space-y-4 text-xs">
              <FormField
                id="deltaQty"
                label="Stock Quantity Change"
                required
                error={adjustForm.errors.deltaQty}
                touched={adjustForm.touched.deltaQty}
                helperText="Use positive numbers to add (e.g. +10) or negative to deduct (e.g. -5)."
              >
                <input
                  id="deltaQty"
                  type="number"
                  placeholder="e.g. +10 or -5"
                  value={adjustForm.values.deltaQty}
                  onChange={adjustForm.handleChange('deltaQty')}
                  onBlur={adjustForm.handleBlur('deltaQty')}
                  className={`input-field ${adjustForm.touched.deltaQty && adjustForm.errors.deltaQty ? 'input-error' : ''}`}
                />
              </FormField>

              <div>
                <label className="block text-xs font-semibold text-[#0B0D17] dark:text-[#F8FAFC] mb-1.5">Movement Type</label>
                <CustomSelect
                  value={adjustForm.values.adjustmentReason}
                  onChange={(val) => adjustForm.setFieldValue('adjustmentReason', val)}
                  options={[
                    { value: 'PURCHASE_IN', label: 'Purchase Received (+)', badge: 'Stock In' },
                    { value: 'SALE_OUT', label: 'Manual Sale / Out (-)', badge: 'Stock Out' },
                    { value: 'SERVICE_USAGE', label: 'Used in Salon Service (-)' },
                    { value: 'ADJUSTMENT', label: 'Reconciliation Adjustment' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B0D17] dark:text-[#F8FAFC] mb-1.5">Notes / Invoice Ref</label>
                <textarea
                  rows={2}
                  placeholder="Reason for adjustment, supplier po..."
                  value={adjustForm.values.adjustmentNotes}
                  onChange={adjustForm.handleChange('adjustmentNotes')}
                  className="textarea-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustingProduct(null);
                    adjustForm.reset();
                  }}
                  className="btn-ghost btn-md"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={adjustForm.isSubmitting}
                  className="btn-primary btn-md disabled:opacity-50"
                >
                  <span>{adjustForm.isSubmitting ? 'Adjusting Stock...' : 'Confirm Adjustment'}</span>
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
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add New Inventory Item</h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  addProductForm.reset();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {addProductForm.submitError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{addProductForm.submitError}</span>
              </div>
            )}

            <form onSubmit={addProductForm.handleSubmit} noValidate className="space-y-3 text-xs">
              <FormField
                id="pName"
                label="Product Name"
                required
                error={addProductForm.errors.name}
                touched={addProductForm.touched.name}
              >
                <input
                  id="pName"
                  type="text"
                  placeholder="e.g. L’Oréal Professionnel Hair Spa Cream"
                  value={addProductForm.values.name}
                  onChange={addProductForm.handleChange('name')}
                  onBlur={addProductForm.handleBlur('name')}
                  className={`input-field ${addProductForm.touched.name && addProductForm.errors.name ? 'input-error' : ''}`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="pSku"
                  label="SKU Code"
                  required
                  error={addProductForm.errors.sku}
                  touched={addProductForm.touched.sku}
                >
                  <input
                    id="pSku"
                    type="text"
                    placeholder="LOR-SPA-500"
                    value={addProductForm.values.sku}
                    onChange={addProductForm.handleChange('sku')}
                    onBlur={addProductForm.handleBlur('sku')}
                    className={`input-field uppercase ${addProductForm.touched.sku && addProductForm.errors.sku ? 'input-error' : ''}`}
                  />
                </FormField>

                <FormField
                  id="pBrand"
                  label="Brand"
                  error={addProductForm.errors.brand}
                  touched={addProductForm.touched.brand}
                >
                  <input
                    id="pBrand"
                    type="text"
                    placeholder="L’Oréal Professionnel"
                    value={addProductForm.values.brand}
                    onChange={addProductForm.handleChange('brand')}
                    onBlur={addProductForm.handleBlur('brand')}
                    className="input-field"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="pCost"
                  label="Cost Price (₹)"
                  error={addProductForm.errors.purchase_price}
                  touched={addProductForm.touched.purchase_price}
                >
                  <input
                    id="pCost"
                    type="number"
                    step="1"
                    min="0"
                    value={addProductForm.values.purchase_price}
                    onChange={addProductForm.handleChange('purchase_price')}
                    onBlur={addProductForm.handleBlur('purchase_price')}
                    className={`input-field ${addProductForm.touched.purchase_price && addProductForm.errors.purchase_price ? 'input-error' : ''}`}
                  />
                </FormField>

                <FormField
                  id="pPrice"
                  label="Selling Price (₹)"
                  required
                  error={addProductForm.errors.selling_price}
                  touched={addProductForm.touched.selling_price}
                >
                  <input
                    id="pPrice"
                    type="number"
                    step="1"
                    min="1"
                    value={addProductForm.values.selling_price}
                    onChange={addProductForm.handleChange('selling_price')}
                    onBlur={addProductForm.handleBlur('selling_price')}
                    className={`input-field ${addProductForm.touched.selling_price && addProductForm.errors.selling_price ? 'input-error' : ''}`}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <FormField
                  id="pLowStock"
                  label="Low Stock Alert"
                  required
                  error={addProductForm.errors.low_stock_threshold}
                  touched={addProductForm.touched.low_stock_threshold}
                >
                  <input
                    id="pLowStock"
                    type="number"
                    min="1"
                    value={addProductForm.values.low_stock_threshold}
                    onChange={addProductForm.handleChange('low_stock_threshold')}
                    onBlur={addProductForm.handleBlur('low_stock_threshold')}
                    className={`input-field ${addProductForm.touched.low_stock_threshold && addProductForm.errors.low_stock_threshold ? 'input-error' : ''}`}
                  />
                </FormField>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="retailCheck"
                    checked={addProductForm.values.is_retail}
                    onChange={addProductForm.handleChange('is_retail')}
                    className="w-4 h-4 rounded text-[#0A24E9] focus:ring-[#0A24E9] cursor-pointer"
                  />
                  <label htmlFor="retailCheck" className="text-[var(--text-primary)] font-medium cursor-pointer">
                    Available for Retail
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    addProductForm.reset();
                  }}
                  className="btn-ghost btn-md"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={addProductForm.isSubmitting}
                  className="btn-primary btn-md disabled:opacity-50"
                >
                  <span>{addProductForm.isSubmitting ? 'Saving Product...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
