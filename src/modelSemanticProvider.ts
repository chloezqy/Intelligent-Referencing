import {requestAI} from './aiClient';
import type {SemanticProvider,SemanticRequest,SemanticCandidate} from './semanticInterpretation';
import {validSemanticCandidate} from './semanticInterpretation';
/** Transport adapter only; privileged credentials never leave the server. */
export const modelSemanticProvider:SemanticProvider={async interpret(request:SemanticRequest,signal?:AbortSignal){
 const result=await requestAI({contextId:request.contextId,selectedIds:request.selectedIds,exemplarIds:request.exemplarIds,scope:request.scope,intent:request.intent,document:request.document},{signal});
 if(result?.contextId!==request.contextId||!Array.isArray(result.candidates)||result.candidates.length>4||result.candidates.some((c:SemanticCandidate)=>!validSemanticCandidate(c,request)||c.source!=='model'))throw new Error('Unsupported AI suggestions. Retry or select touched objects manually.');
 return result.candidates;
}};
