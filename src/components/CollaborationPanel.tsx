import React, { useState } from 'react';
import { SharedReference } from '../collaboration';
import { UIElement } from '../types';
import { useCollaboration } from '../useCollaboration';
interface Props { nodes:UIElement[]; collaboration: ReturnType<typeof useCollaboration>; hasDraft:boolean; onResumeDraft:()=>void; activeId: string | null; openRevision:number; onOpen: (id: string) => void; onLocate: (ref: SharedReference) => void; onClear: () => void }
export default function CollaborationPanel({ nodes, collaboration: c, hasDraft, onResumeDraft, activeId, openRevision, onOpen, onLocate, onClear }: Props) {
  const [code, setCode] = useState(c.initialCode);
  const [copied, setCopied] = useState(false);
  const [showArchived,setShowArchived]=useState(false);
  const received = c.room?.references.filter(r => r.targetUser === c.session?.userId && r.status === 'open' && !r.archivedAt).length || 0;
  const activeReferences=c.room?.references.filter(r=>!r.archivedAt)||[],archivedReferences=c.room?.references.filter(r=>r.archivedAt)||[];
  const listed=showArchived?archivedReferences:activeReferences;
  return <div className="collab-panel">
    {!c.session ? <section><h3>Work together</h3><p>Create a private two-user room, or join the other person’s invitation.</p><button className="primary-action" disabled={c.busy} onClick={() => c.create()}>Create room as User A</button><form onSubmit={e => { e.preventDefault(); c.join(code); }}><label>Room link or code<input aria-label="Room link or code" value={code} onChange={e => setCode(e.target.value)} /></label><button disabled={c.busy || !code.trim()}>Join as User B</button></form></section> : <section>
      <h3>Shared workspace</h3><p className={`identity user-${c.session.userId}`}>You are User {c.session.userId} · {c.connected ? 'Connected' : 'Reconnecting / offline'}</p>
      <div className="presence-list">{(['A','B'] as const).map(user => { const member = c.room?.members.find(m => m.userId === user); return <span key={user} className={`user-${user}`}><i className={member?.online ? 'online' : ''}/>User {user} · {member ? member.online ? 'online' : 'offline' : 'not joined'}</span>; })}</div>
      <label>Invitation link<input aria-label="Invitation link" readOnly value={c.invitation} onFocus={e => e.target.select()} /></label>
      <button onClick={async () => { try { await navigator.clipboard.writeText(c.invitation); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Link copied' : 'Copy invitation link'}</button>
      <p className="subtle">Room code: {c.session.code}</p>
      {location.hostname === 'localhost' && <p className="subtle">For another computer, open this workspace using the server’s LAN address first, then copy its invitation link.</p>}
    </section>}
    {c.error && <p className="connection-error" role="alert">{c.error}</p>}
    {hasDraft&&<section><p className="subtle">You have an unsent share request.</p><button onClick={onResumeDraft}>Resume share popup</button></section>}
    {c.room && <section><h3>References {received > 0 && <span className="inbox-count">{received} to review</span>}</h3><div className="reference-filter" role="group" aria-label="Reference list filter"><button aria-pressed={!showArchived} onClick={()=>setShowArchived(false)}>Active ({activeReferences.length})</button><button aria-pressed={showArchived} onClick={()=>setShowArchived(true)}>Archived ({archivedReferences.length})</button></div>{!listed.length&&<p>{showArchived?'No archived references.':'No active references. Select objects and share a reference, or restore one from Archived.'}</p>}<div className="reference-list">{[...listed].reverse().map(ref => <button key={ref.id} className={activeId === ref.id ? 'selected' : ''} onClick={() => { onOpen(ref.id); }}><span className={`user-${ref.sourceUser}`}>User {ref.sourceUser} → User {ref.targetUser}</span><strong>{ref.intent} · {ref.elementIds.length} objects</strong><span>{ref.label}</span><small>{ref.archivedAt?'Archived':ref.status==='reviewed'?'Reviewed':'Awaiting review'} · {new Date(ref.createdAt).toLocaleString()}</small></button>)}</div></section>}

  </div>;
}
