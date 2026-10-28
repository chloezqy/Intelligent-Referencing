import type {ComparisonContext} from './collaboration';
import type {UIElement} from './types';
import {comparisonEvidence,validateRecommendations,DifferenceRecommendation} from './comparisonRecommendations';
export const comparisonAnalysisKey=(context:ComparisonContext,nodes:UIElement[])=>{const evidence=comparisonEvidence(context,nodes);return JSON.stringify([evidence.sides.A.elementIds,evidence.sides.B.elementIds,nodes]);};
export function canAnalyzeComparison(context:ComparisonContext|undefined,nodes:UIElement[]){if(!context)return false;const evidence=comparisonEvidence(context,nodes);return !!evidence.differences.length&&Object.values(evidence.sides).every(side=>side.elementIds.length>0&&side.elementIds.length<=24);}
const cache=new Map<string,{until:number;promise:Promise<DifferenceRecommendation[]>;pending:boolean}>();
/** Coalesce automatic analyses across rerenders, mode switches and StrictMode remounts. */
export function loadComparisonRecommendations(context:ComparisonContext,nodes:UIElement[],options:{force?:boolean;fetcher?:typeof fetch;now?:()=>number}={}){
 const key=comparisonAnalysisKey(context,nodes),now=(options.now||Date.now)();
 for(const [key,item] of cache)if(item.until<now&&!item.pending)cache.delete(key);
 const saved=cache.get(key);if(saved&&(saved.pending||!options.force))return saved.promise;
 const evidence=comparisonEvidence(context,nodes),contextId=crypto.randomUUID();
 const entry={until:now+600000,pending:true,promise:Promise.resolve([] as DifferenceRecommendation[])};
 entry.promise=(async()=>{
  const response=await (options.fetcher||fetch)('/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'comparison-analysis',contextId,sideA:evidence.sides.A.elementIds,sideB:evidence.sides.B.elementIds,document:nodes}),signal:AbortSignal.timeout(20000)});
  const result=await response.json();if(!response.ok)throw new Error(response.status===503?'AI unavailable.':result.error||'AI analysis failed.');
  if(result.contextId!==contextId||typeof result.model!=='string'||!Array.isArray(result.recommendations)||result.recommendations.some((r:any)=>r.source!=='model'))throw new Error('Invalid AI analysis.');
  return validateRecommendations(result.recommendations.map(({key,category,reason}:DifferenceRecommendation)=>({key,category,reason})),evidence.differences.map(row=>row.key));
 })().catch(error=>{entry.until=(options.now||Date.now)()+60000;throw error;}).finally(()=>{entry.pending=false;});
 if(cache.size>=20){const oldest=[...cache].find(([,item])=>!item.pending);if(oldest)cache.delete(oldest[0]);}
 cache.set(key,entry);return entry.promise;
}
