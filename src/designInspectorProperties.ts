import type {UIElement} from './types';
import {roots,descendants,validatePatches,changedPatches,EditProposal,Patch} from './editing';
export type DesignSection='Position'|'Layout'|'Appearance'|'Typography'|'Fill'|'Stroke'|'Effects';
export const SECTION_FIELDS:Record<DesignSection,(keyof UIElement)[]>={
 Position:['x','y'],Layout:['w','h','spacing'],Appearance:['radius'],Typography:['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'],Fill:['bg','color'],Stroke:['border'],Effects:['shadow']
};
export const FIELD_LABELS:Partial<Record<keyof UIElement,string>>={x:'X',y:'Y',w:'W',h:'H',spacing:'Spacing',radius:'Corner radius',fontFamily:'Font',fontSize:'Size',fontWeight:'Weight',lineHeight:'Line height',letterSpacing:'Tracking',bg:'Fill',color:'Text color',border:'Stroke',shadow:'Shadow'};
export function selectedProperty(ids:string[],nodes:UIElement[],key:keyof UIElement){
 const selected=roots(ids,nodes),values=selected.map(n=>n[key]);
 return {available:values.some(v=>v!==undefined),editable:selected.length>0&&selected.every(n=>!n.library&&n[key]!==undefined),mixed:new Set(values).size>1,value:values.length&&values.every(v=>v===values[0])?values[0]:undefined};
}
export function propertyProposal(ids:string[],nodes:UIElement[],section:DesignSection,values:Partial<UIElement>):EditProposal{
 const selected=roots(ids,nodes),patches:Patch[]=[];
 if(!selected.length||Object.keys(values).some(k=>!SECTION_FIELDS[section].includes(k as keyof UIElement)))throw Error('Unsupported property edit.');
 for(const node of selected){
 const changes:Partial<UIElement>={};
 for(const [key,value] of Object.entries(values)){
 if(node.library||node[key as keyof UIElement]===undefined)throw Error('This property is not editable across the selection.');
 if(typeof node[key as keyof UIElement]!==typeof value)throw Error('Invalid property type.');
 Object.assign(changes,{[key]:value});
 }
 const dx=changes.x===undefined?0:changes.x-node.x,dy=changes.y===undefined?0:changes.y-node.y;
 if(dx||dy)for(const child of descendants([node.id],nodes).filter(n=>n.id!==node.id))patches.push({id:child.id,changes:{x:child.x+dx,y:child.y+dy}});
 patches.push({id:node.id,changes});
 }
 validatePatches(nodes,ids,patches);
 const changed=changedPatches(nodes,patches);if(!changed.length)throw Error('No property changes to preview.');
 return {title:section+' changes',targetIds:ids,mappings:[{id:'properties',label:section,patches:changed}]};
}
