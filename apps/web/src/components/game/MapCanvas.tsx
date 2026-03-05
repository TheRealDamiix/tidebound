import { useEffect, useRef } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { PORTS } from '../../data/gameData'

export default function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentPort } = useGameStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    // Ocean background
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7)
    grad.addColorStop(0, '#0a2a5e')
    grad.addColorStop(1, '#050f32')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = 'rgba(100,150,255,0.06)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Trade route lines
    ctx.strokeStyle = 'rgba(244,197,66,0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 8])
    for (let i = 0; i < PORTS.length; i++) {
      for (let j = i + 1; j < PORTS.length; j++) {
        ctx.beginPath()
        ctx.moveTo(PORTS[i].x * W, PORTS[i].y * H)
        ctx.lineTo(PORTS[j].x * W, PORTS[j].y * H)
        ctx.stroke()
      }
    }
    ctx.setLineDash([])

    // Ports
    PORTS.forEach((port, i) => {
      const x = port.x * W
      const y = port.y * H
      const isActive = i === currentPort

      // Glow for active port
      if (isActive) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 20)
        glow.addColorStop(0, 'rgba(244,197,66,0.4)')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill()
      }

      // Port dot
      ctx.beginPath()
      ctx.arc(x, y, isActive ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = isActive ? '#f4c542' : port.faction === 'pirates' ? '#ef4444' : port.faction === 'spanish' ? '#eab308' : port.faction === 'english' ? '#3b82f6' : '#94a3b8'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Port label
      ctx.fillStyle = isActive ? '#f4c542' : 'rgba(232,220,200,0.7)'
      ctx.font = `${isActive ? 'bold ' : ''}${isActive ? 10 : 9}px "Cinzel", serif`
      ctx.textAlign = 'center'
      ctx.fillText(port.name, x, y - 10)
    })

    // Compass rose
    const cx = W - 35, cy = H - 35
    ctx.fillStyle = 'rgba(244,197,66,0.5)'
    ctx.font = '10px serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, cy - 18)
    ctx.fillText('S', cx, cy + 24)
    ctx.fillText('E', cx + 20, cy + 4)
    ctx.fillText('W', cx - 20, cy + 4)
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(244,197,66,0.3)'; ctx.lineWidth = 1; ctx.stroke()

  }, [currentPort])

  return (
    <div className="panel p-0 overflow-hidden relative">
      <div className="absolute top-2 left-0 right-0 text-center z-10 pointer-events-none">
        <span className="text-xs text-gold/50 font-heading tracking-widest uppercase">The Caribbean Sea · Anno 1695</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full min-h-[360px]" />
    </div>
  )
}
