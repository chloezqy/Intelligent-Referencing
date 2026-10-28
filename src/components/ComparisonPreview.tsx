import React from 'react';
import type {UIElement} from '../types';
import {applyPatches,proposalPatches,EditProposal} from '../editing';
import {ElementPreview} from './ReferencePreviewCard';
const fields:Record<string,string>={bg:'Background color',color:'Text color',border:'Border',radius:'Corner radius',w:'Width',h:'Height',fontFamily:'Font family',fontSize:'Font size',fontWeight:'Font weight',lineHeight:'Line height',letterSpacing:'Letter spacing',spacing:'Spacing',x:'Horizontal position',y:'Vertical position'};
const value=(key:string,v:unknown)=>`${v===undefined?'Not recorded':String(v)}${v!==undefined&&['radius','w','h','fontSize','letterSpacing','spacing','x','y'].includes(key)?' px':''}`;
const shortName=(node:UIElement|undefined)=>node?.label.replace(/^Product Card \((.*)\)$/,'$1').replace(/^Image · /,'')||'Selected object';
export default function ComparisonPreview({proposal,enabled,nodes,onToggle,onApply,onCancel}:{proposal:EditProposal;enabled:string[];nodes:UIElement[];onToggle:(id:string)=>void;onApply:()=>void;onCancel:()=>void}){
 const patches=proposalPatches(proposal,enabled,nodes),after=applyPatches(nodes,patches),first=nodes.find(n=>n.id===proposal.targetIds[0]),proposed=after.find(n=>n.id===first?.id);
 const description=(mapping:EditProposal['mappings'][number])=>{const keys=[...new Set(mapping.patches.flatMap(p=>Object.keys(p.changes)))];const property=keys.length===2&&keys.includes('w')&&keys.includes('h')?'Size':mapping.id==='match-spacing'?'Spacing':keys.map(key=>fields[key]||key).join(', ');return `${property} · ${shortName(nodes.find(n=>n.id===mapping.patches[0]?.id))}`;};
 return <section className="comparison-confirmation" aria-label="Preview changes">
  <header><h4>Preview changes</h4><small>{enabled.length} {enabled.length===1?'change':'changes'}</small></header>
  {proposal.mappings.length===1&&<p className="confirmation-change-title">{description(proposal.mappings[0])}</p>}
  {first&&proposed&&<div className="comparison-before-after"><div><small>Before</small><ElementPreview element={first} nodes={nodes}/></div><div><small>After</small><ElementPreview element={proposed} nodes={after}/></div></div>}
  <ul className="confirmation-changes">{proposal.mappings.map(mapping=>{
   const keys=[...new Set(mapping.patches.flatMap(p=>Object.keys(p.changes)))],name=shortName(nodes.find(n=>n.id===mapping.patches[0]?.id));
   const property=keys.length===2&&keys.includes('w')&&keys.includes('h')?'Size':mapping.id==='match-spacing'?'Spacing':keys.map(key=>fields[key]||key).join(', ');
   return <li key={mapping.id} className={enabled.includes(mapping.id)?'':'is-excluded'}>{proposal.mappings.length>1&&<div className="confirmation-change-title">{<input type="checkbox" aria-label={`Include ${property} · ${name}`} checked={enabled.includes(mapping.id)} onChange={()=>onToggle(mapping.id)}/>}<strong>{property} · {name}</strong></div>}
    <dl>{mapping.patches.flatMap(p=>Object.entries(p.changes).map(([key,next])=><div key={`${p.id}-${key}`}><dt>{fields[key]||key}</dt><dd><span>{value(key,nodes.find(n=>n.id===p.id)?.[key as keyof UIElement])}</span><span aria-label="to">→</span><span>{value(key,next)}</span></dd></div>))}</dl>
   </li>;
  })}</ul>
  <p className="confirmation-note">No changes applied yet.</p>
  <div className="confirmation-actions"><button type="button" className="primary-action" disabled={!enabled.length} onClick={onApply}>Apply changes</button><button type="button" onClick={onCancel}>Cancel</button></div>
 </section>;
}
