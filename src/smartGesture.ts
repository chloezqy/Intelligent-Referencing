import type {Point,UIElement} from './types';
import {getNodeCoverage,pointInPolygon,strokeIntersectsRect} from './utils';
/** Close a rough area without requiring the pointer to return to its starting pixel. */
export function closeSmartGesture(path:Point[]):Point[]{
 const clean=path.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 if(clean.length<3)return clean;
 const first=clean[0],last=clean[clean.length-1];
 return first.x===last.x&&first.y===last.y?clean:[...clean,{...first}];
}
/** Tolerance is measured on screen so loose gestures work at every zoom level. */
export function smartGestureEvidence(path:Point[],nodes:UIElement[],scale:number){
 if(path.length<2)return [];
 const loop=closeSmartGesture(path),padding=18/Math.max(.01,scale);
 const eligible=nodes.filter(n=>!['screen','header','tabbar'].includes(n.type));
 const direct=eligible.filter(n=>pointInPolygon({x:n.x+n.w/2,y:n.y+n.h/2},loop)||getNodeCoverage(n,loop)>.04||strokeIntersectsRect(loop,{x:n.x-padding,y:n.y-padding,w:n.w+padding*2,h:n.h+padding*2}));
 if(direct.length)return direct.map(n=>n.id);
 // An unfinished arc can leave its intended objects inside its bounds but outside
 // the closing chord. Use nearby region contents as evidence for AI to disambiguate.
 const left=Math.min(...loop.map(p=>p.x))-padding,right=Math.max(...loop.map(p=>p.x))+padding;
 const top=Math.min(...loop.map(p=>p.y))-padding,bottom=Math.max(...loop.map(p=>p.y))+padding;
 return eligible.filter(n=>n.x+n.w>=left&&n.x<=right&&n.y+n.h>=top&&n.y<=bottom).map(n=>n.id);
}
