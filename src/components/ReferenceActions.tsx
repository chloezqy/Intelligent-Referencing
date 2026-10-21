import React from 'react';
import { ReferenceIntent } from '../collaboration';
interface Props { shareLabel:string; count:number; onAction:(intent?:ReferenceIntent)=>void }
export default function ReferenceActions({shareLabel,count,onAction}:Props){
  return <div className="reference-actions" aria-label="Selection reference actions">
    {count>=2?<><button type="button" onClick={()=>onAction('Compare')}>Compare</button><button type="button" onClick={()=>onAction('Review')}>Ask for review</button><details className="reference-more" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}}><summary>More</summary><div><button type="button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');onAction('Help');}}>Ask for help</button><button type="button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');onAction();}}>{shareLabel}</button></div></details></>:<><button type="button" onClick={()=>onAction('Review')}>Review</button><button type="button" onClick={()=>onAction('Help')}>Help</button><button type="button" onClick={()=>onAction()}>{shareLabel}</button></>}
  </div>;
}
