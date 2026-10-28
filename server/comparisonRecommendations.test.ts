import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import {comparisonAnalysisRequest,comparisonAnalysisPayload,parseComparisonAnalysis} from './comparisonRecommendations';
import {semanticHandler,SemanticOptions} from './semantic';
const body={task:'comparison-analysis',contextId:'comparison',sideA:['hc1'],sideB:['sc2']};
const context=comparisonAnalysisRequest(body);
const rows=context.differences.map(row=>({key:row.key,category:row.key==='radius'?'suggested':row.key==='dimensions'?'review':'informational',reason:row.key==='radius'?'style_consistency':'layout_context'}));
const output=(recommendations:unknown=rows)=>({id:'resp_mock_comparison',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({recommendations})}]}]});
async function endpoint(options:SemanticOptions,run:(url:string)=>Promise<void>){const app=express();app.use(express.json({limit:'1mb'}));app.post('/api/semantic/interpret',semanticHandler(options));const server=createServer(app);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));try{await run(`http://127.0.0.1:${(server.address() as any).port}/api/semantic/interpret`);}finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}}
const post=(url:string,data:unknown=body)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
test('Comparison analysis derives bounded authoritative differences and rejects invented metadata and output',()=>{
 const context=comparisonAnalysisRequest({...body,differences:[{key:'invented',value:999}],elements:[{id:'invented'}]}),payload=comparisonAnalysisPayload(context,'fixture-model');
 assert.equal(payload.store,false);assert.equal(payload.text.format.strict,true);assert.doesNotMatch(payload.input,/invented/);assert.match(payload.input,/parent/);assert.equal(parseComparisonAnalysis(output(),context).length,context.differences.length);
 for(const result of [output([{key:'invented',category:'suggested',reason:'style_consistency'}]),output(rows.map(row=>({...row,value:999}))),output(rows.map(row=>({...row,elementIds:['invented']}))),{...output(),status:'incomplete'}])assert.throws(()=>parseComparisonAnalysis(result,context));
 assert.throws(()=>comparisonAnalysisRequest({...body,sideB:['invented']}));assert.throws(()=>comparisonAnalysisRequest({...body,sideA:[]}));
});
test('Existing semantic HTTP endpoint returns model provenance and caches comparison classifications without live calls',async()=>{
 let calls=0;await endpoint({enabled:true,key:'offline-test-only',fetcher:async(_url,init)=>{calls++;const payload=JSON.parse(String(init!.body));assert.equal(payload.text.format.name,'comparison_recommendations');return Response.json(output());}},async url=>{
  const first=await post(url);assert.equal(first.status,200);const data=await first.json();assert.ok(data.recommendations.every((r:any)=>r.source==='model'));assert.equal(data.responseId,'resp_mock_comparison');assert.equal(data.contextId,body.contextId);
  const second=await (await post(url,{...body,contextId:'another-context'})).json();assert.equal(second.cached,true);assert.equal(second.contextId,'another-context');assert.equal(calls,1);
 });
});
test('Disabled, failed and invalid comparison AI requests leave deterministic fallback available',async()=>{
 let calls=0;await endpoint({enabled:false,key:'offline-test-only',fetcher:async()=>{calls++;throw new Error('No network allowed');}},async url=>{assert.equal((await post(url)).status,503);});assert.equal(calls,0);
 for(const fetcher of [async()=>new Response('',{status:500}),async()=>Response.json(output([{key:'invented',category:'suggested',reason:'style_consistency'}]))])await endpoint({enabled:true,key:'offline-test-only',fetcher},async url=>{const response=await post(url);assert.equal(response.status,502);assert.ok(!(await response.json()).recommendations);});
});
