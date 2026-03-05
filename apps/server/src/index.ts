import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { Server } from 'socket.io'
import { createServer } from 'http'

import { redis, connectRedis } from './lib/redis.js'
import { supabase } from './lib/supabase.js'
import { registerRoutes } from './routes/index.js'
import { registerSocketHandlers } from './sockets/index.js'

const PORT = Number(process.env.PORT ?? 4000)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

async function bootstrap() {
  // ── Redis (non-fatal — server starts even if Redis is down) ───
  await connectRedis()

  // ── Fastify ──────────────────────────────────
  const app = Fastify({ logger: { level: 'info' } })

  await app.register(helmet)
  await app.register(cors, { origin: CORS_ORIGIN, credentials: true })

  registerRoutes(app)

  // ── HTTP server + Socket.io ───────────────────
  const httpServer = createServer(app.server)

  const io = new Server(httpServer, {
    cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
  })

  registerSocketHandlers(io)

  // ── Start ─────────────────────────────────────
  await app.ready()

  httpServer.listen(PORT, () => {
    console.log(`🏴‍☠️  Tidebound server running on port ${PORT}`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...')
    await redis.quit()
    await app.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
