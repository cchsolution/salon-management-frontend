import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  Package,
  Printer,
  X,
  User,
  QrCode,
  Download,
  Share2,
  Mail,
  MessageSquare,
  Sparkles,
  Percent,
  IndianRupee,
  ShieldCheck,
  CreditCard,
  Banknote,
  AlertTriangle,
  AlertCircle,
  Info,
  Ban,
  Check,
  ArrowRight,
  ArrowLeft,
  Copy,
  FileText,
  FileCheck,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product, Customer, Invoice, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/currency';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { useRetailProducts, useClients, useInvalidateQueries } from '../../hooks/useQueries';
import { useDebounce } from '../../hooks/useDebounce';
import { Validation } from '../../utils/validation';
import { FormField } from '../../components/ui/FormField';

export interface CartItem {
  id: string; // unique cart uuid
  product_id: string;
  name: string;
  sku: string;
  brand: string;
  unit_price: number;
  quantity: number;
  available_stock: number | null; // null if untracked / catalog-only
  unit?: string;
}

export interface ProductStockInfo {
  available: number | null; // null = untracked / catalog only
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CATALOG_ONLY';
  badgeText: string;
  badgeClass: string;
  isAvailable: boolean;
}

/**
 * Determine physical stock on hand using actual backend data fields:
 * 1. quantity_on_hand from /pos/invoices/retail_products/?branch_id=...
 * 2. stock_levels array for specific branch
 * 3. total_stock fallback
 * Does not calculate or invent fictitious stock values.
 */
export const getProductStockInfo = (product: Product, branchId?: string | null): ProductStockInfo => {
  let stock: number | null = null;

  // 1. Backend-computed branch-specific stock on hand (from retail_products endpoint)
  if (product.quantity_on_hand !== undefined && product.quantity_on_hand !== null) {
    stock = Number(product.quantity_on_hand);
  } else if (Array.isArray(product.stock_levels) && product.stock_levels.length > 0) {
    // 2. Branch-specific stock from stock_levels relation
    if (branchId) {
      const match = product.stock_levels.find((sl) => {
        const slBranch = typeof sl.branch === 'object' && sl.branch !== null ? (sl.branch as any).id : sl.branch;
        return String(slBranch) === String(branchId);
      });
      if (match) {
        stock = Number(match.quantity_on_hand);
      } else {
        // When branch is specific and product has stock_levels for other branches but not this branch,
        // it means 0 units exist at this branch!
        stock = 0;
      }
    } else {
      if (product.total_stock !== undefined && product.total_stock !== null) {
        stock = Number(product.total_stock);
      } else {
        stock = product.stock_levels.reduce((sum, sl) => sum + (Number(sl.quantity_on_hand) || 0), 0);
      }
    }
  } else if (product.total_stock !== undefined && product.total_stock !== null) {
    // 3. Fallback to total_stock
    stock = Number(product.total_stock);
  }

  // If product is genuinely untracked in inventory
  if (stock === null) {
    return {
      available: null,
      status: 'CATALOG_ONLY',
      badgeText: 'Catalog Item',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      isAvailable: true,
    };
  }

  // Out of Stock (0 or less)
  if (stock <= 0) {
    return {
      available: 0,
      status: 'OUT_OF_STOCK',
      badgeText: 'Out of Stock (0)',
      badgeClass: 'bg-red-50 text-[#DC2626] dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800/40',
      isAvailable: false,
    };
  }

  // Low Stock condition
  const threshold = product.low_stock_threshold || 5;
  const isLow = product.is_low_stock ?? (stock <= threshold);

  if (isLow) {
    return {
      available: stock,
      status: 'LOW_STOCK',
      badgeText: `Low Stock: ${stock}`,
      badgeClass: 'bg-amber-50 text-[#D97706] dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
      isAvailable: true,
    };
  }

  // In Stock
  return {
    available: stock,
    status: 'IN_STOCK',
    badgeText: `In Stock: ${stock}`,
    badgeClass: 'bg-[#F0FDF4] text-[#5C9764] dark:bg-[#142A1D] dark:text-[#7DB585] border-[#5C9764]/30',
    isAvailable: true,
  };
};

export type PosWorkflowStep = 1 | 2 | 3 | 4;

export const PosBillingPage: React.FC = () => {
  const { branch, salon, user } = useAuth();

  // Workflow State: 1 = Select Products, 2 = Review Bill, 3 = Invoice PDF, 4 = Share Invoice
  const [currentStep, setCurrentStep] = useState<PosWorkflowStep>(1);

  // Data Catalogs via TanStack React Query (cached, branch-sensitive)
  const { data: products = [], isLoading: isProdsLoading } = useRetailProducts(branch?.id);
  const { data: customers = [], isLoading: isCustsLoading } = useClients();
  const { invalidateProducts, invalidateMetrics } = useInvalidateQueries();
  const isLoading = isProdsLoading && isCustsLoading && products.length === 0;

  // Cart & Customer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');

  // User-friendly stock error / validation message
  const [stockError, setStockError] = useState<string | null>(null);

  // Discount: type ('FIXED' | 'PERCENT') and value
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [billingNotes, setBillingNotes] = useState<string>('');
  const [waPhoneTouched, setWaPhoneTouched] = useState<boolean>(false);

  // Catalog Search & Brand Filter
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const debouncedCatalogSearch = useDebounce(catalogSearch, 200);
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Created & Finalized Invoice
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Copy Feedback Toast
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Synchronize cart items with updated branch stock levels when branch or products change
  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      setCart((prevCart) =>
        prevCart.map((item) => {
          const matchingProd = products.find((p) => p.id === item.product_id);
          if (matchingProd) {
            const stockInfo = getProductStockInfo(matchingProd, branch?.id);
            return {
              ...item,
              available_stock: stockInfo.available,
            };
          }
          return item;
        })
      );
    }
  }, [products, branch?.id]);

  // Track overstocked items in current cart
  const overstockedItems = useMemo(() => {
    return cart.filter(
      (item) => item.available_stock !== null && item.quantity > item.available_stock
    );
  }, [cart]);

  const hasStockErrors = overstockedItems.length > 0;

  // Auto-adjust overstocked items to their branch stock limits
  const handleAutoAdjustCart = () => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.available_stock !== null && item.quantity > item.available_stock) {
            return { ...item, quantity: item.available_stock };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
    setStockError(null);
  };

  // Unique Brands from products
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Retail Products with debounced search
  const filteredProducts = useMemo(() => {
    const q = debouncedCatalogSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q);
      const matchesBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    });
  }, [products, debouncedCatalogSearch, selectedBrand]);

  // Selected Customer details
  const selectedCustomerObj = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Synchronize phone with customer object if selected
  useEffect(() => {
    if (selectedCustomerObj?.phone) {
      setCustomPhone(selectedCustomerObj.phone);
    }
  }, [selectedCustomerObj]);

  // Add Product to Cart with real-time stock validation
  const addToCart = (product: Product) => {
    const stockInfo = getProductStockInfo(product, branch?.id);

    // 1. Zero stock check from backend data
    if (stockInfo.available !== null && stockInfo.available <= 0) {
      setStockError(
        `"${product.name}" is Out of Stock (Available: 0) at ${
          branch?.name || 'this branch'
        }. Please replenish inventory or select another product.`
      );
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((c) => c.product_id === product.id);

      // 2. Existing cart quantity check
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        if (stockInfo.available !== null && currentQty + 1 > stockInfo.available) {
          setStockError(
            `Cannot add more "${product.name}". Maximum available branch stock is ${stockInfo.available} (already ${currentQty} in cart).`
          );
          return prevCart;
        }

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
          available_stock: stockInfo.available,
        };
        setStockError(null);
        return updated;
      } else {
        const unitPrice = parseFloat(product.selling_price?.toString() || '0');
        setStockError(null);
        return [
          ...prevCart,
          {
            id: `item-${product.id}-${Date.now()}`,
            product_id: product.id,
            name: product.name,
            sku: product.sku || '',
            brand: product.brand || 'Salon Retail',
            unit_price: unitPrice,
            quantity: 1,
            available_stock: stockInfo.available,
            unit: product.unit || 'units',
          },
        ];
      }
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            if (delta > 0 && item.available_stock !== null && nextQty > item.available_stock) {
              setStockError(
                `Cannot increase "${item.name}". Only ${item.available_stock} available in stock at ${
                  branch?.name || 'this branch'
                }.`
              );
              return item;
            }
            if (nextQty > 0) {
              setStockError(null);
              return { ...item, quantity: nextQty };
            }
            return null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
    setStockError(null);
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'PERCENT') {
      const pct = Math.min(Math.max(val, 0), 100);
      return (subtotal * pct) / 100;
    }
    return Math.min(Math.max(val, 0), subtotal);
  }, [subtotal, discountType, discountValue]);

  // POS Form Field Validations
  const discountError = useMemo(() => {
    const val = parseFloat(discountValue);
    if (isNaN(val)) return 'Please enter a valid numeric discount.';
    if (val < 0) return 'Discount cannot be negative.';
    if (discountType === 'PERCENT' && val > 100) return 'Percentage discount cannot exceed 100%.';
    if (discountType === 'FIXED' && val > subtotal) return `Fixed discount cannot exceed subtotal (${formatINR(subtotal)}).`;
    return null;
  }, [discountValue, discountType, subtotal]);

  const waPhoneError = useMemo(() => {
    const raw = (customPhone || selectedCustomerObj?.phone || '').trim();
    if (!raw) return '10-digit mobile number is required to send WhatsApp invoice.';
    return Validation.phone(true, 'IN')(raw);
  }, [customPhone, selectedCustomerObj]);

  const taxRate = useMemo(() => {
    return Number(salon?.tax_rate || 18.0) / 100; // 18% GST default for retail cosmetics
  }, [salon?.tax_rate]);

  const taxableAmount = Math.max(subtotal - calculatedDiscount, 0);
  const taxAmount = Math.round((taxableAmount * taxRate) * 100) / 100;
  const totalAmountDue = Math.max(taxableAmount + taxAmount, 0);

  // Dynamic UPI payment URL for live QR generation
  const upiUri = useMemo(() => {
    const vpa = salon?.phone ? `${salon.phone.replace(/\D/g, '')}@okaxis` : 'ruhibeauty@okaxis';
    const payeeName = salon?.name || 'Ruhi Beauty Salon';
    const numAmount = totalAmountDue.toFixed(2);
    return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(payeeName)}&am=${numAmount}&cu=INR&tn=${encodeURIComponent('Retail Salon Bill')}`;
  }, [salon?.phone, salon?.name, totalAmountDue]);

  const upiQrImage = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
  }, [upiUri]);

  // ========================================================
  // WORKFLOW STEP TRANSITIONS
  // ========================================================

  // Step 1 -> Step 2: Review Bill
  // Important: DOES NOT create invoice yet!
  const handleGoToReview = () => {
    if (!selectedCustomerId) {
      setStockError('Please select a registered customer to proceed to review the bill.');
      return;
    }

    if (cart.length === 0) {
      setStockError('Please select at least one retail product to add to the cart before proceeding.');
      return;
    }

    if (hasStockErrors) {
      const firstOver = overstockedItems[0];
      setStockError(
        `Insufficient stock for "${firstOver.name}". Available: ${firstOver.available_stock}, Requested: ${firstOver.quantity}. Please adjust quantities to proceed.`
      );
      return;
    }

    setStockError(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3: Create & Finalize Invoice, Generate PDF
  const handleGenerateInvoicePdf = async () => {
    if (cart.length === 0) return;

    if (discountError) {
      setStockError(discountError);
      return;
    }

    if (hasStockErrors) {
      const firstOver = overstockedItems[0];
      setStockError(
        `Insufficient stock for "${firstOver.name}". Available: ${firstOver.available_stock}, Requested: ${firstOver.quantity}.`
      );
      return;
    }

    setIsProcessing(true);
    setStockError(null);

    try {
      // 1. Create Invoice via backend POST /pos/invoices/
      const invoicePayload = {
        branch: branch?.id,
        customer: selectedCustomerId || null,
        discount_type: discountType === 'PERCENT' ? 'PERCENTAGE' : 'FIXED',
        discount_value: parseFloat(discountValue) || 0,
        discount_amount: calculatedDiscount,
        notes: billingNotes.trim() || undefined,
        items: cart.map((item) => ({
          item_type: 'PRODUCT',
          product: item.product_id,
          product_id: item.product_id,
          service: null,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: 0,
        })),
      };

      const createdInvoice = await api.post<Invoice>('/pos/invoices/', invoicePayload);

      // 2. Record payment immediately to officially finalize transaction
      let paidInvoice = createdInvoice;
      try {
        paidInvoice = await api.post<Invoice>(
          `/pos/invoices/${createdInvoice.id}/record_payment/`,
          {
            amount: createdInvoice.total_amount,
            payment_method: paymentMethod,
            transaction_reference: `POS-${paymentMethod}-${Date.now()}`,
          }
        );
      } catch {
        // If payment record has an issue, invoice is still created
      }

      // 3. Invalidate caches and refresh latest inventory stock
      clearApiCache('/pos/');
      clearApiCache('/inventory/');
      clearApiCache('/analytics/metrics/');
      invalidateProducts();
      invalidateMetrics();

      setCompletedInvoice(paidInvoice);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      invalidateProducts();
      const data = err?.response?.data;
      let msg = data?.detail || data?.message || err?.message || 'Failed to generate invoice.';
      if (typeof data === 'object' && !data?.detail && !data?.message) {
        msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ');
      }
      if (msg.includes('Insufficient stock')) {
        msg = `${msg} Please update inventory before billing.`;
      }
      setStockError(`Server Error (${err?.response?.status || '500'}): ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3 Actions: Print / Save as PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Step 4 Actions: Format Text & Sharing Helpers
  const getFormattedInvoiceText = () => {
    if (!completedInvoice) return '';
    const salonName = salon?.name || 'Ruhi Beauty Salon';
    const invNo = completedInvoice.invoice_number;
    const invDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const custName = selectedCustomerObj?.full_name || 'Valued Guest';

    const itemsText = cart
      .map(
        (it) =>
          `• ${it.name} x ${it.quantity} = ${formatINR(it.unit_price * it.quantity)}`
      )
      .join('\n');

    return `*Tax Invoice from ${salonName}*
------------------------------
Invoice No: ${invNo}
Date: ${invDate}
Customer: ${custName}
------------------------------
*Items Purchased:*
${itemsText}
------------------------------
Subtotal: ${formatINR(subtotal)}
Discount: -${formatINR(calculatedDiscount)}
GST (${salon?.tax_rate || 18}%): ${formatINR(taxAmount)}
*Grand Total: ${formatINR(completedInvoice.total_amount)} (${paymentMethod})*
Status: PAID
------------------------------
Thank you for shopping with ${salonName}! We look forward to pampering you again soon.`;
  };

  const handleShareWhatsApp = () => {
    setWaPhoneTouched(true);
    const rawPhone = (customPhone || selectedCustomerObj?.phone || '').trim();
    const err = Validation.phone(true, 'IN')(rawPhone);
    if (err) {
      return;
    }
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(getFormattedInvoiceText());
    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${completedInvoice?.invoice_number} - ${salon?.name || 'Ruhi Beauty Salon'}`,
          text: getFormattedInvoiceText(),
        });
      } catch {
        // User cancelled or closed share dialog
      }
    } else {
      handleCopyInvoiceSummary();
    }
  };

  const handleCopyInvoiceSummary = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedInvoiceText());
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // Clipboard fallback
    }
  };

  const handleCopyInvoiceLink = async () => {
    try {
      const link = window.location.href;
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Clipboard fallback
    }
  };

  const handleShareEmail = () => {
    const email = selectedCustomerObj?.email || '';
    const subject = encodeURIComponent(`Tax Invoice ${completedInvoice?.invoice_number} - ${salon?.name || 'Ruhi Beauty Salon'}`);
    const body = encodeURIComponent(getFormattedInvoiceText());
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Reset Everything for Next Transaction
  const handleStartNewSale = () => {
    setCart([]);
    setSelectedCustomerId('');
    setCustomPhone('');
    setDiscountValue('0');
    setBillingNotes('');
    setStockError(null);
    setCompletedInvoice(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Page Header (Hidden when printing invoice) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
            Retail Point of Sale (POS) & Billing
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            4-step retail billing workflow: Product selection, Bill review, PDF generation, and Multi-channel sharing.
          </p>
        </div>

        {/* Branch Inventory Badge & Live Stock Legend */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] rounded-xl border border-[#0A24E9]/20 shadow-xs">
            <Package className="w-3.5 h-3.5" />
            <span>Branch Inventory: <strong className="font-bold">{branch?.name || 'Himmatnagar Main Studio'}</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] px-2.5 py-1 text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#5C9764]"></span> In Stock</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D97706]"></span> Low Stock</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#DC2626]"></span> Out of Stock</span>
          </div>
        </div>
      </div>

      {/* 4-STEP WORKFLOW PROGRESS BAR (No-print) */}
      <div className="card-surface p-3 sm:p-4 no-print shadow-xs border border-[var(--border)]">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { step: 1, label: '1. Select Products', icon: ShoppingBag },
            { step: 2, label: '2. Review Bill', icon: FileCheck },
            { step: 3, label: '3. Invoice PDF', icon: FileText },
            { step: 4, label: '4. Share Invoice', icon: Share2 },
          ].map((s, idx, arr) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            const Icon = s.icon;

            return (
              <React.Fragment key={s.step}>
                <button
                  type="button"
                  disabled={
                    s.step > currentStep &&
                    (currentStep === 1 || (s.step >= 3 && !completedInvoice))
                  }
                  onClick={() => {
                    if (s.step < currentStep) {
                      setCurrentStep(s.step as PosWorkflowStep);
                    } else if (s.step === 2 && currentStep === 1 && cart.length > 0 && !hasStockErrors) {
                      setCurrentStep(2);
                    }
                  }}
                  className={`flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#0A24E9] dark:text-[#4D68FF] font-bold'
                      : isCompleted
                      ? 'text-[#5C9764] dark:text-[#7DB585] font-semibold'
                      : 'text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      isActive
                        ? 'bg-[#0A24E9] text-white ring-4 ring-[#0A24E9]/20 scale-105'
                        : isCompleted
                        ? 'bg-[#5C9764] text-white'
                        : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold">{s.label}</span>
                </button>

                {idx < arr.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      currentStep > s.step ? 'bg-[#5C9764]' : 'bg-[var(--border)]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Prominent Dismissible Stock Error Banner */}
      {stockError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start justify-between gap-3 text-xs text-[#DC2626] dark:text-red-300 animate-shake no-print">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Inventory & Stock Notice</span>
              <p className="leading-relaxed">{stockError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStockError(null)}
            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-200 transition-colors shrink-0 cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          STEP 1: PRODUCT SELECTION & ACTIVE CART
          ======================================================== */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
          {/* Left Column: Retail Product Catalog */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card-surface p-4 space-y-3 shadow-xs border border-[var(--border)]">
              {/* Search & Brand Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search retail products or SKU..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="input-field pl-9 text-xs"
                  />
                </div>

                {/* Brand Pills */}
                <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('ALL')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                      selectedBrand === 'ALL'
                        ? 'bg-[#0A24E9] text-white shadow-xs'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBrand(b)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                        selectedBrand === b
                          ? 'bg-[#0A24E9] text-white shadow-xs'
                          : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              {isLoading ? (
                <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
                  Loading retail products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--text-secondary)] italic border border-[var(--border)] rounded-xl bg-[var(--surface-secondary)]/30">
                  No retail products found matching "{catalogSearch}".
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto p-1">
                  {filteredProducts.map((prod) => {
                    const stockInfo = getProductStockInfo(prod, branch?.id);
                    const cartItem = cart.find((i) => i.product_id === prod.id);
                    const inCartQty = cartItem ? cartItem.quantity : 0;
                    const isOut = !stockInfo.isAvailable;
                    const isMaxInCart = stockInfo.available !== null && inCartQty >= stockInfo.available;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          if (!isOut && !isMaxInCart) {
                            addToCart(prod);
                          } else if (isOut) {
                            setStockError(
                              `"${prod.name}" is currently Out of Stock at ${branch?.name || 'this branch'}. Available inventory is 0.`
                            );
                          } else if (isMaxInCart) {
                            setStockError(
                              `Cannot add more "${prod.name}". All available branch stock (${stockInfo.available}) is already in your cart.`
                            );
                          }
                        }}
                        className={`p-3 border rounded-xl text-left transition-all flex flex-col justify-between group ${
                          isOut
                            ? 'opacity-85 border-slate-300 dark:border-slate-700 bg-[var(--surface-secondary)]/70 cursor-not-allowed'
                            : isMaxInCart
                            ? 'border-amber-200 dark:border-amber-900/40 hover:border-amber-400 bg-amber-50/10 cursor-pointer'
                            : 'bg-[var(--surface-secondary)]/50 border-[var(--border)] hover:border-[#2868ff]/50 hover:bg-[#EEF2FF] dark:hover:bg-[#1E294B]/30 active:scale-[0.98] cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[10px] uppercase tracking-wider mb-1">
                            {prod.brand && prod.brand.toLowerCase() !== 'retail' ? (
                              <span className="font-bold text-[#059669] dark:text-[#10B981] truncate max-w-[55%]">
                                {prod.brand}
                              </span>
                            ) : prod.category_name ? (
                              <span className="font-medium text-[var(--text-secondary)] truncate max-w-[55%]">
                                {prod.category_name}
                              </span>
                            ) : (
                              <span></span>
                            )}
                            {/* Live Backend Stock Badge */}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${stockInfo.badgeClass}`}>
                              {stockInfo.badgeText}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-[var(--text-primary)] mt-1 line-clamp-2 leading-tight">
                            {prod.name}
                          </p>
                          {prod.sku && (
                            <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                              SKU: {prod.sku}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                              {formatINR(prod.selling_price || 0)}
                            </span>
                            {inCartQty > 0 && (
                              <span className="text-[10px] font-semibold text-[#0A24E9] dark:text-[#4D68FF]">
                                In cart: {inCartQty}
                              </span>
                            )}
                          </div>

                          {isOut ? (
                            <span
                              title="Out of physical stock at selected branch"
                              className="px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-[#DC2626] dark:bg-red-950/60 dark:text-red-300 flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" /> Out
                            </span>
                          ) : isMaxInCart ? (
                            <span
                              title={`Maximum available branch stock reached (${stockInfo.available})`}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1"
                            >
                              Max
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(prod);
                              }}
                              className="w-6 h-6 rounded-lg bg-[#0A24E9]/10 group-hover:bg-[#0A24E9] text-[#0A24E9] group-hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Add to cart"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Step 1 - Cart & Discount */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card-surface p-5 flex flex-col shadow-xs border border-[var(--border)]">
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#0A24E9] dark:text-[#4D68FF]" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Active POS Cart
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Overstocked warning & 1-click Auto-Adjust Banner */}
              {hasStockErrors && (
                <div className="my-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-2 text-xs text-[#D97706] dark:text-amber-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Items exceed branch stock</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAdjustCart}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#D97706] hover:bg-[#B45309] text-white transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    Auto-Adjust All
                  </button>
                </div>
              )}

              {/* Customer Selector - Required registered customer */}
              <div className="my-3 space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Bill To Client <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  searchable
                  placeholder="Select a registered customer..."
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.full_name,
                    sublabel: c.phone,
                  }))}
                  size="sm"
                />
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto max-h-[280px] divide-y divide-[var(--border)] my-2 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-secondary)] italic">
                    Cart is empty. Click any retail product from the catalog on the left to add it.
                  </div>
                ) : (
                  cart.map((item) => {
                    const isOverstocked = item.available_stock !== null && item.quantity > item.available_stock;
                    const isAtMax = item.available_stock !== null && item.quantity >= item.available_stock;

                    return (
                      <div
                        key={item.id}
                        className={`py-2.5 px-2 rounded-xl transition-all ${
                          isOverstocked
                            ? 'bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40'
                            : 'hover:bg-[var(--surface-secondary)]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between text-xs gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-secondary)]">
                              <span className="tabular-nums font-semibold">{formatINR(item.unit_price)} each</span>
                              <span>·</span>
                              {item.available_stock !== null ? (
                                <span
                                  className={`font-semibold ${
                                    item.available_stock <= 0
                                      ? 'text-[#DC2626]'
                                      : item.available_stock <= 5
                                      ? 'text-[#D97706]'
                                      : 'text-[#5C9764] dark:text-[#7DB585]'
                                  }`}
                                >
                                  {item.available_stock} available
                                </span>
                              ) : (
                                <span className="text-[var(--text-secondary)]">Catalog item</span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:scale-95 transition-all cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-[var(--text-primary)] w-5 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isAtMax}
                              onClick={() => updateQuantity(item.id, 1)}
                              className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold transition-all ${
                                isAtMax
                                  ? 'opacity-35 cursor-not-allowed border-[var(--border)] text-[var(--text-secondary)]'
                                  : 'border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:scale-95 cursor-pointer'
                              }`}
                              title={isAtMax ? `Maximum available branch stock is ${item.available_stock}` : 'Increase quantity'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right pl-2 shrink-0">
                            <p className="font-bold text-[var(--text-primary)] tabular-nums">
                              {formatINR(item.unit_price * item.quantity)}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              title="Remove item from cart"
                              aria-label={`Remove ${item.name}`}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors inline-flex items-center justify-center cursor-pointer mt-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Overstocked warning message & 1-click Set to Max button */}
                        {isOverstocked && (
                          <div className="mt-2 pt-1.5 border-t border-red-200 dark:border-red-900/50 flex items-center justify-between text-[11px] text-[#DC2626] dark:text-red-300">
                            <span className="flex items-center gap-1 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Exceeds branch stock ({item.available_stock} available)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.available_stock !== null && item.available_stock > 0) {
                                  setCart((prev) =>
                                    prev.map((i) =>
                                      i.id === item.id ? { ...i, quantity: item.available_stock! } : i
                                    )
                                  );
                                } else {
                                  removeFromCart(item.id);
                                }
                              }}
                              className="font-bold underline hover:text-red-700 dark:hover:text-red-100 cursor-pointer ml-2 shrink-0"
                            >
                              {item.available_stock !== null && item.available_stock > 0
                                ? `Set to Max (${item.available_stock})`
                                : 'Remove Item'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Discount & Calculations */}
              <div className="pt-3 border-t border-[var(--border)] space-y-2.5 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatINR(subtotal)}
                  </span>
                </div>

                {/* Discount Input & Type Selector */}
                <div className="p-2.5 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                      Order Discount
                    </span>
                    <div className="flex rounded-[12px] border border-[var(--border)] p-0.5 bg-[var(--surface)] text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setDiscountType('FIXED')}
                        className={`px-2.5 py-1 rounded-[10px] transition-all cursor-pointer ${
                          discountType === 'FIXED'
                            ? 'bg-[#2868ff] text-white shadow-xs'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        ₹ Fixed
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('PERCENT')}
                        className={`px-2.5 py-1 rounded-[10px] transition-all cursor-pointer ${
                          discountType === 'PERCENT'
                            ? 'bg-[#2868ff] text-white shadow-xs'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        % Percent
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className={`input-field text-right !py-1 text-xs tabular-nums ${discountError ? 'input-error' : ''}`}
                    />
                    <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
                      = -{formatINR(calculatedDiscount)}
                    </span>
                  </div>
                  {discountError && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium pt-0.5">
                      {discountError}
                    </p>
                  )}
                </div>

                {/* GST */}
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Estimated GST ({salon?.tax_rate || 18}%)</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatINR(taxAmount)}
                  </span>
                </div>

                {/* Total Due */}
                <div className="flex justify-between items-center text-sm font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
                  <span>Total Payable</span>
                  <span className="text-lg font-sans font-bold text-[#5C9764] dark:text-[#7DB585] tabular-nums">
                    {formatINR(totalAmountDue)}
                  </span>
                </div>

                {/* Notes */}
                <div>
                  <input
                    type="text"
                    placeholder="Optional bill notes or customer remarks..."
                    value={billingNotes}
                    onChange={(e) => setBillingNotes(e.target.value)}
                    className="input-field !py-1.5 text-xs"
                  />
                </div>

                {/* Informative requirements notice if customer or cart missing */}
                {(!selectedCustomerId || cart.length === 0) && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-0.5">
                      {!selectedCustomerId && <p>• Please select a registered customer to proceed.</p>}
                      {cart.length === 0 && <p>• Please add at least one retail product to cart.</p>}
                    </div>
                  </div>
                )}

                {/* STEP 1 ACTION: NEXT (Requires real client + cart items) */}
                <button
                  type="button"
                  disabled={!selectedCustomerId || cart.length === 0 || hasStockErrors}
                  onClick={handleGoToReview}
                  className={`btn-primary btn-lg w-full mt-2 font-bold shadow-md flex items-center justify-center gap-2 ${
                    !selectedCustomerId || cart.length === 0 || hasStockErrors
                      ? 'opacity-65 cursor-not-allowed bg-slate-400 dark:bg-slate-700 hover:bg-slate-400'
                      : ''
                  }`}
                >
                  <span>
                    {!selectedCustomerId
                      ? 'Select Customer to Proceed'
                      : cart.length === 0
                      ? 'Add Products to Cart to Proceed'
                      : hasStockErrors
                      ? 'Adjust Overstocked Items to Proceed'
                      : `Next: Review Bill (${formatINR(totalAmountDue)})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: BILL REVIEW & CONFIRMATION
          ======================================================== */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
          {/* Left Column: Comprehensive Bill Review */}
          <div className="lg:col-span-8 space-y-4">
            <div className="card-surface p-6 space-y-6 shadow-xs border border-[var(--border)]">
              {/* Review Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                  <span className="text-[10px] font-bold text-[#0A24E9] dark:text-[#4D68FF] uppercase tracking-wider block">
                    Step 2: Bill Review & Summary
                  </span>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
                    Verify Invoice Line Items & Pricing
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Cart</span>
                </button>
              </div>

              {/* Salon & Customer Meta Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Salon & Location
                  </span>
                  <p className="font-bold text-[var(--text-primary)] text-sm">
                    {salon?.name || 'Ruhi Beauty Salon'}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                    {branch?.name || 'Himmatnagar Main Studio'}
                    {branch?.address ? ` · ${branch.address}` : ''}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[11px]">
                    Phone: {branch?.phone || salon?.phone || '+91 98250 12345'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Billed To Customer
                  </span>
                  <p className="font-bold text-[var(--text-primary)] text-sm">
                    {selectedCustomerObj?.full_name || 'Walk-in Guest / Retail Customer'}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[11px]">
                    Phone: {selectedCustomerObj?.phone || customPhone || 'Walk-in'}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[11px]">
                    Email: {selectedCustomerObj?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Selected Products Table */}
              <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-[var(--border)]">
                  <thead className="bg-[var(--surface-secondary)] font-bold text-[var(--text-secondary)] text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Name & SKU</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                    {cart.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                        <td className="py-3 px-3 text-[var(--text-secondary)]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-[var(--text-primary)]">{item.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] mt-0.5">
                            <span>{item.brand}</span>
                            {item.sku && <span>· SKU: {item.sku}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[var(--text-primary)] tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[var(--text-secondary)]">
                          {formatINR(item.unit_price)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[var(--text-primary)] tabular-nums">
                          {formatINR(item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)] text-xs max-w-sm ml-auto">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(subtotal)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-[#DC2626]">
                    <span>Discount:</span>
                    <span className="font-semibold tabular-nums">-{formatINR(calculatedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Net Taxable Amount:</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>GST ({salon?.tax_rate || 18}%):</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
                  <span>Final Payable:</span>
                  <span className="text-[#5C9764] dark:text-[#7DB585] tabular-nums font-extrabold text-lg">
                    {formatINR(totalAmountDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Method Selection & Generate PDF Button */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card-surface p-5 space-y-4 shadow-xs border border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Payment Method
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Choose payment collection method for this bill:
                </p>
              </div>

              {/* Payment Method Pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: <QrCode className="w-4 h-4 text-[#0A24E9]" /> },
                  { id: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4 text-[#5C9764]" /> },
                  { id: 'CARD', label: 'Card / POS', icon: <CreditCard className="w-4 h-4 text-[#0284C7]" /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] text-[var(--text-primary)] ring-2 ring-[#0A24E9]/30'
                        : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic UPI QR Code Box */}
              {paymentMethod === 'UPI' && (
                <div className="p-3.5 bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border)] text-center space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A24E9] dark:text-[#4D68FF] block">
                    Instant Scan to Pay via UPI
                  </span>
                  <div className="w-44 h-44 bg-white p-2.5 rounded-xl shadow-xs mx-auto border border-[#CACED6] flex items-center justify-center">
                    <img
                      src={upiQrImage}
                      alt="UPI Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    Compatible with Google Pay, PhonePe, Paytm & BHIM
                  </p>
                </div>
              )}

              {/* STEP 2 ACTION: GENERATE PDF */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleGenerateInvoicePdf}
                  className="btn-primary btn-lg w-full font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isProcessing ? 'Generating Invoice...' : 'Generate PDF'}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary w-full text-xs font-semibold py-2 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Edit Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 3: INVOICE PDF & PREVIEW
          ======================================================== */}
      {currentStep === 3 && completedInvoice && (
        <div className="space-y-6">
          {/* Top Actions Bar (No-print) */}
          <div className="card-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-[var(--border)] no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#5C9764]" />
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Invoice Created & Generated Successfully
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Official Invoice: <strong>{completedInvoice.invoice_number}</strong> · Paid via {paymentMethod}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="btn-secondary px-3 py-2 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Download / Print PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Invoice →</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewSale}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer"
              >
                New Sale
              </button>
            </div>
          </div>

          {/* Printable A4 Invoice Document Card */}
          <div className="max-w-3xl mx-auto bg-white text-[#29315D] p-8 sm:p-12 rounded-2xl shadow-card border border-[#CACED6] space-y-6 print-area font-sans">
            {/* Invoice Top Brand Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0A24E9] text-white font-extrabold text-lg flex items-center justify-center">
                    R
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-[#29315D] tracking-tight">
                      {salon?.name || 'Ruhi Beauty Salon'}
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {salon?.tagline || 'Your Beauty, Our Passion'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 pt-2 leading-relaxed max-w-sm">
                  {branch?.address || salon?.address || 'Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001'}
                </p>
                <p className="text-xs text-gray-600">
                  Phone: {branch?.phone || salon?.phone || '+91 98250 12345'} · Email: {salon?.email || 'hello@ruhibeauty.local'}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-[#EEF2FF] text-[#0A24E9] border border-[#0A24E9]/20 uppercase tracking-wider">
                  Tax Invoice
                </span>
                <p className="text-xs font-bold text-[#29315D] pt-1">
                  Invoice #: <span className="font-mono text-sm">{completedInvoice.invoice_number}</span>
                </p>
                <p className="text-xs text-gray-600">
                  Date: {new Date(completedInvoice.created_at || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-600">
                  Cashier: {user?.full_name || user?.first_name || 'Front Desk'}
                </p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider mt-1">
                  Status: PAID ({paymentMethod})
                </span>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Billed To Customer
                </span>
                <p className="font-bold text-[#29315D] text-sm mt-0.5">
                  {selectedCustomerObj?.full_name || 'Retail Walk-in Customer'}
                </p>
                <p className="text-gray-600">
                  Phone: {selectedCustomerObj?.phone || customPhone || 'Walk-in'}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Branch Studio
                </span>
                <p className="font-bold text-[#29315D]">
                  {branch?.name || 'Himmatnagar Main Studio'}
                </p>
                <p className="text-gray-600">
                  City: {branch?.city || 'Himmatnagar'}
                </p>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs divide-y divide-gray-200">
                <thead className="bg-gray-100 text-gray-700 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white text-gray-800">
                  {cart.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#29315D]">{item.name}</p>
                        <span className="text-[10px] text-gray-500">{item.brand}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-600">{item.sku || '—'}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#29315D] tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-gray-700">
                        {formatINR(item.unit_price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#29315D] tabular-nums">
                        {formatINR(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-800">Payment Terms & Notes:</p>
                <p>All cosmetics and beauty products sold are 100% genuine and verified.</p>
                <p>Tax invoice generated electronically under Indian GST regulations.</p>
                {billingNotes && <p className="italic">Note: "{billingNotes}"</p>}
              </div>

              <div className="space-y-2 text-xs w-full sm:w-64">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#29315D] tabular-nums">{formatINR(subtotal)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-semibold tabular-nums">-{formatINR(calculatedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Value:</span>
                  <span className="font-semibold text-[#29315D] tabular-nums">{formatINR(taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST ({salon?.tax_rate || 18}%):</span>
                  <span className="font-semibold text-[#29315D] tabular-nums">{formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#29315D] pt-2 border-t-2 border-[#29315D]">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700 tabular-nums">{formatINR(completedInvoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Footer Thank You */}
            <div className="text-center pt-6 border-t border-dashed border-gray-300 space-y-1">
              <p className="text-xs font-bold text-[#29315D]">
                Thank you for visiting {salon?.name || 'Ruhi Beauty Salon'}!
              </p>
              <p className="text-[11px] text-gray-500">
                For customer support or appointments, call {salon?.phone || '+91 98250 12345'} or visit us again soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 4: SHARE INVOICE
          ======================================================== */}
      {currentStep === 4 && completedInvoice && (
        <div className="max-w-2xl mx-auto space-y-6 no-print">
          {/* Header Card */}
          <div className="card-surface p-6 shadow-xs border border-[var(--border)] text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#5C9764]/10 text-[#5C9764] flex items-center justify-center mx-auto">
              <Share2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Share Invoice with Customer
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Invoice <strong>{completedInvoice.invoice_number}</strong> for{' '}
              <strong className="text-[#5C9764]">{formatINR(completedInvoice.total_amount)}</strong> has been generated. Choose your preferred delivery method below:
            </p>
          </div>

          {/* Share Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp Share Card */}
            <div className="card-surface p-5 space-y-3 shadow-xs border border-[var(--border)] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <MessageSquare className="w-5 h-5" />
                  <span>WhatsApp Share</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Sends an instant formatted invoice breakdown to the client's WhatsApp phone number.
                </p>
                <div>
                  <FormField
                    id="waPhone"
                    label="Customer WhatsApp Number"
                    required
                    error={waPhoneError}
                    touched={waPhoneTouched}
                  >
                    <input
                      id="waPhone"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={customPhone}
                      onChange={(e) => {
                        setCustomPhone(e.target.value);
                        if (waPhoneTouched) setWaPhoneTouched(true);
                      }}
                      onBlur={() => setWaPhoneTouched(true)}
                      className={`input-field text-xs ${waPhoneTouched && waPhoneError ? 'input-error' : ''}`}
                    />
                  </FormField>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] italic bg-[var(--surface-secondary)] p-2 rounded-lg border border-[var(--border)]">
                  💡 Note: WhatsApp will open with the invoice text. To attach the PDF file, download it first using the PDF button below and attach it in the chat.
                </p>
              </div>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Chat</span>
              </button>
            </div>

            {/* Native Device Share Card */}
            <div className="card-surface p-5 space-y-3 shadow-xs border border-[var(--border)] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#0A24E9] dark:text-[#4D68FF] font-bold text-sm">
                  <Share2 className="w-5 h-5" />
                  <span>Device Share / AirDrop</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Use your mobile or desktop device's native sharing sheet to share across WhatsApp, Messages, or Email.
                </p>
              </div>

              <button
                type="button"
                onClick={handleNativeShare}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via Device Sheet</span>
              </button>
            </div>

            {/* Download PDF Card */}
            <div className="card-surface p-5 space-y-3 shadow-xs border border-[var(--border)] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                  <Download className="w-5 h-5" />
                  <span>Download / Print PDF</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Generates the clean printable PDF invoice for physical printing or saving locally on your device.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Download / Print PDF</span>
              </button>
            </div>

            {/* Copy Summary Card */}
            <div className="card-surface p-5 space-y-3 shadow-xs border border-[var(--border)] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <Copy className="w-5 h-5" />
                  <span>Copy Receipt Text</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Copies formatted plain-text bill summary to your clipboard to paste anywhere.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyInvoiceSummary}
                className="btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Bill Summary'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Invoice PDF</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewSale}
              className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Start New Sale</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
