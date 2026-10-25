import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collaborationMode} from './collaborationClient';
import {freshDemo,demoPeer,demoShare,simulateRecipient,demoComparison} from './demoCollaboration';
import {evaluateAttempt,TASKS,ResearchAttempt} from './research';
const draft={elementIds:['hc1-cta','sc1-cta'],exemplarIds:['hc1-cta','sc1-cta'],scope:'document' as const,label:'Two purchase actions'};
test('Demo is default; explicit real mode and existing room links preserve real collaboration',()=>{
 assert.equal(collaborationMode(''),'demo');assert.equal(collaborationMode('?mode=realtime'),'realtime');assert.equal(collaborationMode('?room=abc'),'realtime');assert.equal(collaborationMode('?room=abc&mode=demo'),'demo');
});
test('Local shares freeze targets, deduplicate retries and keep notifications and attention separate',()=>{
 const source=structuredClone(draft);const room=demoShare(freshDemo(),source,'Compare','@User B compare these','request',false);
 source.elementIds.length=0;assert.equal(room.references[0].elementIds.length,2);assert.deepEqual(room.references[0].notificationRecipients,['B']);assert.deepEqual(room.references[0].attention,[]);
 assert.equal(demoShare(room,draft,'Compare','retry','request'),room);
 assert.equal(demoShare(freshDemo(),draft,'Review','','invite',true).references[0].attention?.length,1);
 assert.throws(()=>demoShare(freshDemo(),{...draft,elementIds:['missing']},'Review','','bad'));
});
test('Scripted recipient is predictable, idempotent, explicitly labeled and cannot alter targets',()=>{
 const ref=demoShare(freshDemo(),draft,'Compare','compare','r').references[0];
 const result=simulateRecipient(ref);assert.equal(ref.responses.length,0);assert.equal(result.status,'reviewed');assert.match(result.responses[0].message,/Simulated User B/);assert.deepEqual(result.elementIds,draft.elementIds);assert.equal(simulateRecipient(result),result);assert.equal(simulateRecipient({...ref,archivedAt:'archived'}).responses.length,0);
 const recovered=JSON.parse(JSON.stringify(result));assert.equal(simulateRecipient(recovered).responses.length,1);
});
test('Cross-user comparison snapshots both local and fixed demo selections',()=>{
 const a={...demoPeer(),userId:'A' as const,elementIds:['hc1-cta'],exemplarIds:['hc1-cta']},b=demoPeer();
 const comparison=demoComparison(a,b,'snapshot');a.elementIds.length=0;
 assert.deepEqual(comparison.selections.A.elementIds,['hc1-cta']);assert.deepEqual(comparison.selections.B.elementIds,['sc1-cta']);assert.equal(comparison.interpretation.provenance,'rule-based');
});
test('All five validators remain strict; demo evidence can demonstrate Levels 4–5 without relaxing targets',()=>{
 for(const level of [1,2,3] as const){const task=TASKS[level-1];const events:ResearchAttempt['events']=[{id:'g',type:'gesture_attempt',at:''},{id:'i',type:'gesture_interpreted',at:''},{id:'c',type:'interpretation_correction',at:''},{id:'s',type:'selection',at:'',ids:task.targets},{id:'v',type:'interpretation_review',at:'',ids:task.targets}];assert.equal(evaluateAttempt({id:'a',level,startedAt:'',events},[]).complete,true);events[3]={...events[3],ids:[...task.targets,'invalid']};assert.equal(evaluateAttempt({id:'a',level,startedAt:'',events},[]).complete,false);}
 for(const level of [4,5] as const){const attempt={id:`attempt-${level}`,level,startedAt:'',events:[]};const ref=demoShare(freshDemo(),{...draft,research:{level,attemptId:attempt.id}},level===4?'Review':'Compare','Review consistency','r').references[0];assert.equal(evaluateAttempt(attempt,[ref]).complete,false);assert.equal(evaluateAttempt(attempt,[simulateRecipient(ref)]).complete,true);assert.equal(evaluateAttempt(attempt,[{...simulateRecipient(ref),elementIds:['hc1-cta']}]).complete,false);}
});
