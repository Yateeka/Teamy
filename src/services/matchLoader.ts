import { createMockFrames, mockMatches } from '../data/mockTrackingData';
import { parseSkillCornerMatch } from '../parsers/skillcornerParser';
import { derivePhysicalMetrics } from '../utils/derivePhysicalMetrics';
import type { MatchOption, TrackingFrame } from '../types/tracking';

type MatchManifestRow = { id: string | number; date_time?: string; home_team?: { id?: number; short_name?: string; name?: string }; away_team?: { id?: number; short_name?: string; name?: string }; competition_id?: number };
const dataRoot = '/data';

/** Lists locally prepared SkillCorner games. Mocks remain available if no manifest is present. */
export async function discoverMatches(): Promise<MatchOption[]> {
  try {
    const response = await fetch(`${dataRoot}/matches.json`, { cache: 'no-store' });
    if (!response.ok) return mockMatches;
    const rows = await response.json() as MatchManifestRow[];
    if (!Array.isArray(rows) || rows.length === 0) return mockMatches;
    const realMatches: MatchOption[] = rows.map(row => {
      const home = row.home_team?.short_name ?? row.home_team?.name ?? 'Home';
      const away = row.away_team?.short_name ?? row.away_team?.name ?? 'Away';
      const date = row.date_time ? new Date(row.date_time).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'SKILLCORNER OPEN DATA';
      return { id: String(row.id), name: `${home} vs. ${away}`, competition: 'A-League · SkillCorner Open Data', date, duration: 6_300, source: 'skillcorner', homeTeamName: home, awayTeamName: away, homeTeamId: row.home_team?.id, awayTeamId: row.away_team?.id };
    });
    return [...realMatches, ...mockMatches];
  } catch {
    return mockMatches;
  }
}

export async function loadMatch(match: MatchOption): Promise<{ match: MatchOption; frames: TrackingFrame[] }> {
  if (match.source === 'mock') {
    await new Promise(resolve => setTimeout(resolve, 350));
    return { match, frames: derivePhysicalMetrics(createMockFrames(match.duration)) };
  }
  if (match.source !== 'skillcorner') throw new Error('Choose a match or load a tracking file.');
  const folder = `${dataRoot}/matches/${encodeURIComponent(match.id)}`;
  const [matchResponse, trackingResponse] = await Promise.all([
    fetch(`${folder}/${encodeURIComponent(match.id)}_match.json`),
    fetch(`${folder}/${encodeURIComponent(match.id)}_tracking_extrapolated.jsonl`)
  ]);
  if (!matchResponse.ok || !trackingResponse.ok) throw new Error(`Could not find the local tracking files for ${match.name}. Add the match folder under public/data/matches/${match.id}.`);
  const [metadata, trackingText] = await Promise.all([matchResponse.json(), trackingResponse.text()]);
  const rawFrames = trackingText.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line) as unknown; }
    catch { throw new Error(`Tracking data could not be read at line ${index + 1}. Check that Git LFS downloaded the file contents.`); }
  });
  const frames = derivePhysicalMetrics(parseSkillCornerMatch(rawFrames, metadata));
  if (!frames.length) throw new Error(`No tracking frames were found for ${match.name}.`);
  const duration = Math.max(1, frames.at(-1)!.timestamp - frames[0].timestamp);
  const info = metadata as { home_team?: { id?: number; short_name?: string; name?: string }; away_team?: { id?: number; short_name?: string; name?: string }; competition_edition?: { competition?: { name?: string } } };
  return { match: { ...match, duration, homeTeamName: info.home_team?.short_name ?? info.home_team?.name ?? match.homeTeamName, awayTeamName: info.away_team?.short_name ?? info.away_team?.name ?? match.awayTeamName, competition: info.competition_edition?.competition?.name ?? match.competition }, frames };
}

export async function loadLocalFile(file: File): Promise<{ match: MatchOption; frames: TrackingFrame[] }> {
  const text = await file.text();
  const raw = file.name.endsWith('.jsonl') ? text.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line) as unknown; }
    catch { throw new Error(`Tracking data could not be read at line ${index + 1}.`); }
  }) : JSON.parse(text);
  const frames = derivePhysicalMetrics(parseSkillCornerMatch(raw));
  const duration = Math.max(1, frames.at(-1)!.timestamp - frames[0].timestamp);
  return { match: { id: `local-${Date.now()}`, name: file.name.replace(/\.[^.]+$/, ''), competition: 'Local tracking file', date: 'LOCAL FILE', duration, source: 'local' }, frames };
}

export const fallbackMatches = mockMatches;
