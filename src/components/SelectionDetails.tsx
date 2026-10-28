import React,{useState,useEffect} from 'react';
import type {UIElement} from '../types';
import {compareReferenceElements} from '../referencePresentation';
import {readableMetadata} from '../visualComparison';
import {ElementPreview} from './ReferencePreviewCard';
export default function SelectionDetails({ids,nodes}:{ids:string[];nodes:UIElement[]}){
 const comparison=compareReferenceElements(ids,nodes),selected=comparison.elements;
 const [showAll,setShowAll]=useState(false);useEffect(()=>setShowAll(false),[ids.join('|')]);
 const summaryKeys=['dimensions','background','color','radius','fontSize','fontWeight','spacing'];
 const shared=comparison.missingIds.length?[]:comparison.rows.filter(r=>summaryKeys.includes(r.key)&&r.state==='matching');
 return <section className="selection-details"><h4 className="selection-section-title">Details</h4>
  <div className="selection-preview-grid">{(showAll?selected:selected.slice(0,3)).map(node=><figure key={node.id}><div className="reference-preview-art"><ElementPreview element={node} nodes={nodes}/></div><figcaption><strong title={node.label}>{node.label}</strong><small>{readableMetadata(node.type)} · {node.screen||'Screen unavailable'} · {node.w} × {node.h} px</small></figcaption></figure>)}</div>
  {selected.length>3&&<button type="button" className="selection-more" aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?'Show fewer':`+${selected.length-3} more`}</button>}
  <p className="selection-count">{selected.length} {selected.length===1?'object':'objects'}{selected.length>1?' selected':''}</p>
  {!!shared.length&&<dl className="selection-shared-properties" aria-label={selected.length>1?'Shared recorded properties':'Recorded properties'}>{shared.map(r=><div key={r.key}><dt>{r.label}</dt><dd>{['background','color'].includes(r.key)&&/^#[0-9a-f]{3,8}$/i.test(r.values[0])&&<i className="comparison-swatch" style={{backgroundColor:r.values[0]}} aria-hidden="true"/>}{r.values[0]}</dd></div>)}</dl>}
  <details className="selection-all-properties"><summary>View all properties</summary>{selected.map(node=><div key={node.id}><strong>{node.label}</strong><dl>{compareReferenceElements([node.id],nodes).rows.filter(r=>r.state!=='unavailable').map(r=><div key={r.key}><dt>{r.label}</dt><dd>{r.values[0]}</dd></div>)}</dl></div>)}</details>
  {comparison.missingIds.length>0&&<p>{comparison.missingIds.length} unavailable objects</p>}
 </section>;
}
