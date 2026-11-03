import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestOpenAI,retryAfterMs,AIServiceError} from './openaiTransport';
test('429 and 5xx retry at most three attempts, respecting Retry-After and backoff',async()=>{
 for(const status of [429,500,503]){
 let calls=0;const waits:number[]=[];
 const value=await requestOpenAI({},'fixture-key',{random:()=>0,sleep:async ms=>{waits.push(ms);},fetcher:async()=>{
 calls++;return calls<3?Response.json({error:{code:'rate_limit_exceeded'}},{status,headers:calls===1?{'Retry-After':'2'}:{}}):Response.json({id:'real-format-mock'});
 }});
 assert.equal(value.id,'real-format-mock');assert.equal(calls,3);assert.deepEqual(waits,[2000,1000]);
 }
 let calls=0;await assert.rejects(requestOpenAI({},'fixture',{sleep:async()=>{},fetcher:async()=>{calls++;return new Response('',{status:500});}}),(error:AIServiceError)=>error.code==='upstream_error');assert.equal(calls,3);
 assert.equal(retryAfterMs('Thu, 01 Jan 1970 00:00:05 GMT',1000),4000);assert.equal(retryAfterMs('bad'),undefined);
});
test('quota and invalid keys never retry, and raw provider details are not returned',async()=>{
 for(const [status,code,type] of [[429,'insufficient_quota','insufficient_quota'],[429,'credit_balance_exhausted','insufficient_quota'],[401,'invalid_api_key','invalid_request_error'],[429,'project_spend_limit_exceeded','invalid_request_error']] as const){
 let calls=0;await assert.rejects(requestOpenAI({},'secret-fixture',{sleep:async()=>{throw Error('Must not retry');},fetcher:async()=>{calls++;return Response.json({error:{code,type,message:'secret-fixture confidential account'}},{status});}}),(error:AIServiceError)=>{assert.equal(error.retryable,false);assert.doesNotMatch(error.message,/secret-fixture|confidential/);return true;});assert.equal(calls,1);
 }
});
test('long Retry-After returns a safe wait signal instead of retrying early or exceeding deadline',async()=>{
 let calls=0;await assert.rejects(requestOpenAI({},'fixture',{timeoutMs:100,sleep:async()=>{throw Error('Cannot wait beyond deadline');},fetcher:async()=>{calls++;return Response.json({error:{code:'rate_limit_exceeded'}},{status:429,headers:{'Retry-After':'60'}});}}),(e:AIServiceError)=>e.code==='rate_limit'&&e.retryAfter===60);assert.equal(calls,1);
});
test('timeouts and malformed responses fail safely',async()=>{
 await assert.rejects(requestOpenAI({},'secret-fixture',{timeoutMs:5,fetcher:async(_u,init)=>new Promise<Response>((_r,reject)=>init!.signal!.addEventListener('abort',()=>reject(Error('secret-fixture')),{once:true}))}),(e:AIServiceError)=>e.code==='timeout'&&!e.message.includes('secret-fixture'));
 await assert.rejects(requestOpenAI({},'fixture',{fetcher:async()=>new Response('not json')}),(e:AIServiceError)=>e.code==='invalid_response');
});
