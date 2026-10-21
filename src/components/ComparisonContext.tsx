import React from 'react';
import { ComparisonContext as Context, UserId } from '../collaboration';
import { UIElement } from '../types';
interface Props {context:Context;nodes:UIElement[];user?:UserId;onPurpose?:(purpose:string)=>void}
export default function ComparisonContext({context,nodes,user,onPurpose}:Props){return <div className="comparison-context">
 <h4>Context suggestions · rule-based</h4><p>{context.interpretation.summary}</p>
 <ul>{context.interpretation.evidence.map(e=><li key={e}>{e}</li>)}</ul>
 <div className="comparison-participants">{(['A','B'] as const).map(id=><div key={id} className={`user-${id}`}><strong>{id===user?'Your selection':`User ${id}’s selection`}</strong><p>{context.selections[id].elementIds.length} objects · {[...new Set(nodes.filter(n=>context.selections[id].elementIds.includes(n.id)).map(n=>n.screen))].join(', ')}</p></div>)}</div>
 {onPurpose?<><label>Comparison purpose<input aria-label="Comparison purpose" maxLength={300} value={context.purpose} onChange={e=>onPurpose(e.target.value)}/></label><div className="purpose-suggestions">{context.interpretation.purposes.map(p=><button type="button" key={p} aria-pressed={context.purpose===p} onClick={()=>onPurpose(p)}>{p}</button>)}</div></>:<p><strong>Purpose:</strong> {context.purpose}</p>}
 </div>;}
