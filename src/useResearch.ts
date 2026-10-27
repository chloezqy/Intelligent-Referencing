import { useCallback, useEffect, useState } from 'react';
import { UIElement,InferredReference } from './types';
import { RoomSnapshot, Session } from './collaboration';
import { requestId } from './useCollaboration';
import { evaluateAttempt, ResearchAttempt, ResearchEvent, sameIds, TaskLevel } from './research';
interface Log { level: TaskLevel; attempts: ResearchAttempt[] }
const load=(key:string):Log=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');if(value?.attempts&&[1,2,3,4,5].includes(value.level))return value;}catch{}return {level:1,attempts:[]};};
export function useResearch(room:RoomSnapshot|null, session:Session|null,mode:'demo'|'realtime'='realtime',nodes:UIElement[]=[]){
  const key=mode==='demo'?`sr-research-demo-v2-${session?.userId||'A'}`:`sr-research-v2-${session?`${session.code}-${session.userId}`:'solo'}`;
  const [state,setState]=useState(()=>({key,log:load(key)}));
  const log=state.key===key?state.log:load(key);
  const [storageError,setStorageError]=useState('');
  useEffect(()=>{setState(previous=>{
    const restored=load(key);
    // Carry the selection progression into A's first room; never give B A's solo results.
    const carry=previous.key==='sr-research-v2-solo'&&session?.userId==='A'&&!restored.attempts.length;
    return {key,log:carry?{level:previous.log.level,attempts:previous.log.attempts.filter(a=>a.level<=3)}:restored};
  });},[key]);
  useEffect(()=>{if(state.key!==key)return;try{localStorage.setItem(key,JSON.stringify(state.log));setStorageError('');}catch{setStorageError('Research log could not be saved in this browser. Export it before refreshing.');}},[state,key]);
  const update=useCallback((fn:(log:Log)=>Log)=>setState(previous=>({key,log:fn(previous.key===key?previous.log:load(key))})),[key]);
  const attempt=[...log.attempts].reverse().find(a=>a.level===log.level);
  const result=attempt?evaluateAttempt(attempt,room?.references||[],nodes):null;
  const record=useCallback((type:string,details:Partial<ResearchEvent>={})=>update(log=>{
    const current=[...log.attempts].reverse().find(a=>a.level===log.level);
    if(!current||current.completedAt)return log;
    const event:ResearchEvent={id:requestId(),at:new Date().toISOString(),type,step:['gesture_attempt','interpretation_review','interpretation_choice','scope_changed','candidate_activated'].includes(type),...details};
    return {...log,attempts:log.attempts.map(a=>a.id===current.id?{...a,events:[...a.events,event].slice(-1000)}:a)};
  }),[update]);
  const recordSelection=useCallback((ref:InferredReference|null)=>update(log=>{
    const current=[...log.attempts].reverse().find(a=>a.level===log.level);if(!current||current.completedAt)return log;
    const previous=[...current.events].reverse().find(e=>e.type==='selection');
    const ids=ref?.selectedIds||[],now=new Date().toISOString();
    const event:ResearchEvent={id:requestId(),at:now,type:'selection',ids:[...ids],method:ref?.selectionMethod||'conventional'};
    const gestureIndex=current.events.map(e=>e.type).lastIndexOf('gesture_attempt');
    const afterGesture=current.events.slice(gestureIndex+1).filter(e=>e.type==='selection');
    const interpreted=current.events.map(e=>e.type).lastIndexOf('gesture_interpreted')>gestureIndex;
    const corrected=gestureIndex>=0&&interpreted&&afterGesture.length>0&&previous&&!sameIds(previous.ids||[],ids);
    event.step=ids.length>0&&(ref?.selectionMethod==='conventional'||!!corrected);
    const additions=corrected?[event,{id:requestId(),at:now,type:'interpretation_correction',ids:[...ids],method:ref?.selectionMethod}]:[event];
    return {...log,attempts:log.attempts.map(a=>a.id===current.id?{...a,events:[...a.events,...additions].slice(-1000)}:a)};
  }),[update]);
  // Import authenticated, durable server evidence once per event. No viewport is synchronized.
  useEffect(()=>{if(!room)return;update(log=>{
    let changed=false;
    const attempts=log.attempts.map(a=>{
      const refs=room.references.filter(r=>r.research?.attemptId===a.id);
      const evidence:ResearchEvent[]=refs.flatMap(r=>[
        {id:`share:${r.id}`,type:'reference_shared',at:r.createdAt,actor:r.sourceUser,referenceId:r.id,ids:r.elementIds,step:true},
        ...(r.activity||[]).map(e=>({id:e.id,type:`reference_${e.kind}`,at:e.at,actor:e.userId,referenceId:r.id,ids:e.elementIds,step:true})),
        ...r.responses.map(e=>({id:e.id,type:'reference_response',at:e.createdAt,actor:e.userId,referenceId:r.id,step:true})),
        ...(r.reviewedAt?[{id:`review:${r.id}`,type:'reference_acknowledged',at:r.reviewedAt,actor:r.targetUser,referenceId:r.id,step:true}]:[])
      ]);
      const fresh=evidence.filter(e=>!a.events.some(old=>old.id===e.id));
      let next=fresh.length?{...a,events:[...a.events,...fresh]}:a;
      if(!next.completedAt&&evaluateAttempt(next,room.references,nodes).complete){const at=new Date().toISOString();next={...next,completedAt:at,events:[...next.events,{id:requestId(),type:'task_complete',at}]};}
      if(next!==a)changed=true;return next;
    });return changed?{...log,attempts}:log;
  });},[room,update]);
  useEffect(()=>{if(attempt&&!attempt.completedAt&&result?.complete)update(log=>({...log,attempts:log.attempts.map(a=>a.id===attempt.id&&!a.completedAt?{...a,completedAt:new Date().toISOString(),events:[...a.events,{id:requestId(),type:'task_complete',at:new Date().toISOString()}]}:a)}));},[attempt,result?.complete,update]);
  return {mode,log,attempt,result,storageError,record,recordSelection,
    setLevel:(level:TaskLevel)=>update(log=>({...log,level})),
    start:()=>update(log=>{const at=new Date().toISOString();return {...log,attempts:[...log.attempts,{id:requestId(),mode,level:log.level,baseline:structuredClone(nodes),startedAt:at,events:[{id:requestId(),type:'task_start',at}]}].slice(-100)};}),
    exportLog:()=>{const blob=new Blob([JSON.stringify({version:2,mode,evidence:mode==='demo'?'simulated collaboration; not real participant evidence':'real participant interactions',room:room?.code,user:session?.userId||'local',...log},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='smart-reference-research.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);},
  };
}
