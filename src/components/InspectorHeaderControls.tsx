import React from 'react';
import {UserRound,ChevronDown,Play} from 'lucide-react';
import type {Session} from '../collaboration';
export default function InspectorHeaderControls({session,mode,onPerspective}:{session:Session|null;mode:string;onPerspective:(user:'A'|'B')=>void}){
 return <div className="figma-inspector-actions">
  <div className="inspector-profile"><span className="profile-picture"><UserRound size={16}/></span><ChevronDown size={10}/>{mode==='demo'&&<select aria-label="Demo perspective" title={`User ${session?.userId||'A'}`} value={session?.userId||'A'} onChange={e=>onPerspective(e.target.value as 'A'|'B')}><option value="A">User A</option><option value="B">User B</option></select>}</div>
  <div className="inspector-share-actions"><button type="button" disabled aria-label="Present"><Play size={19} strokeWidth={1.5}/><ChevronDown size={10}/></button><button type="button" disabled className="figma-share-button">Share</button></div>
 </div>;
}
