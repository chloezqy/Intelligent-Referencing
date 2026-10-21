import React, { useEffect, useState } from 'react';
import { ComparisonContext } from '../collaboration';
import { UIElement } from '../types';
import { compareReferenceElements, ComparisonRow } from '../referencePresentation';
interface Props { ownership?:ComparisonContext; contextId:string; ids:string[]; nodes:UIElement[]; expanded:boolean }
export default function PropertyComparison({contextId,ids,nodes,expanded,ownership}:Props){
  const [isOpen,setIsOpen]=useState(expanded);
  useEffect(()=>setIsOpen(expanded),[contextId,expanded]);
  const comparison=compareReferenceElements(ids,nodes);
  if(comparison.elements.length<2)return comparison.missingIds.length?<p className="subtle">Some referenced objects are unavailable in this document.</p>:null;
  const table=(rows:ComparisonRow[],caption:string)=><div className="comparison-scroll" role="region" aria-label={caption} tabIndex={0}><table><caption className="sr-only">{caption}</caption><thead><tr><th scope="col">Property</th>{comparison.elements.map(node=><th scope="col" key={node.id}><span>{node.screen||'Unknown screen'}</span><strong>{node.text||node.label}</strong><small>{ownership?(['A','B'] as const).filter(id=>ownership.selections[id].elementIds.includes(node.id)).map(id=>`User ${id}`).join(' + '):node.id}</small></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.key} data-property={row.key}><th scope="row">{row.label}{row.state==='unavailable'&&<small>Incomplete data</small>}</th>{row.values.map((value,i)=><td key={comparison.elements[i].id}>{value}</td>)}</tr>)}</tbody></table></div>;
  const different=comparison.rows.filter(r=>r.state==='different'),matching=comparison.rows.filter(r=>r.state==='matching'),unknown=comparison.rows.filter(r=>r.state==='unavailable');
  return <details className="property-comparison" open={isOpen} onToggle={e=>setIsOpen(e.currentTarget.open)}>
    <summary>Property comparison · rule-based <span>{comparison.elements.length} objects</span></summary>
    <p className="subtle">Authored design values, independent of zoom. Differences describe properties; they do not judge design quality.</p>
    {comparison.missingIds.length>0&&<p role="status">Unavailable targets: {comparison.missingIds.join(', ')}</p>}
    <h4>Differences</h4>{different.length?table(different,'Property differences'):<p>No differences in the available properties.</p>}
    {!!unknown.length&&<details><summary>Unavailable or incomplete properties ({unknown.length})</summary>{table(unknown,'Incomplete property data')}</details>}
    {!!matching.length&&<details><summary>Matching properties ({matching.length})</summary>{table(matching,'Matching properties')}</details>}
  </details>;
}
