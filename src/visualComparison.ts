import {comparisonSides,sideLabel} from './comparisonSides';
import type {ComparisonContext} from './collaboration';
import type {ComparisonRow,PropertyComparison} from './referencePresentation';
import type {UIElement} from './types';

const priority=['role','text','dimensions','spacing','background','color','radius','fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','border'];
export const readableMetadata=(value:string)=>value.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
export interface VisualDifference {row:ComparisonRow;groups:{label:string;user?:'A'|'B';values:string[]}[]}
/** Derive a bounded presentation from existing rows; never pair objects or mutate comparisons. */
export function visualDifferences(comparison:PropertyComparison,ownership?:ComparisonContext){
 const all:VisualDifference[]=[];
 for(const key of priority){
  const row=comparison.rows.find(row=>row.key===key&&row.state==='different');
  if(!row)continue;
  const groups=ownership?(['A','B'] as const).map(user=>({label:sideLabel(ownership,user),user:comparisonSides(ownership)[user].selectedBy,values:[...new Set(comparison.elements.flatMap((element,index)=>comparisonSides(ownership)[user].elementIds.includes(element.id)?[row.values[index]]:[]))]}))
   :[{label:'Selected references',values:[...new Set(row.values)]}];
  // A missing group is not a comparison. Equal sets can reflect variation within both
  // selections, but are not evidence of a difference between the participants.
  if(groups.some(group=>!group.values.length))continue;
  if(ownership&&groups[0].values.length===groups[1].values.length&&groups[0].values.every(value=>groups[1].values.includes(value)))continue;
  all.push({row,groups});
 }
 return {rows:all.slice(0,5),total:all.length};
}
/** Preview the selected element and its existing descendants in document order. */
export function previewElements(root:UIElement,nodes:UIElement[]){
 const children=new Map<string,UIElement[]>();
 for(const node of nodes)if(node.parent){const siblings=children.get(node.parent)||[];siblings.push(node);children.set(node.parent,siblings);}
 const ids=new Set([root.id]),descendants:UIElement[]=[];
 const visit=(parent:string)=>{for(const child of children.get(parent)||[]){if(ids.has(child.id)||descendants.length>=63)continue;ids.add(child.id);descendants.push(child);visit(child.id);}};
 visit(root.id);
 return [root,...descendants];
}
