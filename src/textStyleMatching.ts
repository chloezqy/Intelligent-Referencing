import type {UIElement} from './types.js';
import {descendants,validatePatches,type EditProposal} from './editing.js';
export const TEXT_STYLE_FIELDS=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color'] as const;
export function textStyleLibrary(nodes:UIElement[]){return nodes.filter(n=>n.library&&n.type==='text'&&n.token?.startsWith('Typography / '));}
export function textStyleTargets(ids:string[],nodes:UIElement[]){return descendants(ids,nodes).filter(n=>!n.library&&n.type==='text');}
export function canvasTextReferences(ids:string[],nodes:UIElement[]){const excluded=new Set(descendants(ids,nodes).map(n=>n.id));return nodes.filter(n=>!n.library&&n.type==='text'&&!excluded.has(n.id));}
export interface TextStyleSuggestion{targetId:string;styleId:string;reason:string;source:'model'}
export function validateTextStyleSuggestions(value:unknown,ids:string[],nodes:UIElement[],includeCanvas=false):TextStyleSuggestion[]{
 if(!Array.isArray(value)||value.length>96)throw Error('Invalid text style recommendations.');
 const targets=new Set(textStyleTargets(ids,nodes).map(n=>n.id)),styles=new Set([...textStyleLibrary(nodes),...(includeCanvas?canvasTextReferences(ids,nodes):[])].map(n=>n.id)),seen=new Set<string>();
 return value.map(s=>{const key=`${s?.targetId}:${s?.styleId}`;if(!targets.has(s?.targetId)||!styles.has(s?.styleId)||s?.source!=='model'||typeof s.reason!=='string'||!s.reason.trim()||s.reason.length>180||seen.has(key))throw Error('Unsupported text style recommendation.');seen.add(key);return {targetId:s.targetId,styleId:s.styleId,reason:s.reason,source:'model'};});
}
export function textStyleProposal(choices:{targetId:string;styleId:string}[],ids:string[],nodes:UIElement[]):EditProposal{
 const targets=new Set(textStyleTargets(ids,nodes).map(n=>n.id)),seen=new Set<string>();
 const mappings=choices.flatMap(choice=>{const source=[...textStyleLibrary(nodes),...canvasTextReferences(ids,nodes)].find(n=>n.id===choice.styleId),target=nodes.find(n=>n.id===choice.targetId);
 if(!source||!target||!targets.has(target.id)||seen.has(target.id))throw Error('Unsupported text style.');seen.add(target.id);
 const changes=Object.fromEntries(TEXT_STYLE_FIELDS.filter(k=>source[k]!==undefined&&source[k]!==target[k]).map(k=>[k,source[k]]));
 return Object.keys(changes).length?[{id:target.id,label:source.token||source.label,patches:[{id:target.id,changes}]}]:[];});
 validatePatches(nodes,ids,mappings.flatMap(m=>m.patches));return {title:'Library text styles',targetIds:ids,mappings};
}
