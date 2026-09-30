import { useMemo, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { TrackingFrame } from '../types/tracking';
import type { PitchAnnotation } from '../types/tracking';
import { pitchPoint } from '../utils/coordinateConversion';
type Props = { frame: TrackingFrame; selectedId: string | null; onSelect: (id: string) => void; trails: boolean; labels: boolean; speedLabels:boolean; ballTrail: boolean; shape: boolean; previous: TrackingFrame[]; homeName: string; awayName: string; drawMode:PitchAnnotation['kind']|null; canDraw:boolean; annotations:PitchAnnotation[]; onAnnotation:(drawing:Omit<PitchAnnotation,'id'>)=>void };
type Drawing=Omit<PitchAnnotation,'id'>;
export default function SoccerField({ frame, selectedId, onSelect, trails, labels, speedLabels, ballTrail, shape, previous, homeName, awayName, drawMode, canDraw, annotations, onAnnotation }: Props) {
  const [drawing,setDrawing]=useState<Drawing|null>(null);
  const ballPoints = useMemo(() => previous.slice(-18).map(f => pitchPoint(f.ball.x, f.ball.y)), [previous]);
  const teamShape = (team: 'home' | 'away') => {
    const outfield = frame.players.filter(player => player.team === team && player.number !== 1);
    const ordered = [...outfield].sort((a,b)=>team==='home'?a.x-b.x:b.x-a.x);
    const backLine = ordered.slice(0,4).sort((a,b)=>a.y-b.y).map(player=>pitchPoint(player.x,player.y));
    const hull = convexHull(outfield.map(player=>pitchPoint(player.x,player.y)));
    return { hull: hull.map(point=>`${point.x},${point.y}`).join(' '), backLine: backLine.map(point=>`${point.x},${point.y}`).join(' ') };
  };
  const homeShape=teamShape('home'), awayShape=teamShape('away');
  const localPoint=(event:ReactPointerEvent<SVGRectElement>)=>{const svg=event.currentTarget.ownerSVGElement;if(!svg)return{x:40,y:36};const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const local=point.matrixTransform(svg.getScreenCTM()?.inverse());return{x:Math.max(40,Math.min(760,local.x)),y:Math.max(36,Math.min(476,local.y))};};
  const drawingStart=(event:ReactPointerEvent<SVGRectElement>)=>{if(!canDraw||!drawMode)return;event.currentTarget.setPointerCapture(event.pointerId);const p=localPoint(event);setDrawing({kind:drawMode,x1:p.x,y1:p.y,x2:p.x,y2:p.y});};
  const drawingMove=(event:ReactPointerEvent<SVGRectElement>)=>{if(!drawing)return;const p=localPoint(event);setDrawing({...drawing,x2:p.x,y2:p.y});};
  const drawingEnd=(event:ReactPointerEvent<SVGRectElement>)=>{if(!drawing)return;const p=localPoint(event);onAnnotation({...drawing,x2:p.x,y2:p.y});setDrawing(null);};
  return <div className="pitch-shell"><div className="pitch-meta"><span>TACTICAL VIEW <i>•</i> FULL PITCH</span><span>105 × 68 M</span></div>
    <svg className="pitch" viewBox="0 0 800 512" role="img" aria-label="Animated soccer pitch tracking view">
      <defs><pattern id="grass" width="80" height="440" patternUnits="userSpaceOnUse"><rect width="80" height="440" fill="#70ad83"/><rect width="40" height="440" fill="#66a57b"/></pattern><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><marker id="annotation-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L0 6 L7 3 z" fill="#5a0016"/></marker></defs>
      <rect x="40" y="36" width="720" height="440" rx="2" fill="url(#grass)"/>
      <g className="markings"><rect x="40" y="36" width="720" height="440"/><line x1="400" y1="36" x2="400" y2="476"/><circle cx="400" cy="256" r="68"/><circle cx="400" cy="256" r="2" fill="white"/><rect x="40" y="146" width="110" height="220"/><rect x="40" y="203" width="42" height="106"/><path d="M150 216 A68 68 0 0 1 150 296"/><circle cx="96" cy="256" r="2" fill="white"/><rect x="650" y="146" width="110" height="220"/><rect x="718" y="203" width="42" height="106"/><path d="M650 216 A68 68 0 0 0 650 296"/><circle cx="704" cy="256" r="2" fill="white"/><path d="M40 53 A17 17 0 0 1 57 36 M743 36 A17 17 0 0 1 760 53 M40 459 A17 17 0 0 0 57 476 M743 476 A17 17 0 0 0 760 459"/></g>
      {shape && <g className="formation"><polygon points={homeShape.hull} className="shape-area home-shape"/><polygon points={awayShape.hull} className="shape-area away-shape"/><polyline points={homeShape.backLine} className="back-line home-line"/><polyline points={awayShape.backLine} className="back-line away-line"/></g>}
      {trails && frame.players.map(p => { const pts = previous.slice(-8).map(f => f.players.find(q => q.id === p.id)).filter(Boolean).map(q => { const pos = pitchPoint(q!.x,q!.y); return `${pos.x},${pos.y}`; }).join(' '); return <polyline key={`trail-${p.id}`} points={pts} className={`trail ${p.team}`}/>; })}
      {ballTrail && <polyline points={ballPoints.map(p => `${p.x},${p.y}`).join(' ')} className="ball-trail"/>}
      {frame.players.map(p => { const pos = pitchPoint(p.x,p.y), active = selectedId === p.id; return <g key={p.id} className={`player ${p.team} ${active ? 'selected' : ''}`} transform={`translate(${pos.x} ${pos.y})`} onClick={() => onSelect(p.id)} tabIndex={0} role="button" aria-label={`Select ${p.name}`}>
        {active && <circle r="17" className="player-ring"/>}<circle r="12" className="player-dot"/><text y="3.5" textAnchor="middle" className="jersey">{p.number}</text>{p.speed!==undefined&&p.speed>=7.2&&<path d="M8 -8 L13 -15 L12 -10 L16 -10 L10 -3 L11 -8 Z" className="sprint-bolt"/>}{speedLabels&&<text y="-17" textAnchor="middle" className="speed-label">{(p.speed??0).toFixed(1)}</text>}{labels && <text y="25" textAnchor="middle" className="player-label">{p.name.split(' ').slice(-1)[0]}</text>}
      </g>; })}
      {(() => { const p = pitchPoint(frame.ball.x,frame.ball.y); return <g transform={`translate(${p.x} ${p.y})`} className="ball"><circle r="7"/><path d="M0 -3.2 L3 -1.2 L2 2.7 L-2 2.7 L-3 -1.2 Z"/><path d="M0 -3.2 L0 -6 M3 -1.2 L6 -2 M2 2.7 L4.3 5 M-2 2.7 L-4.3 5 M-3 -1.2 L-6 -2"/></g>; })()}
      <rect x="40" y="36" width="720" height="440" fill="transparent" pointerEvents={canDraw&&drawMode?'all':'none'} className={canDraw&&drawMode?'drawing-surface active':''} onPointerDown={drawingStart} onPointerMove={drawingMove} onPointerUp={drawingEnd}/>
      <g className="annotation-layer" pointerEvents="none">{[...annotations,...(drawing?[{...drawing,id:'preview'}]:[])].map(mark=>mark.kind==='circle'?<ellipse key={mark.id} cx={(mark.x1+mark.x2)/2} cy={(mark.y1+mark.y2)/2} rx={Math.max(4,Math.abs(mark.x2-mark.x1)/2)} ry={Math.max(4,Math.abs(mark.y2-mark.y1)/2)} className="pitch-annotation circle-annotation"/>:<line key={mark.id} x1={mark.x1} y1={mark.y1} x2={mark.x2} y2={mark.y2} markerEnd="url(#annotation-arrow)" className="pitch-annotation arrow-annotation"/>)}</g>
    </svg><div className="pitch-legend"><span><b className="dot home-dot"/>{homeName.toUpperCase()}</span><span><b className="dot away-dot"/>{awayName.toUpperCase()}</span><span><b className="dot ball-dot"/>BALL</span><span className="tracking-live"><i/> LIVE TRACKING</span></div>
  </div>;
}

function convexHull(points:{x:number;y:number}[]){
  const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);
  if(sorted.length<3)return sorted;
  const cross=(o:{x:number;y:number},a:{x:number;y:number},b:{x:number;y:number})=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
  const lower:{x:number;y:number}[]=[],upper:{x:number;y:number}[]=[];
  for(const point of sorted){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],point)<=0)lower.pop();lower.push(point);}
  for(const point of sorted.slice().reverse()){while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],point)<=0)upper.pop();upper.push(point);}
  lower.pop();upper.pop();return lower.concat(upper);
}
