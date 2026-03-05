import { useGameStore } from '../../stores/gameStore'

export default function EventModal() {
  const { modal, closeModal, resolveModalChoice } = useGameStore()
  if (!modal?.active) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="panel p-6 w-full max-w-sm mx-4">
        <div className="panel-title mb-3">{modal.title}</div>
        <p className="text-sm text-sand-light/70 mb-5 leading-relaxed">{modal.body}</p>
        <div className="flex flex-col gap-2">
          {modal.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => resolveModalChoice(i)}
              className="bg-black/30 border border-gold/30 text-sand-light/80 hover:border-gold/60 hover:text-gold rounded px-4 py-2.5 text-sm text-left transition-all hover:bg-black/50"
            >
              {choice.text}
            </button>
          ))}
        </div>
        <button onClick={closeModal} className="mt-4 w-full text-xs text-sand-light/30 hover:text-sand-light/60 transition-colors">
          — Dismiss —
        </button>
      </div>
    </div>
  )
}
