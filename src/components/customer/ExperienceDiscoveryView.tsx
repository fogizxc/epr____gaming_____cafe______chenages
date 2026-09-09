import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { GamingServiceCategory, GamingSystem } from '../../types';
import {
  Gamepad2,
  Tv,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Sparkles,
  Wifi,
  Sliders,
  Flame,
  Star
} from 'lucide-react';

interface ExperienceDiscoveryViewProps {
  onOpenBooking: (category: GamingServiceCategory, systemId?: string) => void;
  onExploreGames?: (category: GamingServiceCategory) => void;
}

export const ExperienceDiscoveryView: React.FC<ExperienceDiscoveryViewProps> = ({
  onOpenBooking,
  onExploreGames
}) => {
  const { systems, requireLogin, openConsoleGames } = useCafe();
  const [selectedCategory, setSelectedCategory] = useState<GamingServiceCategory>('PS5');

  const categories: {
    id: GamingServiceCategory;
    title: string;
    subtitle: string;
    description: string;
    hourlyRate: number;
    videoUrl?: string;
    fallbackThumb: string;
    specsHighlight: string[];
    topGames: string[];
  }[] = [
    {
      id: 'PS5',
      title: 'Sony PlayStation 5 Arena',
      subtitle: '4K 120Hz Ultra HDR & DualSense Haptics',
      description: 'Experience console gaming at its apex on custom Sony BRAVIA 4K 120Hz gaming displays, DualSense wireless controllers with dynamic adaptive triggers, and 3D tempest audio headsets.',
      hourlyRate: 199,
      videoUrl: '/public/videos/ps5.mp4',
      fallbackThumb: '/public/videos/ps5_thumb.jpg',
      specsHighlight: [
        'Custom 4K 120Hz OLED Displays',
        'DualSense Adaptive Trigger Controllers',
        '3D Tempest Spatial Audio Headsets',
        '100+ PlayStation Studios Titles Pre-installed'
      ],
      topGames: ['Marvel\'s Spider-Man 2', 'God of War Ragnarök', 'Tekken 8', 'EA Sports FC 25', 'Ghost of Tsushima']
    },
    {
      id: 'Xbox',
      title: 'Xbox Series X Arena',
      subtitle: 'Game Pass Ultimate & Elite Controllers',
      description: 'Unleash 12 teraflops of raw processing power with Xbox Game Pass Ultimate. Play hundreds of premier titles with Xbox Elite Series 2 customizable paddles and Dolby Vision Atmos fidelity.',
      hourlyRate: 199,
      videoUrl: '/public/videos/xbox.mp4',
      fallbackThumb: '/public/videos/xbox_thumb.jpg',
      specsHighlight: [
        'Xbox Series X 12-Teraflop Hardware',
        'Xbox Elite Series 2 Adjustable Controllers',
        'Xbox Game Pass Ultimate Full Library',
        'Dolby Atmos & Spatial Audio'
      ],
      topGames: ['Forza Horizon 5', 'Halo Infinite', 'Starfield', 'Mortal Kombat 1', 'Cyberpunk 2077']
    },
    {
      id: 'Gaming PC',
      title: 'RTX 4090 Ultra Battle Rigs',
      tagline: 'Esports Tier-1 Competitive Hardware',
      description: 'Dominate competitive esports with top-spec liquid-cooled rigs. Featuring Intel Core i9 14900K and AMD Ryzen 7800X3D CPUs paired with NVIDIA GeForce RTX 4090 GPUs on 240Hz OLED monitors with 9ms fiber ping.',
      hourlyRate: 249,
      fallbackThumb: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop',
      specsHighlight: [
        'Intel Core i9 14900K / Ryzen 7 7800X3D',
        'NVIDIA GeForce RTX 4090 24GB VRAM',
        '240Hz 1440p QD-OLED 0.03ms Response',
        'Wooting 60HE & Zowie 8K Gaming Mice'
      ],
      topGames: ['Valorant', 'Counter-Strike 2', 'Apex Legends', 'Call of Duty Warzone', 'Dota 2']
    } as any,
    {
      id: 'Sim Racing',
      title: 'Fanatec Direct Drive Sim Racing',
      subtitle: 'Hydraulic Pedals & Motion Feedback',
      description: 'Step into the cockpit with professional Fanatec 8Nm direct drive force feedback wheels, load-cell hydraulic pedals, Sparco racing bucket seats, and ultra-wide surround vision.',
      hourlyRate: 349,
      videoUrl: '/public/videos/sim_racing.mp4',
      fallbackThumb: '/sim_racing_thumb.jpg',
      specsHighlight: [
        'Fanatec ClubSport DD 8Nm Direct Drive Wheel',
        'Load-Cell Hydraulic 3-Pedal Assembly',
        'Genuine Sparco Racing Rig & Cockpit Frame',
        'Triple-Monitor 144Hz Wrap-Around Display'
      ],
      topGames: ['Assetto Corsa Competizione', 'F1 24', 'iRacing', 'Forza Motorsport', 'Dirt Rally 2.0']
    },
    {
      id: 'VR',
      title: 'Room-Scale VR Holodeck',
      subtitle: 'Meta Quest 3 & Valve Index Full Tracking',
      description: 'Step inside the virtual realm with high-resolution 4K pancake lenses, 6DoF precision inside-out room tracking, and haptic motion controllers across a padded arena zone.',
      hourlyRate: 299,
      fallbackThumb: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=1200&auto=format&fit=crop',
      specsHighlight: [
        'Meta Quest 3 4K+ Infinite Display & Valve Index',
        'Full 360° Padded Arena Movement Space',
        'Dual Touch Pro Haptic Controllers',
        'Spatial Binaural 3D Audio Architecture'
      ],
      topGames: ['Beat Saber', 'Half-Life: Alyx', 'Superhot VR', 'Resident Evil 4 VR', 'Walkabout Mini Golf']
    },
    {
      id: 'VIP Room',
      title: 'Private Acoustic VIP Gaming Suite',
      subtitle: 'Private Room, PS5 + PC Dual Setup & Recliners',
      description: 'Host private squad sessions in an acoustic soundproof lounge. Features a 65" LG C3 4K 120Hz OLED, simultaneous PS5 & RTX 4090 PC battle rig, plush leather recliners, and dedicated café server assistance.',
      hourlyRate: 499,
      fallbackThumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop',
      specsHighlight: [
        'Acoustically Treated Soundproof Private Lounge',
        '65-Inch LG 4K 120Hz G-Sync OLED Television',
        'Simultaneous PS5 Pro & RTX 4090 PC Dual Rigs',
        'Plush Ergonomic Recliners & Dedicated Butler Service'
      ],
      topGames: ['Curated Flagship Catalog (PS5, Xbox & PC Combined)']
    },
    {
      id: 'Pool Table',
      title: 'Artisan Billiards & Sports Lounge',
      subtitle: 'Championship English Slate Pool Table',
      description: 'Take a break from digital screens with our tournament-grade 8ft English slate pool table, premium ash cues, Aramith tournament balls, and craft espresso beverages delivered tableside.',
      hourlyRate: 199,
      videoUrl: '/public/videos/pool_table.mp4',
      fallbackThumb: '/public/videos/pool_thumb.jpg',
      specsHighlight: [
        'Tournament 8-Foot Italian Slate Bed',
        'Strachan 6811 Tournament Cloth Felt',
        'Hand-Crafted Ash Cues & Aramith Balls',
        'Dedicated Lounge Seating with Café Dining Service'
      ],
      topGames: ['8-Ball Championship', '9-Ball Rotation', 'Straight Pool', 'Killer Pool']
    }
  ];

  const activeCategoryData = categories.find((c) => c.id === selectedCategory) || categories[0];

  // Systems matching currently selected category
  const matchingStations = systems.filter(
    (s) => s.category === selectedCategory || (selectedCategory === 'PS5' && s.category === 'PlayStation')
  );

  const availableCount = matchingStations.filter((s) => s.status === 'AVAILABLE').length;
  const activeCount = matchingStations.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div id="screen-experience-discovery" className="flex flex-col gap-8 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Hardware Arenas & Experiences
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Tv className="w-8 h-8 text-white/80" />
            <span>Discover Gaming Experiences</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-2xl">
            From tier-1 esports RTX 4090 rigs to PlayStation 5 4K OLED lounges and direct drive racing cockpits. Select your arena to review hardware specifications and live availability.
          </p>
        </div>

        <button
          onClick={() => {
            requireLogin(
              () => onOpenBooking(selectedCategory),
              `Please log in to reserve a ${selectedCategory} station.`
            );
          }}
          className="bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-xl transition flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer active:scale-98 self-start md:self-auto"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Book {activeCategoryData.title}</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = cat.id === selectedCategory;
          const matchCount = systems.filter(
            (s) => s.category === cat.id || (cat.id === 'PS5' && s.category === 'PlayStation')
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'bg-white/[0.04] hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              }`}
            >
              <span>{cat.id}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-black/10 text-black font-mono' : 'bg-white/10 text-white/60 font-mono'}`}>
                {matchCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Featured Arena Experience Showcase Card */}
      <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 overflow-hidden shadow-2xl flex flex-col lg:flex-row">
        {/* Left: Video / Media Preview */}
        <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-[440px] bg-black overflow-hidden flex items-center justify-center">
          {activeCategoryData.videoUrl ? (
            <video
              key={activeCategoryData.videoUrl}
              src={activeCategoryData.videoUrl}
              poster={activeCategoryData.fallbackThumb}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={activeCategoryData.fallbackThumb}
              alt={activeCategoryData.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-[#0c0c0c]/40 to-[#0c0c0c]" />

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white font-mono text-[10px] font-bold tracking-wider border border-white/20">
              ₹{activeCategoryData.hourlyRate} / hr
            </span>

            <span className={`px-3 py-1 rounded-full backdrop-blur-md font-mono text-[10px] font-bold tracking-wider border ${
              availableCount > 0
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              ● {availableCount} / {matchingStations.length} Stations Available Now
            </span>
          </div>
        </div>

        {/* Right: Technical Specs & Hardware Breakdown */}
        <div className="lg:w-1/2 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-500">
                Official Arena Fleet
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {activeCategoryData.title}
            </h2>

            <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed">
              {activeCategoryData.description}
            </p>

            {/* Hardware Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              {activeCategoryData.specsHighlight.map((spec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>

            {/* Top Games Installed */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block font-bold mb-2">
                Popular Titles Ready to Play
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeCategoryData.topGames.map((game, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80"
                  >
                    {game}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                requireLogin(
                  () => onOpenBooking(selectedCategory),
                  `Please log in to reserve ${activeCategoryData.title}.`
                );
              }}
              className="flex-1 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Book This Experience</span>
            </button>

            <button
              onClick={() => openConsoleGames(selectedCategory)}
              className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore All Games</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Fleet Stations Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span>Available {selectedCategory} Stations</span>
            <span className="text-xs font-mono font-normal text-white/50">({matchingStations.length} Total)</span>
          </h3>
          <span className="text-xs text-white/50">Click station to reserve slot directly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {matchingStations.map((station) => {
            const isAvailable = station.status === 'AVAILABLE';
            return (
              <div
                key={station.id}
                onClick={() => {
                  if (isAvailable) {
                    requireLogin(
                      () => onOpenBooking(station.category, station.id),
                      `Please log in to reserve ${station.name}.`
                    );
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isAvailable
                    ? 'bg-[#0e0e0e] hover:bg-[#141414] border-white/10 hover:border-white/30 cursor-pointer shadow-md'
                    : 'bg-[#090909] border-white/5 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm font-black text-white uppercase font-mono">{station.name}</span>
                  </div>

                  <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    isAvailable
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {station.status}
                  </span>
                </div>

                {/* Safe Specs */}
                <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed font-light">
                  {station.specs}
                </p>

                {/* Station metadata */}
                <div className="flex items-center justify-between text-[10px] text-white/40 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <strong className="text-white font-mono">{station.ping || 9}ms</strong>
                  </span>

                  <span className="font-mono text-white/90 font-bold">
                    ₹{station.hourlyRate}/hr
                  </span>
                </div>

                {isAvailable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requireLogin(
                        () => onOpenBooking(station.category, station.id),
                        `Please log in to reserve ${station.name}.`
                      );
                    }}
                    className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider transition text-center cursor-pointer"
                  >
                    Select Station
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
