import {tokenFacts} from './designSystemReferencing';
import type {ComparisonContext} from './collaboration';
import {DESIGN_REFERENCE_PURPOSE} from './collaboration';
import {comparisonSides,referenceSides} from './comparisonSides';
import type {UIElement} from './types';
import {roots,textTargets,descendants,layoutPatches,libraryProposal,matchStyles,validatePatches,EditProposal,Patch} from './editing';
export type InspectorAction='Align'|'Match Styles'|'Typography'|'Colors'|'Design System'|'Ask AI';
const categories={typography:['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'],colors:['bg','color','border'],spacing:['spacing'],cornerRadius:['radius']};
export function inspectorTargets(context:ComparisonContext|undefined,ids:string[]){return context?.purpose===DESIGN_REFERENCE_PURPOSE?referenceSides(context).target.elementIds:ids;}
function overlappingReference(context:ComparisonContext,nodes:UIElement[]){const sides=referenceSides(context),sources=new Set(descendants(sides.reference.elementIds,nodes).map(n=>n.id));return descendants(sides.target.elementIds,nodes).some(n=>sources.has(n.id));}
export function inspectorActions(ids:string[],nodes:UIElement[],context?:ComparisonContext){
 const selected=roots(ids,nodes).filter(n=>!n.library),compatible=selected.every(n=>n.type===selected[0]?.type&&n.role===selected[0]?.role);
 const sides=context?comparisonSides(context):undefined;
 const all=context?roots([...sides!.A.elementIds,...sides!.B.elementIds],nodes):selected;
 const sameKinds=all.every(n=>n.type===all[0]?.type&&n.role===all[0]?.role);
 const design=context?.purpose===DESIGN_REFERENCE_PURPOSE,properties=context?.designReference?.properties||[];
 const actions:InspectorAction[]=[];
 if(design&&overlappingReference(context!,nodes))return {actions,reason:'Reference and target overlap. Compare them here, or select separate target objects before editing.'};
 if(!selected.length)return {actions,reason:'No editable target objects are selected.'};
 if(!design&&!sameKinds)return {actions,reason:'These objects have different roles or types. You can inspect their differences; select corresponding elements to edit them together.'};
 if(!compatible)return {actions,reason:'The targets have different roles or types. Select corresponding target elements for editing.'};
 if(!design){try{layoutPatches(ids,nodes,'left');actions.push('Align');}catch{} }
 if(design){try{referenceTransfer(context!,nodes);actions.push('Match Styles');}catch{}}else if(nodes.some(source=>{if(ids.includes(source.id)||source.type!==selected[0].type)return false;try{return matchStyles(ids,nodes,source.id).mappings.length>0;}catch{return false;}}))actions.push('Match Styles');
 if((!design||properties.includes('typography'))&&textTargets(ids,nodes,'all').length)actions.push('Typography');
 if((!design||properties.includes('colors'))&&descendants(ids,nodes).some(n=>n.bg!==undefined||n.color!==undefined||n.border!==undefined))actions.push('Colors');
 if(tokenFacts(ids,nodes).length)actions.push('Design System');
 if(!design&&ids.length<=512)actions.push('Ask AI');
 return {actions,reason:!sameKinds?'The reference and target have different roles or types. Only applicable property actions are offered; select corresponding elements for broader style matching.':''};
}
export function referenceTransfer(context:ComparisonContext,nodes:UIElement[]):EditProposal{
 if(overlappingReference(context,nodes))throw new Error('Reference and target overlap. Choose separate objects before editing.');
 const sides=referenceSides(context);if(sides.reference.elementIds.length!==1)throw new Error('Choose one reference object for style transfer; grouped references can still be compared or shared.');
 const original=matchStyles(sides.target.elementIds,nodes,sides.reference.elementIds[0]);
 const allowed=new Set((context.designReference?.properties||[]).flatMap(key=>categories[key]));
 const mappings=original.mappings.map(m=>({...m,patches:m.patches.map(p=>({id:p.id,changes:Object.fromEntries(Object.entries(p.changes).filter(([key])=>allowed.has(key)||context.designReference?.properties.includes('spacing')&&m.id==='match-spacing'))})).filter(p=>Object.keys(p.changes).length)})).filter(m=>m.patches.length);
 if(!mappings.length)throw new Error('No recorded reference values match the chosen properties and target objects.');
 return {...original,title:'Match selected reference properties',mappings};
}
export function proposedReferenceEdits(context:ComparisonContext,nodes:UIElement[]):EditProposal{
 if(overlappingReference(context,nodes))throw new Error('Reference and target overlap. Choose separate objects before editing.');
 const sides=referenceSides(context),changes=context.designReference?.proposedChanges||[];
 const keys:Record<string,keyof UIElement>={'Font size':'fontSize','Font weight':'fontWeight','Text color':'color','Background':'bg','Corner radius':'radius','Spacing':'spacing'};
 const mappings=changes.map(change=>({id:change.id,label:change.title,patches:change.facts.map(f=>{
  const source=nodes.find(n=>n.id===f.referenceId),target=nodes.find(n=>n.id===f.targetId),key=keys[f.property];
  if(!source||!target||!key||source[key]===undefined||target[key]===undefined||!context.designReference!.properties.includes(f.category))throw new Error('Suggestion values are no longer available. Request suggestions again.');
  const format=(v:unknown)=>`${v}${['fontSize','radius','spacing'].includes(key)?' px':''}`;
  if(format(source[key])!==f.referenceValue||format(target[key])!==f.targetValue)throw new Error('Objects changed since this suggestion. Request suggestions again.');
  return {id:target.id,changes:{[key]:source[key]}} as Patch;
 })}));
 if(!mappings.length)throw new Error('Select proposed changes to preview.');
 const proposal={title:'Proposed reference changes',targetIds:sides.target.elementIds,mappings};validatePatches(nodes,proposal.targetIds,mappings.flatMap(m=>m.patches));return proposal;
}
