import { useGameStore } from '../../stores/gameStore'
import { PORTS, GOODS, getPortPrices } from '../../data/gameData'
import { useMemo } from 'react'

export default function PortPanel() {
  const { currentPort, gold, inventory, ship, buyGood, sellGood } = useGameStore()
  const port = PORTS[currentPort]
  const prices = useMemo(() => getPortPrices(currentPort), [currentPort])
  const cargo = inventory.reduce((a, i) => a + i.qty, 0)

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="panel-title">⚓ Current Port</div>

      <div className="text-center pb-2 border-b border-gold/15">
        <div className="font-heading text-gold font-bold text-xl leading-tight">{port.name}</div>
        <div className={`text-xs font-bold capitalize mt-1 tracking-wider
          ${port.faction === 'pirates' ? 'text-red-400' : port.faction === 'spanish' ? 'text-yellow-400' : port.faction === 'english' ? 'text-blue-400' : 'text-sand-light/50'}`}>
          {port.faction}
        </div>
        <div className="text-xs text-sand-light/40 mt-1 italic">{port.desc}</div>
      </div>

      <div className="flex flex-col gap-1.5">
        {port.goods.map((goodIdx, i) => {
          const good = GOODS[goodIdx]
          const price = prices[i]
          const owned = inventory.find(it => it.goodIdx === goodIdx)?.qty ?? 0
          const canBuy = gold >= price && cargo < ship.maxCargo
          const basePrice = good.basePrice
          const priceClass = price > basePrice * 1.1 ? 'text-red-400' : price < basePrice * 0.9 ? 'text-green-400' : 'text-sand-light'

          return (
            <div key={goodIdx} className="flex items-center gap-2 bg-black/20 rounded px-2 py-1.5 text-xs">
              <span className="text-base">{good.icon}</span>
              <span className="text-sand-light/80 flex-1">{good.name}</span>
              <span className={`font-bold font-numbers tabular-nums w-12 text-right ${priceClass}`}>{price}g</span>
              <button
                onClick={() => buyGood(goodIdx, price)}
                disabled={!canBuy}
                className="px-2 py-0.5 bg-gold/20 border border-gold/40 text-gold rounded text-xs hover:bg-gold/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                BUY
              </button>
              <button
                onClick={() => sellGood(goodIdx, price)}
                disabled={owned === 0}
                className="px-2 py-0.5 bg-green-900/30 border border-green-500/40 text-green-400 rounded text-xs hover:bg-green-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                SELL{owned > 0 ? ` (${owned})` : ''}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
