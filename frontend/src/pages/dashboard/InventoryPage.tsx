import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  RefreshCw,
  IndianRupee,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { StatusLabel } from '../../components/ui/StatusLabel';
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
      adjustmentReason: 'PURCHASE_IN',
      adjustmentNotes: '',
    },
    validationSchema: {
      deltaQty: (val: string) => {
        const trimmed = (val ?? '').trim();
        if (!trimmed) return 'Stock change quantity is required.';
        const num = Number(trimmed);
        if (isNaN(num)) return 'Please enter a valid numeric change.';
        if (num === 0) return 'Change cannot be 0 (e.g. enter 10 to add or -5 to deduct).';
        if (!Number.isInteger(num)) return 'Stock quantity must be a whole integer.';
        return null;
      },
    },
    onSubmit: async (values) => {
      if (!adjustingProduct) return;
      let qty = parseInt(values.deltaQty, 10);
      // Auto-negate if movement type is inherently a deduction and user typed positive
      if ((values.adjustmentReason === 'SALE_OUT' || values.adjustmentReason === 'SERVICE_USAGE') && qty > 0) {
        qty = -qty;
      }

      await api.post(`/inventory/products/${adjustingProduct.id}/adjust_stock/`, {
        branch_id: branch?.id,
        quantity_change: qty,
        movement_type: values.adjustmentReason,
        notes: values.adjustmentNotes.trim(),
      });
      clearApiCache('/inventory/');
      invalidateProducts();
      setAdjustingProduct(null);
      adjustForm.reset();
    },
  });

  // Calculate live projected stock for adjustment preview
  const adjustmentPreview = useMemo(() => {
    if (!adjustingProduct) return null;
    const current = adjustingProduct.total_stock || 0;
    const rawVal = adjustForm.values.deltaQty.trim();
    if (!rawVal || isNaN(Number(rawVal))) {
      return { current, projected: current, delta: 0 };
    }
    let delta = parseInt(rawVal, 10);
    if ((adjustForm.values.adjustmentReason === 'SALE_OUT' || adjustForm.values.adjustmentReason === 'SERVICE_USAGE') && delta > 0) {
      delta = -delta;
    }
    const projected = current + delta;
    return { current, projected, delta };
  }, [adjustingProduct, adjustForm.values.deltaQty, adjustForm.values.adjustmentReason]);

  // Add Product Modal & Validation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addBackendErrors, setAddBackendErrors] = useState<Record<string, string>>({});

  const addProductForm = useFormValidation({
    initialValues: {
      name: '',
      sku: '',
      brand: '',
      unit: 'PIECE',
      purchase_price: '450.00',
      selling_price: '750.00',
      initial_stock: '10',
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
      initial_stock: Validation.quantity('Initial stock quantity', 0, false),
    },
    onSubmit: async (values) => {
      setAddBackendErrors({});
      try {
        await api.post('/inventory/products/', {
          name: values.name.trim(),
          sku: values.sku.trim().toUpperCase(),
          brand: values.brand.trim() || undefined,
          unit: values.unit || 'PIECE',
          purchase_price: parseFloat(values.purchase_price) || 0,
          selling_price: parseFloat(values.selling_price),
          is_retail: values.is_retail,
          low_stock_threshold: parseInt(values.low_stock_threshold, 10) || 5,
          total_stock: parseInt(values.initial_stock || '0', 10) || 0,
        });
        clearApiCache('/inventory/');
        invalidateProducts();
        setIsAddModalOpen(false);
        addProductForm.reset();
      } catch (err: any) {
        const { fieldErrors, generalError } = extractBackendErrors(err);
        setAddBackendErrors({
          ...fieldErrors,
          ...(generalError ? { general: generalError } : {}),
        });
        throw err;
      }
    },
  });

  // Modal scroll lock & Escape key handling
  const isAnyModalOpen = isAddModalOpen || Boolean(adjustingProduct);
  useEffect(() => {
    if (!isAnyModalOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (adjustingProduct) {
          setAdjustingProduct(null);
          adjustForm.reset();
        } else if (isAddModalOpen) {
          setIsAddModalOpen(false);
          addProductForm.reset();
          setAddBackendErrors({});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen, adjustingProduct, isAddModalOpen, adjustForm, addProductForm]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q));

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
          onClick={() => {
            setIsAddModalOpen(true);
            setAddBackendErrors({});
          }}
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
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer ${
              filterLowStock
                ? 'bg-amber-50 dark:bg-amber-950/40 border-[#D97706] text-[#D97706] shadow-sm'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
            Low Stock Only
          </button>
          <button
            onClick={() => {
              clearApiCache('/inventory/');
              invalidateProducts();
            }}
            aria-label="Refresh inventory"
            className="p-2 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors active:scale-95 cursor-pointer"
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
                  const isOut = prod.total_stock <= 0;
                  const isLow = !isOut && prod.total_stock <= prod.low_stock_threshold;
                  return (
                    <tr key={prod.id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[var(--text-primary)]">
                        <p className="font-bold text-[var(--text-primary)]">{prod.name}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-mono">{prod.sku}</p>
                      </td>
                      <td className="py-4 px-4 text-[var(--text-secondary)]">{prod.brand || '—'}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            prod.is_retail
                              ? 'bg-[#EEF2FF] dark:bg-[#1E294B] text-[#2868ff] dark:text-[#4D68FF] border border-[#2868ff]/20'
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
                          <span className="text-[11px] text-[var(--text-secondary)]">{prod.unit || 'units'}</span>
                          {isOut ? (
                            <StatusLabel status="OUT_OF_STOCK" size="xs" />
                          ) : isLow ? (
                            <StatusLabel status="LOW_STOCK" size="xs" />
                          ) : (
                            <StatusLabel status="IN_STOCK" size="xs" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setAdjustingProduct(prod);
                            adjustForm.reset();
                          }}
                          className="btn-outline btn-xs text-[#059669] border-[#059669]/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
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

      {/* Adjust Stock Modal using createPortal with z-[100] */}
      {adjustingProduct &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !adjustForm.isSubmitting) {
                setAdjustingProduct(null);
                adjustForm.reset();
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Adjust Stock: {adjustingProduct.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Current on-hand stock: <strong className="text-[var(--text-primary)]">{adjustingProduct.total_stock} {adjustingProduct.unit || 'units'}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustingProduct(null);
                    adjustForm.reset();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {adjustForm.submitError && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{adjustForm.submitError}</span>
                </div>
              )}

              <form onSubmit={adjustForm.handleSubmit} noValidate className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Movement Type
                  </label>
                  <CustomSelect
                    value={adjustForm.values.adjustmentReason}
                    onChange={(val) => adjustForm.setFieldValue('adjustmentReason', val)}
                    options={[
                      { value: 'PURCHASE_IN', label: 'Purchase Received / Restock (+)', badge: 'Stock In' },
                      { value: 'SALE_OUT', label: 'Manual Sale / Outflow (-)', badge: 'Stock Out' },
                      { value: 'SERVICE_USAGE', label: 'Consumed in Salon Service (-)', badge: 'Usage' },
                      { value: 'ADJUSTMENT', label: 'Inventory Audit / Correction', badge: 'Audit' },
                    ]}
                  />
                </div>

                <FormField
                  id="deltaQty"
                  label="Quantity Change"
                  required
                  error={adjustForm.errors.deltaQty}
                  touched={adjustForm.touched.deltaQty}
                  helperText={
                    adjustForm.values.adjustmentReason === 'SALE_OUT' || adjustForm.values.adjustmentReason === 'SERVICE_USAGE'
                      ? 'Enter units to deduct from inventory'
                      : 'Enter units to add or adjust'
                  }
                >
                  <input
                    id="deltaQty"
                    type="number"
                    step="1"
                    placeholder="e.g. 10"
                    value={adjustForm.values.deltaQty}
                    onChange={adjustForm.handleChange('deltaQty')}
                    onBlur={adjustForm.handleBlur('deltaQty')}
                    className={`input-field ${adjustForm.touched.deltaQty && adjustForm.errors.deltaQty ? 'input-error' : ''}`}
                  />
                </FormField>

                {/* Stock Movement Direction Preview */}
                {adjustmentPreview && adjustmentPreview.delta !== 0 && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    adjustmentPreview.projected < 0
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300'
                      : adjustmentPreview.delta > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {adjustmentPreview.delta > 0 ? (
                        <TrendingUp className="w-4 h-4 text-[#059669]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#DC2626]" />
                      )}
                      <div>
                        <p className="font-bold">
                          Stock Effect: {adjustmentPreview.delta > 0 ? `+${adjustmentPreview.delta}` : adjustmentPreview.delta} {adjustingProduct.unit || 'units'}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {adjustmentPreview.current} → <span className="font-bold">{adjustmentPreview.projected}</span> {adjustingProduct.unit || 'units'}
                        </p>
                      </div>
                    </div>
                    {adjustmentPreview.projected < 0 && (
                      <span className="font-bold text-[10px] text-red-600 bg-red-100 dark:bg-red-900/60 px-1.5 py-0.5 rounded">
                        Negative Stock!
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Notes / PO / Reason
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Supplier PO #4092, damaged packaging..."
                    value={adjustForm.values.adjustmentNotes}
                    onChange={adjustForm.handleChange('adjustmentNotes')}
                    className="textarea-field text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustingProduct(null);
                      adjustForm.reset();
                    }}
                    className="btn-ghost btn-sm"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={adjustForm.isSubmitting}
                    className="btn-primary btn-sm"
                  >
                    <span>{adjustForm.isSubmitting ? 'Adjusting...' : 'Confirm Adjustment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Add Product Modal using createPortal with z-[100] */}
      {isAddModalOpen &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !addProductForm.isSubmitting) {
                setIsAddModalOpen(false);
                addProductForm.reset();
                setAddBackendErrors({});
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4 animate-scale-in max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Add New Inventory Product</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Create catalog product with stock tracking</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    addProductForm.reset();
                    setAddBackendErrors({});
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(addProductForm.submitError || addBackendErrors.general) && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{addBackendErrors.general || addProductForm.submitError}</span>
                </div>
              )}

              <form onSubmit={addProductForm.handleSubmit} noValidate className="space-y-3.5 text-xs">
                <FormField
                  id="pName"
                  label="Product Name"
                  required
                  error={addProductForm.errors.name || addBackendErrors.name}
                  touched={addProductForm.touched.name}
                >
                  <input
                    id="pName"
                    type="text"
                    placeholder="e.g. L’Oréal Professionnel Hair Spa Cream"
                    value={addProductForm.values.name}
                    onChange={addProductForm.handleChange('name')}
                    onBlur={addProductForm.handleBlur('name')}
                    className={`input-field ${
                      (addProductForm.touched.name && addProductForm.errors.name) || addBackendErrors.name
                        ? 'input-error'
                        : ''
                    }`}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    id="pSku"
                    label="SKU Code"
                    required
                    error={addProductForm.errors.sku || addBackendErrors.sku}
                    touched={addProductForm.touched.sku}
                  >
                    <input
                      id="pSku"
                      type="text"
                      placeholder="LOR-SPA-500"
                      value={addProductForm.values.sku}
                      onChange={addProductForm.handleChange('sku')}
                      onBlur={addProductForm.handleBlur('sku')}
                      className={`input-field uppercase ${
                        (addProductForm.touched.sku && addProductForm.errors.sku) || addBackendErrors.sku
                          ? 'input-error'
                          : ''
                      }`}
                    />
                  </FormField>

                  <FormField
                    id="pBrand"
                    label="Brand"
                    error={addProductForm.errors.brand || addBackendErrors.brand}
                    touched={addProductForm.touched.brand}
                  >
                    <input
                      id="pBrand"
                      type="text"
                      placeholder="e.g. L’Oréal, Moroccanoil"
                      value={addProductForm.values.brand}
                      onChange={addProductForm.handleChange('brand')}
                      onBlur={addProductForm.handleBlur('brand')}
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Measurement Unit <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      value={addProductForm.values.unit}
                      onChange={(val) => addProductForm.setFieldValue('unit', val)}
                      options={[
                        { value: 'PIECE', label: 'Piece (pcs)' },
                        { value: 'BOTTLE', label: 'Bottle (btl)' },
                        { value: 'ML', label: 'Millilitres (ml)' },
                        { value: 'GRAM', label: 'Grams (g)' },
                        { value: 'PACK', label: 'Pack / Kit' },
                        { value: 'TUBE', label: 'Tube' },
                        { value: 'BOX', label: 'Box' },
                      ]}
                      size="sm"
                    />
                  </div>

                  <FormField
                    id="pInitialStock"
                    label="Initial Stock On-Hand"
                    error={addProductForm.errors.initial_stock || addBackendErrors.total_stock}
                    touched={addProductForm.touched.initial_stock}
                  >
                    <input
                      id="pInitialStock"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={addProductForm.values.initial_stock}
                      onChange={addProductForm.handleChange('initial_stock')}
                      onBlur={addProductForm.handleBlur('initial_stock')}
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    id="pCost"
                    label="Purchase / Cost Price (₹)"
                    error={addProductForm.errors.purchase_price || addBackendErrors.purchase_price}
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
                      className="input-field"
                    />
                  </FormField>

                  <FormField
                    id="pPrice"
                    label="Retail Selling Price (₹)"
                    required
                    error={addProductForm.errors.selling_price || addBackendErrors.selling_price}
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
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                  <FormField
                    id="pLowStock"
                    label="Low Stock Alert Threshold"
                    required
                    error={addProductForm.errors.low_stock_threshold || addBackendErrors.low_stock_threshold}
                    touched={addProductForm.touched.low_stock_threshold}
                  >
                    <input
                      id="pLowStock"
                      type="number"
                      min="1"
                      step="1"
                      value={addProductForm.values.low_stock_threshold}
                      onChange={addProductForm.handleChange('low_stock_threshold')}
                      onBlur={addProductForm.handleBlur('low_stock_threshold')}
                      className="input-field"
                    />
                  </FormField>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="retailCheck"
                      checked={addProductForm.values.is_retail}
                      onChange={addProductForm.handleChange('is_retail')}
                      className="w-4 h-4 rounded text-[#2868ff] focus:ring-[#2868ff] cursor-pointer"
                    />
                    <label htmlFor="retailCheck" className="text-[var(--text-primary)] font-medium cursor-pointer">
                      Available for Client Retail Sale
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      addProductForm.reset();
                      setAddBackendErrors({});
                    }}
                    className="btn-ghost btn-sm"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={addProductForm.isSubmitting}
                    className="btn-primary btn-sm"
                  >
                    <span>{addProductForm.isSubmitting ? 'Saving Product...' : 'Save Product'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
