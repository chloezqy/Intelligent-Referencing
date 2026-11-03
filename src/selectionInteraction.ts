import {Point} from './types';
export const DRAG_THRESHOLD_PX=6;
export function isSelectionDrag(start:Point,points:Point[]){return points.some(p=>Math.hypot(p.x-start.x,p.y-start.y)>DRAG_THRESHOLD_PX);}
export function selectionDragKind(shift:boolean):'drawing'|'rect-selecting'{return shift?'rect-selecting':'drawing';}

import type {UIElement} from './types';
/** Artboards bound the selection hierarchy; nested groups/cards are selected before their contents. */
export function layerPath(id:string,nodes:UIElement[]):UIElement[]{
 const path:UIElement[]=[],seen=new Set<string>();let node=nodes.find(n=>n.id===id);
 while(node&&node.type!=='screen'&&!seen.has(node.id)){path.unshift(node);seen.add(node.id);node=nodes.find(n=>n.id===node!.parent);}
 return path;
}
export function canvasSelectionTarget(id:string,nodes:UIElement[],selected:string[],options:{deep?:boolean;drill?:boolean;extend?:boolean}={}):UIElement|undefined {
 const path=layerPath(id,nodes),hit=path.at(-1);if(!hit)return;
 if(options.deep)return hit;
 if(options.drill){let index=-1;path.forEach((n,i)=>{if(selected.includes(n.id))index=i;});return path[Math.min(path.length-1,index<0?1:index+1)];}
 if(options.extend&&selected.some(id=>{const n=nodes.find(n=>n.id===id);return n&&n.type===hit.type&&n.role===hit.role&&layerPath(n.id,nodes).length===path.length;}))return hit;
 // Once inside a group, ordinary clicks select siblings at that depth.
 for(const selectedId of [...selected].reverse()){
  const parent=nodes.find(n=>n.id===selectedId)?.parent,index=path.findIndex(n=>n.id===parent);
  if(index>=0&&index<path.length-1)return path[index+1];
 }
 return path[0];
}
export function nestedSelection(ids:string[],nodes:UIElement[],direction:'children'|'parent'):string[]{
 return [...new Set(direction==='children'?ids.flatMap(id=>{const children=nodes.filter(n=>n.parent===id);return children.length?children.map(n=>n.id):[id];}):ids.map(id=>nodes.find(n=>n.id===id)?.parent||id))].filter(id=>nodes.some(n=>n.id===id));
}
export function mergeLayerSelection(previous:string[],id:string,nodes:UIElement[],toggle=false):string[]{
 if(!toggle)return [id];if(previous.includes(id))return previous.filter(value=>value!==id);
 return [...previous.filter(value=>!layerPath(id,nodes).some(n=>n.id===value)&&!layerPath(value,nodes).some(n=>n.id===id)),id];
}
export function canvasMarqueeTargets(hitIds:string[],nodes:UIElement[],selected:string[],deep=false):string[]{
 const ids=[...new Set(hitIds.flatMap(id=>{const n=canvasSelectionTarget(id,nodes,selected,{deep});return n?[n.id]:[];}))];
 return deep?ids.filter(id=>!ids.some(other=>other!==id&&layerPath(other,nodes).some(n=>n.id===id))):ids;
}
