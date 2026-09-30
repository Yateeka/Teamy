import type { MatchOption, TrackingFrame, TrackingPlayer } from '../types/tracking';
export const mockMatches: MatchOption[] = [
  { id: 'match-001', name: 'USWNT vs. Brazil', competition: 'International Friendly', date: 'APR 06, 2025', duration: 5400, source: 'mock', homeTeamName: 'United States', awayTeamName: 'Brazil' },
  { id: 'match-002', name: 'USMNT vs. Mexico', competition: 'CONCACAF Nations League', date: 'MAR 24, 2025', duration: 5400, source: 'mock', homeTeamName: 'United States', awayTeamName: 'Mexico' },
  { id: 'match-003', name: 'Portland Thorns vs. Gotham FC', competition: 'NWSL', date: 'MAY 17, 2025', duration: 5400, source: 'mock', homeTeamName: 'Portland Thorns', awayTeamName: 'Gotham FC' }
];
const formations = [[16,34],[25,12],[25,27],[25,41],[25,56],[41,19],[42,34],[41,49],[57,23],[60,34],[57,45]];
export function createMockFrames(duration = 5400): TrackingFrame[] {
  const frames: TrackingFrame[] = [];
  for (let t = 0; t <= duration; t += 1) {
    // Keep demo motion easy to read at normal playback speed; raw match time still advances 1:1.
    const phase = t * 0.06;
    const players: TrackingPlayer[] = [];
    (['home','away'] as const).forEach((team, side) => formations.forEach(([baseX, baseY], i) => {
      const shift = Math.sin(phase + i * 0.71) * (i > 7 ? 3.5 : 2.1);
      const x = side === 0 ? baseX + shift + Math.sin(phase * 0.4) * 5 : 105 - baseX - shift + Math.cos(phase * 0.4) * 5;
      const y = baseY + Math.sin(phase * 0.7 + i * 0.8 + side) * (i % 3 === 0 ? 4.2 : 2.6);
      const sprintBurst = i === 8 && Math.sin(phase * 0.6 + side * 2.2) > 0.93;
      players.push({ id: `${team}-${i + 1}`, team, number: i === 0 ? 1 : i, name: `${side ? 'Away' : 'Home'} Player ${i === 0 ? 1 : i}`, x: Math.max(2, Math.min(103, x)), y: Math.max(2, Math.min(66, y)), speed: sprintBurst ? 8.1 : 2.0 + Math.abs(Math.sin(phase + i + side)) * 3.8 });
    }));
    const bx = Math.max(2, Math.min(103, 52 + Math.sin(phase * 0.56) * 31 + Math.sin(phase * 1.1) * 8));
    const by = Math.max(2, Math.min(66, 34 + Math.cos(phase * 0.66) * 18 + Math.sin(phase * 0.9) * 6));
    frames.push({ timestamp: t, frame: 1_000_000 + t * 25, period: t < 2700 ? 1 : 2, players, ball: { x: bx, y: by } });
  }
  return frames;
}
