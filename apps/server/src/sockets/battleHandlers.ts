import type { Server, Socket } from 'socket.io'
import type { WS_ClientToServer, WS_ServerToClient } from '@tidebound/shared'
import { redis, RedisKeys } from '../lib/redis.js'

export function registerBattleHandlers(
  io: Server<WS_ClientToServer, WS_ServerToClient>,
  socket: Socket<WS_ClientToServer, WS_ServerToClient>,
) {
  socket.on('battle:action', async (payload) => {
    // 1. Load battle state from Redis
    const raw = await redis.get(RedisKeys.battleState(payload.battleId))
    if (!raw) return

    // 2. TODO: validate player is party to this battle
    // 3. TODO: resolve turn (pure function from shared package)
    // 4. TODO: persist updated state back to Redis
    // 5. Emit result back to player
    // socket.emit('battle:turn_result', result)
  })
}
