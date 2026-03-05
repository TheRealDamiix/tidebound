import { useGameStore } from '../../stores/gameStore'
import type { Combatant } from '../../stores/gameStore'

const BATTLE_ACTIONS = [
  { key: 'broadside', icon: '💥', label: 'Broadside',  desc: 'Fire all cannons — heavy hull damage', cd: 0 },
  { key: 'grapeshot', icon: '🔫', label: 'Grapeshot',  desc: 'Shred their crew, reduce attack power', cd: 2 },
  { key: 'board',     icon: '⚔️', label: 'Board',      desc: 'Crew vs crew — ends fight instantly', cd: 3 },
  { key: 'repair',    icon: '🔧', label: 'Repair',     desc: 'Emergency patch — restore hull (1 use)', cd: 0 },
  { key: 'fireship',  icon: '🔥', label: 'Fire Bomb',  desc: 'Burn their deck — damage over time', cd: 4 },
  { key: 'flee',      icon: '💨', label: 'Flee',       desc: 'Attempt to disengage and escape', cd: 0 },
]

function ShipCard({ combatant, side }: { combatant: Combatant; side: 'player' | 'enemy' }) {
  const hpPct = Math.round((combatant.hp / combatant.maxHp) * 100)
  const hpColor = hpPct > 60 ? 'bg-green-500' : hpPct > 30 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className={`panel p-4 flex-1 min-w-0 ${side === 'player' ? 'border-blue-500/30' : 'border-red-500/30'}`}>
      <div className="flex flex-col items-center gap-2">
        {combatant.statuses.map((s, i) => (
          <span key={i} className="text-xs bg-red-900/40 border border-red-500/30 text-red-300 px-2 py-0.5 rounded">{s.label}</span>
        ))}
        <div className="text-4xl">{combatant.emoji}</div>
        <div className="font-heading text-sm font-bold text-center" style={{ color: side === 'player' ? '#6ec6ff' : '#ff7070' }}>
          {combatant.name}
        </div>
        <div className="text-xs text-sand-light/40 italic">{combatant.shipClass}</div>
        <div className="w-full">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-sand-light/50">Hull</span>
            <span className="text-sand-light/80 font-bold font-numbers tabular-nums">{combatant.hp} / {combatant.maxHp}</span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        <div className="flex gap-3 text-sm text-sand-light/70 font-numbers tabular-nums">
          <span>👥 {combatant.crew}</span>
          <span>💣 {combatant.cannons}</span>
        </div>
      </div>
    </div>
  )
}

export default function BattleScreen() {
  const { battle, playerBattleAction, closeBattle } = useGameStore()
  if (!battle?.active) return null

  const isPlayerTurn = battle.phase === 'player'

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0820 0%, #05030f 100%)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20">
        <div className="font-heading text-gold font-bold">⚔️ Naval Engagement</div>
        <div className={`text-xs font-bold px-3 py-1 rounded border ${isPlayerTurn ? 'border-blue-500/50 text-blue-300 bg-blue-900/20' : 'border-red-500/50 text-red-300 bg-red-900/20'}`}>
          {battle.phase === 'result' ? '— Battle Over —' : isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}
        </div>
      </div>

      {/* Ships */}
      <div className="flex gap-4 p-4">
        <ShipCard combatant={battle.player} side="player" />
        <div className="flex flex-col items-center justify-center px-2">
          <div className="w-px flex-1 bg-gold/20" />
          <div className="text-gold/50 font-heading text-sm py-2">VS</div>
          <div className="w-px flex-1 bg-gold/20" />
        </div>
        <ShipCard combatant={battle.enemy} side="enemy" />
      </div>

      {/* Battle log */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col-reverse gap-1 min-h-0">
        {battle.log.map((entry, i) => (
          <div key={i} className={`text-sm py-0.5 ${entry.type === 'player' ? 'text-blue-300' : entry.type === 'enemy' ? 'text-red-300' : 'text-sand-light/40'}`}>
            {entry.text}
          </div>
        ))}
      </div>

      {/* Actions or Result */}
      {battle.phase === 'result' ? (
        <div className="p-4 border-t border-gold/20 text-center">
          <div className={`font-heading text-2xl font-bold mb-2 ${battle.outcome === 'victory' ? 'text-gold' : battle.outcome === 'defeat' ? 'text-red-400' : 'text-blue-400'}`}>
            {battle.outcome === 'victory' ? '🏆 Victory!' : battle.outcome === 'defeat' ? '💀 Defeated!' : '💨 Escaped!'}
          </div>
          {battle.outcome === 'victory' && (
            <div className="text-base text-sand-light/70 mb-3 font-numbers tabular-nums">
              +{battle.goldGained} gold · Hull damage: {battle.hullDamage} · Crew lost: {battle.crewLost}
            </div>
          )}
          <button onClick={closeBattle} className="btn-primary border border-gold/50 text-gold px-6 py-2 bg-black/30 hover:bg-gold/10">
            Return to Sea
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-gold/20 grid grid-cols-3 gap-2">
          {BATTLE_ACTIONS.map(a => {
            const cd = battle.cooldowns[a.key] ?? 0
            const disabled = !isPlayerTurn || cd > 0 || (a.key === 'repair' && battle.repairUsed)
            return (
              <button
                key={a.key}
                onClick={() => playerBattleAction(a.key)}
                disabled={disabled}
                className="flex flex-col items-center gap-1 bg-black/30 border border-gold/20 rounded p-2 hover:border-gold/50 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-xl">{a.icon}</span>
                <span className="text-xs font-heading font-bold text-gold">{a.label}</span>
                <span className="text-[10px] text-sand-light/40 text-center leading-tight">{cd > 0 ? `⏳ ${cd} turns` : a.desc}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
