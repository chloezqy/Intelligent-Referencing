import type {ToolMode,UIElement,Point} from './types';
export type DragIntent='move'|'reference'|'box';
export function toolDragIntent(tool:ToolMode,onObject:boolean,shift:boolean):DragIntent{
 if(tool==='reference')return 'reference';
 return shift||!onObject?'box':'move';
}
export type Positions=Record<string,Point>;
export function moveTargets(nodes:UIElement[],id:string,selected:string[]){
 const roots=new Set(selected.includes(id)?selected:[id]);
 const ids=new Set(nodes.filter(n=>n.type!=='screen'&&roots.has(n.id)).map(n=>n.id));
 for(let changed=true;changed;){changed=false;for(const n of nodes)if(n.type!=='screen'&&n.parent&&ids.has(n.parent)&&!ids.has(n.id)){ids.add(n.id);changed=true;}}
 return nodes.filter(n=>ids.has(n.id)).map(n=>({...n}));
}
export function movePositions(snapshot:UIElement[],delta:Point,nodes:UIElement[]):Positions{
 let minX=-Infinity,maxX=Infinity,minY=-Infinity,maxY=Infinity;
 for(const n of snapshot){const frame=nodes.find(f=>f.type==='screen'&&f.screen===n.screen);if(frame){minX=Math.max(minX,frame.x-n.x);maxX=Math.min(maxX,frame.x+frame.w-n.x-n.w);minY=Math.max(minY,frame.y-n.y);maxY=Math.min(maxY,frame.y+frame.h-n.y-n.h);}}
 const dx=minX<=maxX?Math.max(minX,Math.min(maxX,delta.x)):0,dy=minY<=maxY?Math.max(minY,Math.min(maxY,delta.y)):0;
 return Object.fromEntries(snapshot.map(n=>[n.id,{x:n.x+dx,y:n.y+dy}]));
}
