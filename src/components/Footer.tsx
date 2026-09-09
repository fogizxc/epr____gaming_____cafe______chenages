import React, { useState } from 'react';
import {
  Palette,
  Briefcase,
  Lightbulb,
  Megaphone,
  BookOpen,
  Info,
  HelpCircle,
  X,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Coffee,
  Gamepad2,
  Instagram,
  Twitter,
  Facebook,
  Share2
} from 'lucide-react';

export type FooterModalTopic =
  | 'designers'
  | 'hire'
  | 'inspiration'
  | 'advertising'
  | 'blog'
  | 'about'
  | 'support';

interface FooterTopicContent {
  id: FooterModalTopic;
  label: string;
  badge: string;
  icon: React.ReactNode;
  headline: string;
  summary: string;
  items: {
    title: string;
    description: string;
    tag?: string;
  }[];
  ctaText: string;
  ctaActionDescription: string;
}

const FOOTER_TOPICS_DATA: Record<FooterModalTopic, FooterTopicContent> = {
  designers: {
    id: 'designers',
    label: 'For designers',
    badge: 'Design System & Creative Assets',
    icon: <Palette className="w-5 h-5 text-purple-400" />,
    headline: 'Created for Digital Artists, UI Designers & Creators',
    summary:
      'We value craft and visual precision. Access Bytes & Brew design assets, Figma design kits, color swatches, 3D workstation renders, and high-framerate stream overlay packs.',
    items: [
      {
        title: 'Cyberpunk & Minimal Dark UI Kit',
        description: 'Complete Tailwind tokens, custom typography scales (Plus Jakarta Sans & Space Grotesk), and vector badge components.',
        tag: 'Figma UI Pack'
      },
      {
        title: 'Streamer & Creator Overlay Assets',
        description: 'Clean OBS and Twitch overlays with live station status indicators and tournament bracket graphics.',
        tag: '1080p / 4K Assets'
      },
      {
        title: 'Official Vector Logo & Brandmark',
        description: 'SVG and high-res transparent PNGs of Bytes & Brew icon, wordmark, and neon badges.',
        tag: 'Vector SVG'
      }
    ],
    ctaText: 'Download Brand Guidelines',
    ctaActionDescription: 'Official design pack ready for community projects.'
  },
  hire: {
    id: 'hire',
    label: 'Hire talent',
    badge: 'Careers & Recruitment',
    icon: <Briefcase className="w-5 h-5 text-emerald-400" />,
    headline: 'Build the Future of Gaming & Cafe Culture',
    summary:
      'Join our high-energy team at Bytes & Brew. We are actively hiring esports tournament coordinators, artisan baristas, hardware rig technicians, and hospitality staff.',
    items: [
      {
        title: 'Senior Hardware & Rig Technician',
        description: 'Manage 40+ liquid-cooled RTX 4090 rigs, optical LAN networking, driver deployments, and tournament anti-cheat systems.',
        tag: 'Full-Time • On-Site'
      },
      {
        title: 'Specialty Coffee Barista & Roaster',
        description: 'Craft single-origin espressos, 16-hour steeped cold brews, and manage high-volume station beverage service.',
        tag: 'Full-Time • Shift Based'
      },
      {
        title: 'Esports Tournament Caster & Host',
        description: 'Shoutcast weekly Valorant, EA FC, and Tekken 8 cups. Coordinate team registrations and spectator streams.',
        tag: 'Contract • Weekends'
      }
    ],
    ctaText: 'Submit Your Application',
    ctaActionDescription: 'Send your portfolio or CV to careers@bytesandbrew.com'
  },
  inspiration: {
    id: 'inspiration',
    label: 'Inspiration',
    badge: 'Showcase & Battlestations',
    icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
    headline: 'Aesthetic Setups, Custom Rigs & Cafe Vibe',
    summary:
      'Get inspired by the aesthetic intersection of minimalist industrial architecture, ambient low-strain lighting, clean cable management, and specialty coffee craftsmanship.',
    items: [
      {
        title: 'Matte Stealth Battlestations',
        description: 'Custom acoustic baffling with diffuse 2700K warm backlighting to eliminate eye fatigue during extended gaming sessions.',
        tag: 'Ergonomic Design'
      },
      {
        title: 'Triple-Screen Motion Sim Cockpits',
        description: 'Trak Racer direct-drive Fanatec wheel rigs with tactile bass shakers and 144Hz curved displays for realistic racing.',
        tag: 'Sim Racing'
      },
      {
        title: 'Artisan Pour-Over & Cold Brew Lab',
        description: 'Slow-drip Japanese cold brew towers showcased on natural slate countertops right alongside pro gaming arenas.',
        tag: 'Coffee Craft'
      }
    ],
    ctaText: 'Explore Community Gallery',
    ctaActionDescription: 'Tag #BytesAndBrew on social media to be featured.'
  },
  advertising: {
    id: 'advertising',
    label: 'Advertising',
    badge: 'Sponsorship & Media',
    icon: <Megaphone className="w-5 h-5 text-pink-400" />,
    headline: 'Reach Thousands of Engaged Gamers & Tech Enthusiasts',
    summary:
      'Partner with Bytes & Brew to showcase your brand across our physical arena displays, tournament broadcast streams, branded custom rigs, and specialty beverage menus.',
    items: [
      {
        title: 'Tournament Title Sponsorship',
        description: 'Naming rights for weekly community cups, banner placements across stadium displays, and branded prize pool trophies.',
        tag: 'Esports Events'
      },
      {
        title: 'In-Arena Digital Signage & Desktop Takeovers',
        description: 'Dedicated sponsor branding on station desktop launchers and high-visibility 4K spectator walls.',
        tag: 'Digital Displays'
      },
      {
        title: 'Product Sampling & Peripheral Showcases',
        description: 'Place your latest gaming mice, keyboards, or headsets directly in front of tournament players for real-world testing.',
        tag: 'Hardware Demos'
      }
    ],
    ctaText: 'Request Media Kit',
    ctaActionDescription: 'Get rates, demographics, and sponsorship packages.'
  },
  blog: {
    id: 'blog',
    label: 'Blog',
    badge: 'Dispatches & Hardware Lab',
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    headline: 'News, Hardware Benchmarks & Coffee Dispatches',
    summary:
      'In-depth articles from our technicians and head barista covering frame-pacing optimization, esports tournament recaps, and bean origin spotlights.',
    items: [
      {
        title: 'Optimizing RTX 4090 Rigs for Sub-3ms Frame Times',
        description: 'A deep dive into kernel optimization, custom NVIDIA profile settings, and optical LAN tuning for competitive esports.',
        tag: 'Hardware Lab • 6 min read'
      },
      {
        title: 'Why 16-Hour Cold Brew is the Ultimate Gaming Fuel',
        description: 'How smooth acidity, high extraction, and natural caffeine balance avoid sugar crashes during intense 5v5 tournaments.',
        tag: 'Coffee Science • 4 min read'
      },
      {
        title: 'Bytes & Brew Spring Cup Finals: Tournament Breakdown',
        description: 'Relive the nail-biting overtime rounds, MVP clutch moments, and champion squad highlights from our LAN stage.',
        tag: 'Esports Recap • 5 min read'
      }
    ],
    ctaText: 'Read Latest Articles',
    ctaActionDescription: 'Updated weekly by our in-house editorial squad.'
  },
  about: {
    id: 'about',
    label: 'About',
    badge: 'Our Story & Sanctuary',
    icon: <Info className="w-5 h-5 text-cyan-400" />,
    headline: 'Where High-Octane Gaming Meets Artisan Coffee',
    summary:
      'Bytes & Brew was created for gamers, creators, and coffee purists who refuse to compromise on either hardware or flavor. We pair 40+ tournament-grade stations with a specialty espresso bar and kitchen.',
    items: [
      {
        title: 'Tournament-Grade Apex Hardware',
        description: 'Intel i9 & Ryzen 7800X3D CPUs, RTX 4090 GPUs, 240Hz/360Hz displays, low-latency fiber, and Herman Miller/Secretlab seating.',
        tag: 'Esports Standard'
      },
      {
        title: 'Direct-to-Station F&B Service',
        description: 'Order single-origin coffee, energy refreshers, smash burgers, and loaded fries directly from your rig with zero match disruption.',
        tag: 'In-Game Delivery'
      },
      {
        title: 'Inclusive Community Sanctuary',
        description: 'From casual multiplayer sessions to high-stakes LAN tournaments, all skill levels and enthusiasts are celebrated.',
        tag: 'Community First'
      }
    ],
    ctaText: 'Visit Our Arena',
    ctaActionDescription: 'Open 10:00 AM to 02:00 AM daily (Late night weekends till 04:00 AM).'
  },
  support: {
    id: 'support',
    label: 'Support',
    badge: '24/7 Concierge & Assistance',
    icon: <HelpCircle className="w-5 h-5 text-rose-400" />,
    headline: 'How Can We Help You Today?',
    summary:
      'Our on-site crew and support team are here to assist with station bookings, tournament registration, account balances, hardware troubleshooting, or private event reservations.',
    items: [
      {
        title: 'Station Reservation & Rescheduling',
        description: 'Modify or extend active gaming sessions, apply prepaid hours, or reserve private team bootcamps.',
        tag: 'Booking Concierge'
      },
      {
        title: 'Hardware & Peripheral Assistance',
        description: 'Assistance with custom DPI settings, headphone audio routing, controller pairing, or anti-cheat launch.',
        tag: 'Rig Support'
      },
      {
        title: 'Prepaid Wallet & Refund Inquiries',
        description: 'Check your digital balance, review GST thermal invoices, or request assistance with payment methods.',
        tag: 'Billing Desk'
      }
    ],
    ctaText: 'Contact Counter Desk',
    ctaActionDescription: 'Call +91 11 4567 8900 or ask any on-duty floor staff member.'
  }
};

interface FooterProps {
  onOpenBooking?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const [activeTopic, setActiveTopic] = useState<FooterModalTopic | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const handleActionClick = (topicId: FooterModalTopic) => {
    if (topicId === 'hire') {
      navigator.clipboard?.writeText('careers@bytesandbrew.com');
      setCopiedNotification('Email copied: careers@bytesandbrew.com');
      setTimeout(() => setCopiedNotification(null), 3000);
    } else if (topicId === 'support') {
      navigator.clipboard?.writeText('+91 11 4567 8900');
      setCopiedNotification('Phone copied: +91 11 4567 8900');
      setTimeout(() => setCopiedNotification(null), 3000);
    } else {
      setCopiedNotification(`Inquiry initiated for ${FOOTER_TOPICS_DATA[topicId].label}!`);
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  const navLinks: { id: FooterModalTopic; label: string }[] = [
    { id: 'designers', label: 'For designers' },
    { id: 'hire', label: 'Hire talent' },
    { id: 'inspiration', label: 'Inspiration' },
    { id: 'advertising', label: 'Advertising' },
    { id: 'blog', label: 'Blog' },
    { id: 'about', label: 'About' },
    { id: 'support', label: 'Support' }
  ];

  return (
    <footer
      id="main-app-footer"
      className="mt-auto border-t border-white/10 bg-[#050505]/95 backdrop-blur-md pt-8 pb-10 px-4 sm:px-8 lg:px-12 text-[#e0e0e0] select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Top Tier: Logo & Tagline */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Bytes & Brew
                </span>
                <span className="text-base sm:text-lg font-black text-amber-500">.</span>
              </div>
              <p className="text-[11px] text-white/50 font-mono">
                Gaming Café & Artisan Coffee Lounge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-white/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Arena Status: 100% Operational • 40+ Rigs Online</span>
          </div>
        </div>

        {/* Requested Navigation Links:
            For designers, Hire talent, Inspiration, Advertising, Blog, About, Support */}
        <div
          id="footer-requested-nav-links"
          className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 sm:gap-x-8 gap-y-3 pt-1 text-xs sm:text-sm font-medium"
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              id={`footer-link-${link.id}`}
              type="button"
              onClick={() => setActiveTopic(link.id)}
              className="text-white/70 hover:text-white transition-colors duration-200 cursor-pointer whitespace-nowrap hover:underline underline-offset-4 decoration-amber-500 decoration-2 active:scale-98"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Social Media Logos in one single line directly at the bottom of blog/about buttons as in uploaded image */}
        <div
          id="footer-social-logos-row"
          className="flex items-center justify-center sm:justify-start gap-5 py-1"
        >
          {/* X (Twitter) Logo */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white transition-transform duration-150 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
            title="X"
            aria-label="X"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </a>

          {/* Facebook Logo (filled circle with f) */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-5 h-5 rounded-full bg-white text-black hover:bg-white/90 transition-transform duration-150 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer overflow-hidden"
            title="Facebook"
            aria-label="Facebook"
          >
            <Facebook className="w-3.5 h-3.5 fill-current stroke-none" />
          </a>

          {/* Instagram Logo */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white transition-transform duration-150 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
            title="Instagram"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5 stroke-[2]" />
          </a>

          {/* Pinterest Logo (filled circle with p) */}
          <a
            href="https://pinterest.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-5 h-5 rounded-full bg-white text-black hover:bg-white/90 transition-transform duration-150 hover:scale-110 active:scale-95 flex items-center justify-center font-bold cursor-pointer overflow-hidden"
            title="Pinterest"
            aria-label="Pinterest"
          >
            <span className="font-serif italic font-black text-xs leading-none -translate-y-[0.5px] select-none">
              p
            </span>
          </a>
        </div>

        {/* Bottom Tier: Copyright, Security standard, System architecture */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-[10px] uppercase tracking-[0.2em] font-mono pt-4 border-t border-white/5">
          <span>&copy; {new Date().getFullYear()} Bytes & Brew Gaming Café</span>
          <span className="hidden md:inline">Terminal Architecture Standard AES-256</span>
          <span>Open Daily 10:00 AM – 02:00 AM</span>
        </div>
      </div>

      {/* Interactive Modal for Footer Links */}
      {activeTopic && (
        <div
          id="footer-topic-modal-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveTopic(null)}
        >
          <div
            id="footer-topic-modal-card"
            className="relative w-full max-w-2xl bg-[#0a0a0c] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mt-20 -mr-20" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mb-20 -ml-20" />

            {/* Modal Header & Navigation Switcher */}
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {FOOTER_TOPICS_DATA[activeTopic].icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-mono text-amber-400 font-bold block">
                      {FOOTER_TOPICS_DATA[activeTopic].badge}
                    </span>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {FOOTER_TOPICS_DATA[activeTopic].label}
                    </h3>
                  </div>
                </div>

                <button
                  id="btn-close-footer-modal"
                  type="button"
                  onClick={() => setActiveTopic(null)}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Tab Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTopic(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      activeTopic === item.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-white/50 hover:text-white/80 border border-transparent'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Headline & Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-white mb-2 leading-snug">
                  {FOOTER_TOPICS_DATA[activeTopic].headline}
                </h4>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {FOOTER_TOPICS_DATA[activeTopic].summary}
                </p>
              </div>

              {/* Curated List Items */}
              <div className="flex flex-col gap-3 mb-6 overflow-y-auto max-h-[35vh] pr-1">
                {FOOTER_TOPICS_DATA[activeTopic].items.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-1 hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {entry.title}
                      </span>
                      {entry.tag && (
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/70">
                          {entry.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed">
                      {entry.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification alert if action taken */}
            {copiedNotification && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{copiedNotification}</span>
              </div>
            )}

            {/* Modal Footer Call to Action */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-white/50 font-mono text-center sm:text-left">
                {FOOTER_TOPICS_DATA[activeTopic].ctaActionDescription}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTopic(null)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => handleActionClick(activeTopic)}
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>{FOOTER_TOPICS_DATA[activeTopic].ctaText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
