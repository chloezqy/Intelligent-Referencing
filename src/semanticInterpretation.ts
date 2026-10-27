import {Interpretation,UIElement,ScopeLevel} from './types.js';
import {generateScopeInterpretations} from './utils.js';
export type InterpretationLevel='geometric'|'structural'|'semantic';
export type InterpretationSource='rule-based'|'model';
export interface SemanticRequest {contextId:string;selectedIds:string[];exemplarIds:string[];scope:ScopeLevel;elements:UIElement[];intent?:string;document?:UIElement[];peer?:{userId:'A'|'B';elementIds:string[];revision:number}}
export interface SemanticCandidate {id:string;label:string;elementIds:string[];evidenceIds:string[];level:InterpretationLevel;source:InterpretationSource;reason:string}
export interface SemanticResult {contextId:string;candidates:SemanticCandidate[];fallback:boolean}
/** Model provider contract. Never changes selection; UI must explicitly apply a candidate. */
export interface SemanticProvider {interpret(request:SemanticRequest,signal?:AbortSignal):Promise<SemanticCandidate[]>}
export function interpretationLevel(value:Pick<Interpretation,'selectedIds'|'exemplarIds'|'matchingRole'>):InterpretationLevel{
 if(value.selectedIds.every(id=>value.exemplarIds.includes(id))&&value.selectedIds.length===value.exemplarIds.length)return 'geometric';
 return value.matchingRole&&!['card','badge'].includes(value.matchingRole)?'semantic':'structural';
}
export function validSemanticCandidate(candidate:SemanticCandidate,request:SemanticRequest){
 if(!candidate||typeof candidate!=='object')return false;
 const ids=new Set(request.elements.filter(n=>n.type!=='screen').map(n=>n.id));
 return typeof candidate.id==='string'&&typeof candidate.label==='string'&&candidate.label.length<=300&&typeof candidate.reason==='string'&&candidate.reason.length<=1000&&['geometric','structural','semantic'].includes(candidate.level)&&['rule-based','model'].includes(candidate.source)&&Array.isArray(candidate.elementIds)&&candidate.elementIds.length>0&&candidate.elementIds.length<=512&&candidate.elementIds.every(id=>ids.has(id))&&new Set(candidate.elementIds).size===candidate.elementIds.length&&Array.isArray(candidate.evidenceIds)&&candidate.evidenceIds.every(id=>ids.has(id));
}
export async function interpretSemanticContext(request:SemanticRequest,provider?:SemanticProvider,signal?:AbortSignal):Promise<SemanticResult>{
 if(provider){try{const output=await provider.interpret(request,signal);if(signal?.aborted)throw new Error('Cancelled');const candidates=output.filter(c=>validSemanticCandidate(c,request)).slice(0,3).map(c=>({...c,source:'model' as const}));if(candidates.length)return {contextId:request.contextId,candidates,fallback:false};}catch{/* Existing deterministic interpretation remains usable. */}}
 const exemplars=request.exemplarIds.length?request.exemplarIds:request.selectedIds;
 const first=request.elements.find(n=>n.id===exemplars[0]);
 const candidates=generateScopeInterpretations(exemplars,request.elements,request.scope,first?.role,first?.component).map(i=>({id:i.id,label:i.label,elementIds:i.selectedIds,evidenceIds:i.exemplarIds,level:interpretationLevel(i),source:'rule-based' as const,reason:i.reasoning})).filter(c=>validSemanticCandidate(c,request)).slice(0,3);
 return {contextId:request.contextId,candidates,fallback:true};
}
export function resultMatchesContext(result:SemanticResult,currentContextId:string){return result.contextId===currentContextId;}
