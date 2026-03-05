import { useGameStore } from '../../stores/gameStore'
import { PORTS } from '../../data/gameData'

export default function SailModal() {
  const { sailModalOpen, closeSailModal, sailTo, currentPort, ship } = useGameStore()
  if (!sailModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={closeSailModal}>
      <div className="panel p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="panel-title mb-4">⛵ Set Sail — Choose Destination</div>
        <div className="flex flex-col gap-2">
          {PORTS.map((port, i) => {
            if (i === currentPort) return null
            const dist = Math.round(Math.sqrt(Math.pow((port.x - PORTS[currentPort].x) * 10, 2) + Math.pow((port.y - PORTS[currentPort].y) * 10, 2)) * 3)
            const days = Math.max(2, dist - ship.speed)
            return (
              <button
                key={i}
                onClick={() => sailTo(i, days)}
                className="flex items-center justify-between bg-black/30 border border-gold/20 rounded px-3 py-2 text-left hover:border-gold/50 hover:bg-black/50 transition-all group"
              >
                <div>
                  <div className="font-heading text-gold text-sm group-hover:text-gold font-bold">{port.name}</div>
                  <div className="text-xs text-sand-light/40 mt-0.5">{port.desc.slice(0, 50)}...</div>
                </div>
                <div className="text-xs text-sand-light/50 ml-4 shrink-0">~{days} days</div>
              </button>
            )
          })}
        </div>
        <button onClick={closeSailModal} className="mt-4 w-full text-xs text-sand-light/30 hover:text-sand-light/60 transition-colors">
          — Dismiss —
        </button>
      </div>
    </div>
  )
}
