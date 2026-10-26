import React from 'react';
import ReferencePreviewCard from './ReferencePreviewCard';
import { ComparisonContext as Context, UserId } from '../collaboration';
import { UIElement } from '../types';
interface Props {context:Context;nodes:UIElement[];user?:UserId;onPurpose?:(purpose:string)=>void;compact?:boolean;visual?:boolean}
export function ComparisonPurpose({context,onPurpose}:{context:Context;onPurpose:(purpose:string)=>void}){
 return <label>Comparison purpose<input aria-label="Comparison purpose" maxLength={300} value={context.purpose} onChange={e=>onPurpose(e.target.value)}/></label>;
}
export default function ComparisonContext({context,nodes,user,onPurpose,compact=false,visual=false}:Props){
 if(visual)return <div className="visual-comparison-context">
  <div className="reference-card-pair">{(['A','B'] as const).map(id=><ReferencePreviewCard key={id} ids={context.selections[id].elementIds} nodes={nodes} user={id} self={user}/>)}</div>
  <section className="comparison-insight" aria-label="Rule-based insight"><h4>Rule-based insight</h4><p>{context.interpretation.summary}</p></section>
 </div>;
 const participants=<div className="comparison-participants">{(['A','B'] as const).map(id=><div key={id} className={`user-${id}`}><strong>{id===user?'Your selection':`User ${id}’s selection`}</strong><p>{context.selections[id].elementIds.length} {context.selections[id].elementIds.length===1?'object':'objects'} · {[...new Set(nodes.filter(n=>context.selections[id].elementIds.includes(n.id)).map(n=>n.screen))].join(', ')}</p></div>)}</div>;
 return <div className={`comparison-context ${compact?'compact-context':''}`}>
 {compact&&participants}
 <div className="comparison-relationship"><h4>{compact?'Relationship · rule-based':'Context suggestions · rule-based'}</h4><p>{context.interpretation.summary}</p></div>
 {!compact&&<><ul>{context.interpretation.evidence.map(e=><li key={e}>{e}</li>)}</ul>{participants}{onPurpose?<ComparisonPurpose context={context} onPurpose={onPurpose}/>:<p><strong>Purpose:</strong> {context.purpose}</p>}</>}
 </div>;
}
