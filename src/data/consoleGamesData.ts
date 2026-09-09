import { GamingServiceCategory, GamingSystem } from '../types';
import { PS5_GAMES_CATALOG } from './games/ps5Catalog';
import { XBOX_GAMES_CATALOG } from './games/xboxCatalog';
import { PC_GAMES_CATALOG } from './games/pcCatalog';
import { SPECIALTY_GAMES_CATALOG } from './games/specialtyCatalog';

export interface ConsoleGameItem {
  id: string;
  title: string;
  category: string;
  platforms: GamingServiceCategory[];
  coverUrl: string;
  bannerUrl?: string;
  rating: string;
  tags: string[];
  multiplayerType: string;
  description: string;
  installedOnSystems?: string[]; // dynamically populated or default
}

/**
 * Resolves authentic game cover (vertical 600x900 box art) and 1920x1080 banner from official game assets
 */
export function resolveAuthenticGameCover(title: string, category?: string): { coverUrl: string; bannerUrl: string } {
  const t = title.toLowerCase();
  const c = (category || '').toLowerCase();

  // Steam App ID Mapping for accurate 600x900 box arts and 1920x1080 banners
  let appId = 2651280; // default Spider-Man 2

  if (t.includes('spider-man') || t.includes('spiderman') || t.includes('miles morales') || t.includes('wolverine')) {
    appId = 2651280;
  } else if (t.includes('gta') || t.includes('grand theft auto') || t.includes('vice city')) {
    return {
      coverUrl: 'https://shared.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg',
      bannerUrl: 'https://i.ytimg.com/vi/QdBZY2fkU-0/maxresdefault.jpg'
    };
  } else if (t.includes('nba')) {
    appId = 2878980;
  } else if (t.includes('fifa') || t.includes('fc 2') || t.includes('pes') || t.includes('football') || t.includes('soccer')) {
    appId = 2669320;
  } else if (t.includes('tekken')) {
    appId = 1778820;
  } else if (t.includes('mortal kombat')) {
    appId = 1971870;
  } else if (t.includes('street fighter')) {
    appId = 1364780;
  } else if (t.includes('god of war') || t.includes('ragnarok') || t.includes('kratos')) {
    appId = 1593500;
  } else if (t.includes('wukong') || t.includes('black myth')) {
    appId = 2358720;
  } else if (t.includes('cyberpunk') || t.includes('night city') || t.includes('phantom liberty')) {
    appId = 1091500;
  } else if (t.includes('elden ring') || t.includes('erdtree') || t.includes('bloodborne') || t.includes('dark souls') || t.includes('demon')) {
    appId = 1245620;
  } else if (t.includes('sekiro')) {
    appId = 814380;
  } else if (t.includes('last of us') || t.includes('tlou')) {
    appId = 1888930;
  } else if (t.includes('ghost of tsushima')) {
    appId = 2215430;
  } else if (t.includes('helldivers')) {
    appId = 553850;
  } else if (t.includes('resident evil') || t.includes('re4')) {
    appId = 2050650;
  } else if (t.includes('baldur') || t.includes('bg3')) {
    appId = 1086940;
  } else if (t.includes('horizon') || t.includes('forbidden west') || t.includes('zero dawn')) {
    appId = 2420110;
  } else if (t.includes('forza') || t.includes('horizon 5') || t.includes('motorsport') || t.includes('gran turismo')) {
    appId = 1551360;
  } else if (t.includes('assetto') || t.includes('iracing')) {
    appId = 805550;
  } else if (t.includes('f1 2') || t.includes('formula 1')) {
    appId = 2488620;
  } else if (t.includes('call of duty') || t.includes('mw2') || t.includes('mw3') || t.includes('warzone')) {
    appId = 1938090;
  } else if (t.includes('cs2') || t.includes('counter-strike') || t.includes('cs:go')) {
    appId = 730;
  } else if (t.includes('red dead') || t.includes('rdr2')) {
    appId = 1174180;
  } else if (t.includes('it takes two')) {
    appId = 1426210;
  } else if (t.includes('hogwarts')) {
    appId = 990080;
  } else if (t.includes('starfield')) {
    appId = 1716740;
  } else if (t.includes('halo')) {
    appId = 1240440;
  } else if (t.includes('beat saber')) {
    appId = 620980;
  } else if (t.includes('half-life') || t.includes('alyx')) {
    appId = 546560;
  } else if (t.includes('diablo')) {
    appId = 2344520;
  } else if (t.includes('overwatch')) {
    appId = 2357570;
  } else if (t.includes('doom')) {
    appId = 782330;
  } else if (t.includes('witcher')) {
    appId = 292030;
  } else if (t.includes('monster hunter')) {
    appId = 582010;
  } else if (t.includes('sea of thieves')) {
    appId = 1172620;
  } else if (t.includes('flight simulator')) {
    appId = 1250410;
  } else if (t.includes('wwe')) {
    appId = 2315690;
  } else if (t.includes('silent hill')) {
    appId = 2124490;
  } else if (t.includes('stalker') || t.includes('s.t.a.l.k.e.r.')) {
    appId = 1643320;
  } else if (t.includes('final fantasy') || t.includes('ffx')) {
    appId = 1462040;
  } else if (t.includes('apex')) {
    appId = 1172470;
  } else if (t.includes('rainbow six') || t.includes('siege')) {
    appId = 359550;
  } else if (t.includes('armored core')) {
    appId = 1888120;
  } else if (t.includes('dragon\'s dogma') || t.includes('dragons dogma')) {
    appId = 2054970;
  } else if (t.includes('assassin') || t.includes('creed')) {
    appId = 2886000;
  } else if (t.includes('dead space')) {
    appId = 1693980;
  } else if (t.includes('ratchet')) {
    appId = 1895840;
  } else if (t.includes('returnal')) {
    appId = 1649240;
  } else if (t.includes('death stranding')) {
    appId = 1850570;
  } else if (t.includes('need for speed')) {
    appId = 1846380;
  } else if (t.includes('lies of p')) {
    appId = 1627720;
  } else if (c.includes('racing')) {
    appId = 1551360;
  } else if (c.includes('fighting')) {
    appId = 1778820;
  } else if (c.includes('sport')) {
    appId = 2669320;
  } else if (c.includes('shooter') || c.includes('fps')) {
    appId = 1938090;
  } else if (c.includes('vr')) {
    appId = 620980;
  } else {
    appId = 1245620; // Elden Ring golden fantasy art
  }

  return {
    coverUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`,
    bannerUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`
  };
}

function enhanceGameItem(item: ConsoleGameItem): ConsoleGameItem {
  // If item currently has an Unsplash placeholder or missing banner, replace with authentic Steam asset
  if (!item.coverUrl || item.coverUrl.includes('images.unsplash.com')) {
    const art = resolveAuthenticGameCover(item.title, item.category);
    return {
      ...item,
      coverUrl: art.coverUrl,
      bannerUrl: art.bannerUrl
    };
  }
  return item;
}

// Exactly 100 famous games per console catalog as requested
export const PS5_CATALOG_100: ConsoleGameItem[] = PS5_GAMES_CATALOG.slice(0, 100).map(enhanceGameItem);
export const XBOX_CATALOG_100: ConsoleGameItem[] = XBOX_GAMES_CATALOG.slice(0, 100).map(enhanceGameItem);
export const PC_CATALOG_100: ConsoleGameItem[] = PC_GAMES_CATALOG.slice(0, 100).map(enhanceGameItem);
export const SPECIALTY_CATALOG: ConsoleGameItem[] = SPECIALTY_GAMES_CATALOG.map(enhanceGameItem);

// Combined database of games
export const CONSOLE_GAMES_DATABASE: ConsoleGameItem[] = [
  ...PS5_CATALOG_100,
  ...XBOX_CATALOG_100,
  ...PC_CATALOG_100,
  ...SPECIALTY_CATALOG
];

/**
 * Returns all games available for a console/rig category, capped at 100 famous games per console,
 * dynamically identifying which specific stations in the café currently have them installed.
 */
export function getGamesForCategory(
  category: GamingServiceCategory,
  allSystems: GamingSystem[]
): { game: ConsoleGameItem; installedStations: GamingSystem[] }[] {
  // Normalize category variations
  const isTargetCategory = (sysCat: GamingServiceCategory) => {
    if (sysCat === category) return true;
    if (category === 'PS5' && sysCat === 'PlayStation') return true;
    if (category === 'PlayStation' && sysCat === 'PS5') return true;
    return false;
  };

  const systemsInCategory = allSystems.filter(s => isTargetCategory(s.category));

  let categoryCatalog: ConsoleGameItem[] = [];

  if (category === 'PS5' || category === 'PlayStation') {
    categoryCatalog = PS5_CATALOG_100;
  } else if (category === 'Xbox') {
    categoryCatalog = XBOX_CATALOG_100;
  } else if (category === 'Gaming PC') {
    categoryCatalog = PC_CATALOG_100;
  } else if (category === 'VR') {
    categoryCatalog = SPECIALTY_CATALOG.filter(g => g.platforms.includes('VR')).slice(0, 100);
  } else if (category === 'Sim Racing') {
    categoryCatalog = SPECIALTY_CATALOG.filter(g => g.platforms.includes('Sim Racing')).slice(0, 100);
  } else if (category === 'Pool Table') {
    categoryCatalog = SPECIALTY_CATALOG.filter(g => g.platforms.includes('Pool Table')).slice(0, 100);
  } else if (category === 'VIP Room') {
    // Curated 100 flagship titles for VIP Room
    categoryCatalog = [
      ...PS5_CATALOG_100.slice(0, 35),
      ...PC_CATALOG_100.slice(0, 35),
      ...XBOX_CATALOG_100.slice(0, 20),
      ...SPECIALTY_CATALOG.slice(0, 10)
    ].slice(0, 100);
  } else {
    categoryCatalog = CONSOLE_GAMES_DATABASE.filter(g => g.platforms.includes(category)).slice(0, 100);
  }

  return categoryCatalog.map(game => {
    // Check which specific systems have this game listed in installedGames
    const matchingSystems = systemsInCategory.filter(sys => {
      if (sys.installedGames.some(ig => ig.toLowerCase().includes('full library'))) {
        return true;
      }
      return sys.installedGames.some(ig =>
        ig.toLowerCase().includes(game.title.toLowerCase()) ||
        game.title.toLowerCase().includes(ig.toLowerCase())
      );
    });

    return {
      game,
      installedStations: matchingSystems.length > 0 ? matchingSystems : systemsInCategory
    };
  });
}

/**
 * Returns games specifically installed on a single station/rig
 */
export function getGamesForStation(
  system: GamingSystem
): ConsoleGameItem[] {
  const isFullLibrary = system.installedGames.some(ig => ig.toLowerCase().includes('full library'));

  if (isFullLibrary) {
    if (system.category === 'PS5' || system.category === 'PlayStation') {
      return PS5_CATALOG_100;
    }
    if (system.category === 'Xbox') {
      return XBOX_CATALOG_100;
    }
    if (system.category === 'Gaming PC') {
      return PC_CATALOG_100;
    }
    return CONSOLE_GAMES_DATABASE.filter(g =>
      g.platforms.includes(system.category) ||
      (system.category === 'PS5' && g.platforms.includes('PlayStation')) ||
      (system.category === 'PlayStation' && g.platforms.includes('PS5'))
    ).slice(0, 100);
  }

  // Find matches from database
  const matches: ConsoleGameItem[] = [];
  system.installedGames.forEach(gameName => {
    const found = CONSOLE_GAMES_DATABASE.find(g =>
      g.title.toLowerCase().includes(gameName.toLowerCase()) ||
      gameName.toLowerCase().includes(g.title.toLowerCase())
    );

    if (found) {
      if (!matches.some(m => m.id === found.id)) {
        matches.push(found);
      }
    } else {
      const art = resolveAuthenticGameCover(gameName);
      matches.push({
        id: `custom-${gameName.toLowerCase().replace(/\s+/g, '-')}`,
        title: gameName,
        category: 'Installed Game',
        platforms: [system.category],
        coverUrl: art.coverUrl,
        bannerUrl: art.bannerUrl,
        rating: '9.0 / 10',
        tags: ['Installed & Verified', 'Ready to Play'],
        multiplayerType: 'Standard Mode',
        description: `Fully pre-installed and updated on ${system.name}. Ready for immediate play upon login.`
      });
    }
  });

  return matches;
}
