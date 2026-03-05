import type { FastifyInstance } from 'fastify'
import { redis, RedisKeys } from '../lib/redis.js'

export async function marketRoutes(app: FastifyInstance) {
  // GET /api/market/:portId
  app.get<{ Params: { portId: string } }>('/:portId', async (req, reply) => {
    const cached = await redis.get(RedisKeys.marketPrices(req.params.portId))
    if (cached) return JSON.parse(cached) as unknown

    // TODO: generate prices, cache in Redis with TTL, return
    return reply.status(503).send({ error: 'Market data not yet available' })
  })
}
