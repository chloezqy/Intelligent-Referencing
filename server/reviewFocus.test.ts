import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewFocusRequest,reviewFocusPayload,parseReviewFocus} from './reviewFocus';
import {MOCK_NODES} from '../src/data';
import {validateReviewFocus,reviewValue} from '../src/reviewFocus';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {ReviewFocusContent} from '../src/components/ReviewFocus';
const image=MOCK_NODES.find(n=>n.role==='productImage'&&!n.library&&n.label.includes('Minimalist'))!;
const related=MOCK_NODES.find(n=>n.role==='productImage'&&!n.library&&n.id!==image.id)!;
const body={contextId:'review-test',elementIds:[image.id],note:'review the shape'};
const result=(suggestion:any)=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({suggestion})}]}]});
const suggestion={focus:'Corner radii may be useful to review in these related images.',referencedId:image.id,relatedId:related.id,property:'radius'};
test('review focus includes sender note, actual metadata and validated model-only selection',()=>{
 const ctx=reviewFocusRequest(body),payload=reviewFocusPayload(ctx,'test-model');
 assert.match(payload.input,/review the shape/);assert.ok(payload.input.includes(image.id));assert.equal(payload.store,false);
 const focus=parseReviewFocus(result(suggestion),ctx)!;assert.equal(focus.source,'model');
 assert.equal(reviewValue(image,'radius'),image.radius+' px');
 for(const invalid of [{...suggestion,relatedId:'invented'},{...suggestion,property:'imagined'},{...suggestion,value:'12px'},{...suggestion,relatedId:MOCK_NODES.find(n=>n.type==='button')!.id}]){
 assert.throws(()=>parseReviewFocus(result(invalid),ctx));
 }
 assert.throws(()=>parseReviewFocus({status:'incomplete'},ctx));
 assert.equal(parseReviewFocus(result(null),ctx),null);
});
test('specific note and no-related review stay grounded without invented comparisons',()=>{
 const ctx=reviewFocusRequest({...body,note:'Check the corner radius against the other product images'});
 assert.match(reviewFocusPayload(ctx,'test-model').input,/Check the corner radius/);
 const focus=validateReviewFocus({...suggestion,relatedId:null},[image.id],[image])!;
 const html=renderToStaticMarkup(React.createElement(ReviewFocusContent,{focus,nodes:[image]}));
 assert.match(html,/Possible review focus/);assert.doesNotMatch(html,/Related element/);
});
test('visual suggestion uses real previews and current recorded values without editing controls',()=>{
 const focus=validateReviewFocus(suggestion,[image.id],MOCK_NODES)!;
 const html=renderToStaticMarkup(React.createElement(ReviewFocusContent,{focus,nodes:MOCK_NODES,onInspect:()=>{throw Error('Requires explicit action');}}));
 assert.equal((html.match(/class="element-preview"/g)||[]).length,2);
 assert.ok(html.includes(image.radius+' px'));assert.ok(html.includes(related.radius+' px'));
 assert.doesNotMatch(html,/Values from canvas/);assert.match(html,/AI suggestion/);assert.match(html,/Inspect on canvas/);assert.doesNotMatch(html,/Apply changes|Mark reviewed/);
});
test('two authenticated users retain review, reply and status updates with contextual AI and when AI is unavailable',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{randomUUID}=await import('node:crypto');
 const {createServer}=await import('node:http'),{default:express}=await import('express'),{RoomStore}=await import('./store'),{collaborationServer}=await import('./app'),{semanticHandler}=await import('./semantic');
 const dir=mkdtempSync(join(tmpdir(),'review-flow-')),app=express();app.use(express.json());
 let enabled=true;
 app.post('/api/semantic/interpret',(req,res,next)=>{if(!enabled){res.status(503).json({error:'AI unavailable'});return;}return semanticHandler({enabled:true,key:'fixture-only',fetcher:async(_url,init)=>{
 const payload=JSON.parse(String(init?.body));assert.match(payload.input,/review the shape/);
 return new Response(JSON.stringify(result(suggestion)),{status:200});
 }})(req,res,next);});
 app.use(collaborationServer(new RoomStore(join(dir,'rooms.json'))));const server=createServer(app);
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 const api=async(path:string,body?:any,user?:any)=>{const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(user?{Authorization:`Bearer ${user.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 try{
 const a=(await api('/rooms',{})).body,b=(await api(`/rooms/${a.code}/join`,{token:'b'.repeat(48)})).body,id=randomUUID();
 assert.equal((await api(`/rooms/${a.code}/references`,{requestId:id,elementIds:[image.id],exemplarIds:[image.id],scope:'exemplars',intent:'Review',label:image.label,message:'review the shape'},a)).status,201);
 const ref=(await api(`/rooms/${a.code}`,undefined,b)).body.references[0];assert.equal(ref.message,'review the shape');
 const analysis=await api('/semantic/interpret',{...body,task:'review-focus',elementIds:ref.elementIds,note:ref.message});assert.equal(analysis.status,200);assert.equal(analysis.body.suggestion.source,'model');assert.equal(analysis.body.suggestion.relatedId,related.id);
 // Inspect/Compare remains an explicit action using the existing local comparison endpoint.
 const comparison=await api(`/rooms/${a.code}/comparison-drafts`,{localIds:[image.id,related.id]},b);assert.equal(comparison.status,201);
 assert.equal((await api(`/rooms/${a.code}/references/${id}/responses`,{requestId:randomUUID(),message:'The shape looks intentional.'},b)).status,200);
 assert.equal((await api(`/rooms/${a.code}`,undefined,a)).body.references[0].responses[0].message,'The shape looks intentional.');
 enabled=false;assert.equal((await api('/semantic/interpret',body)).status,503);
 assert.equal((await api(`/rooms/${a.code}/references/${id}/review`,{},b)).status,200);
 assert.equal((await api(`/rooms/${a.code}`,undefined,a)).body.references[0].status,'reviewed');
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));rmSync(dir,{recursive:true,force:true});}
});
