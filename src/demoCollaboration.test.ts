import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collaborationMode} from './collaborationClient';
import {freshDemo,demoShare,demoComparison} from './demoCollaboration';
import {evaluateAttempt,TASKS,ResearchAttempt} from './research';
const demoPeer=()=>({userId:'B' as const,elementIds:['sc1-cta'],exemplarIds:['sc1-cta'],scope:'exemplars' as const,method:'conventional' as const,revision:1});
const recipientEvidence=(ref:import('./collaboration').SharedReference):import('./collaboration').SharedReference=>({...ref,activity:[{id:'open',userId:'B',kind:'opened',elementIds:[],at:''},{id:'locate',userId:'B',kind:'located',elementIds:ref.elementIds,at:''}],responses:[{id:'reply',userId:'B',message:'Reviewed manually',createdAt:''}]});
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
test('Sharing leaves recipient actions pending, including after storage recovery and reverse-direction sharing',()=>{
 const ref=demoShare(freshDemo(),draft,'Review','Please review','r',true).references[0];
 const recovered=JSON.parse(JSON.stringify(ref));assert.equal(recovered.status,'open');assert.deepEqual(recovered.responses,[]);assert.deepEqual(recovered.activity,[]);assert.equal(recovered.attention[0].viewedAt,undefined);
 const reverse=demoShare(freshDemo(),draft,'Review','@User A please review','reverse',true,'B').references[0];assert.equal(reverse.sourceUser,'B');assert.equal(reverse.targetUser,'A');assert.equal(reverse.attention?.[0].targetUser,'A');assert.deepEqual(reverse.notificationRecipients,['A']);
});
test('Cross-user comparison snapshots both local and manually established demo selections',()=>{
 const a={...demoPeer(),userId:'A' as const,elementIds:['hc1-cta'],exemplarIds:['hc1-cta']},b=demoPeer();
 const comparison=demoComparison(a,b,'snapshot');a.elementIds.length=0;
 assert.deepEqual(comparison.selections.A.elementIds,['hc1-cta']);assert.deepEqual(comparison.selections.B.elementIds,['sc1-cta']);assert.equal(comparison.interpretation.provenance,'rule-based');
});
test('Demo reference activity cannot substitute for actual canvas editing task evidence',()=>{
 for(const level of [4,5] as const){const attempt={id:`attempt-${level}`,level,startedAt:'',events:[]};const ref=demoShare(freshDemo(),{...draft,research:{level,attemptId:attempt.id}},level===4?'Review':'Compare','Review consistency','r').references[0];assert.equal(evaluateAttempt(attempt,[recipientEvidence(ref)]).complete,false);}
});
