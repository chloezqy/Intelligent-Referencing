import type {CollaborationClient} from '../collaborationClient';
import {NUDGE_DISMISSALS_KEY,parseNudgeDismissals,referenceRequestSender} from '../referenceAttention';
import {needsReferenceNotification} from '../mentions';
import {RotateCcw} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { SharedReference, referenceLists } from '../collaboration';
import { UIElement,InferredReference } from '../types';
interface Props {selection?:InferredReference|null;onLocateSelection?:()=>void;studyActive?:boolean;onStudyReset?:()=>void; visible?:boolean;nodes:UIElement[]; collaboration: CollaborationClient; hasDraft:boolean; onResumeDraft:()=>void; activeId: string | null; openRevision:number; onOpen: (id: string) => void; onLocate: (ref: SharedReference) => void; onClear: () => void }
export default function CollaborationPanel({ selection,onLocateSelection,studyActive=false,onStudyReset,visible=true,nodes, collaboration: c, hasDraft, onResumeDraft, activeId, openRevision, onOpen, onLocate, onClear }: Props) {
  const [code, setCode] = useState(c.initialCode);
  const [copied, setCopied] = useState(false);
  const [showArchived,setShowArchived]=useState(false);
  const selectedNodes=[...new Set(selection?.selectedIds||[])].flatMap(id=>{const node=nodes.find(n=>n.id===id&&n.type!=='screen');return node?[node]:[];});
  const selectionKey=selectedNodes.map(n=>n.id).join('|');
  useEffect(()=>{if(selectionKey)setShowArchived(false);},[selectionKey]);
  const received = c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)).length || 0;
  useEffect(()=>{if(visible&&received>0)setShowArchived(false);},[visible]);
  const {active:activeReferences,archived:archivedReferences}=referenceLists(c.room?.references||[],ref=>needsReferenceNotification(ref,c.session?.userId));
  const listed=[...(showArchived?archivedReferences:activeReferences)].sort((a,b)=>Number(needsReferenceNotification(b,c.session?.userId))-Number(needsReferenceNotification(a,c.session?.userId))||b.createdAt.localeCompare(a.createdAt));
  return <div className="collab-panel">
    {c.mode!=='demo'&&<section><label>Workspace mode<select disabled={studyActive} aria-label="Workspace mode" value={c.mode} onChange={e=>{const url=new URL(location.href);url.searchParams.set('mode',e.target.value);url.searchParams.delete('room');url.searchParams.delete('join');location.assign(url.href);}}><option value="demo">Standalone demo</option><option value="realtime">Real-time collaboration</option></select></label></section>}
    {c.mode==='demo'?null:!c.session ? <section><h3>Work together</h3><p>Create a private two-user room, or join the other person’s invitation.</p><button className="primary-action" disabled={c.busy} onClick={() => c.create()}>Create room as User A</button><form onSubmit={e => { e.preventDefault(); c.join(code); }}><label>Room link or code<input aria-label="Room link or code" value={code} onChange={e => setCode(e.target.value)} /></label><button disabled={c.busy || !code.trim()}>Join as User B</button></form></section> : <section>
      <h3>Shared workspace</h3><p className={`identity user-${c.session.userId}`}>You are User {c.session.userId} · {c.connected ? 'Connected' : 'Reconnecting / offline'}</p>
      <div className="presence-list">{(['A','B'] as const).map(user => { const member = c.room?.members.find(m => m.userId === user); return <span key={user} className={`user-${user}`}><i className={member?.online ? 'online' : ''}/>User {user} · {member ? member.online ? 'online' : 'offline' : 'not joined'}</span>; })}</div>
      <label>Invitation link<input aria-label="Invitation link" readOnly value={c.invitation} onFocus={e => e.target.select()} /></label>
      <button onClick={async () => { try { await navigator.clipboard.writeText(c.invitation); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Link copied' : 'Copy invitation link'}</button>
      <p className="subtle">Room code: {c.session.code}</p>
      {location.hostname === 'localhost' && <p className="subtle">For another computer, open this workspace using the server’s LAN address first, then copy its invitation link.</p>}
    </section>}
    {c.mode==='demo'&&!c.room&&<p className="references-loading" role="status">Loading references…</p>}
    {c.error && <p className="connection-error" role="alert">{c.error}</p>}
    {hasDraft&&<section><p className="subtle">You have an unsent share request.</p><button onClick={onResumeDraft}>Resume share popup</button></section>}
    {(c.room||selectedNodes.length>0) && <section><div className="references-section-header"><h3>References {received > 0 && <span className="inbox-count">{received} unread</span>}</h3>{c.mode==='demo'&&<button type="button" className="reset-demo-action" onClick={()=>{if(onStudyReset){onStudyReset();return;}c.resetDemo?.();try{const dismissals=parseNudgeDismissals(localStorage.getItem(NUDGE_DISMISSALS_KEY));localStorage.setItem(NUDGE_DISMISSALS_KEY,JSON.stringify(Object.fromEntries(Object.entries(dismissals).filter(([key])=>!key.startsWith('demo:')))));for(const key of Object.keys(localStorage))if(key.startsWith('sr-research-demo-')||['sr-demo-views','sr-demo-dismissed','sr-demo-perspective'].includes(key))localStorage.removeItem(key);}catch{}location.reload();}}><RotateCcw size={13}/>Reset demo</button>}</div><div className="reference-filter" role="group" aria-label="Reference list filter"><button aria-pressed={!showArchived} onClick={()=>setShowArchived(false)}>Active ({activeReferences.length+(selectedNodes.length?1:0)})</button><button aria-pressed={showArchived} onClick={()=>setShowArchived(true)}>Archived ({archivedReferences.length})</button></div>{!listed.length&&(showArchived||!selectedNodes.length)&&<p>{showArchived?'No archived references.':'No active references. Select layers to see them here.'}</p>}<div className="reference-list">{!showArchived&&selectedNodes.length>0&&<button type="button" className="selected reference-current-selection" aria-label="Current selection" onClick={onLocateSelection}>
  <span className="reference-selection-status">Current selection</span>
  <strong>{selection?.label||selectedNodes.map(node=>node.label).join(', ')}</strong>
  <span>{selectedNodes.slice(0,3).map(node=>node.label).join(' · ')}{selectedNodes.length>3?` · +${selectedNodes.length-3} more`:''}</span>
  <small>{[...new Set(selectedNodes.flatMap(node=>node.screen?[node.screen]:[]))].join(', ')} · {selectedNodes.length} {selectedNodes.length===1?'layer':'layers'}</small>
 </button>}{listed.map(ref=>{
 const unread=needsReferenceNotification(ref,c.session?.userId),sender=referenceRequestSender(ref,c.session?.userId);
 const screens=[...new Set(nodes.filter(node=>ref.elementIds.includes(node.id)).flatMap(node=>node.screen?[node.screen]:[]))];
 const viewed=ref.activity?.some(event=>event.userId===c.session?.userId&&event.kind==='opened');
 return <button key={ref.id} data-reference-id={ref.id} data-unread={unread} className={`${activeId===ref.id?'selected':''} ${unread?'unread-reference':''}`} onClick={()=>onOpen(ref.id)}>
  <span className={`reference-request-header user-${sender}`}>User {sender}{sender===c.session?.userId?' · You':' sent a request'}{unread&&<strong className="reference-unread-label"><i aria-hidden="true"/>Unread</strong>}</span>
  <strong>{ref.intent}{ref.comparison?.purpose?` · ${ref.comparison.purpose}`:''}</strong>
  <span>{ref.label}</span>
  <small>{screens.join(', ')||'Screen unavailable'} · {ref.elementIds.length} {ref.elementIds.length===1?'object':'objects'}</small>
  <small>{unread?'View requested':ref.archivedAt?'Archived':ref.status==='reviewed'?'Reviewed':viewed?'Viewed · Awaiting review':'Awaiting review'} · {new Date(ref.createdAt).toLocaleString()}</small>
 </button>;
})}</div></section>}

  </div>;
}
