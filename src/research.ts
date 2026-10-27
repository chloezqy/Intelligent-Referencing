import { MOCK_NODES } from './data';
import { SharedReference } from './collaboration';
import type {UIElement} from './types';
import {layoutPatches,changedPatches,libraryProposal,proposalPatches} from './editing';
export type TaskLevel = 1 | 2 | 3 | 4 | 5;
export interface ResearchEvent { id: string; type: string; at: string; ids?: string[]; method?: string; actor?: string; referenceId?: string; step?: boolean;action?:string }
export interface ResearchAttempt { mode?:'demo'|'realtime'; id: string; level: TaskLevel; startedAt: string; events: ResearchEvent[]; completedAt?: string;baseline?:UIElement[] }
const ids = (predicate: (n: UIElement) => boolean) => MOCK_NODES.filter(n=>!n.library&&predicate(n)).map(n => n.id);
const cards=ids(n=>n.screen==='Home'&&n.type==='card'&&n.component==='ProductCard');
export const TASKS: {level: TaskLevel; title: string; instructions: string; targets: string[]; focus: string}[] = [
 {level:1,title:'Simple Selection',instructions:'Select exactly the four Home category chips. Use conventional selection or Rough Reference → Adjust interpretation. AI suggestions are optional; choose the intended interpretation.',targets:ids(n=>n.screen==='Home'&&n.role==='filterChip'),focus:'Identify and confirm a reference'},
 {level:2,title:'Alignment',instructions:'Select the four Home product cards. Open Compare → Suggested actions → Align → Even spacing, preview the layout and apply.',targets:cards,focus:'Reference → conventional layout action'},
 {level:3,title:'Batch Style Editing',instructions:'Select the four Home product primary buttons. Open Compare → Suggested actions → Colors and change all their fills to one new color. Keep the button labels unchanged.',targets:ids(n=>n.screen==='Home'&&n.component==='ProductCard'&&n.role==='primaryCTA'),focus:'Semantic selection → batch color edit'},
 {level:4,title:'Design System Matching',instructions:'Select the four Home product cards and open Compare → Suggested actions → Design System and match them to the library elsewhere in this file. Preview and apply all mappings. Preserve product content.',targets:cards,focus:'Cross-frame style source → confirmed targets'},
 {level:5,title:'Complex Semantic Editing',instructions:'Select every primary CTA across all six product screens. Open Compare → Suggested actions → Design System and apply the Primary Button style while preserving every label and role. Try All screens scope in Adjust interpretation.',targets:ids(n=>n.role==='primaryCTA'),focus:'Whole-file semantic reference → library style'},
];
export const sameIds = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === b.length && b.every(id=>a.includes(id));
export function evaluateAttempt(attempt:ResearchAttempt,_references:SharedReference[],nodes:UIElement[]=MOCK_NODES){
 const task=TASKS[attempt.level-1],selection=[...attempt.events].reverse().find(e=>e.type==='selection'),selected=selection?.ids||[];
 const checks=[{label:`Correct targets: ${task.targets.filter(id=>selected.includes(id)).length}/${task.targets.length}; extra selections: ${selected.filter(id=>!task.targets.includes(id)).length}`,done:sameIds(selected,task.targets)}];
 if(attempt.level>1){
  const applied=attempt.events.some(e=>e.type==='action_applied'&&sameIds(e.ids||[],task.targets));
  checks.push({label:'Batch action applied to the correct confirmed reference',done:applied});
  let correct=false;
  try{
   if(attempt.level===2)correct=changedPatches(nodes,layoutPatches(task.targets,nodes,'spacing')).length===0;
   if(attempt.level===3){const targets=nodes.filter(n=>task.targets.includes(n.id));const before=attempt.baseline||MOCK_NODES;correct=new Set(targets.map(n=>n.bg)).size===1&&targets.every(n=>!!n.bg)&&targets.some(n=>n.bg!==before.find(b=>b.id===n.id)?.bg);}
   if(attempt.level>=4){const proposal=libraryProposal(task.targets,nodes);correct=changedPatches(nodes,proposalPatches(proposal,proposal.mappings.map(m=>m.id),nodes)).length===0;}
  }catch{}
  checks.push({label:attempt.level===2?'Final layout has even spacing':attempt.level===3?'Button fills match and use a new color':'Final object properties match the in-file library',done:correct});
  const before=attempt.baseline||MOCK_NODES;
  checks.push({label:'Content, object IDs and semantic roles preserved',done:nodes.length===before.length&&before.every(b=>{const n=nodes.find(n=>n.id===b.id);return n&&n.text===b.text&&n.label===b.label&&n.role===b.role&&n.parent===b.parent;})});
 }
 return {complete:checks.every(c=>c.done),checks,reference:undefined};
}
