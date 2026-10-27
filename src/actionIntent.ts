import type {UIElement} from './types.js';
import {TYPOGRAPHY,COLORS} from './designSystem.js';
import {layoutPatches,libraryProposal,matchStyles,textTargets,colorTargets,EditProposal,Mapping,LayoutOperation,TextRole,validatePatches,roots} from './editing.js';
export const ACTIONS=['layout','library','matchStyles','typography','color'] as const;
export const LAYOUTS=['left','center','right','top','middle','bottom','horizontal','vertical','width','height','spacing'] as const;
export const ROLES=['all','productTitle','price','buttons','primaryCTA','selection'] as const;
export interface ActionStep {action:typeof ACTIONS[number];role:typeof ROLES[number];layout:LayoutOperation|null;sourceId:string|null;token:string|null;property:'bg'|'color'|'border'|'fontFamily'|'fontSize'|'fontWeight'|'lineHeight'|'letterSpacing'|null;value:string|null}
export interface ActionPlan {title:string;steps:ActionStep[]}
export function validateActionPlan(value:any,nodes:UIElement[]):ActionPlan{
 if(!value||typeof value.title!=='string'||!value.title.trim()||value.title.length>120||!Array.isArray(value.steps)||!value.steps.length||value.steps.length>4)throw new Error('AI returned an invalid action plan.');
 for(const s of value.steps){
  if(!s||!ACTIONS.includes(s.action)||!ROLES.includes(s.role)||s.layout!==null&&!LAYOUTS.includes(s.layout)||s.sourceId!==null&&!nodes.some(n=>n.id===s.sourceId&&n.type!=='screen')||s.token!==null&&(typeof s.token!=='string'||!Object.hasOwn(COLORS,s.token)&&!Object.hasOwn(TYPOGRAPHY,s.token))||s.property!==null&&!['bg','color','border','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'].includes(s.property)||s.value!==null&&(typeof s.value!=='string'||s.value.length>100))throw new Error('AI returned unsupported action parameters.');
  if(s.action==='layout'&&!s.layout||s.action==='matchStyles'&&!s.sourceId||['typography','color'].includes(s.action)&&!s.token&&(!s.property||s.value===null))throw new Error('AI action is missing required parameters.');
 }
 return value;
}
export function compileActionPlan(plan:ActionPlan,ids:string[],nodes:UIElement[]):EditProposal{
 validateActionPlan(plan,nodes);const mappings:Mapping[]=[];
 plan.steps.forEach((s,i)=>{
  const roleIds=s.role==='selection'||s.role==='all'?ids:s.role==='productTitle'||s.role==='price'?textTargets(ids,nodes,s.role).map(n=>n.id):colorTargets(ids,nodes,s.role).map(n=>n.id);
  if(s.action==='library'){mappings.push(...libraryProposal(roleIds,nodes).mappings);return;}
  if(s.action==='matchStyles'){mappings.push(...matchStyles(roleIds,nodes,s.sourceId!).mappings);return;}
  if(s.action==='layout'){mappings.push({id:`ai-${i}`,label:`Layout / ${s.layout}`,patches:layoutPatches(roleIds,nodes,s.layout!)});return;}
  let style:Partial<UIElement>={};
  if(s.token){if(s.action==='color'){const color=COLORS[s.token as keyof typeof COLORS];if(!color)throw new Error('Choose a color token.');style=s.property==='border'?{border:`1px solid ${color}`}:{[s.property==='color'?'color':'bg']:color};}else{const token=TYPOGRAPHY[s.token as keyof typeof TYPOGRAPHY];if(!token)throw new Error('Choose a typography token.');style=token;}}
  else {if(s.action==='color'&&!['bg','color','border'].includes(s.property!))throw new Error('Invalid color property.');if(s.action==='typography'&&!['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color'].includes(s.property!))throw new Error('Invalid typography property.');
   const numeric=['fontSize','lineHeight','letterSpacing'].includes(s.property!);const value=numeric?Number(s.value):s.value!;if(numeric&&(!Number.isFinite(value)||Number(value)>200||Number(value)<-10))throw new Error('Invalid typography value.');
   if(['bg','color'].includes(s.property!)&&!/^#[0-9a-f]{6}$/i.test(s.value!))throw new Error('Use a six-digit hex color.');style={[s.property!]:value};}
  const targets=s.action==='typography'||s.action==='color'&&s.property==='color'&&s.role==='all'?textTargets(roleIds,nodes,'all'):colorTargets(roleIds,nodes,'selection');
  mappings.push({id:`ai-${i}`,label:s.token?`${s.action} / ${s.token}`:`${s.action} / ${s.property} → ${s.value}`,patches:targets.map(n=>({id:n.id,changes:style}))});
 });
 const labels={layout:'Layout changes',library:'Match Design System',matchStyles:'Match reference styles',typography:'Typography changes',color:'Color changes'};
 const title=`${[...new Set(plan.steps.map(s=>labels[s.action]))].join(' + ')} · ${roots(ids,nodes).length} objects`;
 const sourceId=plan.steps.find(s=>s.action==='matchStyles')?.sourceId??(plan.steps.some(s=>s.action==='library')?'ds-product-card':undefined);
 const proposal={title,targetIds:[...ids],sourceId,mappings:mappings.map((m,i)=>({...m,id:`ai-${i}-${m.id}`}))};validatePatches(nodes,ids,mappings.flatMap(m=>m.patches));if(!mappings.some(m=>m.patches.length))throw new Error('No relevant objects inside the confirmed reference.');return proposal;
}
