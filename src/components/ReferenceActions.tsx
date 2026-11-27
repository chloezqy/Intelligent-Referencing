import React from 'react';
import { Share2, GitCompareArrows, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ReferenceIntent } from '../collaboration';
interface Props {selectionPending?:boolean;compareOwn?:boolean;expanded?:boolean;interpretationContent?:React.ReactNode;shareLabel:string;onCompare:()=>void;compareReady:boolean;compareHint:string;onMore:()=>void;onAction:(intent?:ReferenceIntent)=>void}
export default function ReferenceActions({selectionPending=false,compareOwn=false,shareLabel,onAction,onCompare,compareReady,compareHint,onMore,expanded=false,interpretationContent}:Props){
 const other=shareLabel.includes('User A')?'A':shareLabel.includes('User B')?'B':null;
 return <div className={`reference-actions action-stack horizontal-actions ${expanded?'':'merged-reference-toolbar'}`} aria-label="Selection reference actions">
   {!expanded&&!selectionPending&&compareReady&&<span className="action-pill-wrap">
     <button type="button" className={`action-pill collaboration-pill user-${other||'A'}`} aria-label={compareOwn?'Reference styling':`Use User ${other||'A/B'}’s selection for styling`} onClick={onCompare}><span className="contextual-action-icon" aria-hidden="true"><GitCompareArrows size={14}/></span><span className="action-label">Reference styling</span></button>
   </span>}
   {!expanded&&!selectionPending&&<button type="button" className="action-pill neutral-pill" onClick={()=>onAction()}><span className="contextual-action-icon" aria-hidden="true"><Share2 size={14}/></span><span className="action-label">Share reference</span></button>}
   <section className={`interpretation-step ${expanded?'is-expanded':''}`} aria-label="Interpretation adjustment">
     <button data-panel-drag-handle={expanded?true:undefined} title={expanded?"Drag to move panel; click to collapse":undefined} type="button" className={expanded?'interpretation-panel-header':'action-pill neutral-pill refine-selection'} aria-label="Adjust interpretation" aria-controls="interpretation-adjustments" aria-expanded={expanded} onClick={onMore}>{!expanded&&<span className="contextual-action-icon" aria-hidden="true"><SlidersHorizontal size={14}/></span>}<span className="action-label">Adjust interpretation</span><ChevronDown size={12} aria-hidden="true" className={expanded?'rotate-180':''}/></button>
     {expanded&&interpretationContent}
   </section>
 </div>;
}
