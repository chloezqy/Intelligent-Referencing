import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {interpretSemanticContext,interpretationLevel,resultMatchesContext,SemanticRequest,SemanticCandidate} from './semanticInterpretation';
const request:SemanticRequest={contextId:'draft-1',selectedIds:['hc1-cta','sc1-cta'],exemplarIds:['hc1-cta','sc1-cta'],scope:'document',elements:MOCK_NODES,intent:'Compare purchase actions',peer:{userId:'B',elementIds:['sc1-cta'],revision:4}};
test('Interpretation levels distinguish physical targets, structural expansion, and rule-based semantic relationships',()=>{
 assert.equal(interpretationLevel({selectedIds:['a'],exemplarIds:['a']}),'geometric');
 assert.equal(interpretationLevel({selectedIds:['a','b'],exemplarIds:['a']}),'structural');
 assert.equal(interpretationLevel({selectedIds:['a','b'],exemplarIds:['a'],matchingRole:'card'}),'structural');
 assert.equal(interpretationLevel({selectedIds:['a','b'],exemplarIds:['a'],matchingRole:'primaryCTA'}),'semantic');
});
test('Semantic adapter defaults to deterministic fallback without changing the selection or request',async()=>{
 const before=JSON.stringify(request);const result=await interpretSemanticContext(request);
 assert.equal(result.fallback,true);assert.ok(result.candidates.length);assert.ok(result.candidates.every(c=>c.source==='rule-based'));assert.equal(JSON.stringify(request),before);
 assert.equal(resultMatchesContext(result,'draft-2'),false);
});
test('A future model adapter returns explicitly labeled candidates; invalid IDs/failure use fallback',async()=>{
 const candidate:SemanticCandidate={id:'model-1',label:'Primary purchase actions',elementIds:['hc1-cta','sc1-cta'],evidenceIds:['hc1-cta'],source:'model',level:'semantic',reason:'Both selected objects have a primaryCTA role.'};
 const result=await interpretSemanticContext(request,{interpret:async()=>[candidate]});assert.equal(result.fallback,false);assert.equal(result.candidates[0].source,'model');
 const invalid=await interpretSemanticContext(request,{interpret:async()=>[{...candidate,elementIds:['invented']}]});assert.equal(invalid.fallback,true);
 const failed=await interpretSemanticContext(request,{interpret:async()=>{throw new Error('Unavailable');}});assert.equal(failed.fallback,true);
});
