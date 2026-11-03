import type {UIElement} from './types.js';
import {descendants,validatePatches,type EditProposal} from './editing.js';
import type {TokenFact,TokenSuggestion} from './designSystemReferencing.js';
export function colorPalette(nodes:UIElement[]){return nodes.filter(n=>n.library&&n.token?.startsWith('Color / ')&&typeof n.bg==='string').map(n=>({id:n.id,name:n.token!.slice(8),value:n.bg!,role:n.role}));}
export function colorStyleFacts(ids:string[],nodes:UIElement[]):TokenFact[]{
 return descendants(ids,nodes).filter(n=>!n.library&&n.type!=='screen').flatMap(target=>colorPalette(nodes).flatMap(token=>(['bg','color','border'] as const).flatMap(property=>{
 const current=target[property];if(current===undefined)return [];
 if(property==='border'&&!/#[0-9a-f]{3,8}\b/i.test(current))return [];
 const proposed=property==='border'?current.replace(/#[0-9a-f]{3,8}\b/i,token.value):token.value;
 return [{id:`${target.id}:${token.id}:${property}`,targetId:target.id,tokenId:token.id,property,current,proposed,tokenLabel:`Color / ${token.name}`,exact:current===proposed}];})));
}
export function validateColorSuggestions(value:unknown,facts:TokenFact[]):TokenSuggestion[]{
 if(!Array.isArray(value)||value.length>8)throw Error('Invalid color recommendations.');
 const seen=new Set<string>();return value.map(s=>{const fact=facts.find(f=>f.id===s?.fact?.id);if(!fact||JSON.stringify(fact)!==JSON.stringify(s.fact)||s.source!=='model'||typeof s.reason!=='string'||!s.reason.trim()||s.reason.length>180||seen.has(fact.id))throw Error('Unsupported color recommendation.');seen.add(fact.id);return {fact,source:'model',reason:s.reason};});
}

export function colorStyleProposal(suggestions:TokenSuggestion[],ids:string[],nodes:UIElement[]):EditProposal{
 const facts=colorStyleFacts(ids,nodes),seen=new Set<string>();
 const mappings=suggestions.flatMap(s=>{const f=facts.find(f=>f.id===s.fact.id),key=`${s.fact.targetId}:${s.fact.property}`;if(!f||JSON.stringify(f)!==JSON.stringify(s.fact)||seen.has(key))throw Error('Unsupported or conflicting color style.');seen.add(key);return f.exact?[]:[{id:f.id,label:f.tokenLabel,patches:[{id:f.targetId,changes:{[f.property]:f.proposed}}]}];});
 validatePatches(nodes,ids,mappings.flatMap(m=>m.patches));return {title:'Existing color styles',targetIds:ids,mappings};
}
