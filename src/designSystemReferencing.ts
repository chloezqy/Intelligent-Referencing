import {comparisonSides,referenceSides} from './comparisonSides.js';
import type {ComparisonContext} from './collaboration.js';
import type {UIElement} from './types.js';
import {descendants,validatePatches,EditProposal} from './editing.js';
export const TOKEN_FIELDS=['bg','color','radius','spacing','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','border','shadow'] as const;
export type TokenField=typeof TOKEN_FIELDS[number];
export interface TokenFact {id:string;targetId:string;tokenId:string;property:TokenField;current:string|number;proposed:string|number;tokenLabel:string;exact:boolean}
export interface TokenSuggestion {fact:TokenFact;reason:string;source:'model'|'deterministic'}
/** Library identity and recorded values are authoritative. Decorative sample styling is not a token. */
export function tokenFacts(ids:string[],nodes:UIElement[]):TokenFact[]{
 const library=nodes.filter(n=>n.library&&n.type!=='screen'),facts:TokenFact[]=[];
 for(const target of descendants(ids,nodes).filter(n=>!n.library&&n.type!=='screen')){
  for(const token of library){
   let fields:readonly TokenField[]=[];
   if(token.token?.startsWith('Color / '))fields=['bg','color'];
   else if(token.token?.startsWith('Typography / ')&&target.type==='text')fields=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color'];
   else if(token.id==='ds-property-0')fields=['radius'];
   else if(token.id==='ds-property-1')fields=['spacing'];
   else if(!token.id.startsWith('ds-property-')&&token.type===target.type&&((token.role&&token.role===target.role)||(token.component&&token.component===target.component)||token.id.startsWith('ds-component-')))fields=TOKEN_FIELDS;
   for(const property of fields){
    const current=target[property],proposed=token.token?.startsWith('Color / ')?token.bg:token[property];
    if(current===undefined||proposed===undefined)continue;
    const exact=current===proposed;
    // A color difference alone provides no semantic evidence. Component styles supply contextual colors.
    if(token.token?.startsWith('Color / ')&&!exact)continue;
    facts.push({id:`${target.id}:${token.id}:${property}`,targetId:target.id,tokenId:token.id,property,current,proposed,tokenLabel:token.token||token.label,exact});
   }
  }
 }
 return facts.slice(0,160);
}
export function validateTokenSuggestions(value:unknown,facts:TokenFact[]):TokenSuggestion[]{
 if(!Array.isArray(value)||value.length>8)throw new Error('Invalid token suggestions.');
 const used=new Set<string>();return value.map(s=>{
  const fact=facts.find(f=>f.id===s?.fact?.id);
  if(!fact||JSON.stringify(s.fact)!==JSON.stringify(fact)||!['model','deterministic'].includes(s.source)||typeof s.reason!=='string'||!s.reason.trim()||s.reason.length>180||used.has(`${fact.targetId}:${fact.property}`))throw new Error('Unsupported or stale design system property.');
  used.add(`${fact.targetId}:${fact.property}`);return {fact:{...fact},reason:s.reason,source:s.source};
 });
}
export function tokenProposal(suggestions:TokenSuggestion[],ids:string[],nodes:UIElement[]):EditProposal{
 const valid=validateTokenSuggestions(suggestions,tokenFacts(ids,nodes));
 const mappings=valid.filter(s=>!s.fact.exact).map(s=>({id:s.fact.id,label:`${s.fact.property} · ${s.fact.tokenLabel}`,patches:[{id:s.fact.targetId,changes:{[s.fact.property]:s.fact.proposed}}]}));
 if(!mappings.length)throw new Error('Selected properties already match the library.');
 validatePatches(nodes,ids,mappings.flatMap(m=>m.patches));return {title:'Use existing design system properties',targetIds:ids,mappings};
}
export function exactTokenSuggestions(facts:TokenFact[]):TokenSuggestion[]{
 const seen=new Set<string>();return facts.filter(f=>f.exact&&!seen.has(`${f.targetId}:${f.property}`)&&!!seen.add(`${f.targetId}:${f.property}`)).slice(0,8).map(fact=>({fact,reason:'Recorded value matches an existing library property.',source:'deterministic'}));
}

export function filterTokenFacts(facts:TokenFact[],properties?:string[]){
 if(!properties)return facts;
 const category=(field:TokenField)=>['bg','color','border'].includes(field)?'colors':field==='radius'?'cornerRadius':field==='spacing'?'spacing':['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'].includes(field)?'typography':undefined;
 return facts.filter(f=>properties.includes(category(f.property)||''));
}

export const TOKEN_LABELS:Record<TokenField,string>={bg:'Fill',color:'Text color',radius:'Corner radius',spacing:'Spacing',fontFamily:'Font family',fontSize:'Font size',fontWeight:'Font weight',lineHeight:'Line height',letterSpacing:'Letter spacing',border:'Border',shadow:'Shadow'};
export function tokenValue(property:TokenField,value:string|number){return `${value}${['radius','spacing','fontSize','letterSpacing'].includes(property)?'px':''}`;}

export function comparisonTokenFacts(context:ComparisonContext,nodes:UIElement[]){
 const sides=comparisonSides(context);
 return context.purpose==='Use as a design reference'?filterTokenFacts(tokenFacts(referenceSides(context).target.elementIds,nodes),context.designReference?.properties||[]):tokenFacts([...sides.A.elementIds,...sides.B.elementIds],nodes);
}
