import type { TrackingFrame, TrackingPlayer, Team } from '../types/tracking';

type PlayerMetadata = { id?: string | number; trackable_object?: string | number; team_id?: string | number; number?: number; first_name?: string; last_name?: string; short_name?: string };
type MatchMetadata = { home_team?: { id?: string | number; short_name?: string; name?: string }; away_team?: { id?: string | number; short_name?: string; name?: string }; players?: PlayerMetadata[] };

/** Convert SkillCorner tracking frames to the app's match-independent pitch model. */
export function parseSkillCornerMatch(raw: unknown, metadata?: unknown): TrackingFrame[] {
  if (!raw || typeof raw !== 'object') throw new Error('Tracking data must be a JSON object or frame list.');
  const root = raw as Record<string, unknown>;
  const rows = Array.isArray(raw) ? raw : (root.frames ?? root.data);
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No tracking frames found. Expected a frames or data list.');
  const match = (metadata ?? {}) as MatchMetadata;
  const playerByTrackingId = new Map<string, PlayerMetadata>();
  for (const player of match.players ?? []) {
    for (const key of [player.trackable_object, player.id]) if (key !== undefined) playerByTrackingId.set(String(key), player);
  }
  const homeId = match.home_team?.id === undefined ? undefined : String(match.home_team.id);
  const awayId = match.away_team?.id === undefined ? undefined : String(match.away_team.id);
  const frames = rows.map((item, index): TrackingFrame => {
    const f = item as Record<string, unknown>;
    const frame = number(f.frame ?? f.frame_number, index);
    const timestamp = parseTimestamp(f.timestamp ?? f.timestamp_seconds ?? f.time ?? f.frame_time, frame / 10);
    const rawPlayers = f.players ?? f.player_data;
    if (!Array.isArray(rawPlayers)) throw new Error(`Frame ${index + 1} has no player list.`);
    const players: TrackingPlayer[] = rawPlayers.map((value, playerIndex) => {
      const player = value as Record<string, unknown>;
      const id = String(player.player_id ?? player.id ?? player.trackable_object ?? `player-${playerIndex}`);
      const person = playerByTrackingId.get(id);
      const teamId = String(player.team_id ?? person?.team_id ?? player.team ?? '');
      const teamRaw = String(player.team_name ?? player.group ?? player.team ?? '').toLowerCase();
      const team: Team = teamId === homeId || teamRaw.includes('home') || teamRaw === '1' ? 'home' : teamId === awayId || teamRaw.includes('away') || teamRaw === '2' ? 'away' : 'away';
      const first = person?.first_name?.trim() ?? '';
      const last = person?.last_name?.trim() ?? '';
      const name = [first, last].filter(Boolean).join(' ') || person?.short_name?.trim() || String(player.name ?? player.player_name ?? `Player ${playerIndex + 1}`);
      return {
        id, team,
        number: number(player.number ?? player.jersey_number ?? person?.number, playerIndex + 1),
        name,
        // SkillCorner pitch coordinates use the pitch centre as origin. Internal coordinates
        // start at the lower-left, in meters, so every renderer uses the same convention.
        x: coordinate(player.x ?? player.position_x, 52.5),
        y: coordinate(player.y ?? player.position_y, 34),
        speed: optionalNumber(player.speed)
      };
    });
    const ball = (f.ball ?? f.ball_data ?? {}) as Record<string, unknown>;
    return {
      timestamp, frame,
      period: number(f.period ?? f.period_id, 1),
      players,
      ball: { x: coordinate(ball.x ?? ball.position_x, 52.5), y: coordinate(ball.y ?? ball.position_y, 34) }
    };
  });
  frames.sort((a, b) => a.timestamp - b.timestamp);
  const kickoffOffset = frames[0].timestamp;
  return frames.map(frame => ({ ...frame, timestamp: Math.max(0, frame.timestamp - kickoffOffset) }));
}

function coordinate(value: unknown, originOffset: number) {
  const n = number(value, 0);
  return n + originOffset;
}
function parseTimestamp(value: unknown, fallback: number) {
  if (typeof value === 'string' && value.includes(':')) {
    const parts = value.split(':').map(Number);
    if (parts.every(Number.isFinite)) return parts.reduce((seconds, part) => seconds * 60 + part, 0);
  }
  return number(value, fallback);
}
const number = (value: unknown, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const optionalNumber = (value: unknown) => value === undefined || value === null ? undefined : number(value);
