import type {UIElement} from './types';
import {descendants} from './editing';

/** Geometry comes from the visible document, so before/after layout stays aligned. */
export function previewSpotlightNodes(ids:string[],nodes:UIElement[]){
 return descendants(ids.filter(id=>nodes.some(n=>n.id===id)),nodes)
  .filter(n=>n.w>0&&n.h>0&&[n.x,n.y,n.w,n.h].every(Number.isFinite));
}

/** Older preview cleanup must not clear a newer card's spotlight. */
export function createPreviewSpotlight(publish:(ids:string[])=>void){
 let owner:symbol|null=null;
 return (source:symbol,ids:string[])=>{
  if(ids.length){owner=source;publish([...new Set(ids)]);}
  else if(owner===source){owner=null;publish([]);}
 };
}
