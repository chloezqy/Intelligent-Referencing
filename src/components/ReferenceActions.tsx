import React from 'react';
import { Share2, GitCompareArrows, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ReferenceIntent } from '../collaboration';
interface Props {compareOwn?:boolean;expanded?:boolean;interpretationContent?:React.ReactNode;shareLabel:string;onCompare:()=>void;compareReady:boolean;compareHint:string;onMore:()=>void;onAction:(intent?:ReferenceIntent)=>void}
export default function ReferenceActions({compareOwn=false,shareLabel,onAction,onCompare,compareReady,compareHint,onMore,expanded=false,interpretationContent}:Props){
 const other=shareLabel.includes('User A')?'A':shareLabel.includes('User B')?'B':null;
 return <div className="reference-actions action-stack" aria-label="Selection reference actions">
   <span className="action-pill-wrap" title={!compareReady?compareHint:undefined}>
     <button type="button" className={`action-pill collaboration-pill user-${other||'A'}`} disabled={!compareReady} aria-label={compareOwn?'Compare selected objects':`Compare with User ${other||'A/B'}’s selection`} aria-describedby={!compareReady?'compare-unavailable':undefined} onClick={onCompare}><span className="action-orb" aria-hidden="true"><GitCompareArrows size={14}/></span>{compareOwn?'Compare':`Compare with User ${other||'A/B'}`}</button>
     {!compareReady&&<span id="compare-unavailable" className="sr-only">{compareHint}</span>}
   </span>
   <button type="button" className="action-pill neutral-pill" onClick={()=>onAction()}><span className="action-orb" aria-hidden="true"><Share2 size={14}/></span>Share reference</button>
   <section className={`interpretation-step ${expanded?'is-expanded':''}`} aria-label="Interpretation adjustment">
     <button type="button" className="action-pill neutral-pill refine-selection" aria-label="Adjust interpretation" aria-controls="interpretation-adjustments" aria-expanded={expanded} onClick={onMore}><span className="action-orb" aria-hidden="true"><SlidersHorizontal size={14}/></span>Adjust interpretation<ChevronDown size={12} aria-hidden="true" className={expanded?'rotate-180':''}/></button>
     {expanded&&interpretationContent}
   </section>
 </div>;
}
