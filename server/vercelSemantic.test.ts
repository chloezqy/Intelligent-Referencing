import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createVercelSemanticApp} from './vercelSemantic';
import {semanticHandler} from './semantic';
import type {SemanticOptions} from './semantic';
import express from 'express';
import {modelSemanticProvider} from '../src/modelSemanticProvider';
import {MOCK_NODES} from '../src/data';
import {readFileSync} from 'node:fs';

const origin='https://smart-reference.example';
const env={VERCEL:'1',VERCEL_URL:'preview.example',VERCEL_PROJECT_PRODUCTION_URL:'smart-reference.example',PUBLIC_ORIGIN:'https://custom.example'};
const input={contextId:'hosted-selection',selectedIds:['hc1-title'],exemplarIds:['hc1-title'],scope:'document' as const};
const output={id:'resp_mock_hosted_not_live',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:[{label:'Purchase information',reason:'Nordic Lounge Chair title, price and Add to Bag belong to the same product card.',elementIds:['hc1-title','hc1-price','hc1-cta'],evidenceIds:['hc1-title']}]})}]}]};
async function hosted(options:SemanticOptions,run:(url:string)=>Promise<void>,environment:NodeJS.ProcessEnv=env){
 const prior=process.env.NODE_ENV;process.env.NODE_ENV='production';
 const server=createServer(createVercelSemanticApp(options,environment));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{await run(`http://127.0.0.1:${(server.address() as any).port}`);}
 finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior;}
}
const post=(url:string,body:unknown=input,extra:Record<string,string>={})=>fetch(url+'/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'X-Forwarded-For':'203.0.113.20',...extra},body:typeof body==='string'?body:JSON.stringify(body)});

test('Production frontend provider reaches hosted handler using the same relative URL; no room server or browser key',async()=>{
 let calls=0;
 await hosted({enabled:true,key:'server-only-fixture',fetcher:async(url,init)=>{
  calls++;assert.equal(url,'https://api.openai.com/v1/responses');
  assert.equal((init!.headers as any).Authorization,'Bearer server-only-fixture');
  return Response.json(output);
 }},async url=>{
  const original=globalThis.fetch;
  try{
   globalThis.fetch=async(target,init)=>{
    assert.equal(target,'/api/semantic/interpret');
    assert.equal(new Headers(init?.headers).has('Authorization'),false);
    return original(new URL(String(target),url),{...init,headers:{...init!.headers,Origin:origin,'X-Forwarded-For':'203.0.113.20'}});
   };
   const candidates=await modelSemanticProvider.interpret({...input,elements:MOCK_NODES});
   assert.equal(candidates[0].source,'model');assert.ok(candidates[0].elementIds.includes('hc1-cta'));
  }finally{globalThis.fetch=original;}
  const repeat=await post(url),data=await repeat.json();
  assert.equal(repeat.status,200);assert.equal(data.cached,true);assert.equal(data.responseId,output.id);assert.equal(calls,1);
  assert.equal(repeat.headers.get('cache-control'),'private, no-store');
  assert.doesNotMatch(JSON.stringify(data),/server-only-fixture/);
  assert.equal((await fetch(url+'/api/rooms')).status,404);
 });
});
test('Hosted route accepts configured production, preview and custom origins; rejects cross-origin/host spoofing before OpenAI',async()=>{
 let calls=0;
 await hosted({enabled:true,key:'fixture',fetcher:async()=>{calls++;return Response.json(output);}},async url=>{
  for(const allowed of [origin,'https://preview.example','https://custom.example'])assert.equal((await post(url,input,{Origin:allowed})).status,200);
  for(const forbidden of ['https://evil.example','null',''])assert.equal((await post(url,input,{Origin:forbidden,Host:'evil.example','X-Forwarded-Host':'evil.example'})).status,403);
  assert.equal((await post(url,input,{'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal(calls,1);
 });
 await hosted({enabled:true,key:'fixture',fetcher:async()=>{throw new Error('Must not call');}},async url=>{assert.equal((await post(url)).status,403);},{VERCEL:'0'});
});
test('Hosted disabled AI, malformed requests and unavailable OpenAI retain deterministic fallback without leaking errors',async()=>{
 let calls=0;
 await hosted({enabled:false,key:'fixture',fetcher:async()=>{calls++;throw new Error('Must not call');}},async url=>{
  assert.equal((await post(url)).status,503);
  assert.equal((await fetch(url+'/api/semantic/interpret')).status,405);
  assert.equal((await post(url,input,{'Content-Type':'text/plain'})).status,415);
  assert.equal((await post(url,'{')).status,400);
  assert.equal((await post(url,{...input,contextId:'x'.repeat(600000)})).status,413);
 });assert.equal(calls,0);
 await hosted({enabled:true,key:'fixture',fetcher:async()=>{calls++;throw new Error('private upstream details');}},async url=>{
  const result=await post(url);assert.equal(result.status,504);const text=await result.text();
  assert.match(text,/Retry or select touched objects manually/);assert.doesNotMatch(text,/private upstream details/);
 });assert.equal(calls,1);
});
test('Hosted requests reuse candidate validation and timeouts',async()=>{
 await hosted({enabled:true,key:'fixture',fetcher:async()=>Response.json({...output,output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:[{label:'Invented',reason:'Unsupported',elementIds:['invented'],evidenceIds:['hc1-title']}]})}]}]})},async url=>{
  const response=await post(url);assert.equal(response.status,502);assert.match((await response.json()).error,/unsupported/);
 });
 await hosted({enabled:true,key:'fixture',timeoutMs:5,fetcher:async(_url,init)=>new Promise<Response>((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(new Error('deadline')),{once:true}))},async url=>{assert.equal((await post(url)).status,504);});
});
test('Vercel builds Vite assets plus a bounded Node function without a localhost rewrite',()=>{
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.framework,'vite');assert.equal(config.outputDirectory,'dist');
 assert.equal(config.functions['api/semantic/interpret.ts'].maxDuration,30);
 assert.doesNotMatch(JSON.stringify(config),/localhost|127\.0\.0\.1|OPENAI_API_KEY/);
});

test('Vercel pre-parsed bodies work without rereading a consumed request stream',async()=>{
 let calls=0;
 const app=createVercelSemanticApp({enabled:true,key:'fixture',fetcher:async()=>{calls++;return Response.json(output);}},env);
 const server=createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;
  // The platform already consumed the request before invoking the Express adapter.
  Object.defineProperty(req,'body',{get:()=>JSON.parse(text)});
  app(req,res);
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base=`http://127.0.0.1:${(server.address() as any).port}`;
  assert.equal((await post(base)).status,200);
  assert.equal((await post(base,{...input,contextId:'x'.repeat(600000)})).status,413);
  assert.equal((await post(base,'{')).status,400);
  assert.equal(calls,1);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('The unchanged local Node adapter still rejects production access without the hosted policy',async()=>{
 const prior=process.env.NODE_ENV;process.env.NODE_ENV='production';
 let calls=0;
 const app=express();app.use(express.json());app.post('/api/semantic/interpret',semanticHandler({enabled:true,key:'fixture',fetcher:async()=>{calls++;return Response.json(output);}}));
 const server=createServer(app);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const base=`http://127.0.0.1:${(server.address() as any).port}`;assert.equal((await post(base)).status,403);assert.equal(calls,0);}
 finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior;}
});
