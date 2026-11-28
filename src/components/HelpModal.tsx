import React,{useEffect,useState} from 'react';
import {useDraggablePanel} from '../useDraggablePanel';
import { X } from 'lucide-react';

const SHORTCUTS:[string,string][]=[
 ['Select / add to selection','V, click / Shift-click'],
 ['Reach nested layers','Double-click or Cmd/Ctrl-click'],
 ['Select child / parent layers','Enter / Shift-Enter'],
 ['Smart Gesture','G; hold Shift to add another area'],
 ['Pan','H, Space-drag or middle drag'],
 ['Zoom','Cmd/Ctrl-scroll'],
 ['Undo / redo','Cmd/Ctrl-Z / Cmd/Ctrl-Shift-Z'],
 ['Clear selection','Escape'],
];

export default function HelpModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
 const [panel,setPanel]=useState<HTMLElement|null>(null);
 useDraggablePanel(panel,'help',isOpen);
 useEffect(()=>{
  if(!isOpen)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();onClose();}};
  window.addEventListener('keydown',onKey,true);
  return()=>window.removeEventListener('keydown',onKey,true);
 },[isOpen,onClose]);
 if(!isOpen)return null;
 return <div className="help-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section ref={setPanel} role="dialog" aria-modal="true" aria-labelledby="help-title" className="help-dialog">
   <div className="panel-heading" data-panel-drag-handle title="Drag to move panel"><span id="help-title">How Smart Reference works</span><button type="button" aria-label="Close help" onClick={onClose}><X size={16}/></button></div>
   <div className="p-5">
    <p className="prototype-description">An HCI research prototype for pointing at design objects, clarifying what you mean, and acting on that reference.</p>
    <ol>
     <li><strong>Select or gesture.</strong> Click layers to select them, or press G and draw over objects with Smart Gesture. Open <em>Adjust interpretation</em> and choose where to find matches: Drawn area, This screen or All screens. Hover a suggestion to preview it, then choose <em>Select N objects</em>, or <em>Keep my drawn selection</em>.</li>
     <li><strong>Take action.</strong> In the right sidebar, AI Actions sits under the selection preview. Use <em>Match library</em> to apply Studio Blue styles, or <em>Pick source</em> to copy chosen style categories from another layer. Review the before and after, then Apply.</li>
     <li><strong>Ask for a change.</strong> Type a request in <em>Ask AI to change…</em>, such as “Make the buttons pill-shaped.” Changes apply to the selected layers and can be undone.</li>
     <li><strong>Compare.</strong> Select two objects and choose <em>Compare</em> to see their property differences, then resolve only the ones you want.</li>
     <li><strong>Share and discuss.</strong> Choose <em>Share reference</em> above a selection to send it to a teammate with a message. Requests appear under References → Active. Switch between User A and User B with the profile control in the right sidebar, reply, or choose <em>Mark as resolved</em>.</li>
    </ol>
    <h3 className="mt-4 font-semibold">Canvas shortcuts</h3>
    <dl className="help-shortcuts">{SHORTCUTS.map(([action,keys])=><React.Fragment key={action}><dt>{action}</dt><dd>{keys}</dd></React.Fragment>)}</dl>
    <p className="mt-3 text-zinc-500">Edits stay in this browser. Sharing sends references and conversations, not document edits. Use References → Reset demo to start fresh.</p>
   </div>
  </section>
 </div>;
}
