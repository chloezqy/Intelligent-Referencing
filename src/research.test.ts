import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TASKS, evaluateAttempt, ResearchAttempt, TaskLevel } from './research';
import { SharedReference } from './collaboration';
const attempt=(level:TaskLevel):ResearchAttempt=>({id:'attempt',level,startedAt:'2026-10-21',events:[]});
const select=(a:ResearchAttempt,ids:string[])=>a.events.push({id:String(a.events.length),type:'selection',at:'now',ids,method:'conventional'});
for(const level of [1,2] as const)test(`Level ${level}: exact targets required, missing/extra selections rejected`,()=>{
  const a=attempt(level),targets=TASKS[level-1].targets;assert.equal(targets.length,15);assert.equal(evaluateAttempt(a,[]).complete,false);
  select(a,targets.slice(1));assert.equal(evaluateAttempt(a,[]).complete,false);
  select(a,[...targets,'home-chip-0']);assert.equal(evaluateAttempt(a,[]).complete,false);
  select(a,targets);assert.equal(evaluateAttempt(a,[]).complete,true);
});
test('Product prices exclude aggregate checkout/cart totals',()=>{assert.ok(!TASKS[0].targets.includes('cart-total-price'));assert.ok(!TASKS[0].targets.includes('chk-final-price'));assert.ok(TASKS[0].targets.includes('detail-price'));});
test('Level 3 requires gesture, correction and reviewed exact targets',()=>{
  const a=attempt(3);select(a,TASKS[2].targets);assert.equal(evaluateAttempt(a,[]).complete,false);
  for(const type of ['gesture_attempt','gesture_interpreted','interpretation_correction'])a.events.push({id:type,type,at:'now',ids:TASKS[2].targets});
  select(a,TASKS[2].targets);a.events.push({id:'review',type:'interpretation_review',at:'now',ids:TASKS[2].targets});
  assert.equal(evaluateAttempt(a,[]).complete,true);select(a,[...TASKS[2].targets,'search-filter-0']);assert.equal(evaluateAttempt(a,[]).complete,false);
});
const reference=(level:4|5):SharedReference=>({id:'ref',sourceUser:'A',targetUser:'B',elementIds:level===5?TASKS[4].targets:['home-chip-0','home-chip-1'],exemplarIds:[],scope:'document',label:'Related elements',intent:level===5?'Compare':'Review',message:'Check design consistency',createdAt:'now',status:'open',responses:[],research:{level,attemptId:'attempt'}});
for(const level of [4,5] as const)test(`Level ${level}: sharing alone, sender actions and partial navigation cannot complete a task`,()=>{
  const a=attempt(level),ref=reference(level);assert.equal(evaluateAttempt(a,[ref]).complete,false);
  ref.activity=[{id:'1',userId:'A',kind:'opened',elementIds:[],at:'now'},{id:'2',userId:'A',kind:'located',elementIds:ref.elementIds,at:'now'}];ref.responses.push({id:'3',userId:'A',message:'Own reply',createdAt:'now'});assert.equal(evaluateAttempt(a,[ref]).complete,false);
  ref.activity.push({id:'4',userId:'B',kind:'opened',elementIds:[],at:'now'},{id:'5',userId:'B',kind:'located',elementIds:[ref.elementIds[0]],at:'now'});ref.responses.push({id:'6',userId:'B',message:'Comparison reviewed',createdAt:'now'});assert.equal(evaluateAttempt(a,[ref]).complete,false);
  ref.activity.push({id:'7',userId:'B',kind:'located',elementIds:ref.elementIds.slice(1),at:'now'});assert.equal(evaluateAttempt(a,[ref]).complete,true);
  ref.research!.attemptId='old-attempt';assert.equal(evaluateAttempt(a,[ref]).complete,false);
});
test('Comparison requires specified targets; no mixing evidence across separate references',()=>{
  const a=attempt(5),first=reference(5),second=reference(5);second.id='other';
  first.activity=[{id:'a',kind:'opened',userId:'B',elementIds:[],at:'now'}];second.activity=[{id:'b',kind:'located',userId:'B',elementIds:second.elementIds,at:'now'}];second.status='reviewed';
  assert.equal(evaluateAttempt(a,[first,second]).complete,false);
  second.activity.push(...first.activity);second.elementIds=['home-chip-0','search-filter-0'];assert.equal(evaluateAttempt(a,[second]).complete,false);
  second.elementIds=TASKS[4].targets;assert.equal(evaluateAttempt(a,[second]).complete,true);
});

test('A fresh gesture or changed selection invalidates an earlier Level 3 review',()=>{const a=attempt(3);a.events.push({id:'g',type:'gesture_attempt',at:'now'},{id:'i',type:'gesture_interpreted',at:'now'},{id:'c',type:'interpretation_correction',at:'now'});select(a,TASKS[2].targets);a.events.push({id:'r',type:'interpretation_review',at:'now',ids:TASKS[2].targets});assert.equal(evaluateAttempt(a,[]).complete,true);a.events.push({id:'g2',type:'gesture_attempt',at:'now'});select(a,TASKS[2].targets);assert.equal(evaluateAttempt(a,[]).complete,false);});

test('An uninterpretable stroke plus manual corrections cannot pass Level 3',()=>{
  const a=attempt(3);a.events.push({id:'g',type:'gesture_attempt',at:'now'});select(a,TASKS[2].targets);a.events.push({id:'c',type:'interpretation_correction',at:'now'},{id:'r',type:'interpretation_review',at:'now',ids:TASKS[2].targets});assert.equal(evaluateAttempt(a,[]).complete,false);
});
