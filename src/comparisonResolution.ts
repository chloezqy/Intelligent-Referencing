import type {ComparisonContext,DesignReference} from './collaboration';
import type {UIElement} from './types';
import {comparisonSides} from './comparisonSides';
import {matchDimensions,internalSpacing,descendants,changedPatches,validatePatches,EditProposal} from './editing';
import {compareReferenceElements} from './referencePresentation';
import {referenceTransfer} from './inspectorEditing';
export const EDITABLE_DIFFERENCES:Record<string,keyof UIElement>={background:'bg',color:'color',radius:'radius',fontSize:'fontSize',fontWeight:'fontWeight',fontFamily:'fontFamily',lineHeight:'lineHeight',letterSpacing:'letterSpacing',border:'border',spacing:'spacing'};
export function resolveComparison(context:ComparisonContext,nodes:UIElement[],keys:string[],direction:'A'|'B'):EditProposal{
 const sides=comparisonSides(context),source=sides[direction],target=sides[direction==='A'?'B':'A'];
 if(source.elementIds.length!==1||!target.elementIds.length)throw new Error('Choose one source object and at least one target. Grouped selections can still be compared or shared.');
 const from=nodes.find(n=>n.id===source.elementIds[0]);
 if(!from||target.elementIds.some(id=>{const n=nodes.find(n=>n.id===id);return !n||n.library||n.type==='screen'||descendants([id],nodes).some(child=>child.id===from.id)||descendants([from.id],nodes).some(child=>child.id===id);}))throw new Error('Choose separate editable target objects.');
 const mappings:EditProposal['mappings']=[];
 if(keys.includes('dimensions'))for(const patch of matchDimensions(target.elementIds,nodes,from.id))mappings.push({id:`size-${patch.id}`,label:`${nodes.find(n=>n.id===patch.id)?.label} · Size (contents retain layout)`,patches:[patch]});
 if(keys.includes('spacing')&&typeof from.spacing==='number'){const recorded=target.elementIds.filter(id=>{const n=nodes.find(n=>n.id===id);return n?.spacing!==undefined&&n.type==='card'&&n.component==='ProductCard';}),layout=internalSpacing(recorded,nodes,from.spacing),patches=layout.length?[...recorded.map(id=>({id,changes:{spacing:from.spacing}})),...layout]:[];if(changedPatches(nodes,patches).length)mappings.push({id:'match-spacing',label:'Recorded spacing and nested layout',patches});}
 const allowed=new Set(keys.filter(key=>key!=='spacing').map(k=>EDITABLE_DIFFERENCES[k]).filter(Boolean));
 for(const id of target.elementIds){const current=nodes.find(n=>n.id===id)!;
  for(const key of allowed){if(current[key]===undefined||from[key]===undefined)continue;const patch={id,changes:{[key]:from[key]}};if(changedPatches(nodes,[patch]).length)mappings.push({id:`match-${id}-${key}`,label:`${current.label} · ${key}`,patches:[patch]});}
 }
 const base={targetIds:target.elementIds,sourceId:from.id};
 if(!mappings.length)throw new Error('No compatible editable differences are selected.');
 const proposal={...base,title:'Resolve selected differences',mappings};validatePatches(nodes,proposal.targetIds,mappings.flatMap(m=>m.patches));return proposal;
}
export function editableDifferences(context:ComparisonContext,nodes:UIElement[]){
 const sides=comparisonSides(context),rows=compareReferenceElements([...new Set([...sides.A.elementIds,...sides.B.elementIds])],nodes).rows.filter(row=>row.state==='different'&&(EDITABLE_DIFFERENCES[row.key]||row.key==='dimensions'));
 return rows.filter(row=>(['A','B'] as const).some(direction=>{try{resolveComparison(context,nodes,[row.key],direction);return true;}catch{return false;}})).map(row=>row.key);
}
export function referencePropertyIssue(context:ComparisonContext,nodes:UIElement[],property:DesignReference['properties'][number]){
 try{const p=referenceTransfer({...context,designReference:{...context.designReference!,properties:[property]}},nodes);
 const patches=p.mappings.flatMap(m=>m.patches);if(!patches.some(p=>Object.keys(p.changes).some(key=>nodes.find(n=>n.id===p.id)?.[key as keyof UIElement]!==undefined)))return 'Recorded values are missing on the target.';
 return '';}catch(error){return /overlap/.test((error as Error).message)?'Reference and target overlap.':/one reference/.test((error as Error).message)?'Choose one reference object.':'No differing compatible recorded values.';}
}
export function reviewComparisonNote(context:ComparisonContext,nodes:UIElement[],keys:string[]){
 const sides=comparisonSides(context),comparison=compareReferenceElements([...new Set([...sides.A.elementIds,...sides.B.elementIds])],nodes);
 const rows=comparison.rows.filter(row=>keys.includes(row.key)&&row.state==='different');
 return `Please review this comparison${rows.length?': '+rows.map(row=>`${row.label}: ${row.values.join(' vs. ')}`).join('; '):' and whether its differences are intentional'}.`;
}
