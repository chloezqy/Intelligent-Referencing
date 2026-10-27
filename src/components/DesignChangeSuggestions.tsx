import type {UIElement} from '../types';
import React from 'react';
import {Sparkles} from 'lucide-react';
import type {ComparisonContext,DesignReference,SharedReference} from '../collaboration';
import type {CollaborationClient} from '../collaborationClient';
import type {ProposedDesignChange} from '../designChanges';
import {useDesignChangeSuggestions} from '../useDesignChangeSuggestions';
function ChangeDetails({change}:{key?:string;change:ProposedDesignChange}){
 return <><strong>{change.title}</strong><p>{change.explanation}</p><div className="proposed-change-values">{change.facts.map(f=><small key={f.id}>{f.property} · Reference: {f.referenceValue} · Target: {f.targetValue}</small>)}</div></>;
}
export function DraftDesignChanges({context,onChange,nodes}:{nodes?:UIElement[];context:ComparisonContext;onChange:(value:DesignReference)=>void}){
 const ai=useDesignChangeSuggestions(context,onChange,nodes),selected=context.designReference?.proposedChanges||[];
 // Checked proposals persist in the draft across closing/resuming the inspector.
 const proposals=ai.proposals.length?ai.proposals:selected;
 return <section className="design-change-suggestions" aria-label="Suggested changes"><div className="suggested-changes-heading"><h4><Sparkles size={14} aria-hidden="true"/> Suggested changes</h4><button type="button" disabled={ai.loading||!context.designReference?.properties.length} onClick={()=>void ai.request()}>{ai.loading?'Suggesting…':'Suggest changes'}</button></div>
 {context.designReference?.properties.includes('spacing')&&<p className="subtle">Spacing suggestions require recorded values on both sides.</p>}
 {ai.message&&<p className="subtle" role="status">{ai.message}</p>}
 {proposals.map(change=><label className="proposed-change" key={change.id}><input type="checkbox" checked={selected.some(s=>s.id===change.id)} onChange={e=>ai.toggle(change,e.target.checked)}/><div><span className="proposed-change-source">AI suggestion</span><ChangeDetails change={change}/></div></label>)}
 <p className="proposed-change-count" aria-live="polite">{selected.length} proposed {selected.length===1?'change':'changes'} selected</p>
 </section>;
}
export function SharedDesignChanges({reference,collaboration:c}:{reference:SharedReference;collaboration:CollaborationClient}){
 const changes=reference.comparison?.designReference?.proposedChanges;if(!changes?.length)return null;
 const canDecide=c.session?.userId===reference.targetUser&&!reference.archivedAt&&reference.status!=='reviewed';
 return <section className="design-change-suggestions" aria-label="Proposed changes"><h4><Sparkles size={14} aria-hidden="true"/> Proposed changes <small>AI suggestions · selected by sender</small></h4>{changes.map(change=><div className="proposed-change shared-change" key={change.id}><ChangeDetails change={change}/><div className="proposed-change-review"><span role="status">{change.status==='pending'?'Pending':change.status==='accepted'?'Accepted':'Dismissed'}</span>{canDecide&&<><button type="button" disabled={c.busy||!c.connected} aria-pressed={change.status==='accepted'} onClick={()=>void c.decideChange(reference.id,change.id,'accepted')}>Accept</button><button type="button" disabled={c.busy||!c.connected} aria-pressed={change.status==='dismissed'} onClick={()=>void c.decideChange(reference.id,change.id,'dismissed')}>Dismiss</button></>}</div></div>)}</section>;
}
