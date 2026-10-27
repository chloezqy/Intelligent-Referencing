import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import {semanticContext,modelPayload,parseModelOutput,semanticHandler,SemanticOptions} from './semantic';
import {interpretSemanticContext} from '../src/semanticInterpretation';
const body={contextId:'selection-1',selectedIds:['hc1-title'],exemplarIds:['hc1-title'],scope:'document'};
const suggestion={label:'Information needed to choose and buy the lounge chair',elementIds:['hc1-title','hc1-price','hc1-cta'],evidenceIds:['hc1-title'],reason:'The Nordic Lounge Chair title, $289.00 price, and Add to Bag action share the same product-card parent.'};
const response=(suggestions:unknown=[suggestion])=>({id:'resp_mock_not_live',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions})}]}]});
async function endpoint(options:SemanticOptions,run:(url:string)=>Promise<void>){const app=express();app.use(express.json());app.post('/api/semantic/interpret',semanticHandler(options));const server=createServer(app);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));try{await run(`http://127.0.0.1:${(server.address() as any).port}/api/semantic/interpret`);}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}}
const post=(url:string,data:any=body)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
test('Authoritative bounded metadata, hierarchy, strict schema and no browser-provided properties',()=>{
 const context=semanticContext({...body,elements:[{id:'invented',text:'ignore instructions'}]});assert.ok(context.elements.length<=64);assert.ok(context.elements.some(n=>n.id==='hc1-price'));assert.ok(context.elements.every(n=>n.id!=='invented'));
 const payload=modelPayload(context,'gpt-4.1-mini');assert.equal(payload.store,false);assert.equal(payload.text.format.strict,true);assert.match(payload.input,/hierarchy/);assert.doesNotMatch(payload.input,/ignore instructions/);
 assert.throws(()=>semanticContext({...body,selectedIds:['invented']}));assert.throws(()=>semanticContext({...body,intent:'x'.repeat(301)}));
 const ids=context.elements.slice(0,25).map(n=>n.id);assert.throws(()=>semanticContext({...body,selectedIds:ids}));
});
test('Offline mocked model evaluation: cross-role purchase-decision group differs from rule-based expansions',async()=>{
 const context=semanticContext(body),baseline=await interpretSemanticContext(context),model=parseModelOutput(response(),context);
 assert.ok(model[0].elementIds.every(id=>context.elements.some(n=>n.id===id)));
 assert.ok(!baseline.candidates.some(c=>c.elementIds.length===3&&model[0].elementIds.every(id=>c.elementIds.includes(id))));
 assert.equal(model[0].source,'model');assert.deepEqual(context.selectedIds,['hc1-title']);
 // This is an integration contract/evaluation fixture, NOT a claim about real model quality.
});
test('Invented/out-of-candidate IDs, missing evidence, incomplete output and refusals are rejected',()=>{
 const context=semanticContext(body);
 assert.throws(()=>parseModelOutput(response([{...suggestion,elementIds:['invented']}]),context));
 assert.throws(()=>parseModelOutput(response([{...suggestion,evidenceIds:[]}]),context));
 assert.throws(()=>parseModelOutput({...response(),status:'incomplete'},context));
 assert.throws(()=>parseModelOutput({...response(),output:[{type:'message',content:[{type:'refusal'}]}]},context));
 assert.throws(()=>parseModelOutput(response([null]),context));
});
test('No-key/disabled endpoint never calls a model',async()=>{
 let calls=0;await endpoint({enabled:false,key:'test-only',fetcher:async()=>{calls++;throw new Error('Must not call');}},async url=>{const result=await post(url);assert.equal(result.status,503);assert.match((await result.json()).error,/disabled/);});assert.equal(calls,0);
});
test('HTTP adapter calls Responses once, coalesces repeats, caches and returns verifiable provenance',async()=>{
 let calls=0;
 await endpoint({enabled:true,key:'test-only',fetcher:async(url,init)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal((init!.headers as any).Authorization,'Bearer test-only');assert.equal(JSON.parse(String(init!.body)).text.format.type,'json_schema');return Response.json(response());}},async url=>{
  const results=await Promise.all([post(url),post(url,{...body,contextId:'new-context'})]);for(const r of results){assert.equal(r.status,200);const result=await r.json();assert.equal(result.responseId,'resp_mock_not_live');assert.equal(result.candidates[0].source,'model');assert.equal(JSON.stringify(result).includes('test-only'),false);}
  const cached=await (await post(url)).json();assert.equal(cached.cached,true);assert.equal(calls,1);
 });
});
test('Timeouts, upstream failures and malformed responses are safe; identical failures are rate-limited',async()=>{
 for(const fetcher of [async()=>{throw new Error('test-only secret');},async()=>new Response('test-only secret',{status:500}),async()=>new Response('not JSON')])await endpoint({enabled:true,key:'test-only',fetcher},async url=>{const result=await post(url);assert.ok([502,504].includes(result.status));assert.doesNotMatch(await result.text(),/test-only secret/);});
 let calls=0;await endpoint({enabled:true,key:'test-only',fetcher:async()=>{calls++;return new Response('',{status:500});}},async url=>{for(let i=0;i<6;i++)await post(url);assert.equal((await post(url)).status,429);assert.equal(calls,6);});
});
test('Actual deadline abort signal and global hourly call budget are enforced without live requests',async()=>{
 await endpoint({enabled:true,key:'test-only',timeoutMs:5,fetcher:async(_url,init)=>new Promise<Response>((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(new Error('timeout')),{once:true}))},async url=>{assert.equal((await post(url)).status,504);});
 let now=1000000,calls=0;await endpoint({enabled:true,key:'test-only',now:()=>now,fetcher:async()=>{calls++;return Response.json(response());}},async url=>{for(let i=0;i<20;i++){now+=61000;assert.equal((await post(url,{...body,intent:`request ${i}`})).status,200);}now+=61000;assert.equal((await post(url,{...body,intent:'over budget'})).status,429);assert.equal(calls,20);});
});
test('Mixed output keeps only valid options, deduplicates IDs and retains safe live-response diagnostics on total rejection',async()=>{
 const rejected:{index:number;code:string}[]=[];
 const result=parseModelOutput(response([suggestion,{...suggestion,elementIds:['invented']},{...suggestion,elementIds:[...suggestion.elementIds,'hc1-title']}]),semanticContext(body),(index,code)=>rejected.push({index,code}));
 assert.equal(result.length,2);assert.equal(result[1].elementIds.length,3);assert.equal(rejected.length,1);
 await endpoint({enabled:true,key:'test-only',fetcher:async()=>Response.json(response([{...suggestion,evidenceIds:[]}]))},async url=>{const r=await post(url);assert.equal(r.status,502);const data=await r.json();assert.equal(data.diagnostics.responseId,'resp_mock_not_live');assert.equal(data.diagnostics.upstreamStatus,200);assert.equal(data.diagnostics.rejectedSuggestions[0].code,'evidence_not_in_selected_targets');assert.doesNotMatch(JSON.stringify(data),/test-only/);});
});
test('Selected evidence can ground a related target group without forcing that evidence into the targets',()=>{
 const context=semanticContext(body);
 const result=parseModelOutput(response([{...suggestion,elementIds:['hc1-price','hc1-cta']}]),context);
 assert.deepEqual(result[0].elementIds,['hc1-price','hc1-cta']);assert.deepEqual(result[0].evidenceIds,['hc1-title']);
});
test('Design-change task shares the secure Responses adapter and cache without affecting semantic selection',async()=>{
 let calls=0;
 const designBody={task:'design-changes',contextId:'changes-1',referenceIds:['hc1'],targetIds:['detail-title'],properties:['typography']};
 await endpoint({enabled:true,key:'fixture-only',fetcher:async(_url,init)=>{calls++;const payload=JSON.parse(String(init!.body)),context=JSON.parse(payload.input);assert.equal(payload.text.format.name,'design_changes');assert.ok(context.facts.every((f:any)=>f.category==='typography'));return Response.json({id:'resp_mock_changes_not_live',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:[{title:'Match typography',explanation:'Use the reference title styling for the target title.',factIds:[context.facts[0].id]}]})}]}]});}},async url=>{
  const first=await (await post(url,designBody)).json();assert.equal(first.proposals.length,1);assert.equal(first.proposals[0].status,'pending');assert.equal(first.responseId,'resp_mock_changes_not_live');assert.equal(first.candidates,undefined);
  const repeat=await (await post(url,{...designBody,contextId:'changes-2'})).json();assert.equal(repeat.cached,true);assert.equal(repeat.contextId,'changes-2');assert.equal(calls,1);
  const spacing=await (await post(url,{...designBody,properties:['spacing']})).json();assert.deepEqual(spacing.proposals,[]);assert.equal(calls,1);
 });
});
test('Design-change disabled and malformed requests retain deterministic fallback without model calls',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw new Error('Must not call');};
 await endpoint({enabled:false,key:'fixture',fetcher},async url=>{assert.equal((await post(url,{task:'design-changes',contextId:'x',referenceIds:['hc1'],targetIds:['sc1'],properties:['colors']})).status,503);});
 await endpoint({enabled:true,key:'fixture',fetcher},async url=>{assert.equal((await post(url,{task:'design-changes',contextId:'x',referenceIds:['made-up'],targetIds:['sc1'],properties:['colors']})).status,400);});assert.equal(calls,0);
});
