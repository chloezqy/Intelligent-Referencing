import React from 'react';
import { InferredReference, UIElement, ScopeLevel } from '../types';
interface Props { shareLabel:string; inferredRef: InferredReference | null; nodes: UIElement[]; onScopeChange:(scope:ScopeLevel)=>void; onShare:()=>void }
export default function PropertiesPanel({shareLabel,inferredRef,nodes,onScopeChange,onShare}:Props) {
  if(!inferredRef) return <div className="selection-detail"><h3>Selection</h3><p>Select objects with V or gesture with S. Rough Reference (R) asks AI to interpret a gesture, then lets you confirm its targets.</p></div>;
  const selected=nodes.filter(n=>inferredRef.selectedIds.includes(n.id));
  return <div className="selection-detail"><h3>{inferredRef.label}</h3><p>{selected.length} objects · {inferredRef.selectionMethod==='smart-ref'?'Confirmed AI reference':'Manual selection'}</p><button className="primary-action" disabled={!selected.length} onClick={onShare}>{shareLabel}</button><p className="subtle">Shift-click objects in Select mode to add or remove them before sharing. Shared references keep their own object IDs.</p><ul>{selected.map(n=><li key={n.id}><span>{n.label}</span><small>{n.screen} · {n.role || n.component || n.type}</small></li>)}</ul></div>;
}
