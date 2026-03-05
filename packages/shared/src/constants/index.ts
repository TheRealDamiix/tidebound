import type { Good, Faction, FactionId, Port } from '../types/index.js'

// ── Factions ──────────────────────────────────
export const FACTIONS: Record<FactionId, Faction> = {
  pirates:   { id: 'pirates',   name: 'Pirate Brethren',  icon: '☠️' },
  navy:      { id: 'navy',      name: 'Royal Navy',        icon: '⚓' },
  merchants: { id: 'merchants', name: 'Merchants Guild',   icon: '💰' },
  natives:   { id: 'natives',   name: 'Island Natives',    icon: '🌴' },
}

export const REPUTATION_THRESHOLDS = {
  allied:   75,
  friendly: 55,
  neutral:  35,
  wary:     20,
  hostile:  0,
} as const

// ── Goods ─────────────────────────────────────
export const GOODS: Good[] = [
  { id: 'rum',        name: 'Rum',        icon: '🍺', basePrice: 80,  volatility: 0.40, legal: true  },
  { id: 'sugar',      name: 'Sugar',      icon: '🍬', basePrice: 60,  volatility: 0.30, legal: true  },
  { id: 'spices',     name: 'Spices',     icon: '🌶️', basePrice: 120, volatility: 0.50, legal: true  },
  { id: 'tobacco',    name: 'Tobacco',    icon: '🌿', basePrice: 90,  volatility: 0.35, legal: true  },
  { id: 'gold_ore',   name: 'Gold Ore',   icon: '✨', basePrice: 200, volatility: 0.60, legal: true  },
  { id: 'silk',       name: 'Silk',       icon: '🎀', basePrice: 150, volatility: 0.45, legal: true  },
  { id: 'timber',     name: 'Timber',     icon: '🪵', basePrice: 45,  volatility: 0.20, legal: true  },
  { id: 'weapons',    name: 'Weapons',    icon: '⚔️', basePrice: 180, volatility: 0.50, legal: false },
  { id: 'medicine',   name: 'Medicine',   icon: '💊', basePrice: 100, volatility: 0.40, legal: true  },
  { id: 'contraband', name: 'Contraband', icon: '📦', basePrice: 300, volatility: 0.80, legal: false },
]

export const GOODS_BY_ID = Object.fromEntries(GOODS.map(g => [g.id, g])) as Record<string, Good>

// ── Ports ─────────────────────────────────────
export const PORTS: Port[] = [
  {
    id: 'port-royal',
    name: 'Port Royal',
    description: 'A bustling English stronghold, rich with merchant traffic and navy patrols.',
    faction: 'english',
    position: { x: 0.55, y: 0.52 },
    availableGoods: ['rum', 'sugar', 'tobacco', 'silk', 'weapons'],
    defenceLevel: 4,
  },
  {
    id: 'havana',
    name: 'Havana',
    description: 'Spanish colonial jewel of the Caribbean. Heavily fortified, lucrative trade.',
    faction: 'spanish',
    position: { x: 0.42, y: 0.42 },
    availableGoods: ['sugar', 'spices', 'gold_ore', 'timber', 'medicine'],
    defenceLevel: 5,
  },
  {
    id: 'tortuga',
    name: 'Tortuga',
    description: 'Lawless pirate haven. No questions asked — if you have coin.',
    faction: 'pirates',
    position: { x: 0.48, y: 0.35 },
    availableGoods: ['rum', 'tobacco', 'silk', 'contraband', 'weapons'],
    defenceLevel: 2,
  },
  {
    id: 'nassau',
    name: 'Nassau',
    description: 'A free port where pirates and merchants mingle uneasily.',
    faction: 'pirates',
    position: { x: 0.62, y: 0.32 },
    availableGoods: ['rum', 'spices', 'gold_ore', 'timber', 'medicine'],
    defenceLevel: 2,
  },
  {
    id: 'cartagena',
    name: 'Cartagena',
    description: 'Rich Spanish trading post. Gateway to the treasures of the Americas.',
    faction: 'spanish',
    position: { x: 0.32, y: 0.68 },
    availableGoods: ['spices', 'gold_ore', 'silk', 'weapons', 'contraband'],
    defenceLevel: 4,
  },
  {
    id: 'bridgetown',
    name: 'Bridgetown',
    description: 'English sugar colony. Sweet profits await the cunning trader.',
    faction: 'english',
    position: { x: 0.78, y: 0.55 },
    availableGoods: ['sugar', 'tobacco', 'timber', 'medicine', 'rum'],
    defenceLevel: 3,
  },
  {
    id: 'santo-domingo',
    name: 'Santo Domingo',
    description: 'Ancient Spanish port, crossroads of the old and new worlds.',
    faction: 'spanish',
    position: { x: 0.58, y: 0.44 },
    availableGoods: ['rum', 'spices', 'silk', 'weapons', 'contraband'],
    defenceLevel: 3,
  },
  {
    id: 'maracaibo',
    name: 'Maracaibo',
    description: 'Remote lagoon port. Few visit — even fewer return without profit.',
    faction: 'neutral',
    position: { x: 0.35, y: 0.75 },
    availableGoods: ['tobacco', 'gold_ore', 'timber', 'medicine', 'contraband'],
    defenceLevel: 1,
  },
]

export const PORTS_BY_ID = Object.fromEntries(PORTS.map(p => [p.id, p])) as Record<string, Port>

// ── Game constants ─────────────────────────────
export const GAME_CONSTANTS = {
  MAX_WANTED_LEVEL:      5,
  MAX_REPUTATION:        100,
  MIN_CREW_TO_SAIL:      5,
  MIN_CREW_TO_RAID:      10,
  REPAIR_KIT_HEAL_MIN:   15,
  REPAIR_KIT_HEAL_MAX:   35,
  FIREBOMB_BURN_TURNS:   3,
  FIREBOMB_BURN_DMG_MIN: 3,
  FIREBOMB_BURN_DMG_MAX: 8,
  MARKET_REFRESH_MS:     5 * 60 * 1000,  // 5 minutes
} as const
