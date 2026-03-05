import { useGameStore } from '../../stores/gameStore'
import { MONTHS } from '../../data/gameData'

export default function GameHUD() {
  const { gold, notoriety, ship, month, year, inventory } = useGameStore()
  const cargo = inventory.reduce((a, i) => a + i.qty, 0)

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-gold/20 flex-wrap gap-2">
      <div className="text-gold font-heading font-bold tracking-widest text-sm uppercase">
        ⚓ Sea <span className="text-white">Devils</span> Tycoon
      </div>

      <div className="flex gap-3 flex-wrap">
        <Pill icon="🪙" label="Gold" value={gold.toLocaleString()} />
        <Pill icon="💀" label="Notoriety" value={String(notoriety)} />
        <Pill icon="📦" label="Cargo" value={`${cargo}/${ship.maxCargo}`} />
      </div>

      <div className="text-xs text-sand-light/60 font-heading text-right">
        Year of Our Lord {year}<br />
        Month of {MONTHS[month]}
      </div>
    </div>
  )
}

function Pill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-black/30 border border-gold/20 rounded px-3 py-1.5 text-sm">
      <span>{icon}</span>
      <span className="text-sand-light/50">{label}:</span>
      <span className="text-gold font-bold text-base font-numbers tabular-nums">{value}</span>
    </div>
  )
}
