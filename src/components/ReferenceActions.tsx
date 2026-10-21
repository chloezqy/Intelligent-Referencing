import React from 'react';
import { Share2, GitCompareArrows } from 'lucide-react';
import { ReferenceIntent } from '../collaboration';
interface Props {shareLabel:string;onCompare:()=>void;compareReady:boolean;compareHint:string;onMore:()=>void;onAction:(intent?:ReferenceIntent)=>void}
export default function ReferenceActions({shareLabel,onAction,onCompare,compareReady,compareHint,onMore}:Props){
 const other=shareLabel.includes('User A')?'A':shareLabel.includes('User B')?'B':null;
 return <div className="reference-actions action-stack" aria-label="Selection reference actions">
   <span className="action-pill-wrap" title={!compareReady?compareHint:undefined}>
     <button type="button" className={`action-pill collaboration-pill user-${other||'A'}`} disabled={!compareReady} aria-label={`Compare with User ${other||'A/B'}’s selection`} aria-describedby={!compareReady?'compare-unavailable':undefined} onClick={onCompare}><span className="action-orb" aria-hidden="true"><GitCompareArrows size={14}/></span>Compare with User {other||'A/B'}</button>
     {!compareReady&&<span id="compare-unavailable" className="sr-only">{compareHint}</span>}
   </span>
   <button type="button" className="action-pill neutral-pill" onClick={()=>onAction()}><span className="action-orb" aria-hidden="true"><Share2 size={14}/></span>{shareLabel}</button>
   <button type="button" className={`action-pill collaboration-pill user-${other||'A'}`} onClick={()=>onAction('Look at this')}><span className="action-orb" aria-hidden="true">{other||'?'}</span>{other?`Bring User ${other} here`:'Bring another user here'}</button>
   <button type="button" className="action-more" aria-label="Selection details and scope" aria-expanded={false} onClick={onMore}>•••</button>
 </div>;
}
