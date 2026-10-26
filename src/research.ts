import { MOCK_NODES } from './data';
import { SharedReference } from './collaboration';
export type TaskLevel = 1 | 2 | 3 | 4 | 5;
export interface ResearchEvent { id: string; type: string; at: string; ids?: string[]; method?: string; actor?: string; referenceId?: string; step?: boolean }
export interface ResearchAttempt { mode?:'demo'|'realtime'; id: string; level: TaskLevel; startedAt: string; events: ResearchEvent[]; completedAt?: string }
const ids = (predicate: (n: typeof MOCK_NODES[number]) => boolean) => MOCK_NODES.filter(predicate).map(n => n.id);
export const TASKS: {level: TaskLevel; title: string; instructions: string; targets: string[]; focus: string}[] = [
  {level:1,title:'Product Price Selection',instructions:'Select all 15 individual product prices across Home, Search, Detail, Favorites and Cart. Exclude cart totals, checkout totals and old prices. Use selection or semantic scope, then remove any extra matches.',targets:ids(n=>n.role==='price'&&(n.component==='ProductCard'||n.component==='CartItem'||n.id==='detail-price')),focus:'Semantic references across screens'},
  {level:2,title:'Primary CTA Selection',instructions:'Select all 15 primary call-to-action buttons across all six screens, including Move All to Bag, Proceed to Checkout and Place Order. Do not include secondary controls.',targets:ids(n=>n.role==='primaryCTA'),focus:'Related components across screens'},
  {level:3,title:'Rough Gesture Interpretation',instructions:'With Rough Reference (R), draw across two Home category chips. Switch to Select (V) for click corrections. Review the interpretation, change its scope or correct its targets, and finish with exactly the four Home category chips. Then confirm your reviewed selection below.',targets:ids(n=>n.screen==='Home'&&n.role==='filterChip'),focus:'Gesture → interpretation → correction → review'},
  {level:4,title:'Shared Review Request',instructions:'As User A, select at least two related objects (same role, component or parent). Share a Review request with a note explaining the design consistency question. User B must open it, locate every target, then respond or mark it reviewed.',targets:[],focus:'Shared targets and explicit intent'},
  {level:5,title:'Collaborative Design Comparison',instructions:'As User A, select exactly the first product CTA on Home (Nordic Lounge Chair) and Search (Eames Style Rocker). Send a Compare request with a note about their design or wording consistency. User B must open, locate both targets and respond or mark reviewed.',targets:['hc1-cta','sc1-cta'],focus:'Establish shared comparison context'},
];
export const sameIds = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === b.length && b.every(id=>a.includes(id));
function related(ids: string[]) {
  const nodes=ids.map(id=>MOCK_NODES.find(n=>n.id===id)).filter(Boolean);
  return nodes.length===ids.length&&nodes.length>=2&&(['role','component','parent'] as const).some(key=>nodes[0]![key]&&nodes.every(n=>n![key]===nodes[0]![key]));
}
export function evaluateAttempt(attempt: ResearchAttempt, references: SharedReference[]) {
  const task=TASKS[attempt.level-1], events=attempt.events;
  const selection=[...events].reverse().find(e=>e.type==='selection');
  const selected=selection?.ids||[];
  const matches=task.targets.filter(id=>selected.includes(id)).length, extras=selected.filter(id=>!task.targets.includes(id)).length;
  if(attempt.level<=3){
    const lastGesture=events.map(e=>e.type).lastIndexOf('gesture_attempt');
    const gesture=lastGesture>=0&&events.slice(lastGesture+1).some(e=>e.type==='gesture_interpreted');
    const gestureEvents=events.slice(lastGesture+1);
    const correction=gestureEvents.some(e=>e.type==='interpretation_correction');
    const lastSelection=events.map(e=>e.type).lastIndexOf('selection');
    const reviewed=events.slice(lastSelection+1).some(e=>e.type==='interpretation_review'&&sameIds(e.ids||[],selected));
    const exact=!!selection&&sameIds(selected,task.targets);
    const checks=[{label:`Correct targets: ${matches}/${task.targets.length}; extra selections: ${extras}`,done:exact}];
    if(attempt.level===3)checks.push({label:'Rough gesture interpreted',done:gesture},{label:'Interpretation corrected',done:correction},{label:'Final selection reviewed',done:reviewed});
    return {complete:checks.every(c=>c.done),checks,reference:undefined};
  }
  const candidates=references.filter(r=>r.research?.attemptId===attempt.id&&r.research.level===attempt.level&&r.sourceUser==='A'&&r.targetUser==='B');
  const progress=(r:SharedReference)=>{
    const validTargets=attempt.level===5?sameIds(r.elementIds,task.targets):related(r.elementIds);
    const opened=r.activity?.some(e=>e.userId==='B'&&e.kind==='opened')||false;
    const located=new Set(r.activity?.filter(e=>e.userId==='B'&&e.kind==='located').flatMap(e=>e.elementIds)||[]);
    const navigated=r.elementIds.every(id=>located.has(id));
    const response=r.responses.some(e=>e.userId==='B')||r.status==='reviewed';
    return [{label:'Correct targets, intent and a context note shared with User B',done:validTargets&&r.intent===(attempt.level===5?'Compare':'Review')&&!!r.message.trim()}, {label:'User B opened the reference',done:opened},{label:'User B located all targets',done:navigated},{label:'User B responded or acknowledged',done:response}];
  };
  // Evaluate each frozen reference separately: evidence from different references must never combine.
  const best=candidates.map(reference=>({reference,checks:progress(reference)})).sort((a,b)=>b.checks.filter(c=>c.done).length-a.checks.filter(c=>c.done).length)[0];
  const checks=best?.checks||['Share a qualifying reference with User B','User B opened the reference','User B located all targets','User B responded or acknowledged'].map(label=>({label,done:false}));
  return {complete:checks.every(c=>c.done),checks,reference:best?.reference};
}
