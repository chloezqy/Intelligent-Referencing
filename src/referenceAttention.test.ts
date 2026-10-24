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
