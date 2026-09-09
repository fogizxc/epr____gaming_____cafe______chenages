import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import {
  Coffee,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  X,
  CreditCard
} from 'lucide-react';
export interface CafeMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  isCombo?: boolean;
}

const ARTISAN_CAFÉ_MENU: CafeMenuItem[] = [
  {
    id: 'fnb-cold-brew',
    name: 'Artisan Vanilla Nitro Cold Brew',
    category: 'Beverage',
    price: 135,
    description: '18-hour slow steeped Ethiopian single-origin roast infused with real Madagascar vanilla bean.'
  },
  {
    id: 'fnb-caramel-macchiato',
    name: 'Iced Salted Caramel Macchiato',
    category: 'Beverage',
    price: 145,
    description: 'Fresh espresso pulled over cold milk and rich buttery sea salt caramel drizzle.'
  },
  {
    id: 'fnb-redbull',
    name: 'Red Bull Energy Drink (250ml)',
    category: 'Beverage',
    price: 125,
    description: 'Chilled vitalizing can for high-focus clutch gaming rounds.'
  },
  {
    id: 'fnb-monster',
    name: 'Monster Ultra Energy (350ml)',
    category: 'Beverage',
    price: 120,
    description: 'Zero sugar, ultra white refreshing energy formulation with light citrus notes.'
  },
  {
    id: 'fnb-coke-zero',
    name: 'Coca-Cola Zero Sugar (330ml Can)',
    category: 'Beverage',
    price: 50,
    description: 'Ice cold carbonated can served with a chilled frosted glass.'
  },
  {
    id: 'fnb-burger-smash',
    name: 'Crispy Double Chicken Smash Burger',
    category: 'Food',
    price: 180,
    description: 'Crispy herb-crusted patties, melted cheddar, house secret smoky relish on toasted brioche.'
  },
  {
    id: 'fnb-panini-paneer',
    name: 'Spicy Tandoori Paneer Panini',
    category: 'Food',
    price: 155,
    description: 'Marinated cottage cheese, crunchy bell peppers, and molten mozzarella pressed golden.'
  },
  {
    id: 'fnb-flatbread',
    name: 'Artisan BBQ Chicken Flatbread',
    category: 'Food',
    price: 210,
    description: 'Woodfired stone crust flatbread with smoky chipotle chicken and mozzarella.'
  },
  {
    id: 'fnb-club-sandwich',
    name: 'Veggie Supreme Cheese Club Sandwich',
    category: 'Food',
    price: 140,
    description: 'Triple-layer toasted sandwich with sliced cucumbers, tomatoes, cheese, and mint chutney.'
  },
  {
    id: 'fnb-peri-fries',
    name: 'Crispy Peri-Peri French Fries',
    category: 'Snack',
    price: 110,
    description: 'Crispy golden potato strips tossed in African bird’s eye chili peri-peri seasoning with garlic mayo dip.'
  },
  {
    id: 'fnb-nachos',
    name: 'Loaded Cheesy Gaming Nachos',
    category: 'Snack',
    price: 150,
    description: 'Corn tortilla chips smothered in warm jalapeño cheese sauce, salsa, and sour cream.'
  },
  {
    id: 'fnb-popcorn',
    name: 'Cinema Butter Crunch Popcorn',
    category: 'Snack',
    price: 80,
    description: 'Freshly popped jumbo corn kernels tossed in golden melted butter.'
  },
  {
    id: 'fnb-combo-esports',
    name: 'Esports Duo Clutch Pack',
    category: 'Combos',
    price: 299,
    description: '1x Double Chicken Burger + 1x Peri-Peri Fries + 1x Red Bull Energy Drink (Save ₹116).',
    isCombo: true
  },
  {
    id: 'fnb-combo-night-owl',
    name: 'Night Owl Caffeinated Raid Pack',
    category: 'Combos',
    price: 249,
    description: '1x Artisan Nitro Cold Brew + 1x Loaded Nachos + 1x Salted Popcorn (Save ₹76).',
    isCombo: true
  }
];

interface CartItem extends CafeMenuItem {
  quantity: number;
}

export const FnbOrderScreen: React.FC = () => {
  const { activeSessions, walletBalance, setWalletBalance, requireLogin } = useCafe();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [destination, setDestination] = useState<string>('STATION');
  const [notes, setNotes] = useState<string>('');
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [activeCustomerOrder, setActiveCustomerOrder] = useState<any | null>(null);

  // Check if customer has an active session to deliver to
  const mySession = activeSessions.find((s) => s.status === 'ACTIVE');

  const categories = ['ALL', 'Beverage', 'Food', 'Snack', 'Combos'];

  const filteredItems = ARTISAN_CAFÉ_MENU.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'Combos') return item.isCombo;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Cart operations
  const addToCart = (item: CafeMenuItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  // Handle order submission via API
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    requireLogin(async () => {
      setIsOrdering(true);
      try {
        const res = await fetch('/api/fnb/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
            targetSystemId: mySession?.systemId || undefined,
            targetLocation: mySession ? mySession.systemName : 'Lounge Area Table 04',
            notes,
            payWithWallet: walletBalance >= total
          })
        });

        const data = await res.json();
        if (data.success) {
          if (walletBalance >= total) {
            setWalletBalance(walletBalance - total);
          }
          setActiveCustomerOrder(data.order);
          clearCart();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsOrdering(false);
      }
    }, 'Please log in to place café food and beverage orders.');
  };

  return (
    <div id="screen-fnb-order" className="flex flex-col gap-8 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-amber-500 block mb-1">
            Artisan Kitchen & Craft Espresso
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Coffee className="w-8 h-8 text-amber-400" />
            <span>Café Fuel & Gourmet Dining</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Artisan cold brews, loaded smash burgers, peri-peri snacks, and gaming combos delivered directly to your active rig or lounge seat.
          </p>
        </div>

        {mySession ? (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Delivery Target: {mySession.systemName}</span>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-xs font-mono self-start md:self-auto">
            Delivery Target: Lounge Seating
          </div>
        )}
      </div>

      {/* Active Kitchen Order Tracker (if an order is currently in progress) */}
      {activeCustomerOrder && (
        <div className="rounded-3xl bg-amber-950/20 border border-amber-500/30 p-6 flex flex-col gap-4 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                  Live Kitchen Order Tracker • {activeCustomerOrder.id}
                </span>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Status: {activeCustomerOrder.status}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setActiveCustomerOrder(null)}
              className="text-white/40 hover:text-white text-xs font-bold"
            >
              Dismiss Tracker
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].map((step, idx) => (
              <div key={step} className="flex flex-col gap-1">
                <div className={`h-1.5 rounded-full ${idx <= 2 ? 'bg-amber-400' : 'bg-white/10'}`} />
                <span className="text-[10px] font-mono uppercase text-white/60">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-white text-black font-black shadow-md'
                : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Menu Items (Left 2 Cols) + Order Cart (Right Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Items Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const inCart = cart.find((i) => i.id === item.id);
            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold block">
                        {item.category} {item.isCombo && '• COMBO'}
                      </span>
                      <h3 className="text-base font-black text-white uppercase tracking-tight mt-0.5">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-base font-black text-white font-mono shrink-0">
                      ₹{item.price}
                    </span>
                  </div>

                  <p className="text-xs text-white/60 font-light mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">
                    Prep: ~10-15 mins
                  </span>

                  {inCart ? (
                    <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-mono font-bold text-white px-1">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Cart Sidebar */}
        <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl h-fit sticky top-24">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>Your Order Cart</span>
              </h3>
              <span className="text-xs font-mono text-white/50">{cart.length} items</span>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-white/40 flex flex-col items-center gap-2">
                <Coffee className="w-8 h-8 text-white/20" />
                <span>Your cart is empty. Add cold brews or snacks from the menu.</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5 max-h-72 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1">
                      <span className="font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-white/40 font-mono">₹{item.price} each</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded bg-white/10 text-white flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-white text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded bg-white/10 text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-white w-14 text-right">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            {cart.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                  Kitchen Notes / Prep Requests
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Extra ice, no sugar, spicy sauce..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Checkout Footer */}
          {cart.length > 0 && (
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 text-xs text-white/60">
                <div className="flex items-center justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GST (5%):</span>
                  <span className="font-mono text-white">₹{gst}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white pt-2 border-t border-white/5">
                  <span>Total Amount:</span>
                  <span className="text-lg font-black font-mono text-amber-400">₹{total}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isOrdering}
                className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isOrdering ? 'Dispatching Order...' : `Place Order (₹${total})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
