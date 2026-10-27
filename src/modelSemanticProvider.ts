import type {SemanticProvider,SemanticRequest,SemanticCandidate} from './semanticInterpretation';
import {validSemanticCandidate} from './semanticInterpretation';
/** Transport adapter only; privileged credentials never leave the server. */
export const modelSemanticProvider:SemanticProvider={async interpret(request:SemanticRequest,signal?:AbortSignal){
 const response=await fetch('/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contextId:request.contextId,selectedIds:request.selectedIds,exemplarIds:request.exemplarIds,scope:request.scope,intent:request.intent,document:request.document}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
 if(!response.headers.get('content-type')?.toLowerCase().includes('application/json')){await response.body?.cancel();throw new Error('AI endpoint unavailable. Check the server or deployment configuration. Retry or select touched objects manually.');}
 let result:any;try{result=await response.json();}catch{throw new Error('Invalid AI server response. Retry or select touched objects manually.');}
 if(!response.ok)throw new Error(response.status===503?'AI is unavailable. Retry or select touched objects manually.':typeof result?.error==='string'?result.error:'AI unavailable. Retry or select touched objects manually.');
 if(result?.contextId!==request.contextId||!Array.isArray(result.candidates)||result.candidates.length>4||result.candidates.some((c:SemanticCandidate)=>!validSemanticCandidate(c,request)||c.source!=='model'))throw new Error('Unsupported AI suggestions. Retry or select touched objects manually.');
 return result.candidates;
}};
