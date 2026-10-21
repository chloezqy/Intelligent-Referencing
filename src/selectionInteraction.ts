import {Point} from './types';
export const DRAG_THRESHOLD_PX=6;
export function isSelectionDrag(start:Point,points:Point[]){return points.some(p=>Math.hypot(p.x-start.x,p.y-start.y)>DRAG_THRESHOLD_PX);}
export function selectionDragKind(shift:boolean):'drawing'|'rect-selecting'{return shift?'rect-selecting':'drawing';}
