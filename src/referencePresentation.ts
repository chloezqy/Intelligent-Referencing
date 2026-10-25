import { SharedReference } from './collaboration';
import { UIElement } from './types';
import { CanvasTransform } from './workspace';

export interface ReferenceAnchor {
  key: string;
  referenceId: string;
  elementId: string;
  x: number;
  y: number;
  active: boolean;
}
export interface PinCluster { key: string; x: number; y: number; anchors: ReferenceAnchor[]; referenceIds: string[] }
export const PIN_SIZE = 24;
const SEPARATION = PIN_SIZE + 8;
const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export function orderedReferences(references: SharedReference[]) {
  return [...references].sort((a,b)=>compareText(a.createdAt,b.createdAt)||compareText(a.id,b.id));
}

/** Screen-space markers; positions always derive from saved object IDs, never local selection. */
export function layoutReferencePins(references: SharedReference[], nodes: UIElement[], camera: CanvasTransform, viewport: {width:number;height:number}, activeId: string | null): PinCluster[] {
  const byId=new Map(nodes.map(node=>[node.id,node]));
  const anchors=orderedReferences(references).filter(ref=>!ref.archivedAt&&ref.status!=='reviewed').flatMap(ref=>[...new Set(ref.elementIds)].sort(compareText).flatMap(elementId=>{
    const node=byId.get(elementId);if(!node)return [];
    const x=(node.x+node.w)*camera.scale+camera.x, y=node.y*camera.scale+camera.y;
    if(x<PIN_SIZE/2||y<PIN_SIZE/2||x>viewport.width-PIN_SIZE/2||y>viewport.height-PIN_SIZE/2)return [];
    return [{key:`${ref.id}:${elementId}`,referenceId:ref.id,elementId,x,y,active:ref.id===activeId}];
  }));
  // Spatial buckets avoid comparing every pin with every other pin in large rooms.
  const parents=anchors.map((_,i)=>i), buckets=new Map<string,number[]>();
  const root=(i:number):number=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
  anchors.forEach((a,i)=>{
    const gx=Math.floor(a.x/SEPARATION),gy=Math.floor(a.y/SEPARATION);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const j of buckets.get(`${gx+dx}:${gy+dy}`)||[]){
      const b=anchors[j];if(Math.abs(a.x-b.x)<SEPARATION&&Math.abs(a.y-b.y)<SEPARATION)parents[root(i)]=root(j);
    }
    const key=`${gx}:${gy}`,bucket=buckets.get(key)||[];bucket.push(i);buckets.set(key,bucket);
  });
  const groups=new Map<number,ReferenceAnchor[]>();
  anchors.forEach((a,i)=>{const key=root(i),group=groups.get(key)||[];group.push(a);groups.set(key,group);});
  return [...groups.values()].map(group=>{
    const anchor=group.find(a=>a.active)||group[0];
    return {key:group.map(a=>a.key).join('|'),x:anchor.x,y:anchor.y,anchors:group,referenceIds:[...new Set(group.map(a=>a.referenceId))]};
  });
}

export interface ComparisonRow { key:string; label:string; values:string[]; state:'different'|'matching'|'unavailable' }
export interface PropertyComparison { elements:UIElement[]; missingIds:string[]; rows:ComparisonRow[] }
const unavailable='Not specified';
export function compareReferenceElements(ids: string[], nodes:UIElement[]):PropertyComparison {
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const unique=[...new Set(ids)],elements=unique.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]);
  const specs:{key:string;label:string;value:(node:UIElement)=>string|number|undefined}[]=[
    {key:'type',label:'Type',value:n=>n.type},
    {key:'role',label:'Role',value:n=>n.role},
    {key:'component',label:'Component',value:n=>n.component},
    {key:'text',label:'Visible text',value:n=>n.text},
    {key:'label',label:'Element label',value:n=>n.label},
    {key:'dimensions',label:'Dimensions',value:n=>`${n.w} × ${n.h} px`},
    {key:'background',label:'Background',value:n=>n.bg?.toLowerCase()},
    {key:'color',label:'Text color',value:n=>n.color?.toLowerCase()},
    {key:'radius',label:'Corner radius',value:n=>n.radius===undefined?undefined:`${n.radius} px`},
    {key:'border',label:'Border',value:n=>n.border},
    {key:'fontSize',label:'Font size',value:n=>n.fontSize===undefined?undefined:`${n.fontSize} px`},
    {key:'fontWeight',label:'Font weight',value:n=>n.fontWeight},
    {key:'screen',label:'Screen',value:n=>n.screen},
    {key:'location',label:'Position in screen',value:n=>{const frame=nodes.find(f=>f.type==='screen'&&f.screen===n.screen);return frame?`x ${n.x-frame.x}, y ${n.y-frame.y} px`:undefined;}},
  ];
  const rows=specs.map(spec=>{
    const raw=elements.map(spec.value),known=raw.filter(v=>v!==undefined);
    const state:ComparisonRow['state']=known.length!==elements.length?'unavailable':new Set(known.map(String)).size>1?'different':'matching';
    return {key:spec.key,label:spec.label,values:raw.map(v=>v===undefined?unavailable:String(v)),state};
  });
  return {elements,missingIds:unique.filter(id=>!byId.has(id)),rows};
}

/** Compact metadata only: full notes and replies stay in the References panel. */
export function referenceShortLabel(reference: SharedReference) {
  const label=reference.label.replace(/\s+/g,' ').trim();
  const short=label.length>44?`${label.slice(0,43)}…`:label;
  return `${reference.intent} · ${short || `${reference.elementIds.length} objects`}`;
}
export function pinChooserBounds(anchor:{x:number;y:number},viewport:{width:number;height:number}) {
  const width=Math.min(240,Math.max(0,viewport.width-16)),height=Math.min(224,Math.max(0,viewport.height-16));
  return {left:Math.max(8,Math.min(viewport.width-width-8,anchor.x+18)),top:Math.max(8,Math.min(viewport.height-height-8,anchor.y+18)),width,maxHeight:height};
}

export function shareActionLabel(user?: 'A'|'B'|null) {
  return user ? `Share to User ${user==='A'?'B':'A'}` : 'Share to user?';
}
/** Anchor an unsent request to its first visible object; keep the form inside the canvas. */
export function sharePopoverLayout(ids:string[],nodes:UIElement[],camera:CanvasTransform,viewport:{width:number;height:number},measuredHeight=320){
  const targets=ids.flatMap(id=>{const node=nodes.find(n=>n.id===id);return node?[{x:(node.x+node.w)*camera.scale+camera.x,y:node.y*camera.scale+camera.y}]:[];});
  if(!targets.length)return null;
  const inView=(p:{x:number;y:number})=>p.x>=12&&p.y>=12&&p.x<=viewport.width-12&&p.y<=viewport.height-12;
  const anchor=targets.find(inView)||targets[0],offscreen=!targets.some(inView);
  const pin={x:Math.max(12,Math.min(viewport.width-12,anchor.x)),y:Math.max(12,Math.min(viewport.height-12,anchor.y))};
  const width=Math.min(312,Math.max(0,viewport.width-16)),maxHeight=Math.min(360,Math.max(0,viewport.height-16)),height=Math.min(measuredHeight,maxHeight);
  const below=pin.y+20,top=below+height<=viewport.height-8?below:Math.max(8,pin.y-20-height);
  return {pin,offscreen,popup:{left:Math.max(8,Math.min(viewport.width-width-8,pin.x-12)),top:Math.min(Math.max(8,viewport.height-height-8),top),width,maxHeight}};
}
