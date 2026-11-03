import {exportStudy} from './studyExport';
import {useState,useCallback,useEffect,useRef} from 'react';
import {STUDY_KEY,STUDY_TASKS,STUDY_TASK_COUNT,currentAttempt,completeStudyAttempt,newStudySession,nextStudyTask,skipCurrentStudyTask,StudySession,StudyEvent,StudyAttempt} from './study';
import type {UIElement} from './types';
import type {SharedReference} from './collaboration';
export function useStudy(){
 const [sessions,setSessions]=useState<StudySession[]>(()=>{try{const data=JSON.parse(localStorage.getItem(STUDY_KEY)||'[]');return Array.isArray(data)?data.map((s:StudySession)=>({...s,endedAt:s.endedAt||new Date().toISOString(),attempts:s.attempts.map(a=>a.endedAt?a:{...a,endedAt:new Date().toISOString(),outcome:'interrupted',events:[...a.events,{type:'interrupted',at:new Date().toISOString(),reason:'Page reloaded; start a new session for a controlled baseline'}]})})):[];}catch{return [];}});
 const [activeId,setActiveId]=useState<string|null>(null),[error,setError]=useState('');
 const session=sessions.find(s=>s.id===activeId),attempt=currentAttempt(session);
 const current=useRef({activeId,sessions});current.current={activeId,sessions};
 useEffect(()=>{try{localStorage.setItem(STUDY_KEY,JSON.stringify(sessions));setError('');}catch{setError('Study records could not be saved. Export before closing this tab.');}},[sessions]);
 const update=useCallback((fn:(s:StudySession)=>StudySession)=>{const id=current.current.activeId;setSessions(all=>all.map(s=>s.id===id?fn(s):s));},[]);
 const record=useCallback((type:string,details:Omit<StudyEvent,'type'|'at'>={})=>update(s=>{const a=currentAttempt(s);if(!a||a.endedAt)return s;return {...s,attempts:s.attempts.map(x=>x.id===a.id?{...x,events:[...x.events,{type,at:new Date().toISOString(),...details}]}:x)};}),[update]);
 const observe=useCallback((nodes:UIElement[],references:SharedReference[])=>update(s=>{
  const original=currentAttempt(s);if(!original||original.endedAt)return s;
  const evidence:StudyEvent[]=references.filter(r=>!original.referenceIds.includes(r.id)&&Date.parse(r.createdAt)>=Date.parse(original.startedAt)).flatMap(r=>[
   {id:`share:${r.id}`,referenceId:r.id,type:'reference_shared',at:r.createdAt,actor:r.sourceUser,ids:r.elementIds,intent:r.intent,mentionedB:r.mentions?.includes('B')||false,invitedB:r.attention?.some(e=>e.targetUser==='B')||false,noteLength:r.message.trim().length},
   ...(r.activity||[]).map(e=>({id:e.id,referenceId:r.id,type:`reference_${e.kind}`,at:e.at,actor:e.userId,ids:e.elementIds})),
   ...r.responses.map(e=>({id:e.id,referenceId:r.id,type:'reference_reply',at:e.createdAt,actor:e.userId})),
   ...(r.reviewedAt?[{id:`review:${r.id}`,referenceId:r.id,type:'reference_reviewed',at:r.reviewedAt,actor:r.targetUser}]:[]),
  ]);
  const fresh=evidence.filter(e=>!original.events.some(old=>old.id===e.id));let a=fresh.length?{...original,events:[...original.events,...fresh]}:original;
  a=completeStudyAttempt(a,nodes,references);
  return a===original?s:{...s,...(a.outcome==='complete'&&a.task===STUDY_TASK_COUNT-1?{endedAt:a.endedAt}:{}),attempts:s.attempts.map(x=>x.id===a.id?a:x)};
 }),[update]);
 const end=useCallback((outcome:'skipped'|'interrupted',reason:string)=>update(s=>{const at=new Date().toISOString();return {...s,attempts:s.attempts.map(a=>!a.endedAt?{...a,endedAt:at,outcome,events:[...a.events,{type:outcome,at,reason}]}:a)};}),[update]);
 useEffect(()=>{if(!activeId)return;const pointer=(e:PointerEvent)=>{if(e.target instanceof Element&&!e.target.closest('[data-study-control]'))record('pointer_interaction',{target:interactionTarget(e.target)});};const key=(e:KeyboardEvent)=>{if(!e.repeat&&!(e.target as Element).closest('[data-study-control]'))record('keyboard_interaction',{target:e.target instanceof Element?interactionTarget(e.target):undefined});};const visibility=()=>record(document.hidden?'tab_hidden':'tab_visible');window.addEventListener('pointerdown',pointer,true);window.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('pointerdown',pointer,true);window.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);};},[activeId,record]);
 return {sessions,session,attempt,active:!!activeId,error,record,observe,
  begin:(participant:string)=>{end('interrupted','New participant session started');update(s=>({...s,endedAt:new Date().toISOString()}));const s=newStudySession(participant);setSessions(all=>[...all,s]);setActiveId(s.id);},
  finish:()=>{end('interrupted','Session ended or workspace reset');update(s=>({...s,endedAt:new Date().toISOString()}));setActiveId(null);},
  start:(task:number,nodes:UIElement[],references:SharedReference[])=>{const at=new Date().toISOString();const a:StudyAttempt={id:crypto.randomUUID(),task,taskId:STUDY_TASKS[task]?.id,taskGroup:STUDY_TASKS[task]?.group,selectionLevel:STUDY_TASKS[task]?.level,taskTitle:STUDY_TASKS[task]?.title,prompt:STUDY_TASKS[task]?.prompt,startedAt:at,events:[{type:'task_start',at}],baseline:structuredClone(nodes),referenceIds:references.map(r=>r.id)};update(s=>nextStudyTask(s)===task?{...s,attempts:[...s.attempts,a]}:s);},
  skip:()=>update(s=>skipCurrentStudyTask(s)),
  identify:(participant:string)=>update(s=>({...s,participant:participant.trim().toUpperCase()||'Unassigned'})),
  exportLog:()=>{const data=exportStudy(sessions);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`smart-reference-study-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),0);},
 };
}

function interactionTarget(target:Element):string {
 const layer=target.closest('[data-canvas-node]')?.getAttribute('data-canvas-node');if(layer)return `layer:${layer}`;
 const control=target.closest('button,input,textarea,select,[role=button]');if(!control)return 'canvas';
 return (control.getAttribute('aria-label')||control.getAttribute('data-action-header')||control.getAttribute('title')||(control.tagName==='BUTTON'&&!control.closest('.reference-list')?control.textContent:'')||control.tagName.toLowerCase()).trim().slice(0,100);
}
