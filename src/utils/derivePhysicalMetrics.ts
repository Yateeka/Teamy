import type { TrackingFrame, TrackingPlayer } from '../types/tracking';

/** Adds speed and cumulative distance without coupling the view to a vendor format. */
export function derivePhysicalMetrics(frames: TrackingFrame[]): TrackingFrame[] {
  const prior = new Map<string, TrackingPlayer & { timestamp: number; distance: number }>();
  return frames.map(frame => ({
    ...frame,
    players: frame.players.map(player => {
      const old = prior.get(player.id);
      const seconds = old ? Math.max(0, frame.timestamp - old.timestamp) : 0;
      const meters = old ? Math.hypot(player.x - old.x, player.y - old.y) : 0;
      const distance = (old?.distance ?? 0) + meters;
      const speed = player.speed ?? (seconds > 0 ? meters / seconds : 0);
      const current = { ...player, speed, distance };
      prior.set(player.id, { ...current, timestamp: frame.timestamp, distance });
      return current;
    })
  }));
}
