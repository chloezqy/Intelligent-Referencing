import {ElementPreview} from './ReferencePreviewCard';
import {conversationTime} from './ReferenceConversation';
import type {CollaborationClient} from '../collaborationClient';
import {NUDGE_DISMISSALS_KEY,parseNudgeDismissals} from '../referenceAttention';
import {needsReferenceNotification} from '../mentions';
import {RotateCcw,MoreHorizontal,ChevronRight} from 'lucide-react';
import React, { useState, useEffect,useRef } from 'react';
import { SharedReference, referenceLists } from '../collaboration';
import { UIElement,InferredReference } from '../types';
interface Props {selection?:InferredReference|null;onLocateSelection?:()=>void;studyActive?:boolean;onStudyReset?:()=>void; visible?:boolean;nodes:UIElement[]; collaboration: CollaborationClient; hasDraft:boolean; onResumeDraft:()=>void; activeId: string | null; openRevision:number; onOpen: (id: string) => void; onLocate: (ref: SharedReference) => void; onClear: () => void }
export default function CollaborationPanel({ selection,onLocateSelection,studyActive=false,onStudyReset,visible=true,nodes, collaboration: c, hasDraft, onResumeDraft, activeId, openRevision, onOpen, onLocate, onClear }: Props) {
  const overflowHost=useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(c.initialCode);
  const [copied, setCopied] = useState(false);
  const [showArchived,setShowArchived]=useState(false),[overflow,setOverflow]=useState(false),[now,setNow]=useState(Date.now);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if(!overflow)return;const outside=(e:PointerEvent)=>{if(!overflowHost.current?.contains(e.target as Node))setOverflow(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[overflow]);
  const selectedNodes=[...new Set(selection?.selectedIds||[])].flatMap(id=>{const node=nodes.find(n=>n.id===id);return node?[node]:[];});
  const selectionKey=selectedNodes.map(n=>n.id).join('|');
  useEffect(()=>{if(selectionKey)setShowArchived(false);},[selectionKey]);
  const received = c.room?.references.filter(r=>needsReferenceNotification(r,c.session?.userId)).length || 0;
  useEffect(()=>{if(visible&&received>0)setShowArchived(false);},[visible]);
  const {active:activeReferences,archived:archivedReferences}=referenceLists(c.room?.references||[],ref=>needsReferenceNotification(ref,c.session?.userId));
  const listed=[...(showArchived?archivedReferences:activeReferences)].sort((a,b)=>Number(needsReferenceNotification(b,c.session?.userId))-Number(needsReferenceNotification(a,c.session?.userId))||b.createdAt.localeCompare(a.createdAt));
  return <div className="collab-panel shared-reference-panel">
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
    {hasDraft&&<section><p className="subtle">You have an unsent share request.</p><button type="button" className="secondary-action" onClick={onResumeDraft}>Continue sharing</button></section>}
    {(c.room||selectedNodes.length>0) && <section><div className="reference-tabs-bar"><div className="reference-filter" role="tablist" aria-label="Reference list filter" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?false:e.key==='End'?true:!showArchived;setShowArchived(next);(e.currentTarget.querySelectorAll('[role=tab]')[next?1:0] as HTMLButtonElement)?.focus();}}}><button type="button" role="tab" aria-selected={!showArchived} onClick={()=>setShowArchived(false)}>Active ({activeReferences.length})</button><button type="button" role="tab" aria-selected={showArchived} onClick={()=>setShowArchived(true)}>Resolved ({archivedReferences.length})</button></div>{c.mode==='demo'&&<div className="references-overflow" ref={overflowHost}><button type="button" aria-label="Reference options" aria-expanded={overflow} aria-haspopup="menu" onClick={()=>setOverflow(!overflow)}><MoreHorizontal size={15}/></button>{overflow&&<div role="menu" aria-label="Reference options" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setOverflow(false);}}}><button type="button" role="menuitem" onClick={()=>{if(onStudyReset){onStudyReset();return;}c.resetDemo?.();try{const dismissals=parseNudgeDismissals(localStorage.getItem(NUDGE_DISMISSALS_KEY));localStorage.setItem(NUDGE_DISMISSALS_KEY,JSON.stringify(Object.fromEntries(Object.entries(dismissals).filter(([key])=>!key.startsWith('demo:')))));for(const key of Object.keys(localStorage))if(key.startsWith('sr-research-demo-')||['sr-demo-views','sr-demo-dismissed','sr-demo-perspective'].includes(key))localStorage.removeItem(key);}catch{}location.reload();}}><RotateCcw size={12}/>Reset demo</button></div>}</div>}</div>{!listed.length&&<p className="references-empty">{showArchived?'No resolved references.':'No active references.'}</p>}<div className="reference-list">{listed.map(ref=>{
 const unread=needsReferenceNotification(ref,c.session?.userId);
 const targets=[...new Set(ref.elementIds)].flatMap(id=>{const node=nodes.find(n=>n.id===id);return node?[node]:[];});
 const screens=[...new Set(targets.flatMap(node=>node.screen?[node.screen]:[]))];
 const objectName=targets.map(node=>node.label).join(', ')||ref.label||`${ref.elementIds.length} layers`;
 const title=(ref.intent.trim()&&ref.intent!=='Look at this'?ref.intent:ref.message.trim().split('\n')[0])||objectName;
 return <button type="button" key={ref.id} data-reference-id={ref.id} data-unread={unread} className={`reference-list-row ${activeId===ref.id?'selected':''}`} aria-label={`${title} · ${objectName} · User ${ref.sourceUser}${unread?' · Unread':''}`} onClick={()=>onOpen(ref.id)}>
  <span className="reference-row-unread" aria-hidden="true">{unread&&<i/>}</span><span className={`reference-row-avatar user-${ref.sourceUser}`} title={`User ${ref.sourceUser}`} aria-label={`Sender User ${ref.sourceUser}`}>{ref.sourceUser}</span><span className="reference-row-thumbnail" aria-hidden="true">{targets[0]&&<ElementPreview element={targets[0]} nodes={nodes}/>}</span><span className="reference-row-copy"><strong title={title}>{title}</strong>{title!==objectName&&<span title={objectName}>{objectName}</span>}<small title={new Date(ref.createdAt).toLocaleString()}>{screens.join(', ')||'Screen unavailable'} · {ref.elementIds.length} {ref.elementIds.length===1?'layer':'layers'} · {conversationTime(ref.createdAt,now).replace('minutes','min').replace('minute','min').replace('1 day ago','Yesterday')}</small></span><ChevronRight size={13} aria-hidden="true"/>
 </button>;
})}</div></section>}

  </div>;
}
