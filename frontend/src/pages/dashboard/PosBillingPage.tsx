import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
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
  Banknote
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product, Customer, Invoice, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/currency';
import { CustomSelect } from '../../components/ui/CustomSelect';

interface CartItem {
  id: string; // unique cart uuid
  product_id: string;
  name: string;
  sku: string;
  brand: string;
  unit_price: number;
  quantity: number;
  available_stock: number;
}

export const PosBillingPage: React.FC = () => {
  const { branch, salon } = useAuth();

  // Data Catalogs
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cart & Customer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);

  // Discount: type ('FIXED' | 'PERCENT') and value
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [billingNotes, setBillingNotes] = useState<string>('');

  // Catalog Search & Brand Filter
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  // Checkout Steps
  // Step 1: Cart & Discount (default main view)
  // Step 2: Payment & QR Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [qrCodeData, setQrCodeData] = useState<{ qr_image?: string; upi_string?: string } | null>(null);
  const [isQrLoading, setIsQrLoading] = useState<boolean>(false);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);

  // Step 3: Generated Bill & Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Load retail products only and clients
  useEffect(() => {
    fetchCatalog();
  }, [branch?.id]);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      // First attempt to fetch dedicated retail products endpoint
      let prods: Product[] = [];
      try {
        const res = await api.get<{ results?: Product[] } | Product[]>('/pos/invoices/retail_products/');
        prods = Array.isArray(res) ? res : res.results || [];
      } catch {
        // Fallback to inventory products filtered by is_retail
        const res = await api.get<{ results?: Product[] } | Product[]>('/inventory/products/');
        const allProds = Array.isArray(res) ? res : res.results || [];
        prods = allProds.filter((p) => p.is_retail !== false);
      }

      const custRes = await api.get<{ results?: Customer[] } | Customer[]>('/crm/clients/');
      const custs = Array.isArray(custRes) ? custRes : custRes.results || [];

      setProducts(prods);
      setCustomers(custs);
    } catch (err: any) {
      console.error('Failed to load POS catalog data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Unique Brands from products
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Retail Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.brand?.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    });
  }, [products, catalogSearch, selectedBrand]);

  // Selected Customer details
  const selectedCustomerObj = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Add Product to Cart
  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((c) => c.product_id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const unitPrice = parseFloat(product.selling_price?.toString() || '0');
      setCart([
        ...cart,
        {
          id: `item-${product.id}-${Date.now()}`,
          product_id: product.id,
          name: product.name,
          sku: product.sku || '',
          brand: product.brand || 'Salon Retail',
          unit_price: unitPrice,
          quantity: 1,
          available_stock: product.total_stock ?? 999,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  // Calculations
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

  const taxRate = useMemo(() => {
    return Number(salon?.tax_rate || 18.0) / 100; // 18% GST default for retail cosmetics
  }, [salon?.tax_rate]);

  const taxableAmount = Math.max(subtotal - calculatedDiscount, 0);
  const taxAmount = taxableAmount * taxRate;
  const totalAmountDue = Math.max(taxableAmount + taxAmount, 0);

  // Step 2: Open Payment Modal & Create Pending Draft Invoice / QR Code
  const handleInitiatePayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
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

      const created = await api.post<Invoice>('/pos/invoices/', invoicePayload);
      setPendingInvoice(created);
      setIsPayModalOpen(true);

      // If default method is UPI, fetch or generate QR code
      if (paymentMethod === 'UPI') {
        fetchQrCode(created.id, created.total_amount);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initialize sale invoice.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch or construct dynamic QR Code for invoice
  const fetchQrCode = async (invoiceId: string, amount: string | number) => {
    setIsQrLoading(true);
    try {
      const qrRes = await api.get<{ qr_image?: string; upi_string?: string }>(
        `/pos/invoices/${invoiceId}/payment_qr/`
      );
      setQrCodeData(qrRes);
    } catch {
      // Generate standard Indian UPI dynamic URI fallback
      const vpa = salon?.phone ? `${salon.phone}@okaxis` : 'ruhibeauty@okaxis';
      const payeeName = salon?.name || 'Ruhi Beauty Salon';
      const numAmount = Number(amount || totalAmountDue).toFixed(2);
      const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(payeeName)}&am=${numAmount}&cu=INR&tn=${encodeURIComponent(`INV-${invoiceId.slice(0, 8)}`)}`;
      setQrCodeData({
        upi_string: upiUri,
        qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`,
      });
    } finally {
      setIsQrLoading(false);
    }
  };

  // Step 2 -> 3: Record Payment & Finalize Invoice
  const handleRecordPayment = async () => {
    if (!pendingInvoice) return;
    setIsProcessing(true);
    try {
      const paidInvoice = await api.post<Invoice>(
        `/pos/invoices/${pendingInvoice.id}/record_payment/`,
        {
          amount: pendingInvoice.total_amount,
          payment_method: paymentMethod,
          transaction_reference: `POS-${paymentMethod}-${Date.now()}`,
        }
      );

      // Invalidate relevant caches
      clearApiCache('/pos/');
      clearApiCache('/inventory/');
      clearApiCache('/analytics/metrics/');

      setCompletedInvoice(paidInvoice);
      setPendingInvoice(null);
      setIsPayModalOpen(false);
      setCart([]);
      setDiscountValue('0');
      setBillingNotes('');
      setSelectedCustomerId('');
    } catch (err: any) {
      alert(err.message || 'Failed to record payment on invoice.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3 Actions: Share WhatsApp / Email
  const getShareReceiptText = () => {
    if (!completedInvoice) return '';
    return `Thank you for shopping at ${salon?.name || 'Ruhi Beauty Salon'}!%0A%0A*Invoice #:* ${completedInvoice.invoice_number}%0A*Total Paid:* ₹${completedInvoice.total_amount}%0A*Date:* ${new Date().toLocaleDateString('en-IN')}%0A%0AWe look forward to pampering you again soon!`;
  };

  const handleShareWhatsApp = () => {
    const phone = selectedCustomerObj?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone ? `91${cleanPhone.slice(-10)}` : ''}?text=${getShareReceiptText()}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const email = selectedCustomerObj?.email || '';
    const subject = encodeURIComponent(`Receipt for Invoice ${completedInvoice?.invoice_number}`);
    const body = encodeURIComponent(`Thank you for shopping at ${salon?.name || 'Ruhi Beauty Salon'}.\nInvoice Number: ${completedInvoice?.invoice_number}\nAmount Paid: ₹${completedInvoice?.total_amount}\n\nHave a wonderful day!`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Retail Point of Sale (POS) & Billing
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Fast checkout for retail cosmetics and hair-care products with dynamic UPI QR & GST billing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] rounded-xl border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
          <Package className="w-3.5 h-3.5" />
          <span>Retail Inventory Catalog Only</span>
        </div>
      </div>

      {/* Main Grid: Catalog (7 cols) + Cart & Checkout (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Retail Product Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-surface p-4 space-y-3">
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                    selectedBrand === 'ALL'
                      ? 'bg-[#6D28D9] text-white shadow-xs'
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                      selectedBrand === b
                        ? 'bg-[#6D28D9] text-white shadow-xs'
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
                {filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => addToCart(prod)}
                    className="p-3 bg-[var(--surface-secondary)]/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-[var(--border)] hover:border-[#6D28D9]/50 rounded-xl text-left transition-all active:scale-[0.98] group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-[#059669] dark:text-[#10B981] uppercase tracking-wider">
                        <span>{prod.brand || 'Retail'}</span>
                        <span className="text-[var(--text-secondary)] font-normal">{prod.sku || ''}</span>
                      </div>
                      <p className="text-xs font-bold text-[var(--text-primary)] mt-1 line-clamp-2 leading-tight">
                        {prod.name}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                        {formatINR(prod.selling_price || 0)}
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-[#6D28D9]/10 group-hover:bg-[#6D28D9] text-[#6D28D9] group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Step 1 - Cart & Discount */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-surface p-5 flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#6D28D9] dark:text-[#8B5CF6]" />
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                  Active POS Cart
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800/40">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Customer Selector */}
            <div className="my-3 space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Bill To Client (Optional)
              </label>
              <CustomSelect
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                searchable
                placeholder="Walk-in Guest / Retail Customer"
                options={[
                  { value: '', label: 'Walk-in Guest / Retail Customer' },
                  ...customers.map((c) => ({
                    value: c.id,
                    label: c.full_name,
                    sublabel: c.phone,
                  })),
                ]}
                size="sm"
              />
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-[260px] divide-y divide-[var(--border)] my-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-secondary)] italic">
                  Cart is empty. Select retail items from the catalog.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                        {formatINR(item.unit_price)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <span className="font-bold text-[var(--text-primary)] w-5 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right pl-2">
                      <p className="font-bold text-[var(--text-primary)] tabular-nums">
                        {formatINR(item.unit_price * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-[10px] text-[#DC2626] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
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
                  <div className="flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--surface)] text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscountType('FIXED')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        discountType === 'FIXED'
                          ? 'bg-[#6D28D9] text-white'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      ₹ Fixed
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        discountType === 'PERCENT'
                          ? 'bg-[#6D28D9] text-white'
                          : 'text-[var(--text-secondary)]'
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
                    className="input-field text-right !py-1 text-xs tabular-nums"
                  />
                  <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
                    = -{formatINR(calculatedDiscount)}
                  </span>
                </div>
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
                <span className="text-lg font-serif text-[#059669] dark:text-[#10B981] tabular-nums">
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

              {/* Proceed to Payment Button */}
              <button
                type="button"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleInitiatePayment}
                className="btn-primary btn-lg w-full mt-2 font-bold shadow-md flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Payment ({formatINR(totalAmountDue)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: PAYMENT & QR MODAL */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                  Step 2: Collect Payment
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Amount Due: <strong className="text-[#059669] dark:text-[#10B981]">{formatINR(totalAmountDue)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-secondary)]"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: <QrCode className="w-5 h-5 text-[#6D28D9]" /> },
                  { id: 'CASH', label: 'Cash', icon: <Banknote className="w-5 h-5 text-[#059669]" /> },
                  { id: 'CARD', label: 'Card / POS', icon: <CreditCard className="w-5 h-5 text-[#0284C7]" /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id === 'UPI' && pendingInvoice && !qrCodeData) {
                        fetchQrCode(pendingInvoice.id, pendingInvoice.total_amount);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === m.id
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-[#6D28D9] text-[var(--text-primary)] ring-2 ring-[#6D28D9]/30'
                        : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic UPI QR Code Display */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border)] text-center space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] dark:text-[#8B5CF6]">
                  Scan to Pay with Any UPI App
                </span>

                <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl shadow-inner border border-slate-200 flex items-center justify-center">
                  {isQrLoading ? (
                    <span className="text-xs text-slate-500 font-semibold animate-pulse">Generating QR...</span>
                  ) : qrCodeData?.qr_image ? (
                    <img
                      src={qrCodeData.qr_image}
                      alt="UPI Payment QR"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-24 h-24 text-slate-400" />
                  )}
                </div>

                <div className="text-xs text-[var(--text-secondary)]">
                  GPay · PhonePe · Paytm · BHIM · AmazonPay
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="btn-ghost btn-md"
              >
                Back to Cart
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRecordPayment}
                className="btn-success btn-md font-bold shadow-md flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isProcessing ? 'Verifying...' : 'Confirm Payment Received'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: GENERATE BILL / TAX INVOICE RECEIPT MODAL */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                  Step 3: Bill Generated Successfully
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletedInvoice(null)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)]"
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Paper Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 print-area bg-[var(--surface)]">
              {/* Salon Brand Header */}
              <div className="text-center pb-3 border-b border-dashed border-[var(--border)] space-y-1">
                <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                  {salon?.name || 'Ruhi Beauty Salon'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {branch?.name || 'Main Studio'}, {branch?.city || 'Himmatnagar, Gujarat'}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Phone: {salon?.phone || '+91 98250 12345'} {salon?.email ? `· ${salon.email}` : ''}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--surface-secondary)] rounded border border-[var(--border)]">
                  Retail Tax Invoice
                </span>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-[var(--border)]">
                <div>
                  <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-bold">Invoice No:</span>
                  <span className="font-bold text-[var(--text-primary)]">{completedInvoice.invoice_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-bold">Date & Time:</span>
                  <span className="text-[var(--text-primary)]">
                    {new Date(completedInvoice.created_at || Date.now()).toLocaleDateString('en-IN')}{' '}
                    {new Date(completedInvoice.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-bold">Customer:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedCustomerObj ? selectedCustomerObj.full_name : 'Walk-in Guest'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-bold">Payment Mode:</span>
                  <span className="font-bold text-[#059669] dark:text-[#10B981] uppercase">{paymentMethod}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-1.5 text-xs py-2">
                <div className="flex justify-between font-bold text-[var(--text-secondary)] text-[11px] uppercase pb-1 border-b border-[var(--border)]">
                  <span>Product Item</span>
                  <span>Qty × Price</span>
                  <span className="text-right">Amount</span>
                </div>
                {completedInvoice.items && completedInvoice.items.length > 0 ? (
                  completedInvoice.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-[var(--border)]/40">
                      <span className="text-[var(--text-primary)] font-medium max-w-[200px] truncate">
                        {it.item_name}
                      </span>
                      <span className="text-[var(--text-secondary)] tabular-nums">
                        {it.quantity} × {formatINR(it.unit_price)}
                      </span>
                      <span className="font-bold text-[var(--text-primary)] tabular-nums text-right">
                        {formatINR(Number(it.unit_price) * it.quantity)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-[var(--text-secondary)] italic">Retail Purchase</div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-2 border-t border-dashed border-[var(--border)] space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">{formatINR(completedInvoice.subtotal || subtotal)}</span>
                </div>
                {Number(completedInvoice.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-[#059669]">
                    <span>Discount:</span>
                    <span className="tabular-nums font-semibold">-{formatINR(completedInvoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>GST ({salon?.tax_rate || 18}%):</span>
                  <span className="tabular-nums font-semibold">{formatINR(completedInvoice.tax_amount || taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-serif font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
                  <span>Grand Total Paid:</span>
                  <span className="text-[#059669] dark:text-[#10B981] tabular-nums">
                    {formatINR(completedInvoice.total_amount)}
                  </span>
                </div>
              </div>

              <div className="text-center pt-4 text-[10px] text-[var(--text-secondary)] border-t border-[var(--border)]">
                Thank you for your visit! Please preserve this bill for returns or exchanges within 7 days.
              </div>
            </div>

            {/* Action Bar (Print, PDF, WhatsApp, Email, Done) */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/60 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-outline btn-sm flex items-center gap-1.5 font-bold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="btn-outline btn-sm flex items-center gap-1.5 text-[#059669] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="btn-outline btn-sm flex items-center gap-1.5 text-[#0284C7] hover:bg-sky-50 dark:hover:bg-sky-950/40"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCompletedInvoice(null)}
                className="btn-primary btn-sm font-bold shadow-md"
              >
                Start New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
