import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_NODES} from './data';
import {localComparison} from './comparisonSides';
import {loadComparisonRecommendations,canAnalyzeComparison} from './comparisonAnalysisClient';
import {comparisonEvidence,recommendationPriority,ruleBasedRecommendations} from './comparisonRecommendations';
test('Automatic comparison analysis coalesces concurrent mounts, caches mode re-entry and invalidates changed values',async()=>{
 const context=localComparison('A',['hc1','sc2'],'auto',MOCK_NODES);let calls=0;
 const fetcher:typeof fetch=async(_url,init)=>{calls++;const body=JSON.parse(String(init!.body));return Response.json({contextId:body.contextId,model:'fixture',recommendations:comparisonEvidence(context,MOCK_NODES).differences.map(row=>({key:row.key,category:'informational',reason:'layout_context',source:'model'}))});};
 const first=loadComparisonRecommendations(context,MOCK_NODES,{fetcher});const concurrent=loadComparisonRecommendations(context,MOCK_NODES,{fetcher});assert.equal(first,concurrent);await first;
 await loadComparisonRecommendations({...context,snapshotId:'mode-reentry'},MOCK_NODES,{fetcher});assert.equal(calls,1);
 const changed=MOCK_NODES.map(n=>n.id==='hc1'?{...n,radius:19}:n);await loadComparisonRecommendations(context,changed,{fetcher});assert.equal(calls,2);
 assert.ok(canAnalyzeComparison(context,MOCK_NODES));assert.equal(canAnalyzeComparison(undefined,MOCK_NODES),false);assert.equal(canAnalyzeComparison(localComparison('A',['hc1'],'one',MOCK_NODES),MOCK_NODES),false);
});
test('Failed auto analysis does not retry on rerender; explicit retry remains possible',async()=>{
 const context=localComparison('A',['hc2','sc3'],'failure',MOCK_NODES);let calls=0;
 const fetcher:typeof fetch=async()=>{calls++;return Response.json({error:'Unavailable'},{status:503});};
 await assert.rejects(loadComparisonRecommendations(context,MOCK_NODES,{fetcher}),/unavailable/i);
 await assert.rejects(loadComparisonRecommendations(context,MOCK_NODES,{fetcher}),/unavailable/i);assert.equal(calls,1);
 await assert.rejects(loadComparisonRecommendations(context,MOCK_NODES,{fetcher,force:true}),/unavailable/i);assert.equal(calls,2);
});
test('Suggested differences always sort ahead of review and information without changing checked properties',()=>{
 const context=localComparison('A',['hc1','sc2'],'priority',MOCK_NODES),recommendations=ruleBasedRecommendations(context,MOCK_NODES),checked=['dimensions'];
 const sorted=[...recommendations].sort((a,b)=>recommendationPriority(a.key,recommendations)-recommendationPriority(b.key,recommendations));
 assert.equal(sorted[0].key,'radius');assert.ok(sorted.findIndex(row=>row.key==='dimensions')<sorted.findIndex(row=>row.key==='label'));assert.deepEqual(checked,['dimensions']);
 const model=recommendations.map(row=>({...row,category:row.key==='dimensions'?'suggested' as const:'informational' as const,source:'model' as const}));
 assert.equal([...recommendations].sort((a,b)=>recommendationPriority(a.key,model)-recommendationPriority(b.key,model))[0].key,'dimensions');
});
