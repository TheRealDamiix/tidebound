import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
})

redis.on('connect',      () => console.log('✅ Redis connected'))
redis.on('error', (err) => console.error('❌ Redis error:', err))

await redis.connect()

// ── Key helpers ────────────────────────────────
// Centralise all Redis key patterns here to avoid typos across the codebase

export const RedisKeys = {
  battleState:    (battleId: string)  => `battle:${battleId}`,
  marketPrices:   (portId: string)    => `market:${portId}`,
  playerSession:  (playerId: string)  => `session:${playerId}`,
  onlinePlayers:  ()                  => `players:online`,
} as const
