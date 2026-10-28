import type {UIElement} from './types.js';
import {COLORS,TYPOGRAPHY,COMPONENT_STYLES} from './designSystem.js';
export type Patch = {id:string;changes:Partial<UIElement>};
export type LayoutOperation = 'left'|'center'|'right'|'top'|'middle'|'bottom'|'horizontal'|'vertical'|'width'|'height'|'spacing';
export type TextRole = 'all'|'productTitle'|'price'|'buttons';
export interface Mapping {id:string;label:string;patches:Patch[]}
export interface EditProposal {title:string;targetIds:string[];mappings:Mapping[];sourceId?:string}
export const STYLE_KEYS = ['bg','color','radius','border','shadow','spacing','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'] as const;
export function descendants(ids:string[],nodes:UIElement[]){
 const set=new Set(ids);for(let changed=true;changed;){changed=false;for(const n of nodes)if(n.parent&&set.has(n.parent)&&!set.has(n.id)){set.add(n.id);changed=true;}}
 return nodes.filter(n=>set.has(n.id));
}
export function roots(ids:string[],nodes:UIElement[]){
 const selected=new Set(ids),byId=new Map(nodes.map(n=>[n.id,n]));
 return ids.flatMap(id=>{const n=byId.get(id);if(!n||n.type==='screen')return [];let parent=n.parent;const seen=new Set<string>();while(parent&&!seen.has(parent)){if(selected.has(parent))return [];seen.add(parent);parent=byId.get(parent)?.parent;}return [n];});
}
export function applyPatches(nodes:UIElement[],patches:Patch[]){const changes=new Map<string,Partial<UIElement>>();for(const p of patches)changes.set(p.id,{...changes.get(p.id),...p.changes});return nodes.map(n=>changes.has(n.id)?{...n,...changes.get(n.id),id:n.id}:n);}
export function textTargets(ids:string[],nodes:UIElement[],role:TextRole){return descendants(ids,nodes).filter(n=>!n.library&&(role==='buttons'?n.type==='button':n.type==='text'||(role==='all'&&n.type==='button'))&&(role==='all'||role==='buttons'||n.role===role));}
export function colorTargets(ids:string[],nodes:UIElement[],role:string){return descendants(ids,nodes).filter(n=>!n.library&&(role==='selection'?ids.includes(n.id):role==='buttons'?n.type==='button':role==='primaryCTA'?n.role==='primaryCTA':role==='text'?n.type==='text':true));}
export function changedPatches(nodes:UIElement[],patches:Patch[]){return patches.filter(p=>{const n=nodes.find(n=>n.id===p.id);return n&&Object.entries(p.changes).some(([k,v])=>n[k as keyof UIElement]!==v);});}
export function validatePatches(nodes:UIElement[],targetIds:string[],patches:Patch[]){
 const allowed=new Set(descendants(targetIds,nodes).filter(n=>!n.library&&n.type!=='screen').map(n=>n.id));
 const fields=new Set<string>([...STYLE_KEYS,'x','y','w','h','token']);
 for(const p of patches){if(!allowed.has(p.id))throw new Error('The edit includes an object outside the confirmed reference.');for(const [key,value] of Object.entries(p.changes)){if(!fields.has(key)||value===undefined)throw new Error('Unsupported edit property.');if(typeof value==='number'&&(!Number.isFinite(value)||(['w','h','fontSize'].includes(key)&&value<=0)||(['radius','spacing','lineHeight'].includes(key)&&value<0)))throw new Error('Invalid property value.');if(typeof value==='string'&&(value.length>200||/[<>]/.test(value)))throw new Error('Invalid style value.');}}
}
export function layoutPatches(ids:string[],nodes:UIElement[],op:LayoutOperation):Patch[]{
 const selected=roots(ids,nodes).filter(n=>!n.library);if(selected.length<2)throw new Error('Select at least two editable objects.');
 if(new Set(selected.map(n=>n.parent)).size!==1)throw new Error('Layout requires objects in the same parent frame. Select siblings to keep nested layouts intact.');
 const horizontal=['left','center','right','horizontal','width'].includes(op),axis=horizontal?'x':'y',size=horizontal?'w':'h';
 const low=Math.min(...selected.map(n=>n[axis])),high=Math.max(...selected.map(n=>n[axis]+n[size]));
 let ordered=[...selected].sort((a,b)=>a[axis]-b[axis]),gap=(high-low-selected.reduce((v,n)=>v+n[size],0))/(selected.length-1),cursor=low;
 const patches:Patch[]=[];
 // Grid-aware even spacing preserves rows, column membership and card contents.
 if(op==='spacing'){
  const rows:UIElement[][]=[];for(const n of [...selected].sort((a,b)=>a.y-b.y||a.x-b.x)){let row=rows.find(r=>Math.abs(r[0].y-n.y)<Math.min(r[0].h,n.h)/2);if(!row){row=[];rows.push(row);}row.push(n);}
  if(rows.length===selected.length)return layoutPatches(ids,nodes,'vertical');
  const columnCount=Math.max(...rows.map(r=>r.length));
  if(rows.some(r=>r.length!==columnCount))throw new Error('Even spacing needs a single row, column, or a complete grid.');
  const left=Math.min(...selected.map(n=>n.x)),right=Math.max(...selected.map(n=>n.x+n.w));
  const widths=Array.from({length:columnCount},(_,i)=>Math.max(...rows.map(r=>r.sort((a,b)=>a.x-b.x)[i].w)));
  const gutter=(right-left-widths.reduce((a,b)=>a+b,0))/(columnCount-1);
  if(gutter<0)throw new Error('There is not enough room for these columns.');
  const top=Math.min(...selected.map(n=>n.y)),bottom=Math.max(...selected.map(n=>n.y+n.h)),heights=rows.map(r=>Math.max(...r.map(n=>n.h)));
  const rowGap=rows.length>1?(bottom-top-heights.reduce((a,b)=>a+b,0))/(rows.length-1):0;
  if(rowGap<0)throw new Error('There is not enough room for these rows.');
  let y=top;rows.forEach((row,rowIndex)=>{let x=left;row.forEach((n,i)=>{for(const child of descendants([n.id],nodes))patches.push({id:child.id,changes:{x:child.x+x-n.x,y:child.y+y-n.y}});x+=widths[i]+gutter;});y+=heights[rowIndex]+rowGap;});
 } else {
  if((op==='horizontal'||op==='vertical')&&gap<0)throw new Error('There is not enough room to distribute without overlap. Use Even spacing to preserve a grid.');
  for(const n of ordered){let value=n[axis],dimension=n[size];
   if(op==='left'||op==='top')value=low;
   if(op==='center'||op==='middle')value=(low+high-n[size])/2;
   if(op==='right'||op==='bottom')value=high-n[size];
   if(op==='horizontal'||op==='vertical'){value=cursor;cursor+=n[size]+gap;}
   if(op==='width'||op==='height')dimension=selected[0][size];
   const delta=value-n[axis];
   for(const child of descendants([n.id],nodes))patches.push({id:child.id,changes:{[axis]:child[axis]+delta,...(child.id===n.id?{[size]:dimension}:{})}});
  }
 }
 const after=applyPatches(nodes,patches),affected=new Set(patches.map(p=>p.id));
 for(const n of after.filter(n=>affected.has(n.id))){const before=nodes.find(b=>b.id===n.id)!;const parent=after.find(p=>p.id===n.parent);if(!parent)continue;
  const overflow=(v:UIElement,p:UIElement)=>Math.max(0,p.x-v.x)+Math.max(0,p.y-v.y)+Math.max(0,v.x+v.w-p.x-p.w)+Math.max(0,v.y+v.h-p.y-p.h);
  const oldParent=nodes.find(p=>p.id===before.parent)!;if(overflow(n,parent)>overflow(before,oldParent)+.01)throw new Error('This operation would move or resize content outside its parent.');
 }
 validatePatches(nodes,ids,patches);return patches;
}
function styleOf(n:UIElement,keys:readonly (keyof UIElement)[]=STYLE_KEYS):Partial<UIElement>{return Object.fromEntries(keys.filter(k=>n[k]!==undefined).map(k=>[k,n[k]]));}
export function internalSpacing(ids:string[],nodes:UIElement[],inset:number):Patch[]{
 const tree=descendants(ids,nodes),patches:Patch[]=[];
 for(const card of tree.filter(n=>n.type==='card'&&n.component==='ProductCard')){
  for(const n of tree.filter(n=>n.parent===card.id&&!['productImage','favorite','badge'].includes(n.role||''))){
   if(n.x-card.x<=20&&n.w<=card.w-16)patches.push({id:n.id,changes:{x:card.x+inset,w:Math.min(n.w,card.w-inset*2)}});
   else if(n.role==='primaryCTA')patches.push({id:n.id,changes:{x:card.x+card.w-n.w-inset}});
  }
 }
 return patches;
}
export function matchStyles(ids:string[],nodes:UIElement[],sourceId:string):EditProposal{
 const source=nodes.find(n=>n.id===sourceId);if(!source||source.type==='screen')throw new Error('Choose an existing component or object as the source.');
 const targets=roots(ids,nodes),sourceTree=descendants([source.id],nodes),sourceSet=new Set(sourceTree.map(n=>n.id));
 if(targets.some(n=>sourceSet.has(n.id))&&sourceId!==targets[0]?.id)throw new Error('Choose a style source separate from the target objects.');
 const mappings:Mapping[]=[];
 for(const target of targets){if(target.id===source.id)continue;if(target.type!==source.type)continue;
  for(const n of descendants([target.id],nodes)){if(sourceSet.has(n.id))continue;const s=n.id===target.id?source:sourceTree.find(s=>s.id!==source.id&&s.type===n.type&&(n.role?s.role===n.role:!s.role));if(!s||n.type==='image')continue;
   mappings.push({id:`match-${n.id}`,label:`${n.label} ← ${s.label}`,patches:[{id:n.id,changes:styleOf(s)}]});
  }
 }
 if(source.spacing!==undefined){const patches=internalSpacing(targets.filter(n=>n.id!==source.id).map(n=>n.id),nodes,source.spacing);if(patches.length)mappings.push({id:'match-spacing',label:`Internal spacing → ${source.spacing}px`,patches});}
 if(!mappings.length)throw new Error('No compatible target objects for this source. Choose a matching component type.');
 return {title:'Match styles',targetIds:[...ids],sourceId,mappings};
}
export function libraryProposal(ids:string[],nodes:UIElement[]):EditProposal{
 const tree=descendants(ids,nodes).filter(n=>!n.library),mappings:Mapping[]=[];
 const libraryStyle=(id:string)=>{const source=nodes.find(n=>n.id===id&&n.library);if(!source)throw new Error('The in-file library source is unavailable.');return styleOf(source);};
 const map=(id:string,label:string,predicate:(n:UIElement)=>boolean,style:Partial<UIElement>)=>{const patches=tree.filter(predicate).map(n=>({id:n.id,changes:{...style,token:label}}));if(patches.length)mappings.push({id,label,patches});};
 map('cards','Product Card → Surface / Radius 12 / Shadow Small',n=>n.type==='card',libraryStyle('ds-product-card'));
 map('titles','Product title → Typography / Body Semibold',n=>n.role==='productTitle',libraryStyle('ds-product-card-title'));
 map('prices','Price → Typography / Price',n=>n.role==='price',libraryStyle('ds-product-card-price'));
 map('cta','CTA → Primary Button / Brand Primary',n=>n.role==='primaryCTA',libraryStyle('ds-product-card-cta'));
 map('secondary','Secondary CTA → Secondary Button',n=>n.type==='button'&&n.role==='secondaryCTA',libraryStyle('ds-component-1'));
 map('chips','Filter → Filter Chip',n=>n.type==='chip',libraryStyle('ds-component-2'));
 map('inputs','Input → Input Field',n=>n.type==='input',libraryStyle('ds-component-3'));
 map('text','Other text → Typography / Caption',n=>n.type==='text'&&!['productTitle','price'].includes(n.role||''),libraryStyle('ds-type-2'));
 // Layout spacing is applied using existing geometry, preserving image and text content.
 const spacing=internalSpacing(ids,nodes,nodes.find(n=>n.id==='ds-product-card')?.spacing||16);
 if(spacing.length)mappings.push({id:'spacing',label:'Internal spacing → Spacing / 16',patches:spacing});
 if(!mappings.length)throw new Error('No library styles match this selection.');return {title:`Match ${roots(ids,nodes).length} objects to Design System`,targetIds:[...ids],sourceId:'ds-product-card',mappings};
}
export function proposalPatches(proposal:EditProposal,enabled:string[],nodes:UIElement[]){const patches=proposal.mappings.filter(m=>enabled.includes(m.id)).flatMap(m=>m.patches);validatePatches(nodes,proposal.targetIds,patches);return patches;}
export const tokenColor=(name:string)=>COLORS[name as keyof typeof COLORS];

/** Explicit root resizing; contents retain their authored layout (no inferred reflow). */
export function matchDimensions(ids:string[],nodes:UIElement[],sourceId:string):Patch[]{
 const source=nodes.find(n=>n.id===sourceId);if(!source||source.type==='screen')throw new Error('Choose an existing size source.');
 const targets=roots(ids,nodes);if(!targets.length||targets.some(n=>n.id===sourceId||descendants([n.id],nodes).some(child=>child.id===sourceId)))throw new Error('Choose separate size targets.');
 const patches=targets.map(target=>{const parent=nodes.find(n=>n.id===target.parent);if(parent&&(target.x+source.w>parent.x+parent.w+.01||target.y+source.h>parent.y+parent.h+.01))throw new Error('The requested size exceeds the target frame.');return {id:target.id,changes:{w:source.w,h:source.h}};});
 validatePatches(nodes,ids,patches);return changedPatches(nodes,patches);
}
