import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STUDY_TASKS,evaluateStudy,studyMetrics,resetPrototypeStorage,StudyAttempt,StudyEvent,STUDY_KEY,nextStudyTask,newStudySession,STUDY_TASK_COUNT,completeStudyAttempt,studySelectionProgress} from './study';
import {MOCK_NODES} from './data';
import {applyPatches,libraryProposal,proposalPatches} from './editing';
import {compileActionPlan} from './actionIntent';
import {freshDemo,demoShare,DEMO_KEY} from './demoCollaboration';
import {NUDGE_DISMISSALS_KEY} from './referenceAttention';
const at='2026-11-03T15:00:00.000Z';
const attempt=(task:number):StudyAttempt=>({id:'attempt',task,startedAt:at,baseline:structuredClone(MOCK_NODES),referenceIds:[],events:[]});
const event=(type:string,details:Partial<StudyEvent>={}):StudyEvent=>({type,at,...details});
const complete=(a:StudyAttempt,nodes=MOCK_NODES,refs=[] as ReturnType<typeof freshDemo>['references'])=>evaluateStudy(a,nodes,refs).every(c=>c.done);
test('all three selection levels accept normal selection or confirmed rough gestures',()=>{
 assert.deepEqual(STUDY_TASKS.slice(0,3).map(t=>t.targets.length),[4,8,15]);
 for(const task of [0,1,2]){
  const ids=STUDY_TASKS[task].targets,a=attempt(task);
  a.events=[event('selection',{ids,method:'conventional'})];assert.equal(complete(a),true);
  a.events=[event('gesture_attempt'),event('selection',{ids,method:'smart-ref'})];assert.equal(complete(a),false);
  a.events.push(event('interpretation_choice'));assert.equal(complete(a),true);
  a.events.push(event('selection',{ids:[...ids,'hc1'],method:'conventional'}));assert.equal(complete(a),false);
 }
});
test('Task 2 requires actual commits and matching styles for all four Home cards',()=>{
 const a=attempt(3),ids=[...STUDY_TASKS[3].targets],p=libraryProposal(ids,MOCK_NODES),patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),edited=applyPatches(MOCK_NODES,patches);
 assert.deepEqual(ids,['hc1','hc2','hc3','hc4']);
 a.events=[event('design_system_previewed',{ids,patches})];assert.equal(complete(a,edited),false);
 a.events.push(event('edit_committed',{ids,patches,method:'design-system'}));assert.equal(complete(a,edited),true);
 assert.equal(complete(a),false);
 const partial=libraryProposal(['hc1'],MOCK_NODES);assert.equal(complete(a,applyPatches(MOCK_NODES,proposalPatches(partial,partial.mappings.map(m=>m.id),MOCK_NODES))),false);
 edited.find(n=>n.id==='hc1-title')!.text='Changed content';assert.equal(complete(a,edited),false);
});
test('Task 2 rejects a single property suggestion, wrong card group or preview-only action',()=>{
 const a=attempt(3),ids=[...STUDY_TASKS[3].targets];a.events=[event('design_system_previewed',{ids}),event('edit_committed',{ids,method:'design-system',patches:ids.map(id=>({id,changes:{radius:12}}))})];
 assert.equal(complete(a,applyPatches(MOCK_NODES,ids.map(id=>({id,changes:{radius:12}})))),false);
 const p=libraryProposal(ids,MOCK_NODES),patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches);
 a.events[1].ids=['hc1'];assert.equal(complete(a,after),false);
});
function reference(){return demoShare(freshDemo(),{elementIds:['hc1-img'],exemplarIds:['hc1-img'],scope:'exemplars',label:'Image'},'Review','@User B Please review this image style.','ref',true).references[0];}
test('sharing task accepts any objects and intent once B resolves the same new reference',()=>{
 const a=attempt(4);
 for(const elementIds of [['hc1'],['sc1-img'],['hc2','sc2'],['ds-product-card']]){
  // The sharing service already validates actual targets; completion imposes no specific object set.
  const r={...reference(),createdAt:at,elementIds,intent:'Look at this',message:'',mentions:[],attention:[],activity:[],responses:[]};
  assert.equal(complete(a,MOCK_NODES,[r]),false);
  r.status='reviewed';r.reviewedAt=at;assert.equal(complete(a,MOCK_NODES,[r]),true);
  const done=completeStudyAttempt(a,MOCK_NODES,[r],at),session=newStudySession('P0');session.attempts=[done];
  assert.equal(nextStudyTask(session),5);
  assert.equal(complete({...a,referenceIds:[r.id]},MOCK_NODES,[r]),false);
  assert.equal(complete(a,MOCK_NODES,[{...r,targetUser:'A',sourceUser:'B'}]),false);
  assert.equal(complete(a,MOCK_NODES,[{...r,createdAt:'2026-11-02T15:00:00Z'}]),false);
 }
});
test('sharing alone or resolving a different old reference cannot complete the task',()=>{
 const a=attempt(4),current={...reference(),id:'new',createdAt:at},old={...reference(),id:'old',createdAt:'2026-11-02T15:00:00Z',status:'reviewed' as const};
 assert.equal(complete(a,MOCK_NODES,[current,old]),false);
 assert.equal(complete(a,MOCK_NODES,[]),false);
 assert.equal(complete(a,MOCK_NODES,[{...current,status:'reviewed',elementIds:[]}]),false);
});
test('optional compare rejects extra geometry edits and preview-only changes',()=>{
 const a=attempt(5),patches=[{id:'sc1',changes:{radius:16}}];a.events=[event('edit_preview_toggled')];assert.equal(complete(a,applyPatches(MOCK_NODES,patches)),false);a.events.push(event('edit_committed',{ids:['sc1'],patches}));assert.equal(complete(a,applyPatches(MOCK_NODES,patches)),true);
 assert.equal(complete(a,applyPatches(MOCK_NODES,[{id:'sc1',changes:{radius:16,w:300}}])),false);
});
test('metrics count only defined physical interactions and freeze at the end timestamp',()=>{
 const a=attempt(0);a.events=['pointer_interaction','keyboard_interaction','gesture_attempt','selection','edit_preview_toggled'].map(t=>event(t));a.endedAt='2026-11-03T15:00:05.500Z';assert.deepEqual(studyMetrics(a,Date.parse(at)+999999),{elapsedSeconds:5.5,interactions:2,gestures:1,selectionMethods:[],finalSelectionMethod:undefined});
});
test('reset clears document, demo state, views and demo nudges while preserving archives and real rooms',()=>{
 const data=new Map([[STUDY_KEY,'saved study'],['sr-research-demo-v2-A','saved legacy'],['sr-room-secret','identity'],['sr-document-v2','edited'],[DEMO_KEY,'references'],['sr-demo-views','views'],['sr-demo-perspective','B'],[NUDGE_DISMISSALS_KEY,JSON.stringify({'demo:demo:A':['ref'],'realtime:room:A':['keep']})]]);
 const storage={getItem:(key:string)=>data.get(key)||null,setItem:(key:string,value:string)=>{data.set(key,value);},removeItem:(key:string)=>{data.delete(key);}};
 resetPrototypeStorage(storage);assert.equal(data.has('sr-document-v2'),false);assert.equal(data.has(DEMO_KEY),false);assert.equal(data.has('sr-demo-views'),false);assert.equal(data.get('sr-demo-perspective'),'A');assert.equal(data.get(STUDY_KEY),'saved study');assert.equal(data.get('sr-room-secret'),'identity');assert.equal(data.get('sr-research-demo-v2-A'),'saved legacy');assert.deepEqual(JSON.parse(data.get(NUDGE_DISMISSALS_KEY)!),{'realtime:room:A':['keep']});
});

test('guided study advances through selection levels, editing, collaboration and comparison',()=>{
 const session=newStudySession('Unassigned');assert.equal(nextStudyTask(session),null);
 for(const id of ['P0','P1','P20']){session.participant=id;assert.equal(nextStudyTask(session),0);}
 for(let task=0;task<STUDY_TASK_COUNT;task++){
  const a=attempt(task);session.attempts.push(a);assert.equal(nextStudyTask(session),null);
  a.outcome='complete';a.endedAt=at;assert.equal(nextStudyTask(session),task===STUDY_TASK_COUNT-1?null:task+1);
 }
 assert.equal(STUDY_TASK_COUNT,6);assert.equal(STUDY_TASKS.at(-1)!.group,4);
});
test('AI library Apply advances Task 2 to Task 3 without a button-specific preview event',()=>{
 const ids=[...STUDY_TASKS[3].targets],a=attempt(3);
 const p=compileActionPlan({title:'Apply library',steps:[{action:'library',role:'all',layout:null,sourceId:null,token:null,property:null,value:null}]},ids,MOCK_NODES);
 const patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES),after=applyPatches(MOCK_NODES,patches);
 a.events=[event('edit_preview_toggled'),event('edit_committed',{ids,patches})];
 const completed=completeStudyAttempt(a,after,[],at),session=newStudySession('P0');session.attempts=[completed];
 assert.equal(completed.outcome,'complete');assert.equal(nextStudyTask(session),4);
 assert.equal(completed.events.filter(e=>e.type==='task_complete').length,1);
 assert.equal(completeStudyAttempt(completed,after,[],at),completed);
});
test('valid style matching ignores internal token labels and normalizes nested selected layers',()=>{
 const ids=[...STUDY_TASKS[3].targets],a=attempt(3),p=libraryProposal(ids,MOCK_NODES);
 const patches=proposalPatches(p,p.mappings.map(m=>m.id),MOCK_NODES).map(p=>({...p,changes:Object.fromEntries(Object.entries(p.changes).filter(([key])=>key!=='token'))}));
 a.events=[event('edit_committed',{ids:[...ids,'hc1-title'],patches})];
 assert.equal(complete(a,applyPatches(MOCK_NODES,patches)),true);
});
test('separate card applications finish only after all four cards have been applied',()=>{
 const a=attempt(3);let nodes=MOCK_NODES;
 for(const [i,id] of STUDY_TASKS[3].targets.entries()){
  const p=libraryProposal([id],nodes),patches=proposalPatches(p,p.mappings.map(m=>m.id),nodes);nodes=applyPatches(nodes,patches);
  a.events.push(event('edit_committed',{ids:[id],patches}));
  assert.equal(complete(a,nodes),i===3);
 }
 assert.equal(complete(a,MOCK_NODES),false);
});

test('study panel shows four task groups and nested selection levels correctly',async()=>{
 const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server'),{default:StudyPanel}=await import('./components/StudyPanel');
 const session=newStudySession('P0');
 for(const task of [0,1,2,3,4,5]){
  const a=attempt(task);a.taskId=STUDY_TASKS[task].id;session.attempts=[a];
  const html=renderToStaticMarkup(React.createElement(StudyPanel,{study:{session,attempt:a,active:true,sessions:[session],error:''} as any}));
  assert.ok(html.includes(`Task ${STUDY_TASKS[task].group} of 4`));
  if(task<3)assert.ok(html.includes(`Selection level ${task+1} of 3`));
 }
});

test('Task 4 completes the real comparison resolution after Task 2 changes Home radius',async()=>{
 const {localComparison}=await import('./comparisonSides'),{resolveComparison}=await import('./comparisonResolution');
 const library=libraryProposal(STUDY_TASKS[3].targets,MOCK_NODES),baseline=applyPatches(MOCK_NODES,proposalPatches(library,library.mappings.map(m=>m.id),MOCK_NODES));
 const a=attempt(5);a.baseline=baseline;
 const context=localComparison('A',['hc1','sc1'],'study-compare',baseline),proposal=resolveComparison(context,baseline,['radius'],'A'),patches=proposalPatches(proposal,proposal.mappings.map(m=>m.id),baseline);
 assert.equal(patches[0].changes.radius,12);
 a.events=[event('edit_preview_toggled'),event('edit_committed',{ids:proposal.targetIds,patches})];
 const completed=completeStudyAttempt(a,applyPatches(baseline,patches),[],at),session=newStudySession('P0');session.attempts=[completed];
 assert.equal(completed.outcome,'complete');assert.equal(nextStudyTask(session),null);
});

test('Level 3 advances after confirming all images from a normal click and AI interpretation',()=>{
 const a=attempt(2),ids=STUDY_TASKS[2].targets;
 a.events=[event('selection',{ids:['hc1-img'],method:'conventional'}),event('ai_interpretation_requested'),event('selection',{ids,method:'smart-ref'})];
 assert.equal(complete(a),false);
 a.events.push(event('interpretation_choice',{ids,method:'smart-ref'}));
 const done=completeStudyAttempt(a,MOCK_NODES,[],at),session=newStudySession('P0');session.attempts=[done];
 assert.equal(done.outcome,'complete');assert.equal(nextStudyTask(session),3);
 assert.deepEqual(studySelectionProgress(a),{selected:15,total:15,extra:0});
});
test('Level 3 cannot reuse an old confirmation or accept library images instead of a product image',()=>{
 const a=attempt(2),ids=STUDY_TASKS[2].targets;
 a.events=[event('selection',{ids:['hc1-img'],method:'smart-ref'}),event('interpretation_choice',{ids:['hc1-img']}),event('selection',{ids,method:'smart-ref'})];
 assert.equal(complete(a),false);
 a.events.push(event('interpretation_choice',{ids:['hc1-img']}));assert.equal(complete(a),false);
 a.events.push(event('interpretation_choice',{ids}));assert.equal(complete(a),true);
 a.events.push(event('selection',{ids:[...ids.slice(0,-1),'ds-product-card-img'],method:'conventional'}));assert.equal(complete(a),false);
 assert.deepEqual(studySelectionProgress(a),{selected:14,total:15,extra:1});
});
test('All screens image interpretation resolves the exact Level 3 set across component types',async()=>{
 const {scopeElements,resolveScopeIds}=await import('./gestureContext');
 const ids=resolveScopeIds(['hc1-img'],scopeElements(['hc1-img'],MOCK_NODES,'document'),'document');
 assert.deepEqual(new Set(ids),new Set(STUDY_TASKS[2].targets));
 for(const method of ['conventional','smart-ref']){
  const a=attempt(2);a.events=[event('selection',{ids,method}),...(method==='smart-ref'?[event('interpretation_choice',{ids})]:[])];
  assert.equal(completeStudyAttempt(a,MOCK_NODES,[],at).outcome,'complete');
 }
});
