-- ============================================================
-- Tidebound · Initial Game Schema
-- 2026-03-03
--
-- Design goals:
--   · Multiplayer-ready from day one
--   · Server-authoritative (service role writes, clients read)
--   · RLS on every player-owned table
--   · Full audit trail for battles (anti-cheat groundwork)
--   · Supabase Realtime on market_prices + world_events
--   · UUIDs throughout — no sequential IDs exposed to clients
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UTILITY: keep updated_at current automatically
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE: ports
-- Static reference data — seeded at the bottom.
-- Faction control can evolve to be player-influenced later.
-- ============================================================
CREATE TABLE IF NOT EXISTS ports (
  id              text          PRIMARY KEY,            -- 'port-royal', 'havana', …
  name            text          NOT NULL,
  description     text          NOT NULL DEFAULT '',
  faction         text          NOT NULL
                  CHECK (faction IN ('english','spanish','pirates','neutral')),
  position_x      numeric(4,2)  NOT NULL CHECK (position_x  BETWEEN 0 AND 1),
  position_y      numeric(4,2)  NOT NULL CHECK (position_y  BETWEEN 0 AND 1),
  defence_level   smallint      NOT NULL DEFAULT 1 CHECK (defence_level BETWEEN 1 AND 5),
  available_goods text[]        NOT NULL DEFAULT '{}',
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: players
-- One row per Supabase auth user.  Core economy + position.
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  captain_name    text          NOT NULL CHECK (char_length(captain_name) BETWEEN 2 AND 32),
  gold            integer       NOT NULL DEFAULT 2450 CHECK (gold >= 0),
  notoriety       smallint      NOT NULL DEFAULT 0    CHECK (notoriety    BETWEEN 0 AND 100),
  wanted_level    smallint      NOT NULL DEFAULT 0    CHECK (wanted_level BETWEEN 0 AND 5),
  current_port_id text          REFERENCES ports(id)  ON DELETE SET NULL,
  game_month      smallint      NOT NULL DEFAULT 8    CHECK (game_month   BETWEEN 0 AND 11),
  game_year       integer       NOT NULL DEFAULT 1695,
  last_active_at  timestamptz   NOT NULL DEFAULT now(),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS players_user_id_idx ON players (user_id);
CREATE INDEX IF NOT EXISTS players_port_idx    ON players (current_port_id);
CREATE INDEX IF NOT EXISTS players_active_idx  ON players (last_active_at DESC);

CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- TABLE: ships
-- One ship per player (fleet expansion possible later).
-- ============================================================
CREATE TABLE IF NOT EXISTS ships (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       uuid        NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  name            text        NOT NULL DEFAULT 'The Crimson Serpent'
                              CHECK (char_length(name) BETWEEN 1 AND 64),
  ship_class      text        NOT NULL DEFAULT 'sloop'
                              CHECK (ship_class IN ('sloop','brigantine','galleon','frigate','fluyt')),
  cannons         smallint    NOT NULL DEFAULT 8   CHECK (cannons        >= 0),
  armor           smallint    NOT NULL DEFAULT 2   CHECK (armor          >= 0),
  hull_max        integer     NOT NULL DEFAULT 100 CHECK (hull_max       >= 1),
  hull_current    integer     NOT NULL DEFAULT 100 CHECK (hull_current   >= 0),
  crew_max        smallint    NOT NULL DEFAULT 30  CHECK (crew_max       >= 1),
  crew_current    smallint    NOT NULL DEFAULT 22  CHECK (crew_current   >= 0),
  morale          smallint    NOT NULL DEFAULT 68  CHECK (morale         BETWEEN 0 AND 100),
  cargo_capacity  smallint    NOT NULL DEFAULT 50  CHECK (cargo_capacity >= 0),
  speed           smallint    NOT NULL DEFAULT 3   CHECK (speed          >= 1),
  CONSTRAINT hull_within_max CHECK (hull_current <= hull_max),
  CONSTRAINT crew_within_max CHECK (crew_current <= crew_max),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ships_player_id_idx ON ships (player_id);

CREATE TRIGGER trg_ships_updated_at
  BEFORE UPDATE ON ships
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- TABLE: player_inventory  (cargo hold)
-- One row per good type per player.
-- quantity = 0 rows are pruned server-side after every sell.
-- ============================================================
CREATE TABLE IF NOT EXISTS player_inventory (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  good_id             text        NOT NULL
                      CHECK (good_id IN (
                        'rum','sugar','spices','tobacco','gold_ore',
                        'silk','timber','weapons','medicine','contraband'
                      )),
  quantity            integer     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  purchased_at_price  integer     NOT NULL CHECK (purchased_at_price > 0),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, good_id)
);

CREATE INDEX IF NOT EXISTS inventory_player_id_idx ON player_inventory (player_id);

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON player_inventory
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- TABLE: player_reputations
-- Four faction scores per player (0–100).
-- ============================================================
CREATE TABLE IF NOT EXISTS player_reputations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  faction_id  text        NOT NULL
              CHECK (faction_id IN ('pirates','navy','merchants','natives')),
  score       smallint    NOT NULL DEFAULT 40 CHECK (score BETWEEN 0 AND 100),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, faction_id)
);

CREATE INDEX IF NOT EXISTS rep_player_id_idx ON player_reputations (player_id);

CREATE TRIGGER trg_reputations_updated_at
  BEFORE UPDATE ON player_reputations
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- TABLE: market_prices
-- Server regenerates all port prices every 5 min.
-- Clients get live updates via Supabase Realtime.
-- ============================================================
CREATE TABLE IF NOT EXISTS market_prices (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  port_id     text        NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  good_id     text        NOT NULL
              CHECK (good_id IN (
                'rum','sugar','spices','tobacco','gold_ore',
                'silk','timber','weapons','medicine','contraband'
              )),
  price       integer     NOT NULL CHECK (price > 0),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (port_id, good_id)
);

CREATE INDEX IF NOT EXISTS market_port_good_idx ON market_prices (port_id, good_id);
CREATE INDEX IF NOT EXISTS market_expires_idx   ON market_prices (expires_at);

CREATE TRIGGER trg_market_updated_at
  BEFORE UPDATE ON market_prices
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- TABLE: battles
-- PvE now; schema is PvP-ready (add opponent_player_id later).
-- Redis holds the hot in-flight state; this table is the
-- durable record used for history, audit, and result apply.
-- ============================================================
CREATE TABLE IF NOT EXISTS battles (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         uuid          NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Full server-side battle state (mirrors Redis; updated each turn)
  state             jsonb         NOT NULL DEFAULT '{}',

  -- Player ship snapshot at battle start (for replay / analytics)
  player_snapshot   jsonb         NOT NULL DEFAULT '{}',

  -- Enemy data (denormalised — NPC enemies aren't their own entities yet)
  enemy_name        text          NOT NULL,
  enemy_emoji       text          NOT NULL DEFAULT '🚢',
  enemy_ship_class  text          NOT NULL DEFAULT 'sloop',
  enemy_hp_max      integer       NOT NULL CHECK (enemy_hp_max > 0),
  enemy_hp_current  integer       NOT NULL CHECK (enemy_hp_current >= 0),
  enemy_cannons     smallint      NOT NULL CHECK (enemy_cannons >= 0),
  enemy_crew        smallint      NOT NULL CHECK (enemy_crew >= 0),
  enemy_armor       smallint      NOT NULL DEFAULT 0  CHECK (enemy_armor >= 0),
  enemy_ai          text          NOT NULL CHECK (enemy_ai IN ('passive','cautious','aggressive')),
  enemy_gold_min    integer       NOT NULL CHECK (enemy_gold_min >= 0),
  enemy_gold_max    integer       NOT NULL CHECK (enemy_gold_max >= enemy_gold_min),
  enemy_crew_fight  numeric(3,2)  NOT NULL DEFAULT 0.80
                    CHECK (enemy_crew_fight BETWEEN 0 AND 1),

  -- Battle progress
  phase             text          NOT NULL DEFAULT 'player'
                    CHECK (phase IN ('player','enemy','resolving','over')),
  round             integer       NOT NULL DEFAULT 1 CHECK (round >= 1),
  outcome           text          CHECK (outcome IN ('victory','defeat','fled')),

  -- Final results (populated by apply_battle_result())
  gold_gained       integer,
  hull_damage       integer,
  crew_lost         integer,
  notoriety_gained  integer,

  created_at        timestamptz   NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS battles_player_id_idx ON battles (player_id);
CREATE INDEX IF NOT EXISTS battles_active_idx    ON battles (player_id) WHERE outcome IS NULL;
CREATE INDEX IF NOT EXISTS battles_phase_idx     ON battles (phase)     WHERE phase <> 'over';

CREATE TRIGGER trg_battles_updated_at
  BEFORE UPDATE ON battles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- TABLE: battle_actions  (full per-turn audit trail)
-- Every move recorded — foundation for anti-cheat / replays.
-- ============================================================
CREATE TABLE IF NOT EXISTS battle_actions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id           uuid        NOT NULL REFERENCES battles(id)  ON DELETE CASCADE,
  player_id           uuid        NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  round               integer     NOT NULL CHECK (round >= 1),
  action              text        NOT NULL
                      CHECK (action IN (
                        'broadside','grapeshot','board','repair','firebomb','flee'
                      )),
  player_damage_dealt integer     NOT NULL DEFAULT 0,
  enemy_damage_dealt  integer     NOT NULL DEFAULT 0,
  crew_lost           integer     NOT NULL DEFAULT 0,
  log_message         text        NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS battle_actions_battle_idx ON battle_actions (battle_id);
CREATE INDEX IF NOT EXISTS battle_actions_player_idx ON battle_actions (player_id);

-- ============================================================
-- TABLE: player_log  (Captain's Log)
-- Capped server-side at 50 entries per player.
-- ============================================================
CREATE TABLE IF NOT EXISTS player_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  entry_type  text        NOT NULL CHECK (entry_type IN ('travel','trade','event','combat')),
  message     text        NOT NULL,
  game_date   text        NOT NULL,   -- display string, e.g. "Sep 14"
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_log_player_recent_idx
  ON player_log (player_id, created_at DESC);

-- ============================================================
-- TABLE: world_events
-- Server-broadcast events visible to all players.
-- Clients subscribe via Supabase Realtime.
-- ============================================================
CREATE TABLE IF NOT EXISTS world_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text        NOT NULL
              CHECK (event_type IN ('storm','ghost_ship','merchant_offer','stranded_sailor')),
  title       text        NOT NULL,
  description text        NOT NULL,
  port_id     text        REFERENCES ports(id) ON DELETE SET NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS world_events_active_idx ON world_events (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS world_events_expire_idx ON world_events (expires_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- The Fastify server uses the service role key and bypasses
-- RLS entirely — all writes go through server routes.
-- Anon/authenticated clients can only read their own rows.
-- ============================================================

ALTER TABLE players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_reputations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_actions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_events     ENABLE ROW LEVEL SECURITY;

-- players: own row only
CREATE POLICY "players_own_row" ON players
  FOR ALL USING (auth.uid() = user_id);

-- ships: own ship only (via player join)
CREATE POLICY "ships_own" ON ships
  FOR ALL USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- inventory: own items only
CREATE POLICY "inventory_own" ON player_inventory
  FOR ALL USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- reputations: own rows only
CREATE POLICY "reputations_own" ON player_reputations
  FOR ALL USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- ports: public read-only — no client writes
CREATE POLICY "ports_public_read" ON ports
  FOR SELECT USING (true);

-- market prices: public read — server writes via service role
CREATE POLICY "market_public_read" ON market_prices
  FOR SELECT USING (true);

-- battles: own battles only
CREATE POLICY "battles_own" ON battles
  FOR ALL USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- battle_actions: own actions, read-only for clients
CREATE POLICY "battle_actions_own_read" ON battle_actions
  FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- player_log: own log only
CREATE POLICY "player_log_own" ON player_log
  FOR ALL USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- world_events: public read-only — server writes
CREATE POLICY "world_events_public_read" ON world_events
  FOR SELECT USING (true);

-- ============================================================
-- FUNCTION: create_player_profile
-- Call server-side immediately after auth signup.
-- Creates player row + default ship + reputations + first log.
-- SECURITY DEFINER so it can write across RLS.
-- ============================================================
CREATE OR REPLACE FUNCTION create_player_profile(
  p_user_id      uuid,
  p_captain_name text,
  p_start_port   text DEFAULT 'port-royal'
)
RETURNS players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player players%ROWTYPE;
BEGIN
  INSERT INTO players (user_id, captain_name, current_port_id)
  VALUES (p_user_id, p_captain_name, p_start_port)
  RETURNING * INTO v_player;

  -- Starting ship (defaults match the frontend initial state)
  INSERT INTO ships (player_id) VALUES (v_player.id);

  -- Seed reputation scores matching the frontend's starting values
  INSERT INTO player_reputations (player_id, faction_id, score)
  VALUES
    (v_player.id, 'pirates',   60),
    (v_player.id, 'navy',      20),
    (v_player.id, 'merchants', 40),
    (v_player.id, 'natives',   75);

  -- First log entry
  INSERT INTO player_log (player_id, entry_type, message, game_date)
  VALUES (
    v_player.id, 'travel',
    'Dropped anchor at Port Royal. A new legend begins on these waters.',
    'Sep 1'
  );

  RETURN v_player;
END;
$$;

-- ============================================================
-- FUNCTION: apply_battle_result
-- Called server-side when a battle ends.
-- Applies gold, notoriety, hull/crew damage to live tables.
-- ============================================================
CREATE OR REPLACE FUNCTION apply_battle_result(p_battle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle battles%ROWTYPE;
BEGIN
  SELECT * INTO v_battle FROM battles WHERE id = p_battle_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Battle % not found', p_battle_id;
  END IF;
  IF v_battle.outcome IS NULL THEN
    RAISE EXCEPTION 'Battle % has no outcome yet', p_battle_id;
  END IF;

  CASE v_battle.outcome

    WHEN 'victory' THEN
      UPDATE players SET
        gold      = gold + COALESCE(v_battle.gold_gained, 0),
        notoriety = LEAST(100, notoriety + COALESCE(v_battle.notoriety_gained, 3))
      WHERE id = v_battle.player_id;

      UPDATE ships SET
        hull_current = GREATEST(10, hull_current - COALESCE(v_battle.hull_damage, 0)),
        crew_current = GREATEST(1,  crew_current - COALESCE(v_battle.crew_lost,   0))
      WHERE player_id = v_battle.player_id;

    WHEN 'defeat' THEN
      -- Ship crippled; crew decimated
      UPDATE ships SET
        hull_current = 15,
        crew_current = GREATEST(1, FLOOR(crew_current * 0.4)::int)
      WHERE player_id = v_battle.player_id;

    WHEN 'fled' THEN
      -- Minor hull damage from the escape
      UPDATE ships SET
        hull_current = GREATEST(10, hull_current - COALESCE(v_battle.hull_damage, 0))
      WHERE player_id = v_battle.player_id;

  END CASE;

  UPDATE battles SET ended_at = now() WHERE id = p_battle_id;
END;
$$;

-- ============================================================
-- FUNCTION: get_player_profile
-- Returns a complete player state JSON blob.
-- Used by GET /api/player/:userId on the Fastify server.
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player players%ROWTYPE;
  v_ship   ships%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_player FROM players WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_ship FROM ships WHERE player_id = v_player.id;

  SELECT jsonb_build_object(
    'id',            v_player.id,
    'captainName',   v_player.captain_name,
    'gold',          v_player.gold,
    'notoriety',     v_player.notoriety,
    'wantedLevel',   v_player.wanted_level,
    'currentPortId', v_player.current_port_id,
    'gameMonth',     v_player.game_month,
    'gameYear',      v_player.game_year,
    'ship',          row_to_json(v_ship),
    'reputations', (
      SELECT jsonb_agg(jsonb_build_object(
        'factionId', faction_id,
        'score',     score
      ))
      FROM player_reputations
      WHERE player_id = v_player.id
    ),
    'inventory', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'goodId',           good_id,
        'quantity',         quantity,
        'purchasedAtPrice', purchased_at_price
      )), '[]')
      FROM player_inventory
      WHERE player_id = v_player.id AND quantity > 0
    ),
    'recentLog', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'type',      entry_type,
        'message',   message,
        'gameDate',  game_date,
        'createdAt', created_at
      ) ORDER BY created_at DESC), '[]')
      FROM (
        SELECT * FROM player_log
        WHERE player_id = v_player.id
        ORDER BY created_at DESC
        LIMIT 50
      ) recent
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- SUPABASE REALTIME
-- market_prices  → all clients see live price updates
-- world_events   → all clients see global events
--
-- battles + player_log use Realtime channel filters
-- (player_id=eq.<uuid>) enforced by the Fastify server when
-- it opens per-player subscriptions.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE market_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE world_events;

-- ============================================================
-- SEED DATA: the 8 Caribbean ports
-- ============================================================
INSERT INTO ports (id, name, description, faction, position_x, position_y, defence_level, available_goods)
VALUES
  (
    'port-royal', 'Port Royal',
    'The wickedest city in the world. English rule, pirate gold.',
    'english', 0.55, 0.52, 4,
    ARRAY['rum','sugar','tobacco','silk','weapons']
  ),
  (
    'havana', 'Havana',
    'Crown jewel of Spanish colonies. Heavily fortified harbour.',
    'spanish', 0.42, 0.42, 5,
    ARRAY['sugar','spices','gold_ore','timber','medicine']
  ),
  (
    'tortuga', 'Tortuga',
    'A pirate haven beyond the reach of any flag.',
    'pirates', 0.48, 0.35, 2,
    ARRAY['rum','tobacco','silk','contraband','weapons']
  ),
  (
    'nassau', 'Nassau',
    'Lawless port where every ship is welcome — for a price.',
    'pirates', 0.62, 0.32, 2,
    ARRAY['rum','spices','gold_ore','timber','medicine']
  ),
  (
    'cartagena', 'Cartagena',
    'Spain''s treasure city, bristling with cannon and soldiers.',
    'spanish', 0.32, 0.68, 4,
    ARRAY['spices','gold_ore','silk','weapons','contraband']
  ),
  (
    'bridgetown', 'Bridgetown',
    'A prosperous English colony. Fine goods, firm law.',
    'english', 0.78, 0.55, 3,
    ARRAY['sugar','tobacco','timber','medicine','rum']
  ),
  (
    'santo-domingo', 'Santo Domingo',
    'Oldest city in the New World. Spanish pride and contraband alike.',
    'spanish', 0.58, 0.44, 3,
    ARRAY['rum','spices','silk','weapons','contraband']
  ),
  (
    'maracaibo', 'Maracaibo',
    'A neutral trading post on the mainland. No questions asked.',
    'neutral', 0.35, 0.75, 1,
    ARRAY['tobacco','gold_ore','timber','medicine','contraband']
  )
ON CONFLICT (id) DO NOTHING;
