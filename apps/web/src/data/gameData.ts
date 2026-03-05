export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export const PORTS = [
  { name: 'Port Royal',    desc: 'A bustling English stronghold, rich with merchant traffic and navy patrols.', x: 0.55, y: 0.52, faction: 'english', goods: [0,1,3,5,7] },
  { name: 'Havana',        desc: 'Spanish colonial jewel of the Caribbean. Heavily fortified, lucrative trade.', x: 0.42, y: 0.42, faction: 'spanish', goods: [1,2,4,6,8] },
  { name: 'Tortuga',       desc: 'Lawless pirate haven. No questions asked — if you have coin.', x: 0.48, y: 0.35, faction: 'pirates', goods: [0,3,5,9,7] },
  { name: 'Nassau',        desc: 'A free port where pirates and merchants mingle uneasily.', x: 0.62, y: 0.32, faction: 'pirates', goods: [0,2,4,6,8] },
  { name: 'Cartagena',     desc: 'Rich Spanish trading post. Gateway to the treasures of the Americas.', x: 0.32, y: 0.68, faction: 'spanish', goods: [2,4,5,7,9] },
  { name: 'Bridgetown',    desc: 'English sugar colony. Sweet profits await the cunning trader.', x: 0.78, y: 0.55, faction: 'english', goods: [1,3,6,8,0] },
  { name: 'Santo Domingo', desc: 'Ancient Spanish port, crossroads of the old and new worlds.', x: 0.58, y: 0.44, faction: 'spanish', goods: [0,2,5,7,9] },
  { name: 'Maracaibo',     desc: 'Remote lagoon port. Few visit — even fewer return without profit.', x: 0.35, y: 0.75, faction: 'neutral', goods: [3,4,6,8,9] },
]

export const GOODS = [
  { name: 'Rum',        icon: '🍺', basePrice: 80,  volatility: 0.4 },
  { name: 'Sugar',      icon: '🍬', basePrice: 60,  volatility: 0.3 },
  { name: 'Spices',     icon: '🌶️', basePrice: 120, volatility: 0.5 },
  { name: 'Tobacco',    icon: '🌿', basePrice: 90,  volatility: 0.35 },
  { name: 'Gold Ore',   icon: '✨', basePrice: 200, volatility: 0.6 },
  { name: 'Silk',       icon: '🎀', basePrice: 150, volatility: 0.45 },
  { name: 'Timber',     icon: '🪵', basePrice: 45,  volatility: 0.2 },
  { name: 'Weapons',    icon: '⚔️', basePrice: 180, volatility: 0.5 },
  { name: 'Medicine',   icon: '💊', basePrice: 100, volatility: 0.4 },
  { name: 'Contraband', icon: '📦', basePrice: 300, volatility: 0.8 },
]

export const ENEMY_SHIPS = [
  { name: 'Merchant Schooner', emoji: '🚢', shipClass: 'Schooner · 2 Cannons',  cannons: 2,  armor: 1, maxHp: 50,  crew: 12, goldMin: 80,  goldMax: 200, crewFight: 0.30, ai: 'passive'    },
  { name: 'Dutch Fluyt',       emoji: '🚢', shipClass: 'Fluyt · 3 Cannons',     cannons: 3,  armor: 2, maxHp: 65,  crew: 18, goldMin: 150, goldMax: 350, crewFight: 0.40, ai: 'cautious'   },
  { name: 'Spanish Galleon',   emoji: '⛵', shipClass: 'Galleon · 6 Cannons',   cannons: 6,  armor: 3, maxHp: 95,  crew: 35, goldMin: 300, goldMax: 600, crewFight: 0.60, ai: 'aggressive' },
  { name: 'Navy Frigate',      emoji: '⛵', shipClass: 'Frigate · 10 Cannons',  cannons: 10, armor: 4, maxHp: 130, crew: 60, goldMin: 200, goldMax: 400, crewFight: 0.85, ai: 'aggressive' },
  { name: 'Pirate Sloop',      emoji: '⛵', shipClass: 'Sloop · 4 Cannons',     cannons: 4,  armor: 2, maxHp: 55,  crew: 22, goldMin: 100, goldMax: 250, crewFight: 0.70, ai: 'aggressive' },
]

export interface EventChoice {
  text: string
  effect: () => void
}

export interface GameEvent {
  title: string
  body: string
  choices: EventChoice[]
}

export function getPortPrices(portIdx: number): number[] {
  return PORTS[portIdx].goods.map(gIdx => {
    const good = GOODS[gIdx]
    const variance = 1 + (Math.random() - 0.5) * good.volatility * 2
    return Math.round(good.basePrice * variance)
  })
}
