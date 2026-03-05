// ─────────────────────────────────────────────
//  TIDEBOUND — Shared Types
//  Used by both apps/web and apps/server
// ─────────────────────────────────────────────

// ── Utility ──────────────────────────────────
export type UUID = string
export type Timestamp = string // ISO 8601

// ── Factions ─────────────────────────────────
export type FactionId = 'pirates' | 'navy' | 'merchants' | 'natives'

export interface Faction {
  id: FactionId
  name: string
  icon: string
}

export interface FactionReputation {
  factionId: FactionId
  score: number    // 0–100
  label: ReputationLabel
}

export type ReputationLabel = 'Allied' | 'Friendly' | 'Neutral' | 'Wary' | 'Hostile'

// ── Goods ─────────────────────────────────────
export type GoodId =
  | 'rum'
  | 'sugar'
  | 'spices'
  | 'tobacco'
  | 'gold_ore'
  | 'silk'
  | 'timber'
  | 'weapons'
  | 'medicine'
  | 'contraband'

export interface Good {
  id: GoodId
  name: string
  icon: string
  basePrice: number
  volatility: number   // 0–1, how much price swings
  legal: boolean
}

export interface CargoItem {
  goodId: GoodId
  quantity: number
  purchasePrice: number  // average price paid, for profit tracking
}

// ── Ports ─────────────────────────────────────
export type PortId = string  // slug e.g. 'port-royal'

export type PortFaction = 'english' | 'spanish' | 'pirates' | 'neutral'

export interface Port {
  id: PortId
  name: string
  description: string
  faction: PortFaction
  position: { x: number; y: number }  // normalised 0–1 SVG coords
  availableGoods: GoodId[]
  defenceLevel: number  // 1–5, affects raid difficulty
}

export interface PortMarketPrice {
  portId: PortId
  goodId: GoodId
  price: number
  updatedAt: Timestamp
}

// ── Ship ──────────────────────────────────────
export type ShipClass = 'sloop' | 'brigantine' | 'galleon' | 'frigate' | 'fluyt'

export interface Ship {
  id: UUID
  name: string
  class: ShipClass
  emoji: string

  // Combat stats
  cannons: number
  armor: number
  hullMax: number
  hullCurrent: number

  // Crew
  crewMax: number
  crewCurrent: number
  morale: number     // 0–100

  // Cargo
  cargoCapacity: number
  cargo: CargoItem[]

  // Movement
  speed: number      // tiles per day equivalent
}

// ── Player ────────────────────────────────────
export interface Player {
  id: UUID
  userId: UUID         // Supabase auth user id
  captainName: string
  gold: number
  notoriety: number    // 0–100
  wantedLevel: number  // 0–5
  currentPortId: PortId | null  // null = at sea
  ship: Ship
  reputations: FactionReputation[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── Battle ────────────────────────────────────
export type BattlePhase = 'player' | 'enemy' | 'resolving' | 'over'
export type BattleOutcome = 'victory' | 'defeat' | 'fled'
export type BattleAction = 'broadside' | 'grapeshot' | 'board' | 'repair' | 'firebomb' | 'flee'
export type StatusEffectType = 'burning' | 'stunned'
export type EnemyAI = 'passive' | 'cautious' | 'aggressive'

export interface StatusEffect {
  type: StatusEffectType
  turnsLeft: number
}

export interface BattleCombatant {
  name: string
  emoji: string
  shipClass: string
  hp: number
  maxHp: number
  cannons: number
  crew: number
  armor: number
  statuses: StatusEffect[]
}

export interface PlayerBattleCombatant extends BattleCombatant {
  repairUsed: boolean
  firebombUsed: boolean
}

export interface EnemyBattleCombatant extends BattleCombatant {
  ai: EnemyAI
  goldMin: number
  goldMax: number
  crewFight: number   // 0–1 multiplier on boarding effectiveness
}

export interface BattleState {
  battleId: UUID
  playerId: UUID
  round: number
  phase: BattlePhase
  player: PlayerBattleCombatant
  enemy: EnemyBattleCombatant
}

export interface BattleActionPayload {
  battleId: UUID
  playerId: UUID
  action: BattleAction
}

export interface BattleTurnResult {
  updatedBattle: BattleState
  playerDamage: number
  enemyDamage: number
  crewLost: number
  logMessage: string
  outcome: BattleOutcome | null  // null = battle continues
}

export interface BattleEndResult {
  outcome: BattleOutcome
  goldGained: number
  notorietyGain: number
  hullDamage: number
  crewLost: number
  roundsFought: number
}

// ── World Events ──────────────────────────────
export type WorldEventType = 'storm' | 'ghost_ship' | 'merchant_offer' | 'stranded_sailor'

export interface WorldEvent {
  id: UUID
  type: WorldEventType
  title: string
  description: string
  portId: PortId | null   // null = at sea
  expiresAt: Timestamp
}

// ── WebSocket Payloads ─────────────────────────
// Client → Server
export interface WS_ClientToServer {
  'battle:action': BattleActionPayload
  'player:sail': { destinationPortId: PortId }
  'player:join_port': { portId: PortId }
}

// Server → Client
export interface WS_ServerToClient {
  'battle:turn_result': BattleTurnResult
  'battle:end': BattleEndResult
  'market:price_update': PortMarketPrice[]
  'world:event': WorldEvent
  'player:state_sync': Partial<Player>
}
