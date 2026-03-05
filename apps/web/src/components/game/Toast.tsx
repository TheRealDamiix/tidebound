import { useGameStore } from '../../stores/gameStore'

export default function Toast() {
  const { toast } = useGameStore()
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="bg-black/80 border border-gold/40 text-gold font-heading font-bold text-sm px-5 py-2.5 rounded shadow-xl backdrop-blur">
        {toast}
      </div>
    </div>
  )
}
