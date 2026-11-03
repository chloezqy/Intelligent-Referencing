import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {exportStudy} from './studyExport';
import {newStudySession,nextStudyTask,skipCurrentStudyTask,STUDY_TASKS,STUDY_TASK_COUNT,type StudyAttempt} from './study';
import {MOCK_NODES} from './data';
import StudyPanel from './components/StudyPanel';
const start='2026-11-03T15:00:00.000Z',end='2026-11-03T15:00:05.000Z';
const attempt=(task:number):StudyAttempt=>({id:`a${task}`,task,taskId:STUDY_TASKS[task].id,taskGroup:STUDY_TASKS[task].group,selectionLevel:STUDY_TASKS[task].level,startedAt:start,baseline:structuredClone(MOCK_NODES),referenceIds:[],events:[]});
test('every task/level can be skipped and progression continues without recording a success',()=>{
 let s=newStudySession('P0');
 for(let task=0;task<STUDY_TASK_COUNT;task++){
  s.attempts.push(attempt(task));const skipped=skipCurrentStudyTask(s,end),a=skipped.attempts.at(-1)!;
  assert.equal(a.outcome,'skipped');assert.equal(a.endedAt,end);assert.equal(nextStudyTask(skipped),task===STUDY_TASK_COUNT-1?null:task+1);
  assert.ok(!a.events.some(e=>e.type==='task_complete'));assert.equal(skipCurrentStudyTask(skipped,end),skipped);
  s=skipped;
  if(task===STUDY_TASK_COUNT-1){assert.equal(skipped.endedAt,end);const html=renderToStaticMarkup(React.createElement(StudyPanel,{study:{session:skipped,attempt:a,active:true,sessions:[skipped],error:''} as any}));assert.match(html,/Study finished/);assert.match(html,/Download study records/);}
 }
});
test('active study UI provides skip controls for both levels and regular tasks',()=>{
 for(const task of [0,3,4,5]){const session=newStudySession('P0'),a=attempt(task);session.attempts=[a];const html=renderToStaticMarkup(React.createElement(StudyPanel,{study:{session,attempt:a,active:true,sessions:[session],error:''} as any}));assert.match(html,task===0?/Skip this level/:/Skip task/);}
});
test('concise export retains timing, outcomes, methods and event context but omits heavy internal data',()=>{
 const s=newStudySession('P0'),a=attempt(0);s.attempts=[a];a.endedAt=end;a.outcome='skipped';
 a.events=[{type:'task_start',at:start},{type:'pointer_interaction',at:start,target:'layer:hc1-cta'},{type:'keyboard_interaction',at:start,target:'textarea'},
 {type:'selection',at:start,ids:['hc1-cta'],method:'conventional'},
 {type:'edit_committed',at:start,ids:['hc1'],patches:[{id:'hc1',changes:{radius:12,bg:'#ffffff',token:'Internal style mapping'}}]},
 {type:'reference_reply',at:start,actor:'B',referenceId:'ref1'}, {type:'skipped',at:end}];
 const out=exportStudy([s],end),trial=out.sessions[0].tasks[0],json=JSON.stringify(out);
 assert.equal(out.version,2);assert.equal(out.sessions[0].participant,'P0');assert.equal(trial.outcome,'skipped');assert.equal(trial.durationMs,5000);assert.equal(trial.interactionCount,2);
 assert.deepEqual(trial.events.find(e=>e.type==='selection'),{at:start,type:'selection',ids:['hc1-cta'],method:'conventional'});
 assert.deepEqual(trial.events.find(e=>e.type==='edit_committed'),{at:start,type:'edit_committed',objects:1,properties:['radius','bg']});
 assert.ok(trial.events.every(e=>e.at));assert.equal(trial.events.length,5);
 assert.doesNotMatch(json,/baseline|patches|referenceIds|Internal style mapping|#ffffff|task_start|taskTitle|prompt|pre|post/);
 assert.ok(json.length<JSON.stringify(s).length/10);
 assert.equal(JSON.stringify(exportStudy([s],end)),json);
});
test('unfinished exports have no invented end time and repeated participant IDs retain distinct sessions',()=>{
 const a=newStudySession('P1'),b=newStudySession('P1');a.attempts=[attempt(0)];b.attempts=[attempt(0)];const data=exportStudy([a,b],end);
 assert.notEqual(data.sessions[0].id,data.sessions[1].id);assert.equal(data.sessions[0].tasks[0].outcome,'in_progress');assert.equal('durationMs' in data.sessions[0].tasks[0],false);
});

test('unused setup sessions do not add noise to the export',()=>{
 assert.deepEqual(exportStudy([newStudySession('Unassigned')],end).sessions,[]);
});
