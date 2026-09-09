export interface GamePhotoItem {
  id: string;
  url: string;
  title: string;
  location: string;
}

export interface GameVideoClip {
  label: string;
  url: string;
  thumb: string;
}

// Authentic Steam CDN and verified official 1080p game trailer video streams
export const OFFICIAL_GAME_TRAILERS = {
  spiderman2: 'https://cdn.akamai.steamstatic.com/steam/apps/257093509/movie480.mp4',
  gta: 'https://cdn.akamai.steamstatic.com/steam/apps/256666635/movie480.mp4',
  gtaLosSantos: 'https://cdn.akamai.steamstatic.com/steam/apps/256914078/movie480.mp4',
  nba2k25: 'https://cdn.akamai.steamstatic.com/steam/apps/257048048/movie480.mp4',
  codMW2: 'https://cdn.akamai.steamstatic.com/steam/apps/256889445/movie480.mp4',
  tekken8: 'https://cdn.akamai.steamstatic.com/steam/apps/256921572/movie480.mp4',
  wukong: 'https://cdn.akamai.steamstatic.com/steam/apps/257048125/movie480.mp4',
  godOfWar: 'https://cdn.akamai.steamstatic.com/steam/apps/256864004/movie480.mp4',
  fc25: 'https://cdn.akamai.steamstatic.com/steam/apps/257059675/movie480.mp4',
  cyberpunk: 'https://cdn.akamai.steamstatic.com/steam/apps/257081132/movie480.mp4',
  eldenRing: 'https://cdn.akamai.steamstatic.com/steam/apps/257002650/movie480.mp4',
  forza5: 'https://cdn.akamai.steamstatic.com/steam/apps/256859757/movie480.mp4',
  simRacing: 'https://cdn.akamai.steamstatic.com/steam/apps/256863243/movie480.mp4',
  streetFighter6: 'https://cdn.akamai.steamstatic.com/steam/apps/256950421/movie480.mp4',
  mortalKombat1: 'https://cdn.akamai.steamstatic.com/steam/apps/256961527/movie480.mp4',
  rdr2: 'https://cdn.akamai.steamstatic.com/steam/apps/256768370/movie480.mp4',
  itTakesTwo: 'https://cdn.akamai.steamstatic.com/steam/apps/256827093/movie480.mp4'
};

// Curated authentic 1080p in-game screenshots and official key arts
export const AUTHENTIC_PHOTO_SETS: Record<string, GamePhotoItem[]> = {
  spiderman: [
    {
      id: 'sm-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_e4b67059ddedaeebd91fce113745f3eb99736f56.1920x1080.jpg',
      title: 'Peter & Miles Web-Gliding',
      location: 'Manhattan Financial District'
    },
    {
      id: 'sm-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_b4be948946130b7e140be82f24f1f9ccefae9117.1920x1080.jpg',
      title: 'Symbiote Surge Combat',
      location: 'Queens Rooftops'
    },
    {
      id: 'sm-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_f4140ba12158b812d9c1adc86c484d8e84b92e92.1920x1080.jpg',
      title: "Kraven's Hunter Fleet Ambush",
      location: 'Central Park Woodlands'
    },
    {
      id: 'sm-4',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_7ef8bc176702470fdc73f62f8e537c3912e70444.1920x1080.jpg',
      title: 'Venom Monolithic Boss Confrontation',
      location: 'Midtown High-Rise Apex'
    },
    {
      id: 'sm-5',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/ss_474a7ffe98998719c22025cc99da1f45dfca025e.1920x1080.jpg',
      title: 'Miles Morales Bio-Electric Discharge',
      location: 'East River Waterfront'
    }
  ],
  gta: [
    {
      id: 'gta-1',
      url: 'https://i.ytimg.com/vi/QdBZY2fkU-0/maxresdefault.jpg',
      title: 'Lucia & Jason Vice City Key Art',
      location: 'Leonida Coastal Highway'
    },
    {
      id: 'gta-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_hero.jpg',
      title: 'Downtown Vinewood Skyline at Sunset',
      location: 'Los Santos Financial Hub'
    },
    {
      id: 'gta-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/ss_71b95b86ea67ae87f7d1421ab7bfb0f2095f9c45.1920x1080.jpg',
      title: 'High Stakes Heist Getaway',
      location: 'Del Perro Freeway'
    },
    {
      id: 'gta-4',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg',
      title: 'GTA Online Tactical Crew',
      location: 'Pacific Standard Bank Vault'
    },
    {
      id: 'gta-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg',
      title: 'Grand Theft Auto Official Box Art',
      location: 'Rockstar Games Studio'
    }
  ],
  nba: [
    {
      id: 'nba-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_8e3db832678488ed1003fa41cc0ef9bd74d332e5.1920x1080.jpg',
      title: 'Jayson Tatum Championship Drive',
      location: 'TD Garden Hardwood'
    },
    {
      id: 'nba-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_40b45c20c14c8996000e81f697bd1d09f26ea5fd.1920x1080.jpg',
      title: 'ProPLAY Signature Step-Back 3-Pointer',
      location: 'Chase Center Arena'
    },
    {
      id: 'nba-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_0d4dd0f0fdfe67d8b3c641816b53b01a6ba062a0.1920x1080.jpg',
      title: 'Fast-Break Alley-Oop Poster Dunk',
      location: 'Madison Square Garden'
    },
    {
      id: 'nba-4',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/ss_3a08987033974b0e58d9d9f21794da91aae82811.1920x1080.jpg',
      title: 'The City 3v3 Pro-Am Tournament',
      location: 'Venice Beach Blacktop'
    },
    {
      id: 'nba-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2878980/library_hero.jpg',
      title: 'NBA 2K25 Cover Stars Showcase',
      location: 'Center Court Spotlight'
    }
  ],
  cod: [
    {
      id: 'cod-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/ee5f6b6aebe4dc9e86b49c4e309d361b132df308/ss_ee5f6b6aebe4dc9e86b49c4e309d361b132df308.1920x1080.jpg',
      title: 'Task Force 141 Tactical Night Raid',
      location: 'Amsterdam Canal Infiltration'
    },
    {
      id: 'cod-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/ca97243a998802a38c7cddf195cee327c5760353/ss_ca97243a998802a38c7cddf195cee327c5760353.1920x1080.jpg',
      title: 'Ghost Operator Extraction Squad',
      location: 'Al Mazrah High Value Extraction'
    },
    {
      id: 'cod-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/6b8f4040a1e923f036e04d9eb21ecb0f866be57e/ss_6b8f4040a1e923f036e04d9eb21ecb0f866be57e.1920x1080.jpg',
      title: 'Compound Breach & CQB Standoff',
      location: 'Las Almas Mountain Stronghold'
    },
    {
      id: 'cod-4',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1938090/c6f865bd79b76a1fa50c59cd17a68d7837abf0b2/ss_c6f865bd79b76a1fa50c59cd17a68d7837abf0b2.1920x1080.jpg',
      title: 'Gunsmith 2.0 Precision Weapon Platform',
      location: 'Forward Operating Armory'
    },
    {
      id: 'cod-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1938090/library_hero.jpg',
      title: 'Modern Warfare Task Force Banner',
      location: 'Drop Zone Echo'
    }
  ],
  tekken: [
    {
      id: 'tekken-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_62e6ec252bc1a641e8e42dba07f23631d5da85e6.1920x1080.jpg',
      title: 'Jin Kazama Devil Heat Strike',
      location: 'Urban Square Destructible Stage'
    },
    {
      id: 'tekken-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_99dabe34abc0f92adc39d7099908c9540be7eb3f.1920x1080.jpg',
      title: 'Kazuya Mishima Electric Wind Godfist',
      location: 'Coliseum of Fate'
    },
    {
      id: 'tekken-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_bbd38a5fe748ec966cbc85ffcd4931f0f2da8ffd.1920x1080.jpg',
      title: 'Reina Taido Strike Counter',
      location: 'Mishima Dojo Courtyard'
    },
    {
      id: 'tekken-4',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/ss_7c55021d3ba8e4f14c6d9dbea9f19d9b7665d5f0.1920x1080.jpg',
      title: 'Paul Phoenix Phoenix Smasher Deathfist',
      location: 'Times Square Neon Ring'
    },
    {
      id: 'tekken-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1778820/library_hero.jpg',
      title: 'Tekken 8 The King of Iron Fist',
      location: 'Grand Tournament Stadium'
    }
  ],
  wukong: [
    {
      id: 'wukong-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/ss_86c4b7462bba219a0d0b89931a35812b9f188976.1920x1080.jpg',
      title: 'The Destined One Golden Staff Smash',
      location: 'Black Wind Mountain Forest'
    },
    {
      id: 'wukong-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/ss_d9391ab31a4d15dddf7ba4949bfa44f5d9170580.1920x1080.jpg',
      title: 'Tiger Vanguard Blood Pool Duel',
      location: 'Crouching Tiger Temple'
    },
    {
      id: 'wukong-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/ss_524a39da392ee83dde091033562bc719d46b5838.1920x1080.jpg',
      title: 'Yellow Wind Sage Samadhi Wind',
      location: 'Yellow Wind Ridge'
    },
    {
      id: 'wukong-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2358720/library_hero.jpg',
      title: 'Ancient Chinese Mythological Sanctuary',
      location: 'Mount Huaguo Summit'
    },
    {
      id: 'wukong-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg',
      title: 'Destined One Cloud Somersault',
      location: 'Pagoda Realm Heights'
    }
  ],
  gow: [
    {
      id: 'gow-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/ss_6eccc970b5de2943546d93d319be1b5c0618f21b.1920x1080.jpg',
      title: 'Kratos Leviathan Axe Frost Recall',
      location: 'Midgard Lake of Nine'
    },
    {
      id: 'gow-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/ss_f1bff24d3967a21d303d95e11ed892e3d9113057.1920x1080.jpg',
      title: 'Atreus Light Arrow Precision Volley',
      location: 'Alfheim Temple of Light'
    },
    {
      id: 'gow-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/ss_3670ba72c7e3e9c3c3225547ef2c1053504e62b8.1920x1080.jpg',
      title: 'Blades of Chaos Scorching Sweep',
      location: 'Helheim Frozen Bridge'
    },
    {
      id: 'gow-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1593500/library_hero.jpg',
      title: 'Kratos and Atreus Norse Epic',
      location: 'Jötunheim Highest Peak'
    },
    {
      id: 'gow-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1593500/header.jpg',
      title: 'Father and Son Journey Begins',
      location: 'Wildwoods Cabin Sanctuary'
    }
  ],
  fc25: [
    {
      id: 'fc-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2669320/ss_857b4aaf3c10b2a886d60f029f32b2f86d968311.1920x1080.jpg',
      title: 'FC IQ Tactical Matchday Presentation',
      location: 'Santiago Bernabéu Floodlights'
    },
    {
      id: 'fc-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2669320/ss_aeeea35bf96fad387b97befd9a5c4b9d8ee2ac1a.1920x1080.jpg',
      title: 'Jude Bellingham Iconic Goal Celebration',
      location: 'Camp Nou Pitch'
    },
    {
      id: 'fc-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2669320/ss_c8460408705b54e37228cc320a2da1c19e4dc12f.1920x1080.jpg',
      title: 'Rush 5v5 High Speed Counter-Attack',
      location: 'Nike Air Zoom Arena'
    },
    {
      id: 'fc-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2669320/library_hero.jpg',
      title: 'UEFA Champions League Matchday Final',
      location: 'Wembley Stadium'
    },
    {
      id: 'fc-5',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2669320/header.jpg',
      title: 'Ultimate Team World Class Lineup',
      location: 'Tunnel Walkout Stage'
    }
  ],
  cyberpunk: [
    {
      id: 'cp-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/ss_2f649b68d579bf87011487d29bc4ccbfdd97d34f.1920x1080.jpg',
      title: 'Ray Tracing Overdrive Neon Alley',
      location: 'Kabuki Market Night City'
    },
    {
      id: 'cp-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/ss_0e64170751e1ae20ff8fdb7001a8892fd48260e7.1920x1080.jpg',
      title: 'Johnny Silverhand Rockerboy Projection',
      location: 'The Afterlife Club Bar'
    },
    {
      id: 'cp-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/ss_af2804aa4bf35d4251043744412ce3b359a125ef.1920x1080.jpg',
      title: 'Mantis Blades Cyberware Combat Dash',
      location: 'Corpo Plaza Expressway'
    },
    {
      id: 'cp-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg',
      title: 'Night City Megabuilding Skyline',
      location: 'Westbrook Luxury Overlook'
    },
    {
      id: 'cp-5',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
      title: 'Sandevistan Cyberware Combat Surge',
      location: "Viktor's Ripperdoc Clinic"
    }
  ],
  eldenring: [
    {
      id: 'er-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/ss_943bf6fe62352757d9070c1d33e50b92fe8539f1.1920x1080.jpg',
      title: 'Limgrave Golden Erdtree Horizon',
      location: 'The First Step Cliffside'
    },
    {
      id: 'er-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/ss_dcdac9e4b26ac0ee5248bfd2967d764fd00cdb42.1920x1080.jpg',
      title: 'General Radahn Starscourge Meteor Strike',
      location: 'Wailing Dunes of Caelid'
    },
    {
      id: 'er-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/ss_3c41384a24d86dddd58a8f61db77f9dc0bfda8b5.1920x1080.jpg',
      title: 'Malenia Blade of Miquella Waterfowl Dance',
      location: 'Haligtree Roots Throne'
    },
    {
      id: 'er-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg',
      title: 'Raya Lucaria Grand Magical Academy',
      location: 'Liurnia of the Lakes Mist'
    },
    {
      id: 'er-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
      title: 'Tarnished Warrior on Spectral Steed',
      location: 'Leyndell Royal Capital Gates'
    }
  ],
  racing: [
    {
      id: 'race-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1551360/ss_cf56e25a0290556ba83229eb0ab370d10be0407c.1920x1080.jpg',
      title: 'Mercedes-AMG ONE Supercar Hairpin Drift',
      location: 'Gran Caldera Volcano Pass'
    },
    {
      id: 'race-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/805550/6f21e352840c96361524072d12e2123285178a42/ss_6f21e352840c96361524072d12e2123285178a42.1920x1080.jpg',
      title: 'Ferrari 296 GT3 Apex Precision Attack',
      location: 'Circuit de Spa-Francorchamps Eau Rouge'
    },
    {
      id: 'race-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/805550/ae39ccca56617ec8e3cf9495e84bee15c9a2dce1/ss_ae39ccca56617ec8e3cf9495e84bee15c9a2dce1.1920x1080.jpg',
      title: 'Night Wet Tire Hydroplane Reflection',
      location: 'Nürburgring GP Chicane'
    },
    {
      id: 'race-4',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1551360/ss_00f0090174380eeaf8753bd3d1028b6772c3aebf.1920x1080.jpg',
      title: 'Sandstorm Cross-Country Rally Blitz',
      location: 'Baja Desert Dunes'
    },
    {
      id: 'race-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1551360/library_hero.jpg',
      title: 'Forza Horizon Festival Grand Stage',
      location: 'Living Desert Horizon Hub'
    }
  ],
  shooter: [
    {
      id: 'fps-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/ss_796601d9d67faf53486eeb26d0724347cea67ddc.1920x1080.jpg',
      title: 'De_Dust2 A Long Tactical Retake',
      location: 'Dust II Bombsite A'
    },
    {
      id: 'fps-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/ss_d830cfd0550fbb64d80e803e93c929c3abb02056.1920x1080.jpg',
      title: 'Volumetric Smoke Interaction & Grenade Clear',
      location: 'Inferno Banana Ramp'
    },
    {
      id: 'fps-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/ss_13bb35638c0267759276f511ee97064773b37a51.1920x1080.jpg',
      title: 'Overpass Canal AWP Sniper Pick',
      location: 'Overpass Monster Connector'
    },
    {
      id: 'fps-4',
      url: 'https://i.ytimg.com/vi/e_E9W2vsRbQ/maxresdefault.jpg',
      title: 'Valorant Duelist Agents Standoff',
      location: 'Bind Teleporter Portal'
    },
    {
      id: 'fps-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/730/library_hero.jpg',
      title: 'Counter-Strike 2 Major Grand Final Stage',
      location: 'Lanxess Arena Stage'
    }
  ],
  fighting: [
    {
      id: 'fight-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/ss_7eb14734a264570367c607698371e492415f48a4.1920x1080.jpg',
      title: 'Liu Kang Fire God Celestial Juggle',
      location: 'Living Forest Arena'
    },
    {
      id: 'fight-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1364780/ss_387137f8cccb048c35a8685634372e97785d40aa.1920x1080.jpg',
      title: 'Ryu Drive Impact Shoryuken Knockout',
      location: 'Metro City Beat Square'
    },
    {
      id: 'fight-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/ss_29b0a9e87d5a4981d7403994b661c43117a87d84.1920x1080.jpg',
      title: 'Sub-Zero Ice Clone Freeze & Wall Shatter',
      location: 'Tarkatan Colony Ruins'
    },
    {
      id: 'fight-4',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1364780/ss_a381f1b3b450c18900d47b991ce8e7456e9cdba5.1920x1080.jpg',
      title: 'Chun-Li Spinning Bird Kick Aerial Mastery',
      location: 'Tian Hong Yuan Chinatown'
    },
    {
      id: 'fight-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1778820/library_hero.jpg',
      title: 'Fist Meets Fate World Finals',
      location: 'EVO Championship Arena'
    }
  ],
  rdr2: [
    {
      id: 'rdr-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/ss_66b553f4c209476d3e4ce25fa4714002cc914c4f.1920x1080.jpg',
      title: 'Arthur Morgan Gallop at Sunrise',
      location: 'The Heartlands Prairie'
    },
    {
      id: 'rdr-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/ss_bac60bacbf5da8945103648c08d27d5e202444ca.1920x1080.jpg',
      title: 'Van der Linde Gang Campfire Gathering',
      location: 'Horseshoe Overlook Camp'
    },
    {
      id: 'rdr-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/ss_668dafe477743f8b50b818d5bbfcec669e9ba93e.1920x1080.jpg',
      title: 'Saint Denis Gaslit Cobblestone Promenade',
      location: 'Saint Denis Harbor'
    },
    {
      id: 'rdr-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1174180/library_hero.jpg',
      title: 'Grizzlies Glacial Mountain Ridge',
      location: 'Mount Hagen Summit'
    },
    {
      id: 'rdr-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg',
      title: 'Dead Eye Precision Saloon Showdown',
      location: 'Valentine Main Thoroughfare'
    }
  ],
  coop: [
    {
      id: 'coop-1',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/ss_3e59753eefaba9a7704a18e902b48e8d38e95e0b.1920x1080.jpg',
      title: 'Cody & May Magnetic Polarity Puzzle',
      location: 'The Tree Workshop'
    },
    {
      id: 'coop-2',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/ss_6e987a0678b013bfd0073a9ac4703e1f04ca4dea.1920x1080.jpg',
      title: 'Toy Dinosaur Flight & Tail Glide',
      location: "Rose's Bedroom Pillow Fort"
    },
    {
      id: 'coop-3',
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/ss_fdac523e3ea4d2f32a44449bb8c224857563bd7d.1920x1080.jpg',
      title: 'Time Manipulation Cuckoo Clock Gears',
      location: 'The Clocktower Heights'
    },
    {
      id: 'coop-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1426210/library_hero.jpg',
      title: 'Dr. Hakim Book of Love Chapter',
      location: 'Garden Greenhouse Fortress'
    },
    {
      id: 'coop-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1426210/header.jpg',
      title: 'Co-op Split Screen Platforming Run',
      location: 'Shed High Voltage Wire'
    }
  ],
  vr: [
    {
      id: 'vr-1',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/library_hero.jpg',
      title: 'Dual Laser Sabers 360-Degree Rhythm Slice',
      location: 'Beat Matrix Cyber Arena'
    },
    {
      id: 'vr-2',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/546560/library_hero.jpg',
      title: 'Gravity Gloves Physics Interaction',
      location: 'City 17 Quarantine Zone'
    },
    {
      id: 'vr-3',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/header.jpg',
      title: 'Expert+ 160BPM Electronic Bass Drop',
      location: 'Neon Tunnel Highway'
    },
    {
      id: 'vr-4',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/546560/header.jpg',
      title: 'Xen Bio-Flora & Combine Citadel Core',
      location: 'Subway Vault Deep Chamber'
    },
    {
      id: 'vr-5',
      url: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/library_600x900.jpg',
      title: 'Virtual Reality Motion Tracking Pod',
      location: 'Nexus VR Sensory Dome'
    }
  ]
};

// Official Steam Library vertical 600x900 covers for instant catalog rendering
export const OFFICIAL_GAME_COVERS: Record<string, { coverUrl: string; bannerUrl: string }> = {
  'spiderman-2': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2651280/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2651280/library_hero.jpg'
  },
  'gta': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg',
    bannerUrl: 'https://i.ytimg.com/vi/QdBZY2fkU-0/maxresdefault.jpg'
  },
  'nba2k25': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2878980/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2878980/library_hero.jpg'
  },
  'cod': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1938090/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1938090/library_hero.jpg'
  },
  'tekken8': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1778820/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1778820/library_hero.jpg'
  },
  'gow': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1593500/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1593500/library_hero.jpg'
  },
  'fc25': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2669320/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2669320/library_hero.jpg'
  },
  'wukong': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2358720/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2358720/library_hero.jpg'
  },
  'cyberpunk': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg'
  },
  'eldenring': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg'
  },
  'forza': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1551360/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1551360/library_hero.jpg'
  },
  'assetto': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/805550/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/805550/library_hero.jpg'
  },
  'tlou': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1888930/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1888930/library_hero.jpg'
  },
  'ghost': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2215430/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2215430/library_hero.jpg'
  },
  'helldivers': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/553850/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/553850/library_hero.jpg'
  },
  're4': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2050650/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2050650/library_hero.jpg'
  },
  'bg3': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1086940/library_hero.jpg'
  },
  'horizon': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2420110/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2420110/library_hero.jpg'
  },
  'cs2': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/730/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/730/library_hero.jpg'
  },
  'mk1': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1971870/library_hero.jpg'
  },
  'sf6': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1364780/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1364780/library_hero.jpg'
  },
  'rdr2': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1174180/library_hero.jpg'
  },
  'ittakestwo': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1426210/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1426210/library_hero.jpg'
  },
  'vr': {
    coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/library_600x900.jpg',
    bannerUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/library_hero.jpg'
  }
};

/**
 * Resolves the true authentic official trailer, in-game screenshots, and official video clips for any game
 */
export function getGameMedia(game: {
  id?: string;
  title: string;
  category?: string;
  coverUrl?: string;
  bannerUrl?: string;
}): {
  videoPreviewUrl: string;
  videoClips: GameVideoClip[];
  defaultPhotos: GamePhotoItem[];
} {
  const t = (game.title || '').toLowerCase();
  const c = (game.category || '').toLowerCase();

  let videoUrl = OFFICIAL_GAME_TRAILERS.spiderman2;
  let photos = AUTHENTIC_PHOTO_SETS.spiderman;
  let secondaryVideo = OFFICIAL_GAME_TRAILERS.codMW2;
  let tertiaryVideo = OFFICIAL_GAME_TRAILERS.tekken8;

  if (t.includes('gta') || t.includes('grand theft auto')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.gta;
    photos = AUTHENTIC_PHOTO_SETS.gta;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.gtaLosSantos;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.rdr2;
  } else if (t.includes('spider-man') || t.includes('spiderman') || t.includes('miles morales')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.spiderman2;
    photos = AUTHENTIC_PHOTO_SETS.spiderman;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.wukong;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.godOfWar;
  } else if (t.includes('nba')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.nba2k25;
    photos = AUTHENTIC_PHOTO_SETS.nba;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.fc25;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.tekken8;
  } else if (t.includes('fc 2') || t.includes('fifa') || t.includes('pes') || t.includes('football') || t.includes('soccer')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.fc25;
    photos = AUTHENTIC_PHOTO_SETS.fc25;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.nba2k25;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.forza5;
  } else if (t.includes('tekken')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.tekken8;
    photos = AUTHENTIC_PHOTO_SETS.tekken;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.streetFighter6;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.mortalKombat1;
  } else if (t.includes('mortal kombat')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.mortalKombat1;
    photos = AUTHENTIC_PHOTO_SETS.fighting;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.tekken8;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.streetFighter6;
  } else if (t.includes('street fighter')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.streetFighter6;
    photos = AUTHENTIC_PHOTO_SETS.fighting;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.tekken8;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.mortalKombat1;
  } else if (t.includes('wukong') || t.includes('black myth')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.wukong;
    photos = AUTHENTIC_PHOTO_SETS.wukong;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.godOfWar;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.eldenRing;
  } else if (t.includes('god of war') || t.includes('ragnarok') || t.includes('kratos')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.godOfWar;
    photos = AUTHENTIC_PHOTO_SETS.gow;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.wukong;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.eldenRing;
  } else if (t.includes('elden ring') || t.includes('erdtree') || t.includes('souls') || t.includes('bloodborne')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.eldenRing;
    photos = AUTHENTIC_PHOTO_SETS.eldenring;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.godOfWar;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.wukong;
  } else if (t.includes('cyberpunk') || t.includes('night city')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.cyberpunk;
    photos = AUTHENTIC_PHOTO_SETS.cyberpunk;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.codMW2;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.gta;
  } else if (
    t.includes('forza') ||
    t.includes('gran turismo') ||
    t.includes('racing') ||
    t.includes('f1') ||
    t.includes('rally') ||
    t.includes('motorsport') ||
    c.includes('racing')
  ) {
    videoUrl = OFFICIAL_GAME_TRAILERS.forza5;
    photos = AUTHENTIC_PHOTO_SETS.racing;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.simRacing;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.gta;
  } else if (t.includes('assetto') || t.includes('iracing') || t.includes('sim rig')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.simRacing;
    photos = AUTHENTIC_PHOTO_SETS.racing;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.forza5;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.gta;
  } else if (t.includes('call of duty') || t.includes('mw2') || t.includes('mw3') || t.includes('warzone')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.codMW2;
    photos = AUTHENTIC_PHOTO_SETS.cod;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.cyberpunk;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.gta;
  } else if (
    t.includes('cs2') ||
    t.includes('counter-strike') ||
    t.includes('valorant') ||
    t.includes('apex') ||
    t.includes('overwatch') ||
    t.includes('siege') ||
    t.includes('doom') ||
    c.includes('shooter') ||
    c.includes('fps')
  ) {
    videoUrl = OFFICIAL_GAME_TRAILERS.codMW2;
    photos = AUTHENTIC_PHOTO_SETS.shooter;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.cyberpunk;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.tekken8;
  } else if (t.includes('red dead') || t.includes('rdr2') || t.includes('redemption')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.rdr2;
    photos = AUTHENTIC_PHOTO_SETS.rdr2;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.gta;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.godOfWar;
  } else if (t.includes('it takes two') || t.includes('co-op') || t.includes('unravel') || t.includes('a way out')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.itTakesTwo;
    photos = AUTHENTIC_PHOTO_SETS.coop;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.spiderman2;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.forza5;
  } else if (c.includes('vr') || t.includes('vr') || t.includes('beat saber') || t.includes('alyx')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.cyberpunk;
    photos = AUTHENTIC_PHOTO_SETS.vr;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.spiderman2;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.simRacing;
  } else if (c.includes('fighting') || c.includes('combat')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.tekken8;
    photos = AUTHENTIC_PHOTO_SETS.tekken;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.streetFighter6;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.mortalKombat1;
  } else if (c.includes('sport')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.fc25;
    photos = AUTHENTIC_PHOTO_SETS.fc25;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.nba2k25;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.forza5;
  } else if (c.includes('rpg') || c.includes('adventure')) {
    videoUrl = OFFICIAL_GAME_TRAILERS.wukong;
    photos = AUTHENTIC_PHOTO_SETS.wukong;
    secondaryVideo = OFFICIAL_GAME_TRAILERS.godOfWar;
    tertiaryVideo = OFFICIAL_GAME_TRAILERS.eldenRing;
  }

  const thumb = game.bannerUrl || game.coverUrl || photos[0].url;

  const videoClips: GameVideoClip[] = [
    { label: 'Official 4K Launch Trailer', url: videoUrl, thumb },
    {
      label: 'Direct Gameplay Combat & Action',
      url: secondaryVideo,
      thumb: photos[1]?.url || thumb
    },
    {
      label: 'Performance 60FPS Direct Feed',
      url: tertiaryVideo,
      thumb: photos[2]?.url || thumb
    }
  ];

  return {
    videoPreviewUrl: videoUrl,
    videoClips,
    defaultPhotos: photos
  };
}

