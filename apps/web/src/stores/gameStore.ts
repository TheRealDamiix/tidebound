import { create } from 'zustand'
import { MONTHS, PORTS, GOODS, ENEMY_SHIPS, getPortPrices } from '../data/gameData'

export interface InventoryItem {
  goodIdx: number
  qty: number
  boughtAt: number
}

export interface LogEntry {
  id: number
  type: 'travel' | 'trade' | 'event' | 'combat'
  text: string
  date: string
}

export interface CombatStatus {
  type: 'burning' | 'weakened' | 'fortified'
  label: string
  turnsLeft: number
}

export interface Combatant {
  name: string
  emoji: string
  shipClass: string
  hp: number
  maxHp: number
  crew: number
  cannons: number
  armor: number
  statuses: CombatStatus[]
}

export interface BattleState {
  active: boolean
  phase: 'player' | 'enemy' | 'result'
  outcome: 'victory' | 'defeat' | 'fled' | null
  player: Combatant
  enemy: Combatant & { ai: string; goldMin: number; goldMax: number; crewFight: number }
  cooldowns: Record<string, number>
  repairUsed: boolean
  log: Array<{ text: string; type: string }>
  goldGained: number
  hullDamage: number
  crewLost: number
}

export interface ModalState {
  active: boolean
  title: string
  body: string
  choices: Array<{ text: string; action: string; data?: unknown }>
}

export interface GameState {
  gold: number
  notoriety: number
  month: number
  year: number
  ship: {
    name: string
    cannons: number
    hull: number
    maxHull: number
    crew: number
    maxCrew: number
    morale: number
    maxCargo: number
    speed: number
  }
  reputation: { pirates: number; navy: number; merchants: number; natives: number }
  wantedLevel: number
  currentPort: number
  inventory: InventoryItem[]
  log: LogEntry[]
  toast: string | null
  battle: BattleState | null
  modal: ModalState | null
  sailModalOpen: boolean

  // Actions
  addLog: (type: LogEntry['type'], text: string) => void
  showToast: (msg: string) => void
  clearToast: () => void
  buyGood: (goodIdx: number, price: number) => void
  sellGood: (goodIdx: number, price: number) => void
  sailTo: (portIdx: number, days: number) => void
  upgradeShip: () => void
  repairShip: () => void
  recruitCrew: () => void
  visitTavern: () => void
  startRaid: () => void
  playerBattleAction: (action: string) => void
  closeBattle: () => void
  closeModal: () => void
  openSailModal: () => void
  closeSailModal: () => void
  resolveModalChoice: (choiceIdx: number) => void
}

let logId = 0
// day is optional — omit it for live events (random), pass it for fixed seed entries
const mkLog = (type: LogEntry['type'], text: string, month: number, day?: number): LogEntry => ({
  id: logId++,
  type,
  text,
  date: `${MONTHS[month].slice(0, 3)} ${day ?? (1 + Math.floor(Math.random() * 28))}`,
})

const EVENTS = [
  {
    title: 'Ghost Ship! 👻',
    body: 'Through the morning mist, a silent vessel drifts without crew or flag.',
    choices: [
      { text: 'Board and loot her', action: 'ghost_loot' },
      { text: 'Leave well enough alone', action: 'ghost_ignore' },
    ],
  },
  {
    title: 'Merchant Offer 💰',
    body: 'A fat merchant vessel signals for parley. Accept their escort contract — or take what you want.',
    choices: [
      { text: 'Accept escort (200 gold)', action: 'merchant_escort' },
      { text: 'Raid them!', action: 'merchant_raid' },
    ],
  },
  {
    title: 'Tropical Storm! ⛈️',
    body: 'A violent storm tears across the sea — your crew scrambles for their lives.',
    choices: [
      { text: 'Ride it out', action: 'storm_ride' },
      { text: 'Seek shelter', action: 'storm_shelter' },
    ],
  },
  {
    title: 'Stranded Sailor 🆘',
    body: 'A lone figure waves from a rocky outcropping, claiming to be a navigator wrongly marooned.',
    choices: [
      { text: 'Rescue him', action: 'sailor_rescue' },
      { text: 'Sail on', action: 'sailor_ignore' },
    ],
  },
]

export const useGameStore = create<GameState>((set, get) => ({
  gold: 2450,
  notoriety: 12,
  month: 8,
  year: 1695,
  ship: { name: 'The Crimson Serpent', cannons: 8, hull: 85, maxHull: 100, crew: 22, maxCrew: 30, morale: 68, maxCargo: 50, speed: 3 },
  reputation: { pirates: 60, navy: 20, merchants: 40, natives: 75 },
  wantedLevel: 1,
  currentPort: 0,
  inventory: [],
  log: [
    mkLog('travel', 'Dropped anchor at Port Royal. The stench of tar and opportunity fills the air.', 8, 14),
    mkLog('trade',  'Sold 8 barrels of rum to a merchant in Havana for 640 gold. Fine profit!', 7, 28),
    mkLog('event',  'A strange fog — found a derelict ship. Claimed 200 gold from the wreck.', 7, 15),
    mkLog('combat', 'Intercepted a Spanish galleon. Took their spices and left them adrift.', 7, 3),
  ],
  toast: null,
  battle: null,
  modal: null,
  sailModalOpen: false,

  addLog: (type, text) => set(s => ({
    log: [mkLog(type, text, s.month), ...s.log].slice(0, 50),
  })),

  showToast: (msg) => {
    set({ toast: msg })
    setTimeout(() => set({ toast: null }), 2500)
  },

  clearToast: () => set({ toast: null }),

  buyGood: (goodIdx, price) => set(s => {
    const cargo = s.inventory.reduce((a, i) => a + i.qty, 0)
    if (s.gold < price || cargo >= s.ship.maxCargo) return s
    const inv = [...s.inventory]
    const existing = inv.find(i => i.goodIdx === goodIdx)
    if (existing) existing.qty++
    else inv.push({ goodIdx, qty: 1, boughtAt: price })
    const good = GOODS[goodIdx]
    get().addLog('trade', `Bought 1 ${good.name} for ${price}g.`)
    get().showToast(`🛒 Bought ${good.name}`)
    return { gold: s.gold - price, inventory: inv }
  }),

  sellGood: (goodIdx, price) => set(s => {
    const inv = [...s.inventory]
    const idx = inv.findIndex(i => i.goodIdx === goodIdx)
    if (idx === -1) return s
    const item = inv[idx]
    const profit = price - item.boughtAt
    if (item.qty <= 1) inv.splice(idx, 1)
    else inv[idx] = { ...item, qty: item.qty - 1 }
    const good = GOODS[goodIdx]
    const ps = profit >= 0 ? `+${profit}g profit` : `${profit}g loss`
    get().addLog('trade', `Sold ${good.name} for ${price}g (${ps}).`)
    get().showToast(`💰 +${price}g`)
    return { gold: s.gold + price, inventory: inv }
  }),

  sailTo: (portIdx, days) => set(s => {
    const newMonth = (s.month + Math.floor(days / 30)) % 12
    const newYear = s.year + Math.floor((s.month + Math.floor(days / 30)) / 12)
    const port = PORTS[portIdx]
    get().addLog('travel', `Set sail for ${port.name}. ${days} days at sea.`)
    get().showToast(`⛵ Sailing to ${port.name}...`)

    // Random event chance
    setTimeout(() => {
      if (Math.random() < 0.4) {
        const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]
        set({ modal: { active: true, title: event.title, body: event.body, choices: event.choices } })
      }
    }, 500)

    return {
      currentPort: portIdx,
      month: newMonth,
      year: newYear,
      sailModalOpen: false,
      ship: { ...s.ship, morale: Math.max(0, s.ship.morale - Math.floor(days / 10)) },
    }
  }),

  upgradeShip: () => set(s => {
    const cost = 500
    if (s.gold < cost) { get().showToast('❌ Not enough gold!'); return s }
    get().addLog('event', 'Upgraded ship hull and rigging.')
    get().showToast('🔧 Ship upgraded!')
    return { gold: s.gold - cost, ship: { ...s.ship, maxHull: s.ship.maxHull + 10, hull: Math.min(s.ship.hull + 20, s.ship.maxHull + 10), cannons: s.ship.cannons + 1 } }
  }),

  repairShip: () => set(s => {
    const missing = s.ship.maxHull - s.ship.hull
    if (missing === 0) { get().showToast('⚓ Hull is already intact!'); return s }
    const cost = Math.max(100, missing * 5)
    if (s.gold < cost) { get().showToast(`❌ Need ${cost}g to repair!`); return s }
    get().addLog('event', `Repaired ship hull for ${cost}g. All hands sealed the breach.`)
    get().showToast(`🔧 Hull restored! -${cost}g`)
    return { gold: s.gold - cost, ship: { ...s.ship, hull: s.ship.maxHull } }
  }),

  recruitCrew: () => set(s => {
    const cost = 150
    const slots = s.ship.maxCrew - s.ship.crew
    if (s.gold < cost || slots === 0) { get().showToast(slots === 0 ? '❌ Crew full!' : '❌ Not enough gold!'); return s }
    const hired = Math.min(3, slots)
    get().addLog('event', `Recruited ${hired} crew members.`)
    get().showToast(`👥 +${hired} crew`)
    return { gold: s.gold - cost, ship: { ...s.ship, crew: s.ship.crew + hired } }
  }),

  visitTavern: () => set(s => {
    const cost = 100
    if (s.gold < cost) { get().showToast('❌ Not enough gold!'); return s }
    const moraleGain = 15 + Math.floor(Math.random() * 15)
    get().addLog('event', `Crew enjoyed a night at the tavern. Morale up ${moraleGain}.`)
    get().showToast(`🍺 Morale +${moraleGain}!`)
    return { gold: s.gold - cost, ship: { ...s.ship, morale: Math.min(100, s.ship.morale + moraleGain) } }
  }),

  startRaid: () => set(s => {
    const template = ENEMY_SHIPS[Math.floor(Math.random() * ENEMY_SHIPS.length)]
    const battle: BattleState = {
      active: true,
      phase: 'player',
      outcome: null,
      player: {
        name: s.ship.name,
        emoji: '⛵',
        shipClass: `${s.ship.cannons} Cannons`,
        hp: s.ship.hull,
        maxHp: s.ship.maxHull,
        crew: s.ship.crew,
        cannons: s.ship.cannons,
        armor: 2,
        statuses: [],
      },
      enemy: {
        ...template,
        hp: template.maxHp,
        statuses: [],
      },
      cooldowns: {},
      repairUsed: false,
      log: [{ text: `⚓ Intercepted ${template.name}! Battle stations!`, type: 'system' }],
      goldGained: 0,
      hullDamage: 0,
      crewLost: 0,
    }
    return { battle }
  }),

  playerBattleAction: (action) => {
    const s = get()
    if (!s.battle || s.battle.phase !== 'player') return

    const b = { ...s.battle }
    const p = { ...b.player }
    const e = { ...b.enemy }
    let msg = ''

    const cd = b.cooldowns[action] ?? 0
    if (cd > 0) return

    const newCooldowns = { ...b.cooldowns }

    switch (action) {
      case 'broadside': {
        const dmg = Math.max(1, p.cannons * 2 + Math.floor(Math.random() * 10) - e.armor)
        e.hp = Math.max(0, e.hp - dmg)
        msg = `💥 Broadside! ${dmg} hull damage to ${e.name}.`
        newCooldowns.broadside = 0
        break
      }
      case 'grapeshot': {
        const crewDmg = Math.floor(Math.random() * 6) + 2
        e.crew = Math.max(0, e.crew - crewDmg)
        msg = `🔫 Grapeshot! Killed ${crewDmg} enemy crew.`
        newCooldowns.grapeshot = 2
        break
      }
      case 'board': {
        const pStr = p.crew * (0.5 + Math.random() * 0.5)
        const eStr = e.crew * e.crewFight * (0.5 + Math.random() * 0.5)
        if (pStr > eStr) {
          const gold = e.goldMin + Math.floor(Math.random() * (e.goldMax - e.goldMin))
          set(st => ({ gold: st.gold + gold }))
          b.goldGained = gold
          b.outcome = 'victory'
          b.phase = 'result'
          msg = `⚔️ Boarding successful! Seized ${gold} gold!`
        } else {
          const crewLost = Math.floor(Math.random() * 5) + 2
          p.crew = Math.max(1, p.crew - crewLost)
          b.crewLost += crewLost
          msg = `⚔️ Boarding repelled! Lost ${crewLost} crew.`
        }
        newCooldowns.board = 3
        break
      }
      case 'repair': {
        if (b.repairUsed) return
        const repaired = 20 + Math.floor(Math.random() * 10)
        p.hp = Math.min(p.maxHp, p.hp + repaired)
        b.repairUsed = true
        msg = `🔧 Emergency repairs! +${repaired} hull.`
        break
      }
      case 'fireship': {
        const existing = e.statuses.find(st => st.type === 'burning')
        if (!existing) e.statuses = [...e.statuses, { type: 'burning', label: '🔥 Burning', turnsLeft: 3 }]
        msg = `🔥 Fire bomb away! ${e.name} is burning!`
        newCooldowns.fireship = 4
        break
      }
      case 'flee': {
        const success = Math.random() < 0.5 + (p.cannons > e.cannons ? 0.2 : 0)
        if (success) {
          b.outcome = 'fled'
          b.phase = 'result'
          msg = `💨 Escaped! The enemy falls behind.`
        } else {
          msg = `💨 Flee attempt failed! Enemy closes in.`
        }
        break
      }
    }

    b.log = [{ text: msg, type: 'player' }, ...b.log]
    b.player = p
    b.enemy = e

    // Tick cooldowns
    Object.keys(newCooldowns).forEach(k => { if (newCooldowns[k] > 0) newCooldowns[k]-- })
    b.cooldowns = newCooldowns

    if (b.phase === 'result') {
      set({ battle: b })
      return
    }

    // Check enemy dead
    if (e.hp <= 0 || e.crew <= 0) {
      const gold = e.goldMin + Math.floor(Math.random() * (e.goldMax - e.goldMin))
      set(st => ({ gold: st.gold + gold }))
      b.goldGained = gold
      b.outcome = 'victory'
      b.phase = 'result'
      set({ battle: b })
      return
    }

    // Enemy turn
    b.phase = 'enemy'
    set({ battle: b })

    setTimeout(() => {
      const s2 = get()
      if (!s2.battle || s2.battle.phase !== 'enemy') return
      const b2 = { ...s2.battle }
      const p2 = { ...b2.player }
      const e2 = { ...b2.enemy }

      // Tick burning status on enemy
      const wasBurning = b2.enemy.statuses.some(st => st.type === 'burning')
      e2.statuses = e2.statuses.map(st => ({ ...st, turnsLeft: st.turnsLeft - 1 })).filter(st => st.turnsLeft > 0)
      let burnMsg = ''
      if (wasBurning) {
        const cannonDmg = (Math.floor(Math.random() * 2) + 1) * p2.cannons  // 1–2 dmg per cannon
        const bonusDmg = Math.floor(Math.random() * 6) + 5                   // 5–10 random burn
        const burnDmg = cannonDmg + bonusDmg
        e2.hp = Math.max(0, e2.hp - burnDmg)
        burnMsg = `🔥 Flames spread! ${burnDmg} burn damage to ${e2.name}.`
      }

      // Enemy attacks
      const eDmg = Math.max(1, e2.cannons * 2 + Math.floor(Math.random() * 8) - p2.armor)
      p2.hp = Math.max(0, p2.hp - eDmg)
      b2.hullDamage += eDmg
      const eMsg = `💥 ${e2.name} fires back! ${eDmg} hull damage.`

      const logEntries: Array<{ text: string; type: string }> = []
      if (burnMsg) logEntries.push({ text: burnMsg, type: 'player' })
      logEntries.push({ text: eMsg, type: 'enemy' })
      b2.log = [...logEntries, ...b2.log]
      b2.player = p2
      b2.enemy = e2
      b2.phase = 'player'

      if (p2.hp <= 0) {
        b2.outcome = 'defeat'
        b2.phase = 'result'
      } else if (e2.hp <= 0) {
        const gold = e2.goldMin + Math.floor(Math.random() * (e2.goldMax - e2.goldMin))
        set(st => ({ gold: st.gold + gold }))
        b2.goldGained = gold
        b2.outcome = 'victory'
        b2.phase = 'result'
      }

      set({ battle: b2 })
    }, 800)
  },

  closeBattle: () => set(s => {
    if (!s.battle) return s
    const b = s.battle
    const ship = { ...s.ship }
    if (b.outcome === 'victory') {
      ship.hull = Math.max(10, ship.hull - b.hullDamage)
      ship.crew = Math.max(1, ship.crew - b.crewLost)
      get().addLog('combat', `Victory! Seized ${b.goldGained} gold. Hull -${b.hullDamage}, Crew -${b.crewLost}.`)
    } else if (b.outcome === 'defeat') {
      ship.hull = 15
      ship.crew = Math.max(1, Math.floor(ship.crew * 0.4))
      get().addLog('combat', 'Defeated. Ship crippled, crew decimated.')
      get().showToast('💀 Defeated!')
    }
    return { battle: null, ship }
  }),

  closeModal: () => set({ modal: null }),
  openSailModal: () => set({ sailModalOpen: true }),
  closeSailModal: () => set({ sailModalOpen: false }),

  resolveModalChoice: (choiceIdx) => set(s => {
    if (!s.modal) return s
    const choice = s.modal.choices[choiceIdx]
    const updates: Partial<GameState> = { modal: null }

    switch (choice.action) {
      case 'ghost_loot': {
        const gold = 150 + Math.floor(Math.random() * 200)
        get().addLog('combat', `Boarded the ghost ship. Found ${gold} gold!`)
        get().showToast(`⚓ Found treasure!`)
        return { ...updates, gold: s.gold + gold }
      }
      case 'ghost_ignore':
        get().addLog('event', 'Let the ghost ship sail on.')
        return updates
      case 'merchant_escort': {
        get().addLog('trade', 'Escort contract: +200 gold.')
        get().showToast('🤝 +200 gold!')
        return { ...updates, gold: s.gold + 200, reputation: { ...s.reputation, merchants: Math.min(100, s.reputation.merchants + 8) } }
      }
      case 'merchant_raid': {
        const loot = 300 + Math.floor(Math.random() * 300)
        get().addLog('combat', `Raided merchant! Seized ${loot} gold.`)
        get().showToast(`💥 +${loot} gold!`)
        return { ...updates, gold: s.gold + loot, notoriety: s.notoriety + 5, reputation: { ...s.reputation, navy: Math.max(0, s.reputation.navy - 10), merchants: Math.max(0, s.reputation.merchants - 15) } }
      }
      case 'storm_ride': {
        const dmg = 5 + Math.floor(Math.random() * 20)
        get().addLog('event', `Storm: -${dmg} hull.`)
        get().showToast(`⛈️ -${dmg} hull`)
        return { ...updates, ship: { ...s.ship, hull: Math.max(10, s.ship.hull - dmg) } }
      }
      case 'storm_shelter':
        get().addLog('event', 'Took shelter. Lost two days, ship intact.')
        get().showToast('🌴 Sheltered safely.')
        return updates
      case 'sailor_rescue':
        get().addLog('event', 'Rescued the sailor. Morale up.')
        get().showToast('⚓ +1 crew, +morale')
        return { ...updates, ship: { ...s.ship, crew: Math.min(s.ship.maxCrew, s.ship.crew + 1), morale: Math.min(100, s.ship.morale + 10) } }
      case 'sailor_ignore':
        get().addLog('event', 'Left the sailor behind. Crew unsettled.')
        return { ...updates, ship: { ...s.ship, morale: Math.max(0, s.ship.morale - 5) } }
      default:
        return updates
    }
  }),
}))
