import type {SemanticProvider,SemanticRequest,SemanticCandidate} from './semanticInterpretation';
import {validSemanticCandidate} from './semanticInterpretation';
/** Transport adapter only; privileged credentials never leave the server. */
export const modelSemanticProvider:SemanticProvider={async interpret(request:SemanticRequest,signal?:AbortSignal){
 const response=await fetch('/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contextId:request.contextId,selectedIds:request.selectedIds,exemplarIds:request.exemplarIds,scope:request.scope,intent:request.intent}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
 if(!response.headers.get('content-type')?.toLowerCase().includes('application/json')){await response.body?.cancel();throw new Error('AI endpoint unavailable. Check the server or deployment configuration. Rule-based options still work.');}
 let result:any;try{result=await response.json();}catch{throw new Error('Invalid AI server response. Rule-based options still work.');}
 if(!response.ok)throw new Error(typeof result?.error==='string'?result.error:'AI unavailable. Rule-based options still work.');
 if(result?.contextId!==request.contextId||!Array.isArray(result.candidates)||result.candidates.length>3||result.candidates.some((c:SemanticCandidate)=>!validSemanticCandidate(c,request)||c.source!=='model'))throw new Error('Unsupported AI suggestions. Rule-based options still work.');
 return result.candidates;
}};
