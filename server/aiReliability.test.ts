import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {semanticHandler,SemanticOptions} from './semantic';
const body={selectedIds:['hc1-title'],exemplarIds:['hc1-title'],scope:'document',contextId:'test'};
const output={id:'resp_fixture',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:[{label:'Product titles',reason:'Related title roles.',elementIds:['hc1-title'],evidenceIds:['hc1-title']}]})}]}]};
async function run(options:SemanticOptions,task:(post:(session:string,intent:string)=>Promise<Response>)=>Promise<void>){
 const app=express();app.use(express.json());app.post('/api/semantic/interpret',semanticHandler({enabled:true,key:'private-fixture',sleep:async()=>{},logger:()=>{},...options}));
 const server=createServer(app);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 try{await task((session,intent)=>fetch('http://127.0.0.1:'+(server.address() as any).port+'/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json','X-Smart-Reference-Session':session},body:JSON.stringify({...body,intent})}));}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
}
test('multiple sessions queue simultaneous distinct requests and identical requests coalesce',async()=>{
 let calls=0,active=0,max=0;
 await run({fetcher:async()=>{calls++;active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,15));active--;return Response.json(output);}},async post=>{
 const responses=await Promise.all(Array.from({length:10},(_,i)=>post(randomUUID(),'context-'+i)));
 assert.ok(responses.every(r=>r.status===200));assert.equal(calls,10);assert.equal(max,4);
 const same=await Promise.all(Array.from({length:8},()=>post(randomUUID(),'shared-context')));assert.ok(same.every(r=>r.status===200));assert.equal(calls,11);
 const data=await same[0].json();assert.equal(data.candidates[0].source,'model');assert.equal(data.responseId,'resp_fixture');
 });
});
test('per-session limits do not block another tester sharing the same network',async()=>{
 await run({sessionMinuteLimit:2,fetcher:async()=>Response.json(output)},async post=>{
 const a=randomUUID(),b=randomUUID();assert.equal((await post(a,'a1')).status,200);assert.equal((await post(a,'a2')).status,200);
 const blocked=await post(a,'a3');assert.equal(blocked.status,429);assert.equal((await blocked.json()).code,'session_limit');
 assert.equal((await post(b,'b1')).status,200);assert.equal((await post(b,'b2')).status,200);
 });
});
test('classified provider failures are logged safely without keys, notes or raw account details',async()=>{
 for(const [status,code,expected] of [[401,'invalid_api_key','invalid_api_key'],[429,'insufficient_quota','insufficient_quota'],[500,'server_error','upstream_error']] as const){
 const logs:any[]=[];let calls=0;
 await run({logger:entry=>logs.push(entry),fetcher:async()=>{calls++;return Response.json({error:{code,type:code,message:'private-fixture secret account note'}},{status});}},async post=>{
 const response=await post(randomUUID(),'private user intention');const data=await response.json();assert.equal(data.code,expected);assert.equal(calls,status===500?3:1);assert.equal(logs[0].code,expected);
 assert.doesNotMatch(JSON.stringify([logs,data]),/private-fixture|secret account|private user intention/);assert.equal(data.diagnostics,undefined);
 });
 }
});
