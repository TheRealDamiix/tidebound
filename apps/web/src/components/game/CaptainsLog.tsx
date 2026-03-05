import { useGameStore } from '../../stores/gameStore'

const TYPE_STYLES: Record<string, string> = {
  travel: 'border-l-blue-400 text-blue-200/80',
  trade:  'border-l-green-400 text-green-200/80',
  event:  'border-l-yellow-400 text-yellow-200/80',
  combat: 'border-l-red-400 text-red-200/80',
}

export default function CaptainsLog() {
  const { log } = useGameStore()

  return (
    <div className="panel p-4 flex flex-col gap-2">
      <div className="panel-title">📜 Captain's Log</div>
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48">
        {log.map(entry => (
          <div key={entry.id} className={`border-l-2 pl-2 py-0.5 text-xs ${TYPE_STYLES[entry.type] ?? 'border-l-sand-light/20 text-sand-light/60'}`}>
            <span className="text-sand-light/30 mr-2">{entry.date}</span>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  )
}
