import type { TrackingFrame } from '../types/tracking';
export type SuggestedMoment = { id: string; title: string; detail: string; start: number; end: number; tag: string };

/** Finds compact, explainable clip candidates from tracking alone. */
export function suggestMoments(frames: TrackingFrame[]): SuggestedMoment[] {
  const picks: (SuggestedMoment & {score:number})[] = [];
  for (let i = 1; i < frames.length; i++) {
    const before = frames[i - 1], now = frames[i], dt = now.timestamp - before.timestamp;
    if (dt <= 0) continue;
    const previousSpeeds=new Map(before.players.map(player=>[player.id,player.speed??0]));
    for(const player of now.players){const speed=player.speed??0;if(speed>=7.2&&(previousSpeeds.get(player.id)??0)<7.2)picks.push({id:`sprint-${player.id}-${now.frame}`,title:`${player.name} sprint`,detail:`Top speed · ${speed.toFixed(1)} m/s`,start:Math.max(0,now.timestamp-3),end:now.timestamp+4,tag:'Sprint',score:speed});}
    const ballSpeed = Math.hypot(now.ball.x - before.ball.x, now.ball.y - before.ball.y) / dt;
    const enteredEndZone = (before.ball.x < 70 && now.ball.x >= 70) || (before.ball.x > 35 && now.ball.x <= 35);
    if (enteredEndZone && ballSpeed >= 2.5) picks.push({ id: `final-third-${now.frame}`, title: 'Ball enters final third', detail: `Fast ball movement · ${ballSpeed.toFixed(1)} m/s`, start: Math.max(0, now.timestamp - 3), end: now.timestamp + 4, tag: 'Attack', score:ballSpeed+3 });
  }
  picks.sort((a,b)=>b.score-a.score);
  const selected: SuggestedMoment[]=[];
  const matchEnd=frames.at(-1)?.timestamp??0;
  for(const pick of picks){if(selected.every(item=>Math.abs(item.start-pick.start)>9))selected.push({id:pick.id,title:pick.title,detail:pick.detail,start:pick.start,end:Math.min(matchEnd,pick.end),tag:pick.tag});if(selected.length===4)break;}
  selected.sort((a,b)=>a.start-b.start);
  return selected;
}
