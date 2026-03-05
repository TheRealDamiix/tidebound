import { useGameStore } from '../../stores/gameStore'
import { GOODS } from '../../data/gameData'

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm text-sand-light/80 mb-1">
        <span>{label}</span>
        <span className="font-bold font-numbers tabular-nums">{value}/{max}</span>
      </div>
      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ShipPanel() {
  const { ship, inventory } = useGameStore()
  const cargo = inventory.reduce((a, i) => a + i.qty, 0)

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="panel-title">⛵ Your Vessel</div>

      <div className="text-3xl text-center">🏴‍☠️</div>
      <div className="text-center">
        <div className="font-heading text-gold text-sm font-bold">{ship.name}</div>
        <div className="text-xs text-sand-light/50 italic">{ship.cannons} Cannons</div>
      </div>

      <div>
        <StatBar label="Hull"   value={ship.hull}   max={ship.maxHull} color="bg-blue-400" />
        <StatBar label="Crew"   value={ship.crew}   max={ship.maxCrew} color="bg-green-400" />
        <StatBar label="Morale" value={ship.morale} max={100}          color="bg-yellow-400" />
        <StatBar label="Cargo"  value={cargo}       max={ship.maxCargo} color="bg-orange-400" />
      </div>

      {inventory.length > 0 && (
        <div>
          <div className="text-xs text-sand-light/40 uppercase tracking-wider mb-2">Cargo Hold</div>
          <div className="grid grid-cols-2 gap-1">
            {inventory.map(item => (
              <div key={item.goodIdx} className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 text-xs">
                <span>{GOODS[item.goodIdx].icon}</span>
                <span className="text-sand-light/70 truncate">{GOODS[item.goodIdx].name}</span>
                <span className="text-gold ml-auto">×{item.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
