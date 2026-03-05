import type { FastifyInstance } from 'fastify'
import { supabase } from '../lib/supabase.js'

export async function playerRoutes(app: FastifyInstance) {
  // GET /api/player/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const { data, error } = await supabase
      .from('players')
      .select('*, ships(*), player_reputations(*)')
      .eq('id', req.params.id)
      .single()

    if (error) return reply.status(404).send({ error: 'Player not found' })
    return data
  })
}
