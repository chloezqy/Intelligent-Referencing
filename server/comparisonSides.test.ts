import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {collaborationServer} from './app';
import {RoomStore} from './store';
import {sideDirection,referenceSides} from '../src/comparisonSides';
import {designChangeContext} from '../src/designChanges';
import {MOCK_NODES} from '../src/data';

test('Local realtime comparison opens without peer presence; sharing preserves frozen sides, swap and proposals without self invitations',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'local-comparison-')),file=join(dir,'rooms.json'),server=createServer(collaborationServer(new RoomStore(file)));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 const api=async(path:string,body?:unknown,session?:any)=>{const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 try{
  const a=(await api('/rooms',{})).body;
  const response=await api(`/rooms/${a.code}/comparison-drafts`,{localIds:['hc1-title','detail-title']},a);assert.equal(response.status,201);
  const context=response.body;assert.deepEqual(context.sides.A,{elementIds:['hc1-title'],selectedBy:'A'});assert.deepEqual(context.sides.B,{elementIds:['detail-title'],selectedBy:'A'});assert.deepEqual(context.selections.B.elementIds,[]);
  assert.equal((await api(`/rooms/${a.code}/comparison-drafts`,{localIds:['hc1-title','invented']},a)).status,400);
  const b=(await api(`/rooms/${a.code}/join`,{token:'b'.repeat(48)})).body;
  context.purpose='Use as a design reference';context.designReference={direction:sideDirection(context,'B'),properties:['typography']};
  const sides=referenceSides(context),fact=designChangeContext(sides.reference.elementIds,sides.target.elementIds,['typography'],MOCK_NODES).facts[0];
  context.designReference.proposedChanges=[{id:'change-0',title:'Match typography',explanation:'Use reference title styling.',source:'model',status:'pending',facts:[fact]}];
  const id=randomUUID(),payload={requestId:id,comparison:context,elementIds:['hc1-title','detail-title'],exemplarIds:['hc1-title'],scope:'document',intent:'Compare',label:'Local comparison',message:'@User A note to self',inviteNow:true};
  assert.equal((await api(`/rooms/${a.code}/references`,payload,a)).status,201);
  const ref=(await api(`/rooms/${a.code}`,undefined,b)).body.references[0];
  assert.deepEqual(ref.comparison.sides,context.sides);assert.deepEqual(ref.comparison.designReference,context.designReference);assert.deepEqual(ref.notificationRecipients,[]);assert.equal(ref.attention[0].targetUser,'B');
  assert.equal((await api(`/rooms/${a.code}/references/${id}/changes/change-0`,{status:'accepted'},b)).status,200);
  const saved=new RoomStore(file).snapshot(a.code,()=>false).references[0];assert.equal(saved.comparison!.designReference!.proposedChanges![0].status,'accepted');assert.equal(saved.status,'open');
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});}
});

test('Saved collaborator reference can be compared and shared while both participants are offline',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'reference-comparison-')),server=createServer(collaborationServer(new RoomStore(join(dir,'rooms.json'))));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 const api=async(path:string,body:unknown,session?:any)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 try{
  const a=(await api('/rooms',{})).body,b=(await api(`/rooms/${a.code}/join`,{token:'c'.repeat(48)})).body,id=randomUUID();
  assert.equal((await api(`/rooms/${a.code}/references`,{requestId:id,elementIds:['hc1-title','detail-title'],exemplarIds:['hc1-title'],scope:'document',intent:'Review',label:'Saved peer selection',message:'',inviteNow:false},b)).status,201);
  const draft=await api(`/rooms/${a.code}/comparison-drafts`,{localIds:['sc2'],referenceId:id},a);assert.equal(draft.status,201);
  assert.deepEqual(draft.body.sides,{A:{elementIds:['sc2'],selectedBy:'A'},B:{elementIds:['hc1-title','detail-title'],selectedBy:'B'}});
  assert.equal((await api(`/rooms/${a.code}/comparison-drafts`,{localIds:['sc2'],referenceId:id},b)).status,400);
  assert.equal((await api(`/rooms/${a.code}/comparison-drafts`,{localIds:['sc2'],referenceId:'missing'},a)).status,400);
  assert.equal((await api(`/rooms/${a.code}/references`,{requestId:randomUUID(),comparison:draft.body,elementIds:['sc2','hc1-title','detail-title'],exemplarIds:['sc2'],scope:'document',intent:'Compare',label:'Compare saved reference',message:'',inviteNow:false},a)).status,201);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});}
});
