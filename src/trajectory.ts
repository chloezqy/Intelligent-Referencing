import type {Point} from './types';
import {DRAG_THRESHOLD_PX,isSelectionDrag} from './selectionInteraction';
export type TrajectoryIntent='pending'|'click'|'move'|'reference'|'box';
export interface TrajectoryOptions {movable:boolean;shift?:boolean;final?:boolean;elapsedMs?:number;locked?:TrajectoryIntent}
export const TRAJECTORY={noisePx:2,moveLengthPx:32,moveDisplacementPx:28,moveDelayMs:120,straightness:.96,maxDeviationPx:3,curveRadians:.9,turnRadians:.45} as const;
/** Screen-pixel geometry, independent of zoom and event timestamps except the move dwell gate. */
export function trajectoryMetrics(points:Point[]){
 const samples:Point[]=[];
 for(const p of points){const last=samples[samples.length-1];if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!last||Math.hypot(p.x-last.x,p.y-last.y)>=TRAJECTORY.noisePx))samples.push(p);}
 let length=0,curvature=0,turns=0,maxDeviation=0;
 const first=samples[0]||{x:0,y:0},last=samples[samples.length-1]||first,displacement=Math.hypot(last.x-first.x,last.y-first.y);
 for(let i=1;i<samples.length;i++){
  const p=samples[i],previous=samples[i-1];length+=Math.hypot(p.x-previous.x,p.y-previous.y);
  if(displacement)maxDeviation=Math.max(maxDeviation,Math.abs((last.x-first.x)*(first.y-p.y)-(first.x-p.x)*(last.y-first.y))/displacement);
  if(i>1){const before=samples[i-2],ax=previous.x-before.x,ay=previous.y-before.y,bx=p.x-previous.x,by=p.y-previous.y;const angle=Math.abs(Math.atan2(ax*by-ay*bx,ax*bx+ay*by));curvature+=angle;if(angle>=TRAJECTORY.turnRadians)turns++;}
 }
 const width=samples.length?Math.max(...samples.map(p=>p.x))-Math.min(...samples.map(p=>p.x)):0,height=samples.length?Math.max(...samples.map(p=>p.y))-Math.min(...samples.map(p=>p.y)):0;
 return {samples:samples.length,length,displacement,curvature,turns,maxDeviation,straightness:length?displacement/length:1,closed:length>=20&&Math.hypot(width,height)>DRAG_THRESHOLD_PX&&displacement<=Math.max(6,length*.2)};
}
/** The caller owns actual movement; once visible movement is locked, never reclassify it. */
export function classifyTrajectory(points:Point[],options:TrajectoryOptions):TrajectoryIntent{
 if(options.locked==='move'||options.locked==='reference'||options.locked==='box')return options.locked;
 if(!points.length||!isSelectionDrag(points[0],points))return options.final?'click':'pending';
 if(options.shift)return 'box';
 const m=trajectoryMetrics(points);
 if(m.closed||m.length>=12&&(m.curvature>=TRAJECTORY.curveRadians&&m.straightness<=.88||m.turns>=2&&m.straightness<=.9))return 'reference';
 if(!options.movable)return 'reference';
 if(m.length>=TRAJECTORY.moveLengthPx&&m.displacement>=TRAJECTORY.moveDisplacementPx&&(options.elapsedMs||0)>=TRAJECTORY.moveDelayMs&&m.straightness>=TRAJECTORY.straightness&&m.maxDeviation<=TRAJECTORY.maxDeviationPx&&m.turns===0)return 'move';
 // Inconclusive strokes never become accidental object moves.
 return options.final?'reference':'pending';
}
