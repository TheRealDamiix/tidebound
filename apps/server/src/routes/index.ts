import type { FastifyInstance } from 'fastify'
import { healthRoutes }  from './health.js'
import { playerRoutes }  from './player.js'
import { marketRoutes }  from './market.js'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes,  { prefix: '/api/health' })
  await app.register(playerRoutes,  { prefix: '/api/player' })
  await app.register(marketRoutes,  { prefix: '/api/market' })
}
