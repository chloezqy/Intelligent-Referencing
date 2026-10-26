import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedReference} from './collaboration';
import {nextAttention} from './referenceAttention';
const reference:SharedReference={id:'r',sourceUser:'A',targetUser:'B',elementIds:['hc1-cta'],exemplarIds:['hc1-cta'],scope:'exemplars',label:'CTA',intent:'Review',message:'Review consistency',createdAt:'2026-10-24T10:00:00Z',status:'open',responses:[]};
test('Asynchronous shares stay quiet; view invitations point to the same reference',()=>{
 assert.equal(nextAttention([reference],'B',[]),undefined);
 assert.equal(nextAttention([{...reference,intent:'Look at this',attention:[]}],'B',[]),undefined);
 const invited={...reference,attention:[{id:'i',sourceUser:'A' as const,targetUser:'B' as const,createdAt:reference.createdAt}]};
 assert.equal(nextAttention([invited],'B',[])?.reference.id,'r');assert.equal(nextAttention([invited],'A',[]),undefined);assert.equal(nextAttention([invited],'B',['i']),undefined);
 assert.equal(nextAttention([{...invited,archivedAt:'now'}],'B',[]),undefined);
});
test('Repeated invitations have independent viewing receipts without duplicate conversations',()=>{
 const ref={...reference,status:'reviewed' as const,attention:[{id:'old',sourceUser:'A' as const,targetUser:'B' as const,createdAt:reference.createdAt,viewedAt:'now'},{id:'new',sourceUser:'A' as const,targetUser:'B' as const,createdAt:'2026-10-24T11:00:00Z'}]};
 assert.equal(nextAttention([ref],'B',[])?.key,'new');
 assert.equal(nextAttention([{...reference,intent:'Look at this'}],'B',[])?.key,'r');
});

test('Later suppresses current banners without changing unread/review state; a new invitation remains eligible',async()=>{
 const {dismissedReferenceKeys,parseNudgeDismissals,nudgeScope}=await import('./referenceAttention');
 const {needsReferenceNotification}=await import('./mentions');
 const {referenceLists}=await import('./collaboration');
 for(const simulated of [true,false]){
  const ref={...reference,simulated,notificationRecipients:[] as ('A'|'B')[],attention:[{id:'invite-1',sourceUser:'A' as const,targetUser:'B' as const,createdAt:reference.createdAt}]};
  const before=JSON.stringify(ref),scope=nudgeScope(simulated?'demo':'realtime','room','B');
  const saved=parseNudgeDismissals(JSON.stringify({[scope]:dismissedReferenceKeys(ref,'B')}));
  assert.equal(nextAttention([ref],'B',saved[scope]),undefined);
  assert.equal(needsReferenceNotification(ref,'B'),true);
  assert.equal(ref.status,'open');assert.equal(ref.reviewedAt,undefined);assert.equal(JSON.stringify(ref),before);
  assert.deepEqual(referenceLists([ref]).active,[ref]);
  const renewed={...ref,attention:[...ref.attention,{id:'invite-2',sourceUser:'A' as const,targetUser:'B' as const,createdAt:'2026-10-26T12:00:00Z'}]};
  assert.equal(nextAttention([renewed],'B',saved[scope])?.key,'invite-2');
  const viewed={...renewed,activity:[{id:'open',userId:'B' as const,kind:'opened' as const,elementIds:[],at:'now'}],attention:renewed.attention.map(i=>({...i,viewedAt:'now'}))};
  assert.equal(needsReferenceNotification(viewed,'B'),false);assert.equal(viewed.status,'open');assert.equal(viewed.reviewedAt,undefined);
 }
});
test('Dismissal storage is isolated by room, participant and mode and rejects malformed state',async()=>{
 const {parseNudgeDismissals,nudgeScope}=await import('./referenceAttention');
 assert.notEqual(nudgeScope('demo','demo','A'),nudgeScope('demo','demo','B'));
 assert.notEqual(nudgeScope('realtime','one','A'),nudgeScope('realtime','two','A'));
 assert.notEqual(nudgeScope('demo','one','A'),nudgeScope('realtime','one','A'));
 assert.deepEqual(parseNudgeDismissals('{bad'),{});assert.deepEqual(parseNudgeDismissals('[]'),{});
 assert.deepEqual(parseNudgeDismissals('{"good":["invite"],"bad":[2]}'),{good:['invite']});
});
test('New view invitations on previously opened/reviewed references appear unread and recoverable without changing review evidence',async()=>{
 const {needsReferenceNotification}=await import('./mentions');
 const {referenceLists}=await import('./collaboration');
 const {referenceRequestSender}=await import('./referenceAttention');
 const ref={...reference,status:'reviewed' as const,reviewedAt:'earlier',activity:[{id:'opened',userId:'A' as const,kind:'opened' as const,elementIds:[],at:'earlier'}],attention:[{id:'new',sourceUser:'B' as const,targetUser:'A' as const,createdAt:'now'}]};
 assert.equal(needsReferenceNotification(ref,'A'),true);assert.equal(referenceRequestSender(ref,'A'),'B');
 assert.equal(referenceLists([ref],r=>needsReferenceNotification(r,'A')).active.length,1);
 const seen={...ref,attention:ref.attention.map(i=>({...i,viewedAt:'now'}))};
 assert.equal(needsReferenceNotification(seen,'A'),false);
 assert.equal(referenceLists([seen],r=>needsReferenceNotification(r,'A')).archived.length,1);
 assert.equal(seen.reviewedAt,'earlier');
});
test('Opening an older Look at this reference silences its banner without requiring review',()=>{
 const ref={...reference,intent:'Look at this' as const,activity:[{id:'open',userId:'B' as const,kind:'opened' as const,elementIds:[],at:'now'}]};
 assert.equal(nextAttention([ref],'B',[]),undefined);assert.equal(ref.status,'open');
});
