import { useGameStore } from '../../stores/gameStore'

const FACTIONS = [
  { key: 'pirates' as const,   icon: '☠️', name: 'Pirate Brethren', color: 'bg-red-500' },
  { key: 'navy' as const,      icon: '⚓', name: 'Royal Navy',       color: 'bg-blue-500' },
  { key: 'merchants' as const, icon: '💰', name: 'Merchants Guild',  color: 'bg-yellow-500' },
  { key: 'natives' as const,   icon: '🌴', name: 'Island Natives',   color: 'bg-green-500' },
]

function repLabel(v: number) {
  if (v >= 80) return { text: 'Allied',    cls: 'text-green-400' }
  if (v >= 60) return { text: 'Respected', cls: 'text-blue-400' }
  if (v >= 40) return { text: 'Neutral',   cls: 'text-sand-light/50' }
  if (v >= 20) return { text: 'Wary',      cls: 'text-yellow-400' }
  return               { text: 'Hostile',  cls: 'text-red-400' }
}

export default function ReputationPanel() {
  const { reputation } = useGameStore()

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="panel-title">⚜️ Reputation</div>
      {FACTIONS.map(f => {
        const val = reputation[f.key]
        const { text, cls } = repLabel(val)
        return (
          <div key={f.key} className="flex items-center gap-2">
            <span className="text-lg w-6 text-center">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-sand-light/70">{f.name}</span>
                <span className={`font-bold font-numbers ${cls}`}>{text}</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${f.color}`} style={{ width: `${val}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
