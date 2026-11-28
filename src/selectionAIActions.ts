import type {UIElement} from './types';
import {applyPatches,changedPatches,layoutPatches,libraryProposal,proposalPatches,roots,validatePatches,type EditProposal,type Patch} from './editing';
import {layerStyleProposal} from './layerStyleReference';
export const ACTION_CATEGORIES=['Colors','Text','Corners','Shadow','Spacing'] as const;
export type ActionCategory=typeof ACTION_CATEGORIES[number];
export interface StyleChange {id:string;targetId:string;property:string;before:unknown;after:unknown;category:ActionCategory}
export function propertyCategory(key:string):ActionCategory|undefined{
 if(['bg','color','border'].includes(key))return 'Colors';
 if(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'].includes(key))return 'Text';
 if(key==='radius')return 'Corners';if(key==='shadow')return 'Shadow';
 if(['spacing','x','y','w','h'].includes(key))return 'Spacing';
}
export function selectionStyleChanges(ids:string[],nodes:UIElement[],sourceId?:string):StyleChange[]{
 const proposal=sourceId?layerStyleProposal(ids,nodes,sourceId):libraryProposal(ids,nodes);
 const after=applyPatches(nodes,proposalPatches(proposal,proposal.mappings.map(m=>m.id),nodes));
 const changes:StyleChange[]=[];
 for(const node of after){const before=nodes.find(n=>n.id===node.id)!;
  for(const [property,value] of Object.entries(node)){const category=propertyCategory(property);if(category&&before[property as keyof UIElement]!==value)changes.push({id:`${node.id}:${property}`,targetId:node.id,property,before:before[property as keyof UIElement],after:value,category});}
 }
 return changes;
}
export function categoryProposal(ids:string[],nodes:UIElement[],changes:StyleChange[],categories:ActionCategory[],sourceId?:string):EditProposal{
 const patches=changes.filter(c=>categories.includes(c.category)).map(c=>{
  const node=nodes.find(n=>n.id===c.targetId);if(!node||node[c.property as keyof UIElement]!==c.before)throw Error('These styles changed. Choose the categories again.');
  return {id:c.targetId,changes:{[c.property]:c.after}} as Patch;
 });
 validatePatches(nodes,ids,patches);
 if(!patches.length)throw Error('Choose at least one property category.');
 return {title:sourceId?'Copy source styles':'Apply library styles',targetIds:[...ids],sourceId:sourceId||'ds-product-card',mappings:[{id:'selected-categories',label:categories.join(', '),patches}]};
}
export function unevenSpacing(ids:string[],nodes:UIElement[]):{gaps:number[];gap:number;patches:Patch[]}|null{
 const selected=roots(ids,nodes);if(selected.length<3||selected.some(n=>n.library)||new Set(selected.map(n=>n.parent)).size!==1)return null;
 const horizontal=selected.every(n=>Math.abs(n.y-selected[0].y)<1),vertical=selected.every(n=>Math.abs(n.x-selected[0].x)<1);
 if(!horizontal&&!vertical)return null;
 const axis=horizontal?'x':'y',size=horizontal?'w':'h',ordered=[...selected].sort((a,b)=>a[axis]-b[axis]);
 const gaps=ordered.slice(1).map((n,i)=>n[axis]-ordered[i][axis]-ordered[i][size]);
 if(Math.min(...gaps)<0||Math.max(...gaps)-Math.min(...gaps)<1)return null;
 try{const patches=changedPatches(nodes,layoutPatches(ids,nodes,'spacing'));if(!patches.length)return null;return {gaps,gap:gaps.reduce((a,b)=>a+b,0)/gaps.length,patches};}catch{return null;}
}
