import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modelSemanticProvider} from './modelSemanticProvider';
import {MOCK_NODES} from './data';
const request={contextId:'frozen-context',selectedIds:['hc1-title'],exemplarIds:['hc1-title'],scope:'document' as const,elements:MOCK_NODES};
test('Browser transport sends only identifiers, rejects stale/malformed responses and preserves the selection',async()=>{
 const original=globalThis.fetch,initial=JSON.stringify(request);try{
 globalThis.fetch=async(url,init)=>{assert.equal(url,'/api/semantic/interpret');const body=JSON.parse(String(init!.body));assert.equal(body.elements,undefined);assert.equal((init!.headers as any).Authorization,undefined);return Response.json({contextId:'wrong-context',candidates:[]});};
 await assert.rejects(()=>modelSemanticProvider.interpret(request),/Unsupported/);
 globalThis.fetch=async()=>new Response('<html>missing backend</html>',{headers:{'Content-Type':'text/html'}});await assert.rejects(()=>modelSemanticProvider.interpret(request),/Node server/);
 globalThis.fetch=async()=>Response.json({contextId:request.contextId,candidates:[{id:'bad',label:'bad',level:'semantic',source:'model',reason:'bad',elementIds:['invented'],evidenceIds:['hc1-title']}]});await assert.rejects(()=>modelSemanticProvider.interpret(request),/Unsupported/);
 assert.equal(JSON.stringify(request),initial);
 }finally{globalThis.fetch=original;}
});
