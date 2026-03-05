import { Redis } from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
})

redis.on('connect',      () => console.log('✅ Redis connected'))
redis.on('error', (err: Error) => console.error('❌ Redis error:', err))

// connectRedis() is called from bootstrap() so a Redis outage never
// prevents the HTTP server from starting and passing health checks.
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect()
  } catch (err) {
    console.error('⚠️  Redis unavailable — market cache and battle state disabled:', err)
  }
}

// ── Key helpers ────────────────────────────────
// Centralise all Redis key patterns here to avoid typos across the codebase

export const RedisKeys = {
  battleState:    (battleId: string)  => `battle:${battleId}`,
  marketPrices:   (portId: string)    => `market:${portId}`,
  playerSession:  (playerId: string)  => `session:${playerId}`,
  onlinePlayers:  ()                  => `players:online`,
} as const
