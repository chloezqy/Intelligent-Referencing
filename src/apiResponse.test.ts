import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiResponseError, readApiJson, requireEventStream, parseRoomEvent } from './apiResponse';
const endpoint='/api/rooms/example/events';
test('Plain-text and HTML error pages expose status, content type and endpoint without JSON parsing',async()=>{
  for(const [status,type,body] of [[404,'text/plain','The page could not be found'],[502,'text/html','<html>Bad gateway</html>'],[200,'text/html','<html>Frontend fallback</html>']] as const){
    await assert.rejects(readApiJson(new Response(body,{status,headers:{'Content-Type':type}}),endpoint),(error:any)=>{
      assert.ok(error instanceof ApiResponseError);assert.equal(error.status,status);assert.equal(error.contentType,type);assert.ok(error.message.includes(endpoint));assert.ok(!error.message.includes('Unexpected token'));return true;
    });
  }
});
test('Structured API failures preserve useful server messages and status',async()=>{
  await assert.rejects(readApiJson(new Response(JSON.stringify({error:'Room not found.'}),{status:404,headers:{'Content-Type':'application/json; charset=utf-8'}}),endpoint),/Room not found.*HTTP 404/);
});
test('Malformed JSON and wrong payload shapes are rejected before consuming API state',async()=>{
  for(const body of ['The page could not be found','{"ok":','null','[]','"hello"'])await assert.rejects(readApiJson(new Response(body,{headers:{'Content-Type':'application/json'}}),endpoint),ApiResponseError);
  assert.deepEqual(await readApiJson(new Response('{"ok":true}',{headers:{'Content-Type':'application/json'}}),endpoint),{ok:true});
});
test('Realtime accepts only an actual event stream and validates error responses',async()=>{
  await requireEventStream(new Response('data: {}\n\n',{headers:{'Content-Type':'text/event-stream; charset=utf-8'}}),endpoint);
  await assert.rejects(requireEventStream(new Response('The page could not be found',{status:404,headers:{'Content-Type':'text/plain'}}),endpoint),/HTTP 404.*text\/plain/);
  await assert.rejects(requireEventStream(new Response('<html>SPA</html>',{headers:{'Content-Type':'text/html'}}),endpoint),/not a realtime event stream/);
  await assert.rejects(requireEventStream(new Response('{"error":"Invalid identity"}',{status:401,headers:{'Content-Type':'application/json'}}),endpoint),/Invalid identity/);
});
test('Malformed stream events cannot replace valid room state',()=>{
  assert.throws(()=>parseRoomEvent('The page could not be found',endpoint),/Invalid JSON/);
  assert.throws(()=>parseRoomEvent('{"message":"wrong service"}',endpoint),/Invalid room snapshot/);
  assert.equal(parseRoomEvent('{"code":"room","documentId":"doc","revision":1,"members":[],"references":[]}',endpoint).code,'room');
});
