import {
  SupplierVendor,
  PurchaseOrder,
  PromotionCode,
  MaintenanceTicket,
  CafeBusinessSettings
} from '../types';

export const INITIAL_BUSINESS_SETTINGS: CafeBusinessSettings = {
  cafeName: 'Bytes & Brew Esports & Gaming Lounge',
  brandTagline: 'Next-Gen Ultra RTX 4090 Rigs • Specialty Concessions • Pro LAN Arenas',
  address: 'Plot 42, 3rd Floor, Cyber Hub Horizon, Linking Road, Bandra West',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400050',
  gstin: '27AAACB2201M1ZT',
  contactPhone: '+91 98200 84920',
  contactEmail: 'desk@bytesandbrew.in',
  operatingHours: {
    open: '10:00',
    close: '02:00',
    weekendClose: '04:00'
  },
  taxGstEnabled: true,
  taxGstPercentage: 18,
  currencySymbol: '₹',
  cancellationGracePeriodMins: 30,
  maxAdvanceBookingDays: 14,
  walkInDepositRequired: false,
  emergencyBroadcastMessage: '⚡ LAN Tournament Qualifier starts at 6:00 PM. High-ping optimization active on Arena Alpha.',
  emergencyBroadcastActive: false
};

export const INITIAL_SUPPLIERS: SupplierVendor[] = [
  {
    id: 'supp-redbull',
    name: 'Red Bull Energy India Pvt Ltd',
    category: 'BEVERAGES',
    contactPerson: 'Karan Malhotra',
    phone: '+91 98201 11223',
    email: 'karan.orders@in.redbull.com',
    address: 'Bandra-Kurla Complex, Bandra East, Mumbai 400051',
    leadTimeDays: 2,
    paymentTerms: 'Net 15 Days',
    status: 'ACTIVE',
    lastOrderDate: '2026-09-02',
    pendingOrdersCount: 0
  },
  {
    id: 'supp-monster',
    name: 'Monster Beverage India Distrib',
    category: 'BEVERAGES',
    contactPerson: 'Suresh Pillai',
    phone: '+91 98112 33445',
    email: 'orders@monsterbeverages-west.in',
    address: 'Andheri Industrial Estate, Mumbai 400053',
    leadTimeDays: 1,
    paymentTerms: 'Immediate / UPI',
    status: 'ACTIVE',
    lastOrderDate: '2026-09-04',
    pendingOrdersCount: 1
  },
  {
    id: 'supp-asus',
    name: 'ASUS Republic of Gamers Enterprise',
    category: 'HARDWARE',
    contactPerson: 'Aditya Shenoy',
    phone: '+91 98330 99887',
    email: 'b2b.support@asus.rog.in',
    address: 'Lamington Road Tech Hub, Grant Road, Mumbai 400007',
    leadTimeDays: 3,
    paymentTerms: 'Credit 30 Days',
    status: 'ACTIVE',
    lastOrderDate: '2026-08-28',
    pendingOrdersCount: 0
  },
  {
    id: 'supp-corsair',
    name: 'Corsair & Elgato India Support',
    category: 'PERIPHERALS',
    contactPerson: 'Vikram Joshi',
    phone: '+91 98219 77665',
    email: 'enterprise@corsair-in.com',
    address: 'Lower Parel Commercial Tower, Mumbai 400013',
    leadTimeDays: 2,
    paymentTerms: 'Net 15 Days',
    status: 'ACTIVE',
    lastOrderDate: '2026-08-30',
    pendingOrdersCount: 0
  },
  {
    id: 'supp-roastery',
    name: 'Blue Tokai Specialty Roasters',
    category: 'DAIRY_BAKERY',
    contactPerson: 'Neha Deshmukh',
    phone: '+91 98334 55667',
    email: 'wholesale@bluetokai.com',
    address: 'Mahalaxmi Mills Compound, Mumbai 400011',
    leadTimeDays: 1,
    paymentTerms: 'Net 7 Days',
    status: 'ACTIVE',
    lastOrderDate: '2026-09-06',
    pendingOrdersCount: 1
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1092',
    supplierId: 'supp-monster',
    supplierName: 'Monster Beverage India Distrib',
    items: [
      { name: 'Monster Energy Ultra White (500ml)', quantity: 48, unitCost: 85, totalCost: 4080 },
      { name: 'Monster Mango Loco (500ml)', quantity: 24, unitCost: 90, totalCost: 2160 }
    ],
    totalAmount: 6240,
    orderDate: '2026-09-07',
    expectedDelivery: '2026-09-09',
    status: 'IN_TRANSIT',
    notes: 'Replenishing tournament weekend stock.'
  },
  {
    id: 'po-1091',
    supplierId: 'supp-roastery',
    supplierName: 'Blue Tokai Specialty Roasters',
    items: [
      { name: 'Attikan Estate Espresso Roast (1kg)', quantity: 6, unitCost: 850, totalCost: 5100 },
      { name: 'Cold Brew Blend (1kg)', quantity: 4, unitCost: 900, totalCost: 3600 }
    ],
    totalAmount: 8700,
    orderDate: '2026-09-08',
    expectedDelivery: '2026-09-10',
    status: 'ORDERED',
    notes: 'Concession bar weekly coffee bean batch.'
  },
  {
    id: 'po-1089',
    supplierId: 'supp-redbull',
    supplierName: 'Red Bull Energy India Pvt Ltd',
    items: [
      { name: 'Red Bull 250ml Classic Can (Pack of 24)', quantity: 4, unitCost: 1920, totalCost: 7680 },
      { name: 'Red Bull Sugarfree 250ml (Pack of 24)', quantity: 2, unitCost: 1920, totalCost: 3840 }
    ],
    totalAmount: 11520,
    orderDate: '2026-09-02',
    expectedDelivery: '2026-09-04',
    status: 'RECEIVED',
    notes: 'Stock received and audited in cooler #2.'
  }
];

export const INITIAL_PROMOTIONS: PromotionCode[] = [
  {
    id: 'promo-welcome',
    code: 'WELCOME100',
    discountType: 'FLAT',
    discountValue: 100,
    minSpend: 300,
    maxUses: 500,
    currentUses: 142,
    validFrom: '2026-08-01',
    validUntil: '2026-12-31',
    status: 'ACTIVE',
    description: 'Flat ₹100 discount for new walk-ins and newly registered gamers.',
    applicableServices: ['Gaming PC', 'PlayStation', 'Xbox', 'Sim Racing']
  },
  {
    id: 'promo-night',
    code: 'NIGHTRAID25',
    discountType: 'PERCENT',
    discountValue: 25,
    minSpend: 400,
    maxUses: 1000,
    currentUses: 388,
    validFrom: '2026-08-15',
    validUntil: '2026-10-31',
    status: 'ACTIVE',
    description: '25% Off during all-night grind sessions booked past 11:00 PM.',
    applicableServices: ['Gaming PC', 'VIP Room']
  },
  {
    id: 'promo-squad',
    code: 'SQUAD50',
    discountType: 'FLAT',
    discountValue: 200,
    minSpend: 800,
    maxUses: 200,
    currentUses: 94,
    validFrom: '2026-09-01',
    validUntil: '2026-09-30',
    status: 'ACTIVE',
    description: 'Save ₹200 when booking 4+ rigs for competitive 5v5 team practice.',
    applicableServices: ['Gaming PC']
  },
  {
    id: 'promo-esports',
    code: 'VALORANTPRO',
    discountType: 'PERCENT',
    discountValue: 15,
    minSpend: 250,
    maxUses: 150,
    currentUses: 82,
    validFrom: '2026-09-01',
    validUntil: '2026-09-15',
    status: 'ACTIVE',
    description: 'LAN Tournament participant promo during qualifier week.',
    applicableServices: ['Gaming PC', 'Sim Racing']
  }
];

export const INITIAL_MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'maint-101',
    stationId: 'ps5-01',
    stationName: 'PS5-01',
    issueCategory: 'CONTROLLER_DRIFT',
    priority: 'HIGH',
    reportedBy: 'Kunal Shah (Floor Staff)',
    reportedAt: '2026-09-09 11:15',
    status: 'OPEN',
    assignedTechnician: 'Hardware Systems Tech',
    description: 'DualSense controller #2 left analog stick drifting slightly in EA FC 25.',
    resolutionNotes: ''
  },
  {
    id: 'maint-102',
    stationId: 'pc-06',
    stationName: 'PC-06',
    issueCategory: 'GAME_UPDATE',
    priority: 'NORMAL',
    reportedBy: 'Samir Rao (Supervisor)',
    reportedAt: '2026-09-09 10:40',
    status: 'IN_PROGRESS',
    assignedTechnician: 'Hardware Systems Tech',
    description: 'Call of Duty: Warzone 32GB mid-season patch downloading via Battle.net.',
    resolutionNotes: 'Download 78% complete over 1Gbps LAN.'
  },
  {
    id: 'maint-103',
    stationId: 'vr-01',
    stationName: 'VR-01',
    issueCategory: 'CLEANING',
    priority: 'NORMAL',
    reportedBy: 'Kunal Shah (Floor Staff)',
    reportedAt: '2026-09-09 09:30',
    status: 'RESOLVED',
    assignedTechnician: 'Kunal Shah',
    description: 'Headset sanitary face cushion replacement and lens micro-fiber sanitization.',
    resolutionNotes: 'New silicon face guard installed. UV sanitized.',
    resolvedAt: '2026-09-09 10:00'
  }
];
