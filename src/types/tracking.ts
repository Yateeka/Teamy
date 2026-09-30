export type Team = 'home' | 'away';
export interface TrackingPlayer { id: string; team: Team; number: number; name: string; x: number; y: number; speed?: number; distance?: number }
export interface TrackingFrame { timestamp: number; frame: number; period: number; players: TrackingPlayer[]; ball: { x: number; y: number } }
export interface MatchOption { id: string; name: string; competition: string; date: string; duration: number; source: 'mock' | 'skillcorner' | 'local'; homeTeamName?: string; awayTeamName?: string; homeTeamId?: string | number; awayTeamId?: string | number; }
export type PitchAnnotation = { id: string; kind: 'arrow' | 'circle'; x1: number; y1: number; x2: number; y2: number };
export interface SavedClip { id: string; title: string; notes: string; tags: string[]; start: number; end: number; matchId?: string; annotations?: PitchAnnotation[] }
