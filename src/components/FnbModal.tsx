import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { Utensils, Coffee, Zap, Pizza, Shield, Plus, Check } from 'lucide-react';

interface FnbModalProps {
  sessionId: string;
  onClose: () => void;
}

export const FnbModal: React.FC<FnbModalProps> = ({ sessionId, onClose }) => {
  const { fnbProducts, addFoodToSession, activeSessions } = useCafe();
  const session = activeSessions.find(s => s.id === sessionId);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedItems, setAddedItems] = useState<Record<string, number>>({});
  const [successMsg, setSuccessMsg] = useState(false);

  const categories = ['All', 'Drinks', 'Snacks', 'Food', 'Accessories'];

  const filteredProducts = selectedCategory === 'All'
    ? fnbProducts
    : fnbProducts.filter(p => p.category === selectedCategory);

  const handleAddItem = (productId: string) => {
    addFoodToSession(sessionId, productId, 1);
    setAddedItems(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.03)] p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto text-white backdrop-blur-md animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block">
              Refreshments
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Coffee className="w-4 h-4 text-white/70" />
              <span>Café F&B Order POS</span>
            </h3>
            <span className="text-xs text-white/50 font-light mt-0.5 block">
              Active Station: <strong className="text-white font-semibold">{session?.systemName} ({session?.customerName})</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 my-4 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {filteredProducts.map(p => {
            const addedQty = addedItems[p.id] || 0;
            return (
              <div
                key={p.id}
                className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-white/20 transition"
              >
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1">{p.name}</h4>
                  <span className="text-xs font-mono font-bold text-white">₹{p.price}</span>
                  <span className="text-[10px] text-white/40 block font-light">Stock: {p.stock} units</span>
                </div>
                <button
                  onClick={() => handleAddItem(p.id)}
                  className="flex items-center gap-1 bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {addedQty > 0 ? `(${addedQty})` : ''}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/70 font-medium">
            {successMsg && '✓ Item added to active invoice bill!'}
          </span>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
