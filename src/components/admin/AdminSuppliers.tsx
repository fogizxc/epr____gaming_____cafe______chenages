import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Package,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Building,
  DollarSign,
  X,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { SupplierVendor, PurchaseOrder } from '../../types';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS } from '../../data/adminInitialData';

export const AdminSuppliers: React.FC = () => {
  const { updateFnbStock, fnbProducts } = useCafe();

  const [suppliers, setSuppliers] = useState<SupplierVendor[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [activeTab, setActiveTab] = useState<'PURCHASE_ORDERS' | 'VENDORS'>('PURCHASE_ORDERS');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddPoModal, setShowAddPoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Supplier Form
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppCategory, setNewSuppCategory] = useState<SupplierVendor['category']>('BEVERAGES');
  const [newSuppContact, setNewSuppContact] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');
  const [newSuppEmail, setNewSuppEmail] = useState('');
  const [newSuppAddress, setNewSuppAddress] = useState('');
  const [newSuppLeadTime, setNewSuppLeadTime] = useState(2);
  const [newSuppTerms, setNewSuppTerms] = useState('Net 15 Days');

  // New PO Form
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItemName, setPoItemName] = useState('');
  const [poItemQty, setPoItemQty] = useState(24);
  const [poItemUnitCost, setPoItemUnitCost] = useState(100);
  const [poNotes, setPoNotes] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const newVendor: SupplierVendor = {
      id: `supp-${Date.now()}`,
      name: newSuppName,
      category: newSuppCategory,
      contactPerson: newSuppContact,
      phone: newSuppPhone,
      email: newSuppEmail,
      address: newSuppAddress,
      leadTimeDays: newSuppLeadTime,
      paymentTerms: newSuppTerms,
      status: 'ACTIVE',
      lastOrderDate: new Date().toISOString().split('T')[0],
      pendingOrdersCount: 0
    };
    setSuppliers([newVendor, ...suppliers]);
    setShowAddSupplierModal(false);
    triggerToast(`Supplier ${newSuppName} registered successfully.`);
    setNewSuppName('');
    setNewSuppContact('');
    setNewSuppPhone('');
    setNewSuppEmail('');
  };

  const handleAddPo = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find(s => s.id === selectedSupplierId);
    if (!supp) return;

    const totalAmount = poItemQty * poItemUnitCost;
    const newPo: PurchaseOrder = {
      id: `po-${Date.now().toString().slice(-4)}`,
      supplierId: supp.id,
      supplierName: supp.name,
      items: [
        {
          name: poItemName,
          quantity: poItemQty,
          unitCost: poItemUnitCost,
          totalCost: totalAmount
        }
      ],
      totalAmount,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(Date.now() + supp.leadTimeDays * 86400000).toISOString().split('T')[0],
      status: 'ORDERED',
      notes: poNotes
    };

    setPurchaseOrders([newPo, ...purchaseOrders]);
    setShowAddPoModal(false);
    triggerToast(`Purchase Order #${newPo.id} dispatched to ${supp.name}.`);
    setPoItemName('');
    setPoNotes('');
  };

  const handleReceivePo = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    // Check if any matching fnb product to replenish automatically
    po.items.forEach(item => {
      const match = fnbProducts.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(p.name.toLowerCase()));
      if (match) {
        updateFnbStock(match.id, item.quantity);
      }
    });

    setPurchaseOrders(prev =>
      prev.map(p => (p.id === poId ? { ...p, status: 'RECEIVED' } : p))
    );
    triggerToast(`PO #${poId} received and verified! Inventory updated.`);
  };

  const filteredOrders = purchaseOrders.filter(p =>
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Procurement & Supply Chain
            </span>
            <span className="text-xs text-white/50 font-mono">
              {suppliers.length} Approved Vendors • {purchaseOrders.filter(p => p.status === 'IN_TRANSIT' || p.status === 'ORDERED').length} In-Transit
            </span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight">
            Supplier Vendors & Purchase Restocking Orders
          </h2>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Manage authorized F&B distributors, hardware suppliers, purchase orders, and inventory restocking batches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddPoModal(true)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition cursor-pointer"
          >
            <Building className="w-4 h-4 text-white/70" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            Active Vendors
          </span>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {suppliers.filter(s => s.status === 'ACTIVE').length}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Contracted B2B partners</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            Pending Restock Deliveries
          </span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">
            {purchaseOrders.filter(p => p.status === 'ORDERED' || p.status === 'IN_TRANSIT').length}
          </div>
          <span className="text-[11px] text-amber-400/80 mt-1 block">Arriving within 24-48 hrs</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            Total Procured This Month
          </span>
          <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
            ₹{purchaseOrders.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-cyan-400/80 mt-1 block">Wholesale supply expenditure</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            Average Lead Time
          </span>
          <div className="text-3xl font-black text-purple-400 font-mono mt-1">
            1.8 Days
          </div>
          <span className="text-[11px] text-purple-400/80 mt-1 block">Quick local replenishment</span>
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('PURCHASE_ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'PURCHASE_ORDERS'
                ? 'bg-white text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('VENDORS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'VENDORS'
                ? 'bg-white text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Vendor Directory ({suppliers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO #, vendor, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: PURCHASE ORDERS */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-3">PO Number</th>
                  <th className="py-3 px-3">Supplier Vendor</th>
                  <th className="py-3 px-3">Items Ordered</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Order Date</th>
                  <th className="py-3 px-3">Delivery ETA</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-amber-400 uppercase">
                      #{po.id}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">
                      {po.supplierName}
                    </td>
                    <td className="py-3.5 px-3 text-white/80">
                      {po.items.map((i, idx) => (
                        <div key={idx} className="font-mono text-[11px]">
                          {i.name} × {i.quantity}
                        </div>
                      ))}
                      {po.notes && (
                        <span className="text-[10px] text-white/40 italic block mt-0.5">
                          "{po.notes}"
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      ₹{po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-white/60">
                      {po.orderDate}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-white/60">
                      {po.expectedDelivery}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          po.status === 'RECEIVED'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                            : po.status === 'IN_TRANSIT'
                            ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/40'
                            : 'bg-amber-950/70 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {po.status !== 'RECEIVED' ? (
                        <button
                          onClick={() => handleReceivePo(po.id)}
                          className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black text-[10px] font-black uppercase rounded-lg transition cursor-pointer shadow"
                        >
                          Mark Received
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/40 font-mono">Stocked ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: VENDOR DIRECTORY */}
      {activeTab === 'VENDORS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                    {s.category}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{s.status}</span>
                  </span>
                </div>

                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                  {s.name}
                </h4>

                <div className="my-3 py-3 border-y border-white/5 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Point of Contact:</span>
                    <span className="font-bold text-white">{s.contactPerson}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/40">Phone:</span>
                    <span className="text-amber-400">{s.phone}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/40">Email:</span>
                    <span className="text-white/70">{s.email}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/40">Lead Time:</span>
                    <span className="text-white">{s.leadTimeDays} Business Days</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/40">Terms:</span>
                    <span className="text-white">{s.paymentTerms}</span>
                  </div>
                </div>

                <p className="text-[10px] text-white/40 truncate">
                  {s.address}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-mono">
                  Last: {s.lastOrderDate}
                </span>
                <button
                  onClick={() => {
                    setSelectedSupplierId(s.id);
                    setShowAddPoModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase transition cursor-pointer"
                >
                  Order Batch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {showAddPoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-black uppercase text-white">Create Purchase Order</h3>
              <button
                onClick={() => setShowAddPoModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPo} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Product Item / Stock Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Bull 250ml Classic Can (Pack of 24)"
                  value={poItemName}
                  onChange={(e) => setPoItemName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={poItemQty}
                    onChange={(e) => setPoItemQty(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={poItemUnitCost}
                    onChange={(e) => setPoItemUnitCost(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex items-center justify-between font-mono">
                <span className="text-white/60">Calculated Total:</span>
                <span className="text-amber-400 font-black text-sm">
                  ₹{(poItemQty * poItemUnitCost).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Order Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Priority delivery before Friday weekend rush"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddPoModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase"
                >
                  Dispatch PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-black uppercase text-white">Add New Supplier Vendor</h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">Company / Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Bull Energy India"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Category</label>
                  <select
                    value={newSuppCategory}
                    onChange={(e) => setNewSuppCategory(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="BEVERAGES">Beverages</option>
                    <option value="SNACKS">Snacks & Confections</option>
                    <option value="HARDWARE">PC / Console Hardware</option>
                    <option value="PERIPHERALS">Peripherals & Audio</option>
                    <option value="DAIRY_BAKERY">Coffee & Bakery</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={newSuppLeadTime}
                    onChange={(e) => setNewSuppLeadTime(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Contact Representative</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karan Malhotra"
                  value={newSuppContact}
                  onChange={(e) => setNewSuppContact(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200 00000"
                    value={newSuppPhone}
                    onChange={(e) => setNewSuppPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="orders@vendor.com"
                    value={newSuppEmail}
                    onChange={(e) => setNewSuppEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Office / Warehouse Address</label>
                <input
                  type="text"
                  placeholder="City, Commercial Zone"
                  value={newSuppAddress}
                  onChange={(e) => setNewSuppAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
