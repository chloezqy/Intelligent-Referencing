import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shareNoteRequest,shareNotePayload,parseShareNote} from './shareNote';
import {MOCK_NODES} from '../src/data';
const context=shareNoteRequest({contextId:'note',elementIds:['hc1-img'],note:'look at this',request:'Review',document:MOCK_NODES});
const value={kind:'rewrite',text:'Review this image and share your feedback.',referencedIds:['hc1-img'],relatedIds:[],properties:[]};
const response=(v:any)=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(v)}]}]});
test('Sender clarification shares the existing semantic evidence and validates real object context',()=>{
 const payload=shareNotePayload(context,'model');assert.equal(payload.store,false);assert.match(payload.instructions,/SENDER/);assert.equal(JSON.parse(payload.input).vague,true);
 assert.equal(parseShareNote(response(value),context).source,'model');assert.throws(()=>parseShareNote(response({...value,kind:'clarification'}),context),/Invalid/);
 assert.throws(()=>shareNoteRequest({contextId:'note',elementIds:['invented'],note:'hello',request:'Review',document:MOCK_NODES}));
});

test('Existing semantic endpoint clarifies before sharing; recipient receives only approved note and can reply/review',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{randomUUID}=await import('node:crypto');
 const {createServer}=await import('node:http'),{default:express}=await import('express'),{RoomStore}=await import('./store'),{collaborationServer}=await import('./app'),{semanticHandler}=await import('./semantic');
 const dir=mkdtempSync(join(tmpdir(),'share-note-')),app=express();app.use(express.json());let calls=0;
 app.post('/api/semantic/interpret',semanticHandler({enabled:true,key:'fixture-only',fetcher:async()=>{calls++;return new Response(JSON.stringify(response(value)),{status:200});}}));
 app.use(collaborationServer(new RoomStore(join(dir,'rooms.json'))));const server=createServer(app);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const api=async(path:string,body?:any,token?:string)=>{const r=await fetch(`http://127.0.0.1:${(server.address() as any).port}/api${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 try{
 const a=(await api('/rooms',{})).body,b=(await api(`/rooms/${a.code}/join`,{token:'b'.repeat(48)})).body;
 const analysis=await api('/semantic/interpret',{task:'share-note',contextId:'sender',elementIds:['hc1-img'],note:'look at this',request:'Review',document:MOCK_NODES});
 assert.equal(analysis.status,200);assert.equal(analysis.body.interpretation.kind,'rewrite');assert.equal(analysis.body.interpretation.source,'model');assert.equal(calls,1);
 const id=randomUUID(),draft={requestId:id,elementIds:['hc1-img'],exemplarIds:['hc1-img'],scope:'exemplars',label:'Image',intent:'Review',message:'look at this',recipientIds:['B'],inviteNow:true};
 assert.equal((await api(`/rooms/${a.code}/references`,draft,a.token)).status,201);
 const ref=(await api(`/rooms/${a.code}`,undefined,b.token)).body.references[0];assert.equal(ref.message,'look at this');assert.deepEqual(ref.notificationRecipients,['B']);assert.ok(!ref.message.includes(value.text));
 assert.equal((await api(`/rooms/${a.code}/references`,{...draft,requestId:randomUUID(),recipientIds:['A']},a.token)).status,400);
 assert.equal((await api(`/rooms/${a.code}/references/${id}/responses`,{requestId:randomUUID(),message:'Reviewed the image.'},b.token)).status,200);
 assert.equal((await api(`/rooms/${a.code}/references/${id}/review`,{},b.token)).status,200);
 const updated=(await api(`/rooms/${a.code}`,undefined,a.token)).body.references[0];assert.equal(updated.status,'reviewed');assert.equal(updated.responses[0].message,'Reviewed the image.');
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));rmSync(dir,{recursive:true,force:true});}
});
