import type {CollaborationClient} from '../collaborationClient';
import {NUDGE_DISMISSALS_KEY,parseNudgeDismissals,referenceRequestSender} from '../referenceAttention';
import {needsReferenceNotification} from '../mentions';
import React, { useState, useEffect } from 'react';
import { SharedReference, referenceLists } from '../collaboration';
import { UIElement } from '../types';
interface Props { visible?:boolean;nodes:UIElement[]; collaboration: CollaborationClient; hasDraft:boolean; onResumeDraft:()=>void; activeId: string | null; openRevision:number; onOpen: (id: string) => void; onLocate: (ref: SharedReference) => void; onClear: () => void }
export default function CollaborationPanel({ visible=true,nodes, collaboration: c, hasDraft, onResumeDraft, activeId, openRevision, onOpen, onLocate, onClear }: Props) {
  const [code, setCode] = useState(c.initialCode);
  const [copied, setCopied] = useState(false);
  const [showArchived,setShowArchived]=useState(false);
  const received = c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)).length || 0;
  useEffect(()=>{if(visible&&received>0)setShowArchived(false);},[visible]);
  const {active:activeReferences,archived:archivedReferences}=referenceLists(c.room?.references||[],ref=>needsReferenceNotification(ref,c.session?.userId));
  const listed=[...(showArchived?archivedReferences:activeReferences)].sort((a,b)=>Number(needsReferenceNotification(b,c.session?.userId))-Number(needsReferenceNotification(a,c.session?.userId))||b.createdAt.localeCompare(a.createdAt));
  return <div className="collab-panel">
    <section><label>Workspace mode<select aria-label="Workspace mode" value={c.mode} onChange={e=>{const url=new URL(location.href);url.searchParams.set('mode',e.target.value);url.searchParams.delete('room');url.searchParams.delete('join');location.assign(url.href);}}><option value="demo">Standalone demo</option><option value="realtime">Real-time collaboration</option></select></label></section>
    {c.mode==='demo'?<section><h3>Standalone demo</h3><p>Simulated collaboration · You are User {c.session?.userId}. References stay in this browser.</p><p className="subtle">Switch User A / B in the top bar to receive, view and reply manually. No automatic replies.</p><button onClick={()=>{c.resetDemo?.();try{const dismissals=parseNudgeDismissals(localStorage.getItem(NUDGE_DISMISSALS_KEY));localStorage.setItem(NUDGE_DISMISSALS_KEY,JSON.stringify(Object.fromEntries(Object.entries(dismissals).filter(([key])=>!key.startsWith('demo:')))));for(const key of Object.keys(localStorage))if(key.startsWith('sr-research-demo-')||['sr-demo-views','sr-demo-dismissed','sr-demo-perspective'].includes(key))localStorage.removeItem(key);}catch{}location.reload();}}>Reset demo</button></section>:!c.session ? <section><h3>Work together</h3><p>Create a private two-user room, or join the other person’s invitation.</p><button className="primary-action" disabled={c.busy} onClick={() => c.create()}>Create room as User A</button><form onSubmit={e => { e.preventDefault(); c.join(code); }}><label>Room link or code<input aria-label="Room link or code" value={code} onChange={e => setCode(e.target.value)} /></label><button disabled={c.busy || !code.trim()}>Join as User B</button></form></section> : <section>
      <h3>Shared workspace</h3><p className={`identity user-${c.session.userId}`}>You are User {c.session.userId} · {c.connected ? 'Connected' : 'Reconnecting / offline'}</p>
      <div className="presence-list">{(['A','B'] as const).map(user => { const member = c.room?.members.find(m => m.userId === user); return <span key={user} className={`user-${user}`}><i className={member?.online ? 'online' : ''}/>User {user} · {member ? member.online ? 'online' : 'offline' : 'not joined'}</span>; })}</div>
      <label>Invitation link<input aria-label="Invitation link" readOnly value={c.invitation} onFocus={e => e.target.select()} /></label>
      <button onClick={async () => { try { await navigator.clipboard.writeText(c.invitation); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Link copied' : 'Copy invitation link'}</button>
      <p className="subtle">Room code: {c.session.code}</p>
      {location.hostname === 'localhost' && <p className="subtle">For another computer, open this workspace using the server’s LAN address first, then copy its invitation link.</p>}
    </section>}
    {c.error && <p className="connection-error" role="alert">{c.error}</p>}
    {hasDraft&&<section><p className="subtle">You have an unsent share request.</p><button onClick={onResumeDraft}>Resume share popup</button></section>}
    {c.room && <section><h3>References {received > 0 && <span className="inbox-count">{received} unread</span>}</h3><div className="reference-filter" role="group" aria-label="Reference list filter"><button aria-pressed={!showArchived} onClick={()=>setShowArchived(false)}>Active ({activeReferences.length})</button><button aria-pressed={showArchived} onClick={()=>setShowArchived(true)}>Archived ({archivedReferences.length})</button></div>{!listed.length&&<p>{showArchived?'No archived references.':'No active references. Select objects and share a reference.'}</p>}<div className="reference-list">{listed.map(ref=>{
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
