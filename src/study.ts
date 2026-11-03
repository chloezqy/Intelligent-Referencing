import {MOCK_NODES} from './data';
import type {UIElement} from './types';
import type {SharedReference} from './collaboration';
import {libraryProposal,proposalPatches,changedPatches,roots,type Patch} from './editing';
import {sameIds} from './research';
import {DEMO_KEY} from './demoCollaboration';
import {NUDGE_DISMISSALS_KEY,parseNudgeDismissals} from './referenceAttention';
export const STUDY_KEY='sr-user-study-v1';
export interface StudyTask {id:string;group:1|2|3|4;level?:number;title:string;prompt:string;targets:string[]}
export const STUDY_TASKS:StudyTask[]=[
 {id:'selection-home-buttons',group:1,level:1,title:'Select four Home buttons',prompt:'Select exactly the four “Add to Bag” buttons on Home. Use normal selection or Rough Gesture—whichever you prefer. If using Rough Gesture, confirm the interpretation.',targets:['hc1-cta','hc2-cta','hc3-cta','hc4-cta']},
 {id:'selection-two-screen-filters',group:1,level:2,title:'Select eight filters',prompt:'Select exactly all eight category/filter chips across Home and Search. Use normal selection or Rough Gesture, and confirm any gesture interpretation.',targets:MOCK_NODES.filter(n=>!n.library&&n.role==='filterChip'&&(n.screen==='Home'||n.screen==='Search')).map(n=>n.id)},
 {id:'selection-all-images',group:1,level:3,title:'Select all product images',prompt:'Select all 15 product images across the shopping screens, including Favorites and Cart. Exclude the design-system sample. Use normal selection or Rough Gesture, and confirm any gesture interpretation.',targets:MOCK_NODES.filter(n=>!n.library&&n.role==='productImage'&&n.type==='image').map(n=>n.id)},
 {id:'design-system',group:2,title:'Apply the design system to Home cards',prompt:'Select all four product cards on Home. In the purple Suggested actions block, choose Apply design system, review the preview, and apply the changes. Keep the product content unchanged.',targets:['hc1','hc2','hc3','hc4']},
 {id:'collaboration',group:3,title:'Share a reference with User B',prompt:'Select any part of the design and share a reference with User B. Then switch to User B, open the reference, and resolve it using Mark reviewed. Notes, mentions, invitations and replies are optional.',targets:[]},
 {id:'compare',group:4,title:'Compare cards across screens',prompt:'Compare the first product card on Home with the first product card on Search. Keep their different layouts, but make the Search card use the Home card’s corner radius. Preview and apply only that change.',targets:['hc1','sc1']},
];
export const STUDY_TASK_COUNT=STUDY_TASKS.length;
export const studyTask=(a:Pick<StudyAttempt,'task'|'taskId'>|undefined)=>a?(STUDY_TASKS.find(t=>t.id===a.taskId)||STUDY_TASKS[a.task]):STUDY_TASKS[0];
export interface StudyEvent {id?:string;referenceId?:string;type:string;at:string;target?:string;ids?:string[];method?:string;patches?:Patch[];reason?:string;actor?:string;intent?:string;mentionedB?:boolean;invitedB?:boolean;noteLength?:number}
export interface StudyAttempt {id:string;task:number;taskId?:string;taskTitle?:string;taskGroup?:number;selectionLevel?:number;prompt?:string;startedAt:string;endedAt?:string;outcome?:'complete'|'skipped'|'interrupted';events:StudyEvent[];baseline:UIElement[];referenceIds:string[]}
export interface StudySession {id:string;participant:string;startedAt:string;endedAt?:string;mode:'demo';baselineVersion:'mobile-commerce-v1';protocolVersion?:string;attempts:StudyAttempt[];pre?:string;post?:string}
export const currentAttempt=(s:StudySession|undefined)=>s?.attempts.at(-1);
export function evaluateStudy(a:StudyAttempt,nodes:UIElement[],references:SharedReference[]){
 const has=(type:string)=>a.events.some(e=>e.type===type),task=studyTask(a);
 if(!task)return [];
 const preserved=a.baseline.length===nodes.length&&a.baseline.every(b=>{const n=nodes.find(n=>n.id===b.id);return n&&['text','label','role','parent'].every(k=>n[k as keyof UIElement]===b[k as keyof UIElement]);});
 if(task.group===1){
  const selectionIndex=a.events.map(e=>e.type).lastIndexOf('selection'),selection=a.events[selectionIndex];
  // Interpretation can start from a normal click as well as a rough gesture.
  // Only a confirmation of the current selection counts; drawing a gesture is not required.
  const confirmed=!!selection&&(selection.method==='conventional'||selection.method==='smart-ref'&&a.events.slice(selectionIndex+1).some(e=>e.type==='interpretation_choice'&&(!e.ids||sameIds(e.ids,selection.ids||[]))));
  return [{label:`Exactly ${task.targets.length} intended objects selected`,done:!!selection&&sameIds(selection.ids||[],task.targets)},
   {label:'Selection confirmed',done:confirmed}];
 }
 if(task.group===2){
  // Apply is recorded centrally for every editing route, including AI and per-card batches.
  // UI-specific preview names, proposal titles and token labels are not task outcomes.
  const appliedIds=new Set(a.events.filter(e=>e.type==='edit_committed'&&e.patches?.length).flatMap(e=>{
   const selected=roots(e.ids||[],nodes).map(n=>n.id);
   return selected.length&&selected.every(id=>(task.targets as readonly string[]).includes(id))?selected:[];
  }));
  let matches=false;try{
   const p=libraryProposal([...task.targets],nodes);
   const patches=proposalPatches(p,p.mappings.map(m=>m.id),nodes).map(p=>({...p,changes:Object.fromEntries(Object.entries(p.changes).filter(([key])=>key!=='token'))}));
   matches=changedPatches(nodes,patches).length===0;
  }catch{}
  return [{label:'Applied changes to all four Home cards',done:task.targets.every(id=>appliedIds.has(id))},
   {label:'All four cards match the design system',done:matches},
   {label:'Product content preserved',done:preserved}];
 }
 if(task.group===3){
  const shared=references.filter(r=>!a.referenceIds.includes(r.id)&&Date.parse(r.createdAt)>=Date.parse(a.startedAt)&&r.sourceUser==='A'&&r.targetUser==='B'&&r.elementIds.length>0);
  // Only the recipient can mark reviewed through either collaboration adapter.
  // Object identity, request intent, notes and discussion are participant choices.
  return [{label:'Shared a reference with User B',done:shared.length>0},
   {label:'User B resolved that reference',done:shared.some(r=>r.status==='reviewed')}];
 }
 const home=nodes.find(n=>n.id==='hc1'),search=nodes.find(n=>n.id==='sc1'),before=a.baseline.find(n=>n.id==='sc1');
 const committed=a.events.some(e=>e.type==='edit_committed'&&e.patches?.length===1&&e.patches[0].id==='sc1'&&Object.keys(e.patches[0].changes).every(k=>k==='radius'));
 return [{label:'Comparison previewed',done:has('edit_preview_toggled')},{label:'Only Search corner radius changed to match Home',done:committed&&home?.radius===search?.radius&&search?.radius!==before?.radius&&nodes.every(n=>{const b=a.baseline.find(b=>b.id===n.id);return b&&Object.keys(n).every(k=>k==='radius'&&n.id==='sc1'||n[k as keyof UIElement]===b[k as keyof UIElement]);})}];
}
export function studyMetrics(a:StudyAttempt,now=Date.now()) {return {elapsedSeconds:Math.max(0,((a.endedAt?Date.parse(a.endedAt):now)-Date.parse(a.startedAt))/1000),interactions:a.events.filter(e=>e.type==='pointer_interaction'||e.type==='keyboard_interaction').length,gestures:a.events.filter(e=>e.type==='gesture_attempt').length,selectionMethods:[...new Set(a.events.filter(e=>e.type==='selection'&&e.method).map(e=>e.method!))],finalSelectionMethod:a.events.filter(e=>e.type==='selection').at(-1)?.method};}
export function resetPrototypeStorage(storage:Pick<Storage,'removeItem'|'getItem'|'setItem'>){
 for(const key of ['sr-document-v2',DEMO_KEY,'sr-demo-views','sr-demo-dismissed'])storage.removeItem(key);
 storage.setItem('sr-demo-perspective','A');
 const dismissals=parseNudgeDismissals(storage.getItem(NUDGE_DISMISSALS_KEY));
 storage.setItem(NUDGE_DISMISSALS_KEY,JSON.stringify(Object.fromEntries(Object.entries(dismissals).filter(([key])=>!key.startsWith('demo:')))));
}
export function newStudySession(participant:string):StudySession{return {id:crypto.randomUUID(),participant:participant.trim()||'Unassigned',startedAt:new Date().toISOString(),mode:'demo',baselineVersion:'mobile-commerce-v1',protocolVersion:'selection-levels-v3',attempts:[]};}

/** Guided mode runs three selection levels followed by Tasks 2–4 in order, without participant task controls. */
export function nextStudyTask(session:StudySession|undefined):number|null {
 if(!session||session.endedAt||!/^P\d+$/i.test(session.participant))return null;
 const attempt=currentAttempt(session);
 if(!attempt)return 0;
 if(!['complete','skipped'].includes(attempt.outcome||'')||attempt.task+1>=STUDY_TASK_COUNT)return null;
 return attempt.task+1;
}

/** The observer and task progression share this completion transition. */
export function completeStudyAttempt(a:StudyAttempt,nodes:UIElement[],references:SharedReference[],at=new Date().toISOString()):StudyAttempt {
 if(a.endedAt)return a;
 const checks=evaluateStudy(a,nodes,references);
 return checks.length&&checks.every(c=>c.done)?{...a,endedAt:at,outcome:'complete',events:[...a.events,{type:'task_complete',at}]}:a;
}

export function studySelectionProgress(a:StudyAttempt|undefined){
 if(!a)return null;const task=studyTask(a);if(task?.group!==1)return null;
 const ids=a.events.filter(e=>e.type==='selection').at(-1)?.ids||[];
 return {selected:task.targets.filter(id=>ids.includes(id)).length,total:task.targets.length,extra:ids.filter(id=>!task.targets.includes(id)).length};
}

export function skipStudyAttempt(a:StudyAttempt,at=new Date().toISOString()):StudyAttempt {
 return a.endedAt?a:{...a,endedAt:at,outcome:'skipped',events:[...a.events,{type:'skipped',at}]};
}

export function skipCurrentStudyTask(s:StudySession,at=new Date().toISOString()):StudySession {
 const a=currentAttempt(s);if(!a||a.endedAt)return s;
 const next=skipStudyAttempt(a,at);
 return {...s,...(a.task===STUDY_TASK_COUNT-1?{endedAt:at}:{}),attempts:s.attempts.map(old=>old.id===a.id?next:old)};
}
