import {
  GamingSystem,
  PricingRule,
  PriceHistoryEntry,
  ActiveSession,
  Booking,
  MembershipPlan,
  CustomerMembership,
  Tournament,
  TournamentTeam,
  TournamentMatch,
  Invoice,
  WalletTransaction,
  FnbProduct,
  EmployeeShift,
  WaitlistEntry,
  AuditLogEntry,
  HeroGameSlide
} from '../types';

export const INITIAL_HERO_GAMES: HeroGameSlide[] = [
  {
    id: 'game-spiderman-2',
    title: "Marvel's Spider-Man 2",
    tagline: "Be Greater. Together.",
    category: "Action-Adventure",
    tags: ["Tekken 8", "Fifa 2024", "WW2", "PES 2024", "Spider-Man 2"],
    description: "is an action-adventure game developed by Insomniac Games and published by Sony Interactive. Featuring Peter Parker and Miles Morales battling Venom and Kraven the Hunter across an expanded New York City.",
    price: "₹199 / hr",
    rating: "9.8 / 10",
    platforms: ["PS5", "PC"],
    bannerUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/2651280/library_hero.jpg",
    coverUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/2651280/library_600x900.jpg",
    videoPreviewUrl: "https://cdn.akamai.steamstatic.com/steam/apps/257093509/movie480.mp4",
    thumbnails: [
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_e4b67059ddedaeebd91fce113745f3eb99736f56.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_b4be948946130b7e140be82f24f1f9ccefae9117.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_f4140ba12158b812d9c1adc86c484d8e84b92e92.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_7ef8bc176702470fdc73f62f8e537c3912e70444.1920x1080.jpg"
    ],
    availableCount: 4
  },
  {
    id: 'game-gta-6',
    title: "Grand Theft Auto VI",
    tagline: "Welcome to Leonida",
    category: "Open World Action",
    tags: ["GTA VI", "Open World", "Rockstar", "Action", "4K Ultra"],
    description: "Grand Theft Auto VI heads to the state of Leonida, home to the neon-soaked streets of Vice City and beyond in the biggest, most immersive evolution of the Grand Theft Auto series yet.",
    price: "₹249 / hr",
    rating: "9.9 / 10",
    platforms: ["PS5", "Xbox", "PC"],
    bannerUrl: "https://i.ytimg.com/vi/QdBZY2fkU-0/maxresdefault.jpg",
    coverUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg",
    videoPreviewUrl: "https://cdn.akamai.steamstatic.com/steam/apps/256666635/movie480.mp4",
    thumbnails: [
      "https://i.ytimg.com/vi/QdBZY2fkU-0/maxresdefault.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_hero.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/ss_71b95b86ea67ae87f7d1421ab7bfb0f2095f9c45.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg"
    ],
    availableCount: 8
  },
  {
    id: 'game-nba2k25',
    title: "NBA 2K25",
    tagline: "Ball Over Everything",
    category: "Sports Simulation",
    tags: ["NBA 2K25", "Sports", "Multiplayer", "Competitive"],
    description: "Stack up wins, hoist banners, and make history in NBA 2K25. Command every court with authenticity and powered by ProPLAY giving you ultimate control over how you play.",
    price: "₹199 / hr",
    rating: "9.2 / 10",
    platforms: ["PS5", "Xbox", "PC"],
    bannerUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/2878980/library_hero.jpg",
    coverUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/2878980/library_600x900.jpg",
    videoPreviewUrl: "https://cdn.akamai.steamstatic.com/steam/apps/257048048/movie480.mp4",
    thumbnails: [
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_8e3db832678488ed1003fa41cc0ef9bd74d332e5.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_40b45c20c14c8996000e81f697bd1d09f26ea5fd.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_0d4dd0f0fdfe67d8b3c641816b53b01a6ba062a0.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_3a08987033974b0e58d9d9f21794da91aae82811.1920x1080.jpg"
    ],
    availableCount: 6
  },
  {
    id: 'game-mw2',
    title: "Call of Duty: Modern Warfare II",
    tagline: "The Ultimate Weapon Is Team",
    category: "First-Person Shooter",
    tags: ["MW2", "Warzone", "FPS", "Esports", "RTX On"],
    description: "Welcome to the new era of Call of Duty. Drop into an unprecedented global conflict with iconic Operators of Task Force 141 across high-stakes tactical ops and multiplayer battles.",
    price: "₹249 / hr",
    rating: "9.5 / 10",
    platforms: ["PC", "PS5", "Xbox"],
    bannerUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1938090/library_hero.jpg",
    coverUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1938090/library_600x900.jpg",
    videoPreviewUrl: "https://cdn.akamai.steamstatic.com/steam/apps/256889445/movie480.mp4",
    thumbnails: [
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/ee5f6b6aebe4dc9e86b49c4e309d361b132df308/ss_ee5f6b6aebe4dc9e86b49c4e309d361b132df308.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/ca97243a998802a38c7cddf195cee327c5760353/ss_ca97243a998802a38c7cddf195cee327c5760353.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/6b8f4040a1e923f036e04d9eb21ecb0f866be57e/ss_6b8f4040a1e923f036e04d9eb21ecb0f866be57e.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/c6f865bd79b76a1fa50c59cd17a68d7837abf0b2/ss_c6f865bd79b76a1fa50c59cd17a68d7837abf0b2.1920x1080.jpg"
    ],
    availableCount: 7
  },
  {
    id: 'game-tekken-8',
    title: "Tekken 8: Launch Edition",
    tagline: "Fist Meets Fate",
    category: "Competitive Fighting",
    tags: ["Tekken 8", "Fighting", "Tournament", "Unreal Engine 5"],
    description: "Built completely from the ground up in Unreal Engine 5, Tekken 8 pushes the limits of next-gen fighting hardware with aggressive new Heat mechanics and stunning destructible stages.",
    price: "₹199 / hr",
    rating: "9.7 / 10",
    platforms: ["PS5", "PC"],
    bannerUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1778820/library_hero.jpg",
    coverUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1778820/library_600x900.jpg",
    videoPreviewUrl: "https://cdn.akamai.steamstatic.com/steam/apps/256921572/movie480.mp4",
    thumbnails: [
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_62e6ec252bc1a641e8e42dba07f23631d5da85e6.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_99dabe34abc0f92adc39d7099908c9540be7eb3f.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_bbd38a5fe748ec966cbc85ffcd4931f0f2da8ffd.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_7c55021d3ba8e4f14c6d9dbea9f19d9b7665d5f0.1920x1080.jpg"
    ],
    availableCount: 5
  }
];

export const INITIAL_PRICING_RULES: PricingRule[] = [
  {
    id: 'price-ps5',
    service: 'PS5',
    normalPrice: 199,
    peakPrice: 249,
    weekendPrice: 249,
    isPeakEnabled: true,
    peakHoursStart: '18:00',
    peakHoursEnd: '23:00',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-xbox',
    service: 'Xbox',
    normalPrice: 199,
    peakPrice: 249,
    weekendPrice: 249,
    isPeakEnabled: true,
    peakHoursStart: '18:00',
    peakHoursEnd: '23:00',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-ps4',
    service: 'PS4',
    normalPrice: 149,
    peakPrice: 189,
    weekendPrice: 199,
    isPeakEnabled: true,
    peakHoursStart: '17:00',
    peakHoursEnd: '23:00',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-pc',
    service: 'Gaming PC',
    normalPrice: 249,
    peakPrice: 299,
    weekendPrice: 349,
    isPeakEnabled: true,
    peakHoursStart: '17:00',
    peakHoursEnd: '23:30',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-vip',
    service: 'VIP Room',
    normalPrice: 499,
    peakPrice: 649,
    weekendPrice: 699,
    isPeakEnabled: true,
    peakHoursStart: '16:00',
    peakHoursEnd: '00:00',
    peakDays: ['Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-vr',
    service: 'VR',
    normalPrice: 299,
    peakPrice: 349,
    weekendPrice: 399,
    isPeakEnabled: true,
    peakHoursStart: '17:00',
    peakHoursEnd: '23:00',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-pool',
    service: 'Pool Table',
    normalPrice: 199,
    peakPrice: 249,
    weekendPrice: 299,
    isPeakEnabled: true,
    peakHoursStart: '18:00',
    peakHoursEnd: '00:00',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-sim',
    service: 'Sim Racing',
    normalPrice: 349,
    peakPrice: 399,
    weekendPrice: 449,
    isPeakEnabled: true,
    peakHoursStart: '17:00',
    peakHoursEnd: '23:30',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  },
  {
    id: 'price-ps-legacy',
    service: 'PlayStation',
    normalPrice: 199,
    peakPrice: 249,
    weekendPrice: 249,
    isPeakEnabled: true,
    peakHoursStart: '18:00',
    peakHoursEnd: '23:00',
    peakDays: ['Friday', 'Saturday', 'Sunday'],
    lastUpdatedBy: 'Admin',
    updatedAt: '2026-09-01 10:00'
  }
];

export const INITIAL_PRICE_HISTORY: PriceHistoryEntry[] = [
  {
    id: 'ph-1',
    service: 'Gaming PC',
    previousPrice: 219,
    newPrice: 249,
    adminName: 'Admin (System)',
    date: '2026-08-15',
    time: '14:30',
    reason: 'Upgraded all rigs with RTX 4090 and 240Hz OLED monitors'
  },
  {
    id: 'ph-2',
    service: 'VIP Room',
    previousPrice: 449,
    newPrice: 499,
    adminName: 'Admin',
    date: '2026-08-20',
    time: '11:15',
    reason: 'Added Dolby Atmos 7.1.4 sound system and mini-bar'
  }
];

export const INITIAL_SYSTEMS: GamingSystem[] = [
  {
    id: 'pc-01',
    name: 'PC-01',
    category: 'Gaming PC',
    status: 'ACTIVE',
    hourlyRate: 249,
    specs: 'Intel Core i9 14900K, RTX 4090 24GB, 64GB DDR5, 240Hz 1440p OLED',
    installedGames: ['Valorant', 'CS2', 'GTA V', 'Cyberpunk 2077', 'Apex Legends', 'Fortnite'],
    location: 'Zone Alpha - Main Arena',
    totalUsageHours: 412,
    totalRevenue: 102588,
    activeSessionId: 'sess-pc01',
    currentCustomerName: 'Rahul Verma',
    currentCustomerPhone: '+91 98765 43210',
    sessionEndTime: Date.now() + 5071000, // ~1h 24m remaining
    ipAddress: '192.168.1.101',
    ping: 9,
    temp: 64
  },
  {
    id: 'pc-02',
    name: 'PC-02',
    category: 'Gaming PC',
    status: 'AVAILABLE',
    hourlyRate: 249,
    specs: 'Intel Core i9 14900K, RTX 4090 24GB, 64GB DDR5, 240Hz 1440p OLED',
    installedGames: ['Valorant', 'CS2', 'Call of Duty: MW2', 'Dota 2', 'Overwatch 2'],
    location: 'Zone Alpha - Main Arena',
    totalUsageHours: 388,
    totalRevenue: 96612,
    ipAddress: '192.168.1.102',
    ping: 8,
    temp: 42
  },
  {
    id: 'pc-03',
    name: 'PC-03',
    category: 'Gaming PC',
    status: 'RESERVED',
    hourlyRate: 249,
    specs: 'Intel Core i7 14700K, RTX 4080 Super, 32GB DDR5, 240Hz IPS',
    installedGames: ['Valorant', 'CS2', 'BGMI Emulator', 'League of Legends'],
    location: 'Zone Alpha - Main Arena',
    totalUsageHours: 350,
    totalRevenue: 87150,
    currentCustomerName: 'Siddharth Roy (7:00 PM)',
    ipAddress: '192.168.1.103',
    ping: 11,
    temp: 45
  },
  {
    id: 'pc-04',
    name: 'PC-04',
    category: 'Gaming PC',
    status: 'AVAILABLE',
    hourlyRate: 249,
    specs: 'Intel Core i7 14700K, RTX 4080 Super, 32GB DDR5, 240Hz IPS',
    installedGames: ['Valorant', 'CS2', 'Fortnite', 'Rocket League', 'FIFA 24'],
    location: 'Zone Alpha - Main Arena',
    totalUsageHours: 310,
    totalRevenue: 77190,
    ipAddress: '192.168.1.104',
    ping: 10,
    temp: 40
  },
  {
    id: 'pc-05',
    name: 'PC-05',
    category: 'Gaming PC',
    status: 'AVAILABLE',
    hourlyRate: 249,
    specs: 'AMD Ryzen 7 7800X3D, RTX 4080 Super, 32GB DDR5, 240Hz IPS',
    installedGames: ['Valorant', 'CS2', 'Apex Legends', 'Rainbow Six Siege'],
    location: 'Zone Beta - Esports Row',
    totalUsageHours: 290,
    totalRevenue: 72210,
    ipAddress: '192.168.1.105',
    ping: 7,
    temp: 43
  },
  {
    id: 'pc-06',
    name: 'PC-06',
    category: 'Gaming PC',
    status: 'AVAILABLE',
    hourlyRate: 249,
    specs: 'AMD Ryzen 7 7800X3D, RTX 4080 Super, 32GB DDR5, 240Hz IPS',
    installedGames: ['Valorant', 'CS2', 'Apex Legends', 'Rainbow Six Siege'],
    location: 'Zone Beta - Esports Row',
    totalUsageHours: 275,
    totalRevenue: 68475,
    ipAddress: '192.168.1.106',
    ping: 8,
    temp: 41
  },
  {
    id: 'pc-07',
    name: 'PC-07',
    category: 'Gaming PC',
    status: 'AVAILABLE',
    hourlyRate: 249,
    specs: 'Intel Core i7 14700K, RTX 4070 Ti, 32GB DDR5, 180Hz Fast-IPS',
    installedGames: ['Valorant', 'CS2', 'GTA V', 'PUBG PC'],
    location: 'Zone Beta - Esports Row',
    totalUsageHours: 240,
    totalRevenue: 59760,
    ipAddress: '192.168.1.107',
    ping: 12,
    temp: 39
  },
  {
    id: 'pc-08',
    name: 'PC-08',
    category: 'Gaming PC',
    status: 'MAINTENANCE',
    hourlyRate: 249,
    specs: 'Intel Core i7 14700K, RTX 4070 Ti, 32GB DDR5, 180Hz Fast-IPS',
    installedGames: ['Valorant', 'CS2', 'PUBG PC'],
    location: 'Zone Beta - Esports Row',
    totalUsageHours: 210,
    totalRevenue: 52290,
    ipAddress: '192.168.1.108',
    ping: 0,
    temp: 78
  },
  // PlayStation 5 systems
  {
    id: 'ps5-01',
    name: 'PS5-01',
    category: 'PS5',
    status: 'ACTIVE',
    hourlyRate: 199,
    specs: 'Sony PlayStation 5 Disc Edition, 2x DualSense Edge, 65" Sony Bravia 4K 120Hz OLED',
    installedGames: ["Marvel's Spider-Man 2", "Tekken 8", "FC 24", "God of War Ragnarok", "Gran Turismo 7", "Mortal Kombat 1"],
    location: 'Console Lounge A',
    totalUsageHours: 490,
    totalRevenue: 97510,
    activeSessionId: 'sess-ps01',
    currentCustomerName: 'Aman Deep',
    currentCustomerPhone: '+91 99112 33445',
    sessionEndTime: Date.now() + 2530000, // ~42m remaining
    ipAddress: '192.168.1.121',
    ping: 14,
    temp: 58
  },
  {
    id: 'ps5-02',
    name: 'PS5-02',
    category: 'PS5',
    status: 'AVAILABLE',
    hourlyRate: 199,
    specs: 'Sony PlayStation 5 Slim 1TB, 2x DualSense Controllers, 55" 4K 120Hz Gaming TV',
    installedGames: ["FC 24", "WWE 2K24", "Tekken 8", "NBA 2K25", "GTA V"],
    location: 'Console Lounge A',
    totalUsageHours: 430,
    totalRevenue: 85570,
    ipAddress: '192.168.1.122',
    ping: 15,
    temp: 44
  },
  {
    id: 'ps5-03',
    name: 'PS5-03',
    category: 'PS5',
    status: 'AVAILABLE',
    hourlyRate: 199,
    specs: 'Sony PlayStation 5 Slim 1TB, 2x DualSense Controllers, 55" 4K 120Hz Gaming TV',
    installedGames: ["FC 24", "Street Fighter 6", "It Takes Two", "Spider-Man 2"],
    location: 'Console Lounge B',
    totalUsageHours: 395,
    totalRevenue: 78605,
    ipAddress: '192.168.1.123',
    ping: 13,
    temp: 43
  },
  {
    id: 'ps5-04',
    name: 'PS5-04',
    category: 'PS5',
    status: 'AVAILABLE',
    hourlyRate: 199,
    specs: 'Sony PlayStation 5 Slim 1TB, 2x DualSense Controllers, 55" 4K 120Hz Gaming TV',
    installedGames: ["Tekken 8", "FC 24", "UFC 5", "A Way Out"],
    location: 'Console Lounge B',
    totalUsageHours: 320,
    totalRevenue: 63680,
    ipAddress: '192.168.1.124',
    ping: 14,
    temp: 42
  },
  // PlayStation 4 Systems
  {
    id: 'ps4-01',
    name: 'PS4-01',
    category: 'PS4',
    status: 'AVAILABLE',
    hourlyRate: 149,
    specs: 'Sony PlayStation 4 Pro 1TB, 2x DualShock 4 Controllers, 50" 4K HDR TV',
    installedGames: ['God of War', 'The Last of Us Part II', 'Bloodborne', 'Uncharted 4', 'FIFA 23'],
    location: 'Console Lounge D',
    totalUsageHours: 510,
    totalRevenue: 75990,
    ipAddress: '192.168.1.125',
    ping: 18,
    temp: 44
  },
  {
    id: 'ps4-02',
    name: 'PS4-02',
    category: 'PS4',
    status: 'AVAILABLE',
    hourlyRate: 149,
    specs: 'Sony PlayStation 4 Slim 1TB, 2x DualShock 4 Controllers, 50" 1080p Gaming Display',
    installedGames: ['Horizon Zero Dawn', 'Gran Turismo Sport', 'Mortal Kombat 11', 'Crash Bandicoot'],
    location: 'Console Lounge D',
    totalUsageHours: 460,
    totalRevenue: 68540,
    ipAddress: '192.168.1.126',
    ping: 17,
    temp: 42
  },
  // Xbox Systems
  {
    id: 'xbox-01',
    name: 'XBOX-01',
    category: 'Xbox',
    status: 'MAINTENANCE',
    hourlyRate: 199,
    specs: 'Xbox Series X 1TB, 2x Wireless Elite Controllers, Game Pass Ultimate, 55" 4K 120Hz TV',
    installedGames: ["Forza Horizon 5", "Halo Infinite", "Gears 5", "FC 24", "Mortal Kombat 11"],
    location: 'Console Lounge C',
    totalUsageHours: 340,
    totalRevenue: 67660,
    ipAddress: '192.168.1.131',
    ping: 0,
    temp: 72
  },
  {
    id: 'xbox-02',
    name: 'XBOX-02',
    category: 'Xbox',
    status: 'AVAILABLE',
    hourlyRate: 199,
    specs: 'Xbox Series X 1TB, 2x Wireless Controllers, Game Pass Ultimate, 55" 4K 120Hz TV',
    installedGames: ["Forza Motorsport", "Starfield", "FC 24", "NBA 2K25"],
    location: 'Console Lounge C',
    totalUsageHours: 290,
    totalRevenue: 57710,
    ipAddress: '192.168.1.132',
    ping: 16,
    temp: 46
  },
  {
    id: 'xbox-03',
    name: 'XBOX-03',
    category: 'Xbox',
    status: 'AVAILABLE',
    hourlyRate: 199,
    specs: 'Xbox Series X 1TB, 2x Wireless Controllers, Game Pass Ultimate, 55" 4K 120Hz TV',
    installedGames: ["Call of Duty MW2", "Minecraft", "FC 24", "Hi-Fi Rush"],
    location: 'Console Lounge C',
    totalUsageHours: 245,
    totalRevenue: 48755,
    ipAddress: '192.168.1.133',
    ping: 15,
    temp: 45
  },
  // VIP Room Systems
  {
    id: 'vip-01',
    name: 'VIP-01',
    category: 'VIP Room',
    status: 'AVAILABLE',
    hourlyRate: 499,
    specs: 'Ultra Private Suite: 85" Samsung Neo QLED 8K, Dual Custom Liquid Cooled RTX 4090 Rigs, PS5 Pro Setup, Reclining Ergonomic Gaming Chairs, Dolby Atmos 7.1.4, Mini Fridge',
    installedGames: ['Full Library across Steam, Epic, Riot, and PlayStation Plus Premium'],
    location: 'VIP Executive Suite 1',
    totalUsageHours: 280,
    totalRevenue: 139720,
    ipAddress: '192.168.1.141',
    ping: 6,
    temp: 38
  },
  {
    id: 'vip-02',
    name: 'VIP-02',
    category: 'VIP Room',
    status: 'AVAILABLE',
    hourlyRate: 499,
    specs: 'Streamer & Squad Suite: 4x RTX 4080 Super Pods, Elgato 4K Streaming Rig, 75" 4K Spectator Display, Soundproof Studio, Dedicated 1Gbps Fiber',
    installedGames: ['Full Competitive Esports Suite + Streaming Software Suite'],
    location: 'VIP Streamer Studio 2',
    totalUsageHours: 220,
    totalRevenue: 109780,
    ipAddress: '192.168.1.142',
    ping: 5,
    temp: 37
  },
  // VR Systems
  {
    id: 'vr-01',
    name: 'VR-01',
    category: 'VR',
    status: 'AVAILABLE',
    hourlyRate: 299,
    specs: 'Meta Quest 3 512GB Wireless 6DoF, 120Hz 4K+ Infinite Display, 4x4m Padded Haptic Play Area',
    installedGames: ['Beat Saber', 'Superhot VR', 'Half-Life: Alyx', 'Eleven Table Tennis', 'Arizona Sunshine 2'],
    location: 'VR Holodeck Alpha',
    totalUsageHours: 215,
    totalRevenue: 64285,
    ipAddress: '192.168.1.151',
    ping: 4,
    temp: 36
  },
  {
    id: 'vr-02',
    name: 'VR-02',
    category: 'VR',
    status: 'AVAILABLE',
    hourlyRate: 299,
    specs: 'HTC Vive Pro 2, Valve Index Knuckles Controllers, Dual SteamVR 2.0 Laser Base Stations',
    installedGames: ['Half-Life: Alyx', 'Pavlov VR', 'Boneworks', 'The Climb 2'],
    location: 'VR Holodeck Beta',
    totalUsageHours: 180,
    totalRevenue: 53820,
    ipAddress: '192.168.1.152',
    ping: 5,
    temp: 38
  },
  // Pool Table Systems
  {
    id: 'pool-01',
    name: 'POOL-01',
    category: 'Pool Table',
    status: 'AVAILABLE',
    hourlyRate: 199,
    specs: '9ft Championship Tournament Slate Table, Aramith Pro TV Ball Set, Predator Carbon Cues, Shadowless Overhead LED',
    installedGames: ['8-Ball Standard', '9-Ball Tournament', 'Straight Pool', 'Killer Pool'],
    location: 'Billiards Lounge North',
    totalUsageHours: 340,
    totalRevenue: 67660,
    ipAddress: '192.168.1.161',
    ping: 0,
    temp: 24
  },
  {
    id: 'pool-02',
    name: 'POOL-02',
    category: 'Pool Table',
    status: 'AVAILABLE',
    hourlyRate: 199,
    specs: '8ft English Slate Pool Table, Strachan 6811 Fine Wool Cloth, Hand-spliced Ash Cues, Digital Scoreboard',
    installedGames: ['UK 8-Ball', 'Blackball Rules', 'Trickshot Practice'],
    location: 'Billiards Lounge South',
    totalUsageHours: 290,
    totalRevenue: 57710,
    ipAddress: '192.168.1.162',
    ping: 0,
    temp: 23
  },
  // Sim Racing Systems
  {
    id: 'sim-01',
    name: 'SIM-01',
    category: 'Sim Racing',
    status: 'AVAILABLE',
    hourlyRate: 349,
    specs: 'Fanatec Podium DD2 Direct Drive (25Nm Force Feedback), Heusinkveld Ultimate+ Hydraulic Pedals, Triple 32" 165Hz Curved Displays, Sparco Carbon Bucket Rig',
    installedGames: ['Assetto Corsa Competizione', 'iRacing', 'F1 24', 'Dirt Rally 2.0', 'Forza Motorsport'],
    location: 'Sim Racing Pit Row 1',
    totalUsageHours: 310,
    totalRevenue: 108190,
    ipAddress: '192.168.1.171',
    ping: 8,
    temp: 48
  },
  {
    id: 'sim-02',
    name: 'SIM-02',
    category: 'Sim Racing',
    status: 'AVAILABLE',
    hourlyRate: 349,
    specs: 'Moza Racing R16 Direct Drive Wheelbase, Formula FSR Dual-Clutch Steering Wheel, Load Cell Inverted Pedals, Next Level Racing Motion Plus 2DOF Platform',
    installedGames: ['F1 24', 'Assetto Corsa Competizione', 'Automobilista 2', 'Gran Turismo 7 PC'],
    location: 'Sim Racing Pit Row 2',
    totalUsageHours: 260,
    totalRevenue: 90740,
    ipAddress: '192.168.1.172',
    ping: 9,
    temp: 46
  }
];

export const INITIAL_ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: 'sess-pc01',
    systemId: 'pc-01',
    systemName: 'PC-01',
    customerId: 'cust-rahul',
    customerName: 'Rahul Verma',
    customerPhone: '+91 98765 43210',
    startTime: Date.now() - 2129000,
    endTime: Date.now() + 5071000,
    durationHours: 2,
    ratePerHour: 249,
    membershipUsedHours: 0,
    vipMembershipUsedHours: 0,
    foodItems: [{ id: 'fnb-1', name: 'Red Bull Energy Drink', price: 125, quantity: 1 }],
    foodTotal: 125,
    totalAmount: 623, // (2 * 249) + 125
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    employeeName: 'Vikram (Emp-01)',
    status: 'ACTIVE'
  },
  {
    id: 'sess-ps01',
    systemId: 'ps5-01',
    systemName: 'PS5-01',
    customerId: 'cust-aman',
    customerName: 'Aman Deep',
    customerPhone: '+91 99112 33445',
    startTime: Date.now() - 1070000,
    endTime: Date.now() + 2530000,
    durationHours: 1,
    ratePerHour: 199,
    membershipUsedHours: 0,
    vipMembershipUsedHours: 0,
    foodItems: [{ id: 'fnb-2', name: 'Crispy Peri Peri Fries', price: 110, quantity: 1 }],
    foodTotal: 110,
    totalAmount: 309,
    paymentStatus: 'PAID',
    paymentMethod: 'Cash',
    employeeName: 'Rohan (Emp-02)',
    status: 'ACTIVE'
  }
];

export const INITIAL_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan-premium',
    name: 'PREMIUM MEMBERSHIP',
    price: 3999,
    normalHours: 50,
    vipHours: 5,
    durationMonths: 3,
    benefits: [
      '50 Hours Normal Gaming (PlayStation, Xbox, Gaming PC)',
      '5 Hours VIP Luxury Room Gaming',
      '15% Flat Discount on F&B Menu',
      'Priority Booking & Waitlist Bypass',
      'Free Entry into Monthly Café Community Tournaments',
      'Dedicated High-Speed Discord VIP Role'
    ],
    status: 'ACTIVE'
  },
  {
    id: 'plan-basic',
    name: 'BASIC SQUAD PASS',
    price: 1899,
    normalHours: 20,
    vipHours: 2,
    durationMonths: 1,
    benefits: [
      '20 Hours Normal Gaming across PC & Consoles',
      '2 Hours VIP Gaming Suite access',
      '10% Discount on Café snacks & drinks',
      'Standard booking window access'
    ],
    status: 'ACTIVE'
  },
  {
    id: 'plan-pro',
    name: 'PRO ESPORTS ELITE',
    price: 6999,
    normalHours: 100,
    vipHours: 10,
    durationMonths: 6,
    benefits: [
      '100 Hours Normal Gaming (Top RTX 4090 Rigs Guaranteed)',
      '10 Hours VIP Suite or Streaming Studio',
      '20% Off all Café products & merch',
      'Free Team Registration in 1 Major Tournament',
      'Personal Gear Locker in Lounge'
    ],
    status: 'ACTIVE'
  }
];

export const INITIAL_CUSTOMER_MEMBERSHIP: CustomerMembership = {
  id: 'cm-andy',
  customerId: 'cust-andy',
  customerName: 'Andy Patel',
  planName: 'PREMIUM MEMBERSHIP',
  pricePaid: 3999,
  purchaseDate: '2026-08-15',
  expiryDate: '2026-11-15',
  normalHoursAllocated: 50,
  normalHoursUsed: 12,
  normalHoursRemaining: 38,
  vipHoursAllocated: 5,
  vipHoursUsed: 1,
  vipHoursRemaining: 4,
  status: 'ACTIVE'
};

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourn-val-01',
    title: 'Valorant Champions Night - Delhi NCR',
    game: 'Valorant',
    platform: 'PC',
    date: '2026-09-12',
    startTime: '16:00',
    endTime: '22:00',
    venue: 'Nexus Main Arena - LAN Stage',
    entryFeePerTeam: 4000,
    teamSize: 4,
    maxTeams: 16,
    registeredTeamsCount: 12,
    registrationDeadline: '2026-09-11 23:59',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScNexusValorantRegistration2026/viewform',
    prizePool: {
      first: 25000,
      second: 10000,
      third: 5000
    },
    status: 'REGISTRATION OPEN',
    rules: [
      'Standard 4v4 Swiftplay + Competitive tournament rules.',
      'All 4 players must be present at venue 30 minutes before match time.',
      'Bring your own peripherals (Mice/Keyboards/Headsets) allowed and encouraged.',
      'Any third-party script or unfair advantage leads to instant team disqualification.'
    ]
  },
  {
    id: 'tourn-bgmi-02',
    title: 'BGMI LAN Showdown Cup',
    game: 'BGMI',
    platform: 'Mobile',
    date: '2026-09-19',
    startTime: '15:00',
    endTime: '21:00',
    venue: 'Nexus Mobile Arena & Stage Lounge',
    entryFeePerTeam: 4000,
    teamSize: 4,
    maxTeams: 16,
    registeredTeamsCount: 10,
    registrationDeadline: '2026-09-18 20:00',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScNexusBGMILANRegistration2026/viewform',
    prizePool: {
      first: 24000,
      second: 12000,
      third: 4000
    },
    status: 'REGISTRATION OPEN',
    rules: [
      'Mobile devices only. Emulators, iPads, and triggers are strictly prohibited.',
      'All 4 members must play on local cafe 5GHz Wi-Fi with official referee check.'
    ]
  },
  {
    id: 'tourn-ff-03',
    title: 'Free Fire Speed Rush Cup',
    game: 'Free Fire',
    platform: 'Mobile',
    date: '2026-09-26',
    startTime: '17:00',
    endTime: '21:00',
    venue: 'Nexus Lounge Floor',
    entryFeePerTeam: 2000,
    teamSize: 4,
    maxTeams: 16,
    registeredTeamsCount: 16,
    registrationDeadline: '2026-09-25 18:00',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScNexusFreeFireCup2026/viewform',
    prizePool: {
      first: 15000,
      second: 8000,
      third: 3000
    },
    status: 'REGISTRATION CLOSED',
    rules: [
      'Clash Squad format, 4 members per team.',
      'Character skill presets restricted according to LAN referee rules.'
    ]
  }
];

export const INITIAL_TOURNAMENT_TEAMS: TournamentTeam[] = [
  {
    id: 'team-alpha',
    tournamentId: 'tourn-val-01',
    teamName: 'Team Phoenix Alpha',
    captainName: 'Aryan Sharma',
    captainPhone: '+91 98112 23344',
    captainEmail: 'aryan.phoenix@gmail.com',
    players: [
      { name: 'Aryan Sharma', gameId: 'PHX#Incur' },
      { name: 'Sameer Khan', gameId: 'ViperX#4412' },
      { name: 'Tanmay Bhatt', gameId: 'OmenGod#1337' },
      { name: 'Gaurav Rao', gameId: 'JettReaper#007' }
    ],
    registrationDate: '2026-09-02',
    paymentStatus: 'PAID',
    checkInStatus: 'CHECKED_IN',
    assignedStationRange: 'PC-01 to PC-04'
  },
  {
    id: 'team-ghost',
    tournamentId: 'tourn-val-01',
    teamName: 'Ghost Syndicate',
    captainName: 'Kunal Joshi',
    captainPhone: '+91 98777 88990',
    captainEmail: 'kunal.ghost@outlook.com',
    players: [
      { name: 'Kunal Joshi', gameId: 'Ghost#Prime' },
      { name: 'Rohan Mehra', gameId: 'Spectre#992' },
      { name: 'Devanshu Sen', gameId: 'Brimstone#601' },
      { name: 'Nikhil Roy', gameId: 'Chamber#202' }
    ],
    registrationDate: '2026-09-03',
    paymentStatus: 'PAID',
    checkInStatus: 'CHECKED_IN',
    assignedStationRange: 'PC-05 to PC-08'
  },
  {
    id: 'team-blaze',
    tournamentId: 'tourn-val-01',
    teamName: 'Blaze Vanguard',
    captainName: 'Manish Tyagi',
    captainPhone: '+91 97123 45678',
    captainEmail: 'manish.blaze@gmail.com',
    players: [
      { name: 'Manish Tyagi', gameId: 'Blaze#01' },
      { name: 'Aditya Pal', gameId: 'Sova#Arrow' },
      { name: 'Sahil Kapoor', gameId: 'Reyna#Devour' },
      { name: 'Harshit Gill', gameId: 'Cypher#Eye' }
    ],
    registrationDate: '2026-09-04',
    paymentStatus: 'PAID',
    checkInStatus: 'NOT_CHECKED_IN'
  },
  {
    id: 'team-immortal',
    tournamentId: 'tourn-val-01',
    teamName: 'Immortal Legends',
    captainName: 'Vivek Nair',
    captainPhone: '+91 99881 22334',
    captainEmail: 'vivek.nair@gmail.com',
    players: [
      { name: 'Vivek Nair', gameId: 'Immortal#Lead' },
      { name: 'Praveen Das', gameId: 'Sage#Heal' },
      { name: 'Varun Verma', gameId: 'Breach#Flash' },
      { name: 'Anirudh Roy', gameId: 'Fade#Haunt' }
    ],
    registrationDate: '2026-09-05',
    paymentStatus: 'PAID',
    checkInStatus: 'NOT_CHECKED_IN'
  }
];

export const INITIAL_TOURNAMENT_MATCHES: TournamentMatch[] = [
  {
    id: 'match-1',
    tournamentId: 'tourn-val-01',
    round: 'Quarterfinal',
    matchNumber: 1,
    teamA: 'Team Phoenix Alpha',
    teamB: 'Ghost Syndicate',
    scoreA: 13,
    scoreB: 11,
    winner: 'Team Phoenix Alpha',
    status: 'COMPLETED',
    stationInfo: 'PC-01 to PC-08'
  },
  {
    id: 'match-2',
    tournamentId: 'tourn-val-01',
    round: 'Quarterfinal',
    matchNumber: 2,
    teamA: 'Blaze Vanguard',
    teamB: 'Immortal Legends',
    scoreA: 8,
    scoreB: 13,
    winner: 'Immortal Legends',
    status: 'COMPLETED',
    stationInfo: 'PC-01 to PC-08'
  },
  {
    id: 'match-3',
    tournamentId: 'tourn-val-01',
    round: 'Semifinal',
    matchNumber: 3,
    teamA: 'Team Phoenix Alpha',
    teamB: 'Immortal Legends',
    scoreA: 0,
    scoreB: 0,
    status: 'LIVE',
    stationInfo: 'Main Stage Arena'
  },
  {
    id: 'match-4',
    tournamentId: 'tourn-val-01',
    round: 'Final',
    matchNumber: 4,
    teamA: 'Winner Match 3',
    teamB: 'TBD',
    scoreA: 0,
    scoreB: 0,
    status: 'UPCOMING',
    stationInfo: 'LAN Stage Finals'
  }
];

export const INITIAL_FNB_PRODUCTS: FnbProduct[] = [
  { id: 'fnb-1', name: 'Red Bull Energy Drink (250ml)', category: 'Drinks', price: 125, stock: 48, iconName: 'Zap' },
  { id: 'fnb-2', name: 'Monster Ultra Energy (350ml)', category: 'Drinks', price: 120, stock: 32, iconName: 'Zap' },
  { id: 'fnb-3', name: 'Cold Hazelnut Iced Coffee', category: 'Drinks', price: 90, stock: 24, iconName: 'Coffee' },
  { id: 'fnb-4', name: 'Coca-Cola Zero Sugar Can', category: 'Drinks', price: 50, stock: 60, iconName: 'GlassWater' },
  { id: 'fnb-5', name: 'Crispy Peri Peri French Fries', category: 'Snacks', price: 110, stock: 30, iconName: 'Utensils' },
  { id: 'fnb-6', name: 'Loaded Cheesy Gaming Nachos', category: 'Snacks', price: 150, stock: 25, iconName: 'Pizza' },
  { id: 'fnb-7', name: 'Crispy Double Chicken Burger', category: 'Food', price: 180, stock: 20, iconName: 'Utensils' },
  { id: 'fnb-8', name: 'Veggie Supreme Cheese Club Sandwich', category: 'Food', price: 140, stock: 18, iconName: 'Utensils' },
  { id: 'fnb-9', name: 'Esports Carbon Thumb Sleeves (Pair)', category: 'Accessories', price: 99, stock: 15, iconName: 'Shield' },
  { id: 'fnb-10', name: 'Anti-Slip Mouse Grip Tape Set', category: 'Accessories', price: 149, stock: 10, iconName: 'Mouse' }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-2026-101',
    customerId: 'cust-andy',
    customerName: 'Andy Patel',
    customerPhone: '+91 98991 12233',
    systemId: 'pc-02',
    systemName: 'PC-02',
    service: 'Gaming PC',
    date: '2026-09-06',
    startTime: '19:00',
    endTime: '21:00',
    durationHours: 2,
    applicableRate: 249,
    membershipUsedHours: 2,
    vipMembershipUsedHours: 0,
    discount: 0,
    foodTotal: 0,
    finalAmount: 0, // covered by membership
    paymentStatus: 'PAID',
    bookingStatus: 'UPCOMING',
    qrCode: 'NEXUS-BK-101-ANDY',
    createdAt: '2026-09-06 09:30'
  },
  {
    id: 'bk-2026-098',
    customerId: 'cust-siddharth',
    customerName: 'Siddharth Roy',
    customerPhone: '+91 97110 99887',
    systemId: 'pc-03',
    systemName: 'PC-03',
    service: 'Gaming PC',
    date: '2026-09-06',
    startTime: '19:00',
    endTime: '21:00',
    durationHours: 2,
    applicableRate: 249,
    membershipUsedHours: 0,
    vipMembershipUsedHours: 0,
    discount: 0,
    foodTotal: 0,
    finalAmount: 498,
    paymentStatus: 'PAID',
    bookingStatus: 'UPCOMING',
    qrCode: 'NEXUS-BK-098-SID',
    createdAt: '2026-09-06 11:10'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-8801',
    invoiceNumber: 'NEX-2026-8801',
    date: '2026-09-05',
    time: '21:30',
    customerName: 'Andy Patel',
    customerContact: '+91 98991 12233',
    bookingId: 'bk-2026-089',
    systemName: 'VIP-01 (Luxury Suite)',
    service: 'VIP Room',
    gameTitle: 'Grand Theft Auto VI (Early Demo)',
    startTime: '18:30',
    endTime: '20:30',
    durationHours: 2,
    ratePerHour: 499,
    membershipHoursUsed: 1, // 1 hr paid by VIP membership, 1 hr paid normally
    foodItems: [
      { name: 'Red Bull Energy Drink (250ml)', quantity: 2, price: 125 },
      { name: 'Loaded Cheesy Gaming Nachos', quantity: 1, price: 150 }
    ],
    discount: 0,
    subtotal: 899, // 499 (1 hr gaming) + 250 + 150
    gstTax: 45,
    total: 944,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    employeeName: 'Vikram (Emp-01)'
  },
  {
    id: 'inv-8795',
    invoiceNumber: 'NEX-2026-8795',
    date: '2026-09-03',
    time: '19:45',
    customerName: 'Andy Patel',
    customerContact: '+91 98991 12233',
    bookingId: 'bk-2026-074',
    systemName: 'PC-02',
    service: 'Gaming PC',
    gameTitle: 'Valorant',
    startTime: '16:45',
    endTime: '19:45',
    durationHours: 3,
    ratePerHour: 249,
    membershipHoursUsed: 2, // 2 hrs covered by Membership Pass
    foodItems: [
      { name: 'Crispy Peri Peri French Fries', quantity: 1, price: 110 },
      { name: 'Cold Hazelnut Iced Coffee', quantity: 1, price: 90 }
    ],
    discount: 0,
    subtotal: 449, // 1 hr paid (249) + 200 F&B
    gstTax: 22,
    total: 471,
    paymentMethod: 'Wallet',
    paymentStatus: 'PAID',
    employeeName: 'Rohan (Emp-02)'
  },
  {
    id: 'inv-8782',
    invoiceNumber: 'NEX-2026-8782',
    date: '2026-08-30',
    time: '21:00',
    customerName: 'Andy Patel',
    customerContact: '+91 98991 12233',
    bookingId: 'bk-2026-058',
    systemName: 'SIM-01',
    service: 'Sim Racing',
    gameTitle: 'Assetto Corsa Competizione',
    startTime: '19:00',
    endTime: '21:00',
    durationHours: 2,
    ratePerHour: 349,
    membershipHoursUsed: 0,
    foodItems: [
      { name: 'Monster Ultra Energy (350ml)', quantity: 1, price: 120 }
    ],
    discount: 0,
    subtotal: 818, // 698 + 120
    gstTax: 41,
    total: 859,
    paymentMethod: 'Card',
    paymentStatus: 'PAID',
    employeeName: 'Vikram (Emp-01)'
  },
  {
    id: 'inv-8760',
    invoiceNumber: 'NEX-2026-8760',
    date: '2026-08-26',
    time: '18:15',
    customerName: 'Andy Patel',
    customerContact: '+91 98991 12233',
    bookingId: 'bk-2026-042',
    systemName: 'PS5-01',
    service: 'PlayStation',
    gameTitle: 'EA Sports FC 25',
    startTime: '16:15',
    endTime: '18:15',
    durationHours: 2,
    ratePerHour: 199,
    membershipHoursUsed: 2, // fully covered by membership
    foodItems: [
      { name: 'Crispy Double Chicken Burger', quantity: 1, price: 180 },
      { name: 'Coca-Cola Zero Sugar Can', quantity: 1, price: 50 }
    ],
    discount: 0,
    subtotal: 230, // only F&B
    gstTax: 12,
    total: 242,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    employeeName: 'Vikram (Emp-01)'
  },
  {
    id: 'inv-8744',
    invoiceNumber: 'NEX-2026-8744',
    date: '2026-08-21',
    time: '22:00',
    customerName: 'Andy Patel',
    customerContact: '+91 98991 12233',
    bookingId: 'bk-2026-029',
    systemName: 'POOL-01',
    service: 'Pool Table',
    gameTitle: '9-Ball Tournament Rules',
    startTime: '20:00',
    endTime: '22:00',
    durationHours: 2,
    ratePerHour: 199,
    membershipHoursUsed: 0,
    foodItems: [
      { name: 'Veggie Supreme Cheese Club Sandwich', quantity: 1, price: 140 },
      { name: 'Red Bull Energy Drink (250ml)', quantity: 1, price: 125 }
    ],
    discount: 0,
    subtotal: 663, // 398 + 265
    gstTax: 33,
    total: 696,
    paymentMethod: 'Cash',
    paymentStatus: 'PAID',
    employeeName: 'Rohan (Emp-02)'
  },
  {
    id: 'inv-8802',
    invoiceNumber: 'NEX-2026-8802',
    date: '2026-09-05',
    time: '22:15',
    customerName: 'Karan Mehra',
    customerContact: '+91 98711 55667',
    bookingId: 'bk-2026-092',
    systemName: 'PS5-02',
    service: 'PlayStation',
    gameTitle: 'Marvel Spider-Man 2',
    startTime: '20:00',
    endTime: '22:00',
    durationHours: 2,
    ratePerHour: 199,
    membershipHoursUsed: 0,
    foodItems: [{ name: 'Coca-Cola Zero Sugar Can', quantity: 1, price: 50 }],
    discount: 0,
    subtotal: 448,
    gstTax: 22,
    total: 470,
    paymentMethod: 'Cash',
    paymentStatus: 'PAID',
    employeeName: 'Rohan (Emp-02)'
  }
];

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'wt-1',
    customerId: 'cust-andy',
    type: 'RECHARGE',
    amount: 2000,
    balanceAfter: 2000,
    timestamp: '2026-08-25 15:40',
    description: 'Wallet top-up via UPI'
  },
  {
    id: 'wt-2',
    customerId: 'cust-andy',
    type: 'FOOD',
    amount: -150,
    balanceAfter: 1850,
    timestamp: '2026-09-02 18:20',
    description: 'Cafe Snack Bar Order #FNB-412'
  }
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wl-1',
    customerName: 'Sameer Sehgal',
    customerPhone: '+91 98110 54321',
    service: 'Gaming PC',
    preferredTime: '19:30',
    durationHours: 2,
    queuePosition: 1,
    status: 'WAITING',
    joinedAt: '2026-09-06 17:15'
  }
];

export const INITIAL_EMPLOYEE_SHIFT: EmployeeShift = {
  id: 'shift-today',
  employeeName: 'Vikram Singh',
  shiftDate: '2026-09-06',
  startTime: '10:00',
  openingCash: 5000,
  cashSales: 1820,
  upiSales: 4350,
  cardSales: 1200,
  walletSales: 350,
  expenses: 250,
  status: 'OPEN'
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    user: 'Admin',
    role: 'ADMIN',
    action: 'PRICE_UPDATE',
    entity: 'Gaming PC',
    previousValue: '₹219/hr',
    newValue: '₹249/hr',
    timestamp: '2026-08-15 14:30'
  },
  {
    id: 'log-2',
    user: 'Vikram (Employee)',
    role: 'EMPLOYEE',
    action: 'SESSION_START',
    entity: 'PC-01',
    previousValue: 'AVAILABLE',
    newValue: 'ACTIVE (Rahul Verma, 2 hrs)',
    timestamp: '2026-09-06 15:30'
  },
  {
    id: 'log-3',
    user: 'Andy Patel',
    role: 'CUSTOMER',
    action: 'BOOKING_CREATE',
    entity: 'PC-02',
    newValue: 'Booking #bk-2026-101 for 19:00',
    timestamp: '2026-09-06 09:30'
  }
];
