import React,{useState} from 'react';
import {Sparkles,ChevronDown,ArrowUp} from 'lucide-react';

/** Shared shell only: actions keep their existing controllers and previews. */
export default function AIActionsPanel({count,children}:{count:number;children?:React.ReactNode}){
 const [open,setOpen]=useState(true);
 return <section className={`design-ai-actions ${open?'is-expanded':'is-collapsed'}`} aria-label="AI Actions">
  <button type="button" className="ai-actions-heading" aria-expanded={open} onClick={()=>setOpen(!open)}>
   <Sparkles size={16} aria-hidden="true"/><strong>AI Actions</strong><small>{count?`For ${count} selected ${count===1?'layer':'layers'}`:'No selection'}</small><ChevronDown size={14} aria-hidden="true"/>
  </button>
  <div hidden={!open} className="ai-actions-body">
   {count?<div className="design-suggestion-rows">{children}</div>:<p className="ai-actions-empty">Select a layer to see available actions.</p>}
   <div className="ai-command" title="Freeform commands are not supported yet. Use an action above.">
    <Sparkles size={14} aria-hidden="true"/><input aria-label="Describe a change" placeholder="Describe a change..." disabled/><button type="button" disabled aria-label="Submit change (coming soon)" title="Freeform commands are not supported yet."><ArrowUp size={16}/></button>
   </div>
  </div>
 </section>;
}
