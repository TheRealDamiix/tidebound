import { useRef, useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'

export default function ActionBar() {
  const { openSailModal, startRaid, upgradeShip, repairShip, recruitCrew, visitTavern } = useGameStore()
  const [harborOpen, setHarborOpen] = useState(false)
  const harborRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (harborRef.current && !harborRef.current.contains(e.target as Node)) {
        setHarborOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex gap-2 px-4 py-2 bg-black/20 border-b border-gold/10 flex-wrap items-center">
      {/* Set Sail */}
      <button
        onClick={openSailModal}
        className="btn-primary text-xs px-3 py-1.5 bg-black/30 border border-blue-500/50 text-blue-300 hover:bg-blue-900/30 transition-all"
      >
        ⛵ Set Sail
      </button>

      {/* Raid Ship */}
      <button
        onClick={startRaid}
        className="btn-primary text-xs px-3 py-1.5 bg-black/30 border border-red-500/50 text-red-300 hover:bg-red-900/30 transition-all"
      >
        💥 Raid Ship
      </button>

      {/* Harbor dropdown */}
      <div className="relative" ref={harborRef}>
        <button
          onClick={() => setHarborOpen(v => !v)}
          className={`btn-primary text-xs px-3 py-1.5 bg-black/30 border transition-all
            ${harborOpen
              ? 'border-amber-400/70 text-amber-200 bg-amber-900/30'
              : 'border-amber-500/50 text-amber-300 hover:bg-amber-900/30'
            }`}
        >
          🏠 Harbor {harborOpen ? '▲' : '▼'}
        </button>

        {harborOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 flex flex-col gap-1 min-w-[170px]
                          bg-ocean-900 border border-gold/30 rounded p-2 shadow-xl shadow-black/60">
            <div className="text-[0.6rem] text-gold/40 font-heading tracking-widest uppercase px-1 pb-1 border-b border-gold/10 mb-1">
              Harbor Services
            </div>
            <button
              onClick={() => { repairShip(); setHarborOpen(false) }}
              className="btn-primary text-xs px-3 py-1.5 bg-black/30 border border-green-500/50 text-green-300 hover:bg-green-900/30 transition-all text-left w-full"
            >
              🔧 Repair Ship
            </button>
            <button
              onClick={() => { upgradeShip(); setHarborOpen(false) }}
              className="btn-primary text-xs px-3 py-1.5 bg-black/30 border border-purple-500/50 text-purple-300 hover:bg-purple-900/30 transition-all text-left w-full"
            >
              ⚒️ Upgrade Ship
            </button>
          </div>
        )}
      </div>

      {/* Recruit Crew */}
      <button
        onClick={recruitCrew}
        className="btn-primary text-xs px-3 py-1.5 bg-black/30 border border-green-500/50 text-green-300 hover:bg-green-900/30 transition-all"
      >
        👥 Recruit Crew
      </button>

      {/* Tavern */}
      <button
        onClick={visitTavern}
        className="btn-primary text-xs px-3 py-1.5 bg-black/30 border border-yellow-500/50 text-yellow-300 hover:bg-yellow-900/30 transition-all"
      >
        🍺 Tavern
      </button>
    </div>
  )
}
