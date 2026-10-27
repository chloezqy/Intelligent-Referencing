import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import {tokenContext,tokenPayload,parseTokenOutput} from './designSystemReferencing';
import {semanticHandler} from './semantic';
import {MOCK_NODES} from '../src/data';
import {applyPatches} from '../src/editing';
const body={task:'design-system',contextId:'test',targetIds:['hc1']};
const output=(factId:string)=>({id:'resp_mock_tokens',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:[{factId,reason:'Corresponding card library property.'}]})}]}]});
test('Token task uses authoritative library, bounded facts and strict structured output; rejects forged IDs',()=>{
 const ctx=tokenContext(body),payload=tokenPayload(ctx,'gpt-4.1-mini');assert.ok(ctx.facts.length<=160);assert.equal(payload.text.format.strict,true);assert.equal(payload.store,false);
 assert.equal(parseTokenOutput(output(ctx.facts[0].id),ctx)[0].source,'model');assert.throws(()=>parseTokenOutput(output('invented'),ctx));assert.throws(()=>parseTokenOutput({...output(ctx.facts[0].id),status:'incomplete'},ctx));assert.throws(()=>tokenContext({...body,targetIds:['invented']}));
 const forged=MOCK_NODES.map(n=>n.library?{...n,radius:999}:n);assert.deepEqual(tokenContext({...body,document:forged}).facts,ctx.facts);
 const updated=applyPatches(MOCK_NODES,[{id:'hc1',changes:{radius:7}}]);assert.equal(tokenContext({...body,document:updated}).facts.find(f=>f.targetId==='hc1'&&f.property==='radius')?.current,7);
 assert.ok(tokenContext({...body,properties:['cornerRadius']}).facts.every(f=>f.property==='radius'));assert.throws(()=>tokenContext({...body,properties:['invented']}));
});
test('Mock Responses transport caches token analysis and disabled AI preserves fallback; no live calls',async()=>{
 let calls=0;
 const app=express();app.use(express.json());app.post('/enabled',semanticHandler({enabled:true,key:'fixture-only',fetcher:async(_url,init)=>{calls++;const payload=JSON.parse(String(init?.body));assert.equal(payload.text.format.name,'design_system_references');const ctx=JSON.parse(payload.input);return new Response(JSON.stringify(output(ctx.facts[0].id)),{headers:{'Content-Type':'application/json'}});}}));app.post('/disabled',semanticHandler({enabled:false}));
 const server=createServer(app);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${(server.address() as any).port}`;
 const post=async(path:string)=>{const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,result:await response.json()};};
 try{const first=await post('/enabled');assert.equal(first.status,200);assert.equal(first.result.responseId,'resp_mock_tokens');assert.equal(first.result.tokenSuggestions.length,1);const second=await post('/enabled');assert.equal(second.result.cached,true);assert.equal(calls,1);assert.equal((await post('/disabled')).status,503);}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});

test('Realtime sharing validates and persists checked library properties with frozen comparison ownership',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {collaborationServer}=await import('./app'),{RoomStore}=await import('./store');
 const dir=mkdtempSync(join(tmpdir(),'token-share-')),file=join(dir,'rooms.json'),server=createServer(collaborationServer(new RoomStore(file)));
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 const api=async(path:string,body?:unknown,session?:any)=>{const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,result:await response.json()};};
 try{
 const a=(await api('/rooms',{})).result,b=(await api(`/rooms/${a.code}/join`,{token:'c'.repeat(48)})).result;
 const context=(await api(`/rooms/${a.code}/comparison-drafts`,{localIds:['hc1','sc1']},a)).result;context.purpose='Compare differences';
 const ctx=tokenContext(body);context.tokenSuggestions=parseTokenOutput(output(ctx.facts.find(f=>!f.exact)!.id),ctx);
 const payload={requestId:crypto.randomUUID(),comparison:context,elementIds:['hc1','sc1'],exemplarIds:['hc1'],scope:'document',intent:'Compare',label:'Token proposal',message:'Review selected library property'};
 assert.equal((await api(`/rooms/${a.code}/references`,payload,a)).status,201);
 const received=(await api(`/rooms/${a.code}`,undefined,b)).result.references[0];assert.deepEqual(received.comparison.tokenSuggestions,context.tokenSuggestions);assert.deepEqual(received.comparison.sides,context.sides);
 assert.deepEqual(new RoomStore(file).snapshot(a.code,()=>false).references[0].comparison!.tokenSuggestions,context.tokenSuggestions);
 const invalid=structuredClone(payload);invalid.requestId=crypto.randomUUID();invalid.comparison.tokenSuggestions[0].fact.proposed='invented';assert.equal((await api(`/rooms/${a.code}/references`,invalid,a)).status,400);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));rmSync(dir,{recursive:true,force:true});}
});
