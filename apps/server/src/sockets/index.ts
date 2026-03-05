import type { Server } from 'socket.io'
import type { WS_ClientToServer, WS_ServerToClient } from '@tidebound/shared'
import { registerBattleHandlers } from './battleHandlers.js'

export function registerSocketHandlers(
  io: Server<WS_ClientToServer, WS_ServerToClient>,
) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    registerBattleHandlers(io, socket)

    socket.on('player:join_port', ({ portId }) => {
      void socket.join(`port:${portId}`)
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}
