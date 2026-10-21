import React from 'react';
import { InferredReference, UIElement, ScopeLevel } from '../types';
interface Props { shareLabel:string; inferredRef: InferredReference | null; nodes: UIElement[]; onScopeChange:(scope:ScopeLevel)=>void; onShare:()=>void }
export default function PropertiesPanel({shareLabel,inferredRef,nodes,onScopeChange,onShare}:Props) {
  if(!inferredRef) return <div className="selection-detail"><h3>Selection</h3><p>Select objects with V or gesture with S. Interpretation uses geometry and authored role/component metadata, not a language model.</p></div>;
  const selected=nodes.filter(n=>inferredRef.selectedIds.includes(n.id));
  return <div className="selection-detail"><h3>{inferredRef.label}</h3><p>{selected.length} objects · {inferredRef.selectionMethod==='smart-ref'?'Gesture + metadata rules':'Manual selection'}</p><div className="scope-actions">{([{scope:'exemplars',label:'Touched'},{scope:'screen',label:'Screen'},{scope:'document',label:'All Screens'}] as const).map(s=><button key={s.scope} aria-pressed={s.scope===inferredRef.scope} onClick={()=>onScopeChange(s.scope)}>{s.label}</button>)}</div><button className="primary-action" disabled={!selected.length} onClick={onShare}>{shareLabel}</button><p className="subtle">Shift-click objects in Select mode to add or remove them before sharing. Shared references keep their own object IDs.</p><ul>{selected.map(n=><li key={n.id}><span>{n.label}</span><small>{n.screen} · {n.role || n.component || n.type}</small></li>)}</ul></div>;
}
