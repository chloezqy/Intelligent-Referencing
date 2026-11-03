import {STUDY_TASKS,type StudySession,type StudyAttempt,type StudyEvent} from './study';
const lifecycle=new Set(['task_start','task_complete','skipped','interrupted','action_applied','ai_preview_patch','ai_interpretation_chosen']);
/** Analysis export: event timing/context, without document snapshots, patch values or message contents. */
function interaction(e:StudyEvent){
 return {at:e.at,type:e.type,
  ...(e.actor?{actor:e.actor}:{}),
  ...(e.target?{target:e.target}:{}),
  ...((e.type==='selection'||e.type==='reference_shared')?{ids:e.ids||[],...(e.method?{method:e.method}:{})}:{}),
  ...(e.referenceId?{reference:e.referenceId}:{}),
  ...(e.type==='edit_committed'?{objects:e.patches?new Set(e.patches.map(p=>p.id)).size:0,properties:[...new Set((e.patches||[]).flatMap(p=>Object.keys(p.changes).filter(k=>k!=='token')))]}:{}),
 };
}
function trial(a:StudyAttempt){
 const task=STUDY_TASKS.find(t=>t.id===a.taskId),events=a.events.filter(e=>!lifecycle.has(e.type)&&!(e.type==='design_system_previewed'&&!e.patches)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 return {task:a.taskId||a.taskTitle||`legacy-${a.task}`,group:a.taskGroup||task?.group,...(a.selectionLevel||task?.level?{level:a.selectionLevel||task?.level}:{}),
  outcome:a.outcome||'in_progress',start:a.startedAt,...(a.endedAt?{end:a.endedAt,durationMs:Math.max(0,Date.parse(a.endedAt)-Date.parse(a.startedAt))}:{}),
  interactionCount:events.filter(e=>e.type==='pointer_interaction'||e.type==='keyboard_interaction').length,
  events:events.map(interaction),
 };
}
export function exportStudy(sessions:StudySession[],at=new Date().toISOString()){
 return {version:2,exportedAt:at,sessions:sessions.filter(s=>s.attempts.length>0).map(s=>({id:s.id,participant:s.participant,protocol:s.protocolVersion||'legacy',mode:s.mode,start:s.startedAt,...(s.endedAt?{end:s.endedAt}:{}),tasks:s.attempts.map(trial)}))};
}
