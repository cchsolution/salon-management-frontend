import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle2,
  Search,
  Scissors,
  Package,
  Printer,
  X,
  User,
  IndianRupee
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Service, Product, Customer, Invoice, PaymentMethod, StaffProfile } from '../../types';

interface CartItem {
  id: string; // unique cart uuid
  item_id: string; // service or product id
  name: string;
  type: 'SERVICE' | 'PRODUCT';
  unit_price: number;
  quantity: number;
  discount: number;
  staff_id?: string;
}

export const PosBillingPage: React.FC = () => {
  const { branch, salon } = useAuth();

  const [services, setServices] = useState<Service[]>(() => {
    const c = api.getCached<{ results?: Service[] } | Service[]>('/catalog/services/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const c = api.getCached<{ results?: Product[] } | Product[]>('/inventory/products/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const c = api.getCached<{ results?: Customer[] } | Customer[]>('/crm/clients/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [staffList, setStaffList] = useState<StaffProfile[]>(() => {
    const c = api.getCached<{ results?: StaffProfile[] } | StaffProfile[]>('/catalog/staff/');
    return Array.isArray(c) ? c : c?.results || [];
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Catalog tab & search
  const [catalogTab, setCatalogTab] = useState<'all' | 'services' | 'products'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, [branch?.id]);

  const fetchCatalog = async () => {
    try {
      const [svcRes, prodRes, custRes, staffRes] = await Promise.all([
        api.get<{ results?: Service[] } | Service[]>('/catalog/services/'),
        api.get<{ results?: Product[] } | Product[]>('/inventory/products/'),
        api.get<{ results?: Customer[] } | Customer[]>('/crm/clients/'),
        api.get<{ results?: StaffProfile[] } | StaffProfile[]>('/catalog/staff/'),
      ]);

      setServices(Array.isArray(svcRes) ? svcRes : svcRes.results || []);
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes.results || []);
      setCustomers(Array.isArray(custRes) ? custRes : custRes.results || []);
      setStaffList(Array.isArray(staffRes) ? staffRes : staffRes.results || []);
    } catch {}
  };

  const addToCart = (item: Service | Product, type: 'SERVICE' | 'PRODUCT') => {
    const existingIndex = cart.findIndex((c) => c.item_id === item.id && c.type === type);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const price = type === 'SERVICE' ? (item as Service).effective_price : (item as Product).selling_price;
      setCart([
        ...cart,
        {
          id: `${type}-${item.id}-${Date.now()}`,
          item_id: item.id,
          name: item.name,
          type,
          unit_price: parseFloat(price.toString()),
          quantity: 1,
          discount: 0,
          staff_id: type === 'SERVICE' && staffList.length > 0 ? staffList[0].id : undefined,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity - item.discount, 0);
  const taxRate = Number(salon?.tax_rate || 18.0) / 100; // 18% GST default
  const taxAmount = subtotal * taxRate;
  const totalDiscount = parseFloat(discountAmount) || 0;
  const total = Math.max(subtotal + taxAmount - totalDiscount, 0);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const invoicePayload = {
        branch: branch?.id,
        customer: selectedCustomerId || null,
        discount_amount: totalDiscount,
        notes,
        items: cart.map((item) => ({
          item_type: item.type,
          service: item.type === 'SERVICE' ? item.item_id : null,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount,
          staff: item.staff_id || null,
        })),
      };

      const createdInvoice = await api.post<Invoice>('/pos/invoices/', invoicePayload);

      const paidInvoice = await api.post<Invoice>(
        `/pos/invoices/${createdInvoice.id}/record_payment/`,
        {
          amount: createdInvoice.total_amount,
          payment_method: paymentMethod,
          transaction_reference: `POS-SALE-${Date.now()}`,
        }
      );

      setCompletedInvoice(paidInvoice);
      setCart([]);
      setIsPayModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
          Point of Sale (POS) & Checkout
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          Process walk-in clients, appointment checkouts, retail sales, and UPI/Cash/Card payments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left catalog panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-surface p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Catalog Tabs */}
              <div className="flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--surface-secondary)] w-full sm:w-auto">
                <button
                  onClick={() => setCatalogTab('all')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    catalogTab === 'all' ? 'bg-[var(--surface)] text-[#6D28D9] dark:text-[#8B5CF6] shadow-sm' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setCatalogTab('services')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    catalogTab === 'services' ? 'bg-[var(--surface)] text-[#6D28D9] dark:text-[#8B5CF6] shadow-sm' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Services
                </button>
                <button
                  onClick={() => setCatalogTab('products')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    catalogTab === 'products' ? 'bg-[var(--surface)] text-[#6D28D9] dark:text-[#8B5CF6] shadow-sm' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Retail Products
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-52">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="input-field pl-8"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto p-1">
              {(catalogTab === 'all' || catalogTab === 'services') &&
                services
                  .filter((s) => s.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map((svc) => (
                    <button
                      key={`svc-${svc.id}`}
                      onClick={() => addToCart(svc, 'SERVICE')}
                      className="p-3 bg-[var(--surface-secondary)]/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-[var(--border)] hover:border-[#6D28D9] rounded-xl text-left transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#6D28D9] dark:text-[#8B5CF6] uppercase">
                          <Scissors className="w-3 h-3" /> Service
                        </span>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1 line-clamp-2">{svc.name}</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">{svc.duration_minutes} mins</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">₹{Number(svc.effective_price).toLocaleString('en-IN')}</span>
                        <Plus className="w-3.5 h-3.5 text-[#6D28D9] group-hover:scale-125 transition-transform" />
                      </div>
                    </button>
                  ))}

              {(catalogTab === 'all' || catalogTab === 'products') &&
                products
                  .filter((p) => p.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map((prod) => (
                    <button
                      key={`prod-${prod.id}`}
                      onClick={() => addToCart(prod, 'PRODUCT')}
                      className="p-3 bg-[var(--surface-secondary)]/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-[var(--border)] hover:border-[#059669] rounded-xl text-left transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#059669] dark:text-[#10B981] uppercase">
                          <Package className="w-3 h-3" /> Retail
                        </span>
                        <p className="text-xs font-bold text-[var(--text-primary)] mt-1 line-clamp-2">{prod.name}</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">{prod.brand || 'Salon Care'}</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">₹{Number(prod.selling_price).toLocaleString('en-IN')}</span>
                        <Plus className="w-3.5 h-3.5 text-[#059669] group-hover:scale-125 transition-transform" />
                      </div>
                    </button>
                  ))}
            </div>
          </div>
        </div>

        {/* Right POS Cart & Totals (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-surface p-5 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#6D28D9] dark:text-[#8B5CF6]" />
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Current Sale</h3>
              </div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{cart.length} items</span>
            </div>

            {/* Customer Picker */}
            <div className="my-3">
              <label className="block text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1">
                Client (Optional)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="input-field text-xs"
              >
                <option value="">Walk-in Guest</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone}) - {c.loyalty_points} pts
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-[280px] divide-y divide-[var(--border)] my-2">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
                  Cart is empty. Select services or products from the catalog.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[var(--text-secondary)]">₹{item.unit_price} each</span>
                        {item.type === 'SERVICE' && (
                          <select
                            value={item.staff_id || ''}
                            onChange={(e) => {
                              const updated = cart.map((c) =>
                                c.id === item.id ? { ...c, staff_id: e.target.value } : c
                              );
                              setCart(updated);
                            }}
                            className="text-[10px] bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-1"
                          >
                            {staffList.map((stf) => (
                              <option key={stf.id} value={stf.id}>
                                {stf.user_details?.full_name?.split(' ')[0] || stf.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                      >
                        -
                      </button>
                      <span className="font-semibold text-[var(--text-primary)] w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-[var(--text-primary)]">₹{(item.unit_price * item.quantity).toFixed(2)}</p>
                      <button
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

            {/* Calculations & Checkout */}
            <div className="pt-3 border-t border-[var(--border)] space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--text-primary)]">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Estimated GST ({salon?.tax_rate || 18}%)</span>
                <span className="font-semibold text-[var(--text-primary)]">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Discount (₹)</span>
                <input
                  type="number"
                  step="1"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-20 px-2 py-0.5 text-right border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] rounded focus:outline-none"
                />
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
                <span>Total Due</span>
                <span className="text-[#059669] dark:text-[#10B981]">₹{total.toFixed(2)}</span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => setIsPayModalOpen(true)}
                className="btn-primary w-full py-3 text-sm mt-3"
              >
                Proceed to Payment (₹{total.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-5">
            <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
              Collect Payment (₹{total.toFixed(2)})
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR' },
                  { id: 'CASH', label: 'Cash' },
                  { id: 'CARD', label: 'Card' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-3 text-xs font-bold rounded-xl border transition-colors ${
                      paymentMethod === m.id
                        ? 'bg-[#6D28D9] text-white border-[#6D28D9] shadow-sm'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] border-[var(--border)] hover:border-[#6D28D9]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompleteSale}
                className="btn-secondary"
              >
                {isProcessing ? 'Processing...' : 'Complete & Record Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Invoice & Receipt Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
              Payment Completed!
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Invoice #{completedInvoice.invoice_number} has been settled and recorded.
            </p>

            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl text-xs space-y-1 text-left border border-[var(--border)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Amount Paid:</span>
                <span className="font-bold text-[#059669] dark:text-[#10B981]">₹{completedInvoice.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Date:</span>
                <span className="text-[var(--text-primary)]">{new Date().toLocaleTimeString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Status:</span>
                <span className="text-[#059669] dark:text-[#10B981] font-semibold">{completedInvoice.status}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="btn-ghost flex-1 border border-[var(--border)]"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="btn-primary flex-1"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
