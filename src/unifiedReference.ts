import {DESIGN_REFERENCE_PURPOSE,type DesignReference,type ComparisonContext} from './collaboration.js';
import type {UIElement} from './types.js';
import {comparisonSides,sideDirection} from './comparisonSides.js';
import {compareReferenceElements} from './referencePresentation.js';
import {EDITABLE_DIFFERENCES,resolveComparison} from './comparisonResolution.js';
import {validatePatches,descendants,internalSpacing,type EditProposal} from './editing.js';
import {tokenFacts,validateTokenSuggestions,type TokenSuggestion} from './designSystemReferencing.js';
export const referencePropertyLabels:Record<string,string>={background:'Fill color',color:'Text color',dimensions:'Size',radius:'Corner radius',border:'Border',spacing:'Card inset',shadow:'Shadow'};
export function referenceProperties(context:ComparisonContext,nodes:UIElement[],direction:'A'|'B'){
 const sides=comparisonSides(context),reference=sides[direction].elementIds,target=sides[direction==='A'?'B':'A'].elementIds;
 const comparison=compareReferenceElements([...new Set([...reference,...target])],nodes);
 const transferable=comparison.rows.filter(row=>{
  if(row.state!=='different'||reference.length!==1||!target.length)return false;
  const field=EDITABLE_DIFFERENCES[row.key];
  if(row.key!=='dimensions'&&(!field||[...reference,...target].some(id=>nodes.find(n=>n.id===id)?.[field]===undefined)))return false;
  if(row.key==='spacing'&&target.some(id=>{const n=nodes.find(n=>n.id===id);return n?.type!=='card'||n.component!=='ProductCard';}))return false;
  try{return resolveComparison(context,nodes,[row.key],direction).mappings.length>0;}catch{return false;}
 });
 const keys=new Set(transferable.map(row=>row.key));
 const other=comparison.rows.filter(row=>!keys.has(row.key)&&row.state!=='matching'&&row.values.some(value=>value!=='Not specified'));
 return {reference,target,comparison,transferable,other};
}
/** Library overrides replace only the same layer/property; the reference remains untouched. */
export function unifiedReferenceProposal(context:ComparisonContext,nodes:UIElement[],direction:'A'|'B',keys:string[],overrides:TokenSuggestion[]):EditProposal|null{
 const available=referenceProperties(context,nodes,direction),allowed=new Set(available.transferable.map(row=>row.key));
 const selected=keys.filter(key=>allowed.has(key));
 const base=selected.length?resolveComparison(context,nodes,selected,direction):undefined;
 const safe=validateTokenSuggestions(overrides,tokenFacts(available.target,nodes));
 const referenceIds=new Set(descendants(available.reference,nodes).map(n=>n.id));
 const editedIds=new Set(safe.map(s=>s.fact.targetId));
 if([...editedIds].some(id=>referenceIds.has(id)))throw Error('Reference and target overlap.');
 const layoutOverrideIds=new Set(safe.filter(s=>s.fact.property==='spacing').flatMap(s=>descendants([s.fact.targetId],nodes).map(n=>n.id)));
 const overridden=new Set(safe.map(s=>`${s.fact.targetId}:${s.fact.property}`));
 const mappings=(base?.mappings||[]).flatMap(mapping=>{
  const patches=mapping.patches.map(p=>({...p,changes:Object.fromEntries(Object.entries(p.changes).filter(([key])=>!overridden.has(`${p.id}:${key}`)&&!(mapping.id==='match-spacing'&&layoutOverrideIds.has(p.id)&&['x','y','w','h','spacing'].includes(key))))})).filter(p=>Object.keys(p.changes).length);
  return patches.length?[{...mapping,patches}]:[];
 });
 mappings.push(...safe.filter(s=>!s.fact.exact).map(s=>({id:`library-${s.fact.id}`,label:`Library: ${s.fact.tokenLabel}`,patches:[{id:s.fact.targetId,changes:{[s.fact.property]:s.fact.proposed}},...(s.fact.property==='spacing'?internalSpacing([s.fact.targetId],nodes,Number(s.fact.proposed)):[])]})));
 const cleaned=mappings.flatMap(m=>{const patches=m.patches.map(p=>({...p,changes:Object.fromEntries(Object.entries(p.changes).filter(([key,value])=>nodes.find(n=>n.id===p.id)?.[key as keyof UIElement]!==value))})).filter(p=>Object.keys(p.changes).length);return patches.length?[{...m,patches}]:[];});
 if(!cleaned.length)return null;
 const proposal={title:'Use as design reference',targetIds:available.target,sourceId:available.reference[0],mappings:cleaned};
 validatePatches(nodes,proposal.targetIds,cleaned.flatMap(m=>m.patches));return proposal;
}
export function unifiedPatches(proposal:EditProposal|null){return proposal?.mappings.flatMap(m=>m.patches)||[];}
export function referenceChangeCount(keys:string[],overrides:TokenSuggestion[],proposal:EditProposal|null){
 if(!proposal)return 0;
 const fields=new Set(unifiedPatches(proposal).flatMap(p=>Object.keys(p.changes)));
 return keys.filter(key=>key==='dimensions'?fields.has('w')||fields.has('h'):fields.has(EDITABLE_DIFFERENCES[key] as string)).length+overrides.filter(s=>unifiedPatches(proposal).some(p=>p.id===s.fact.targetId&&p.changes[s.fact.property]!==undefined)&&!keys.some(key=>EDITABLE_DIFFERENCES[key]===s.fact.property)).length;
}

export interface ReferenceShareDetails {summary:string;direction:'A'|'B';keys:string[];overrides?:TokenSuggestion[]}
/** Use existing sharing fields where available; retain unsupported categories as note context. */
export function referenceSharingContext(context:ComparisonContext,{direction,keys,overrides=[]}:ReferenceShareDetails):ComparisonContext{
 const categories=[...new Set(keys.flatMap(key=>['background','color','border'].includes(key)?['colors']:['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'].includes(key)?['typography']:key==='radius'?['cornerRadius']:key==='spacing'?['spacing']:[]))] as DesignReference['properties'];
 const {designReference:old,tokenSuggestions:oldTokens,...base}=context;
 const rest={...base,...(overrides.length?{tokenSuggestions:overrides}:{})};
 return categories.length?{...rest,purpose:DESIGN_REFERENCE_PURPOSE,designReference:{direction:sideDirection(context,direction),properties:categories}}:{...rest,purpose:'Use as design reference (comparison)'};
}
