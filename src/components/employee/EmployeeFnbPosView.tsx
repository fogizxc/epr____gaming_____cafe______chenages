import React, { useState } from 'react';
import {
  Coffee,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Receipt,
  DollarSign,
  Tv,
  CreditCard,
  Wallet
} from 'lucide-react';
import { ActiveSession, FnbProduct } from '../../types';

interface EmployeeFnbPosViewProps {
  products: FnbProduct[];
  activeSessions: ActiveSession[];
  preselectedSessionId?: string | null;
  onOrderSuccess: (order: any) => void;
}

export const EmployeeFnbPosView: React.FC<EmployeeFnbPosViewProps> = ({
  products,
  activeSessions,
  preselectedSessionId,
  onOrderSuccess
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'DRINKS' | 'SNACKS' | 'MEALS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: FnbProduct; quantity: number }[]>([]);

  // Destination: either attach to active session or walkin counter bill
  const [destinationType, setDestinationType] = useState<'STATION' | 'COUNTER'>(
    preselectedSessionId ? 'STATION' : 'COUNTER'
  );
  const [targetSessionId, setTargetSessionId] = useState(preselectedSessionId || (activeSessions[0]?.id || ''));
  const [counterCustomerName, setCounterCustomerName] = useState('Counter Customer');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' ? true :
      selectedCategory === 'DRINKS' ? p.category === 'DRINKS' :
      selectedCategory === 'SNACKS' ? p.category === 'SNACKS' :
      p.category === 'FOOD';
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: FnbProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: FnbProduct; quantity: number }[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      const activeSessionObj = activeSessions.find(s => s.id === targetSessionId);

      const res = await fetch('/api/employee/fnb/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: destinationType === 'STATION' ? targetSessionId : undefined,
          customerName: destinationType === 'STATION' ? activeSessionObj?.customerName : counterCustomerName,
          items: itemsPayload,
          paymentMethod
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Order placed successfully! Bill total: ₹${total}`);
        setCart([]);
        onOrderSuccess(data.data.order);
      } else {
        setErrorMsg(data.error || 'Failed to place F&B order.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error processing F&B order.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6">
      {/* Products Catalog Grid (Left 2/3) */}
      <div className="flex-1 w-full space-y-4">
        {/* Search & Categories Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {(['ALL', 'DRINKS', 'SNACKS', 'MEALS'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-black font-black'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search F&B items..."
              className="w-full sm:w-56 bg-black/40 border border-white/15 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const inCart = cart.find((c) => c.product.id === p.id);
            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="h-28 w-full rounded-xl bg-black/40 overflow-hidden mb-3 relative">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 text-white font-bold backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-white/40 line-clamp-2 mt-0.5 font-light">
                    {p.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm font-black font-mono text-emerald-400">
                    ₹{p.price}
                  </span>

                  {inCart ? (
                    <div className="flex items-center gap-1.5 bg-amber-400 text-black rounded-lg px-2 py-1 text-xs font-mono font-bold">
                      <button
                        onClick={() => updateQuantity(p.id, -1)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        -
                      </button>
                      <span>{inCart.quantity}</span>
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-black text-white transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POS Cart Sidebar (Right 1/3) */}
      <div className="w-full lg:w-80 shrink-0 p-5 rounded-3xl bg-[#0c0c0c] border border-white/15 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              POS Order Cart
            </h3>
          </div>
          <span className="text-xs font-mono text-white/50">{cart.length} items</span>
        </div>

        {/* Order Destination Selector */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block">
            Delivery Destination:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDestinationType('STATION')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition ${
                destinationType === 'STATION'
                  ? 'bg-amber-400 text-black border-amber-400'
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              Active Rig Tab
            </button>
            <button
              type="button"
              onClick={() => setDestinationType('COUNTER')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition ${
                destinationType === 'COUNTER'
                  ? 'bg-amber-400 text-black border-amber-400'
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              Walk-in Bill
            </button>
          </div>

          {destinationType === 'STATION' ? (
            <div>
              <label className="text-[10px] text-white/40 block mb-1">Select Station:</label>
              <select
                value={targetSessionId}
                onChange={(e) => setTargetSessionId(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {activeSessions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-black text-white">
                    {s.systemName} — {s.customerName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-white/40 block mb-1">Customer Identifier:</label>
              <input
                type="text"
                value={counterCustomerName}
                onChange={(e) => setCounterCustomerName(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-8 text-center text-white/30 text-xs italic">
              Cart is empty. Tap items to add.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-bold text-white truncate">{item.product.name}</div>
                  <div className="text-[10px] text-white/40 font-mono">
                    ₹{item.product.price} × {item.quantity} = ₹{item.product.price * item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-white px-1">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="w-6 h-6 rounded hover:bg-red-950/60 hover:text-red-400 flex items-center justify-center text-white/40 transition ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Method */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-1.5">
            Payment Mode:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['Cash', 'UPI', 'Card'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 rounded-lg border text-xs font-bold text-center cursor-pointer transition ${
                  paymentMethod === method
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Summary & Checkout */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm font-bold text-white">
            <span>Total:</span>
            <span className="font-mono text-emerald-400 font-black text-lg">₹{total}</span>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs">
              {successMsg}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
          >
            {isProcessing ? 'Processing Order...' : 'Complete & Print Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
