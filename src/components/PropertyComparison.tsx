import {comparisonSides,sideLabel} from '../comparisonSides';
import React, { useEffect, useState } from 'react';
import {Ruler,Palette,Type,MousePointer2,Scan,Square,Weight,CaseSensitive} from 'lucide-react';
import {visualDifferences,readableMetadata} from '../visualComparison';
import { ComparisonContext } from '../collaboration';
import { UIElement } from '../types';
import { compareReferenceElements, ComparisonRow } from '../referencePresentation';
interface Props { ownership?:ComparisonContext; contextId:string; ids:string[]; nodes:UIElement[]; expanded:boolean; compact?:boolean;visual?:boolean }
export default function PropertyComparison({contextId,ids,nodes,expanded,ownership,compact=false,visual=false}:Props){
  const [isOpen,setIsOpen]=useState(expanded);
  useEffect(()=>setIsOpen(expanded),[contextId,expanded]);
  const comparison=compareReferenceElements(ids,nodes);
  if(comparison.elements.length<2&&!visual)return comparison.missingIds.length?<p className="subtle">Some referenced objects are unavailable in this document.</p>:null;
  const readable=(value:string,key:string)=>compact&&!visual&&['role','component','type'].includes(key)?value.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase()):value;
  const table=(rows:ComparisonRow[],caption:string)=><div className="comparison-scroll" role="region" aria-label={caption} tabIndex={0}><table><caption className="sr-only">{caption}</caption><thead><tr><th scope="col">Property</th>{comparison.elements.map(node=><th scope="col" key={node.id}><span>{node.screen||'Unknown screen'}</span><strong>{node.text||node.label}</strong><small>{ownership?(['A','B'] as const).filter(id=>comparisonSides(ownership)[id].elementIds.includes(node.id)).map(id=>sideLabel(ownership,id)).join(' + '):node.id}</small></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.key} data-property={row.key}><th scope="row">{row.label}{row.state==='unavailable'&&<small>Incomplete data</small>}</th>{row.values.map((value,i)=><td key={comparison.elements[i].id}>{readable(value,row.key)}</td>)}</tr>)}</tbody></table></div>;
  // Presentation only: read availability from metadata, not the displayed missing-value
  // placeholder (which could itself be legitimate recorded text).
  const hasRecordedValue=(row:ComparisonRow)=>comparison.elements.some(node=>row.key==='location'
    ?nodes.some(frame=>frame.type==='screen'&&frame.screen===node.screen)
    :node[(row.key==='background'?'bg':row.key) as keyof UIElement]!==undefined);
  const different=comparison.rows.filter(r=>r.state==='different'),matching=comparison.rows.filter(r=>r.state==='matching'),unknown=comparison.rows.filter(r=>r.state==='unavailable'&&hasRecordedValue(r));
  if(visual){
   const summary=visualDifferences(comparison,ownership);
   const icons:Record<string,typeof Ruler>={role:MousePointer2,text:Type,dimensions:Ruler,background:Palette,color:Palette,radius:Square,fontSize:CaseSensitive,fontWeight:Weight,border:Scan};
   const labels:Record<string,string>={background:'Fill',color:'Text color',dimensions:'Size',radius:'Corners'};
   return <section className="visual-properties" aria-label="Comparison details">
    <header><h4>Comparison details</h4><span>{comparison.elements.length<2?'One selection':different.length?`${different.length} recorded ${different.length===1?'difference':'differences'}`:unknown.length||comparison.missingIds.length?'Partial comparison':'Recorded values match'}</span></header>
    {summary.rows.length?<ul className="visual-differences">{summary.rows.map(({row,groups})=>{
     const Icon=icons[row.key]||Square;
     return <li key={row.key} data-summary-property={row.key}><div className="difference-label"><Icon size={15} aria-hidden="true"/><strong>{labels[row.key]||row.label}</strong></div>
      <div className="difference-groups">{groups.map((group,index)=><div className={group.user?`user-${group.user}`:''} key={index}><small>{group.label}</small><div className="difference-values">{group.values.slice(0,2).map(value=><span className="difference-value" key={value}>
       {['background','color'].includes(row.key)&&/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%a-z]+\)|transparent)$/i.test(value)&&<i className="comparison-swatch" style={{backgroundColor:value}} aria-hidden="true"/>}
       <span>{row.key==='role'?readableMetadata(value):value||'Empty text'}</span>
      </span>)}{group.values.length>2&&<span className="difference-more">+{group.values.length-2} more</span>}</div></div>)}</div>
     </li>;
    })}</ul>:<p className="no-visual-differences">{comparison.elements.length<2?'Select another object to compare; available editing actions are below.':different.length?'Differences are available in detailed properties.':unknown.length||comparison.missingIds.length?'Some properties cannot be compared because values are missing.':'No differences in the recorded values.'}</p>}
    {summary.total>5&&<p className="subtle">{summary.total-5} more differences in detailed properties.</p>}
    {comparison.missingIds.length>0&&<p className="subtle" role="status">{comparison.missingIds.length} referenced {comparison.missingIds.length===1?'element is':'elements are'} unavailable.</p>}
    <details key={contextId} className="visual-property-details"><summary>View detailed properties</summary>
     {different.length?table(different,'Property differences'):<p>No differences in the available properties.</p>}
     {!!matching.length&&<details><summary>Matching properties ({matching.length})</summary>{table(matching,'Matching properties')}</details>}
    </details>
    {!!unknown.length&&<details key={`incomplete-${contextId}`} className="incomplete-properties"><summary>Show {unknown.length} incomplete {unknown.length===1?'property':'properties'}</summary>{table(unknown,'Incomplete property data')}</details>}
   </section>;
  }
  return <details className={`property-comparison ${compact?'compact-comparison':''}`} open={isOpen} onToggle={e=>setIsOpen(e.currentTarget.open)}>
    <summary>{compact?'Properties':'Property comparison · rule-based'} <span>{compact?'Authored values':`${comparison.elements.length} objects`}</span></summary>
    {!compact&&<p className="subtle">Authored design values, independent of zoom. Differences describe properties; they do not judge design quality.</p>}
    {comparison.missingIds.length>0&&<p role="status">Unavailable targets: {comparison.missingIds.join(', ')}</p>}
    {!compact&&<h4>Differences</h4>}{different.length?table(different,'Property differences'):<p>No differences in the available properties.</p>}
    {!!matching.length&&<details><summary>Matching properties ({matching.length})</summary>{table(matching,'Matching properties')}</details>}
    {!!unknown.length&&<details key={contextId} className="incomplete-properties"><summary>Show {unknown.length} incomplete {unknown.length===1?'property':'properties'}</summary>{table(unknown,'Incomplete property data')}</details>}
  </details>;
}
