import {MOCK_NODES} from '../src/data';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {designChangesRequest,designChangesPayload,parseDesignChanges} from './designChanges';
import {RoomStore} from './store';
import {demoComparison} from '../src/demoCollaboration';
import {DESIGN_REFERENCE_PURPOSE,validateDesignReference} from '../src/collaboration';
const body={contextId:'test',referenceIds:['hc1'],targetIds:['sc1'],properties:['typography','colors']};
const output=(factIds:string[])=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestions:[{title:'Match typography',explanation:'Use the recorded reference style on the related target.',factIds}]})}]}]});
test('Design change payload uses authoritative bounded metadata, strict schema and selected facts; parser rejects inventions',()=>{
 const ctx=designChangesRequest({...body,elements:[{id:'invented'}]});const payload=designChangesPayload(ctx,'gpt-4.1-mini');
 assert.equal(payload.store,false);assert.equal(payload.text.format.strict,true);assert.doesNotMatch(payload.input,/invented/);assert.match(payload.instructions,/padding\/spacing/);
 const changes=parseDesignChanges(output([ctx.facts[0].id]),ctx);assert.equal(changes[0].source,'model');assert.equal(changes[0].facts[0].referenceValue,ctx.facts[0].referenceValue);
 assert.throws(()=>parseDesignChanges(output(['invented']),ctx));assert.throws(()=>parseDesignChanges({...output([]),status:'incomplete'},ctx));assert.throws(()=>parseDesignChanges(output([]),ctx));assert.throws(()=>designChangesRequest({...body,properties:['padding']}));
});
test('Realtime persisted proposal decisions survive restart, preserve reference status, and reject sender decisions',()=>{
 const directory=mkdtempSync(join(tmpdir(),'design-changes-'));try{
 const file=join(directory,'rooms.json'),store=new RoomStore(file),a=store.create();store.join(a.code,'b'.repeat(48));
 const selection=(userId:'A'|'B',id:string)=>({userId,elementIds:[id],exemplarIds:[id],scope:'exemplars' as const,method:'conventional' as const,revision:1});
 const comparison={...demoComparison(selection('A','hc1'),selection('B','sc1'),'frozen'),purpose:DESIGN_REFERENCE_PURPOSE};
 const ctx=designChangesRequest(body),changes=parseDesignChanges(output([ctx.facts[0].id]),ctx);
 comparison.designReference=validateDesignReference(comparison.purpose,{direction:{referenceUser:'A',targetUser:'B'},properties:body.properties,proposedChanges:changes},comparison.selections);
 const id=randomUUID();store.share(a.code,'A',{requestId:id,elementIds:['hc1','sc1'],exemplarIds:['hc1'],scope:'document',label:'Test',intent:'Compare',message:''},comparison);
 assert.throws(()=>store.decideChange(a.code,'A',id,changes[0].id,'accepted'));
 store.decideChange(a.code,'B',id,changes[0].id,'accepted');
 const saved=new RoomStore(file).snapshot(a.code,()=>false).references[0];assert.equal(saved.status,'open');assert.equal(saved.comparison!.designReference!.proposedChanges![0].status,'accepted');
 store.decideChange(a.code,'B',id,changes[0].id,'dismissed');assert.equal(store.snapshot(a.code,()=>false).references[0].comparison!.designReference!.proposedChanges![0].status,'dismissed');
 }finally{rmSync(directory,{recursive:true,force:true});}
});
test('Authenticated realtime HTTP clients share selected proposals and receive independent decisions',async()=>{
 const {createServer}=await import('node:http');const {collaborationServer}=await import('./app');
 const directory=mkdtempSync(join(tmpdir(),'design-change-http-')),server=createServer(collaborationServer(new RoomStore(join(directory,'rooms.json'))));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 const api=async(path:string,body?:unknown,session?:any)=>{const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,body:await response.json()};};
 const streams:AbortController[]=[];
 try{
  const a=(await api('/rooms',{})).body,b=(await api(`/rooms/${a.code}/join`,{token:'b'.repeat(48)})).body;
  for(const session of [a,b]){const abort=new AbortController();streams.push(abort);await fetch(`${base}/rooms/${a.code}/events`,{headers:{Authorization:`Bearer ${session.token}`},signal:abort.signal});}
  const select=(id:string)=>({elementIds:[id],exemplarIds:[id],scope:'exemplars',method:'conventional'});
  await api(`/rooms/${a.code}/selection`,select('hc1'),a);await api(`/rooms/${a.code}/selection`,select('sc1'),b);
  const frozen=(await api(`/rooms/${a.code}/comparison-drafts`,{revisions:{A:1,B:2}},a)).body;
  const ctx=designChangesRequest(body),proposals=parseDesignChanges(output([ctx.facts[0].id]),ctx),id=randomUUID();
  const payload={requestId:id,elementIds:['hc1','sc1'],exemplarIds:['hc1'],scope:'document',label:'Design reference',intent:'Compare',message:'Discuss these changes',comparison:{...frozen,purpose:DESIGN_REFERENCE_PURPOSE,designReference:{direction:{referenceUser:'A',targetUser:'B'},properties:body.properties,proposedChanges:proposals}}};
  assert.equal((await api(`/rooms/${a.code}/references`,payload,a)).status,201);
  const path=`/rooms/${a.code}/references/${id}/changes/${proposals[0].id}`;
  assert.equal((await api(path,{status:'accepted'})).status,401);
  assert.equal((await api(path,{status:'accepted'},a)).status,400);
  assert.equal((await api(path,{status:'accepted'},b)).status,200);
  const ref=(await api(`/rooms/${a.code}`,undefined,a)).body.references.find((r:any)=>r.id===id);
  assert.equal(ref.comparison.designReference.proposedChanges[0].status,'accepted');assert.equal(ref.status,'open');assert.deepEqual(ref.elementIds,['hc1','sc1']);
  assert.equal((await api(`/rooms/${a.code}/references/${id}/responses`,{message:'I will discuss this change',requestId:randomUUID()},b)).status,200);
  assert.equal((await api(path,{status:'dismissed'},b)).status,200);
  assert.equal((await api(`/rooms/${a.code}/references/${id}/review`,{},b)).status,200);
 }finally{streams.forEach(controller=>controller.abort());server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(directory,{recursive:true,force:true});}
});
test('Design-change evidence uses validated current document styles instead of stale authored defaults',()=>{
 const document=MOCK_NODES.map(n=>n.id==='hc1-title'?{...n,fontSize:17}:n);
 const ctx=designChangesRequest({contextId:'edited',referenceIds:['hc1-title'],targetIds:['detail-title'],properties:['typography'],document});
 assert.ok(ctx.facts.some(f=>f.property==='Font size'&&f.referenceValue==='17 px'));
 assert.throws(()=>designChangesRequest({contextId:'bad',referenceIds:['hc1-title'],targetIds:['detail-title'],properties:['typography'],document:[{id:'invented'}]}));
});
