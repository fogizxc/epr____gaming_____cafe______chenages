import React from 'react';
import { HeroGameSlide, GamingServiceCategory } from '../../types';
import { ArrowLeft, Star, Gamepad2, ArrowRight } from 'lucide-react';

interface GameOverviewScreenProps {
  game: HeroGameSlide;
  onBack: () => void;
  onBookSlot: (game: HeroGameSlide, category?: GamingServiceCategory) => void;
}

/**
 * Safe game overview screen.
 * This screen intentionally does not consume CafeContext collections or call
 * array helpers. Game selection must remain render-safe even when legacy
 * browser state is malformed.
 */
export const GameOverviewScreen: React.FC<GameOverviewScreenProps> = ({ game, onBack, onBookSlot }) => {
  const title = typeof game?.title === 'string' && game.title.trim() ? game.title : 'Game';
  const category = typeof game?.category === 'string' && game.category.trim() ? game.category : 'Gaming PC';
  const description = typeof game?.description === 'string' ? game.description : 'Explore this title and reserve a gaming station.';
  const cover = typeof game?.coverUrl === 'string' ? game.coverUrl : '';
  const banner = typeof game?.bannerUrl === 'string' ? game.bannerUrl : cover;
  const rating = game?.rating ?? '—';
  const platforms = Array.isArray(game?.platforms) ? game.platforms.filter((p) => typeof p === 'string') : [];
  const tags = Array.isArray(game?.tags) ? game.tags.filter((t) => typeof t === 'string') : [];

  const targetCategory: GamingServiceCategory =
    platforms.includes('PS5') || platforms.includes('PlayStation') ? 'PS5' :
    platforms.includes('Xbox') ? 'Xbox' :
    platforms.includes('VR') ? 'VR' :
    platforms.includes('Sim Racing') ? 'Sim Racing' :
    'Gaming PC';

  return (
    <div id="screen-game-overview" className="w-full flex flex-col gap-8 pb-16 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
        <button id="btn-back-to-arena" onClick={onBack} className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 transition cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-red-600" />
          Back to Main Arena
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">{category}</span>
          <span className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/10"><Star className="w-3 h-3 fill-current" />{rating}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900 border border-white/10">
          {banner ? <img src={banner} alt={title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-20 h-20 text-white/20" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          <div className="absolute bottom-5 left-5 right-5"><h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">{title}</h1></div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-500">Game Overview</span>
            <p className="mt-3 text-sm text-white/75 leading-relaxed">{description}</p>
          </div>

          {platforms.length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Platforms</span>
              <div className="flex flex-wrap gap-2 mt-2">{platforms.map((p) => <span key={p} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white">{p}</span>)}</div>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tags</span>
              <div className="flex flex-wrap gap-2 mt-2">{tags.slice(0, 8).map((tag) => <span key={tag} className="px-2.5 py-1 rounded-md bg-red-600/10 border border-red-500/20 text-[10px] text-red-300">{tag}</span>)}</div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Ready to play</div>
            <div className="text-sm text-white/70 mt-1">Reserve a {targetCategory} station for this game.</div>
          </div>

          <div className="flex gap-3">
            <button onClick={onBack} className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 transition cursor-pointer">Back</button>
            <button onClick={() => onBookSlot(game, targetCategory)} className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer">
              Book This Game <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
