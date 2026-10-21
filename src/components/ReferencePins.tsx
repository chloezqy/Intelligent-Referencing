import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SharedReference } from '../collaboration';
import { UIElement } from '../types';
import { CanvasTransform } from '../workspace';
import { layoutReferencePins, orderedReferences, referenceShortLabel, pinChooserBounds } from '../referencePresentation';
interface Props { references:SharedReference[]; nodes:UIElement[]; camera:CanvasTransform; viewport:{width:number;height:number}; activeId:string|null; onOpen:(id:string)=>void }
export default function ReferencePins({references,nodes,camera,viewport,activeId,onOpen}:Props){
  const [chooser,setChooser]=useState<string|null>(null),host=useRef<HTMLDivElement>(null),lastTrigger=useRef<HTMLButtonElement|null>(null);
  const pins=useMemo(()=>layoutReferencePins(references,nodes,camera,viewport,activeId),[references,nodes,camera,viewport,activeId]);
  const ordered=useMemo(()=>orderedReferences(references),[references]);
  const byId=new Map(references.map(r=>[r.id,r]));
  const selected=pins.find(p=>p.key===chooser);
  useEffect(()=>{
    if(!chooser)return;
    const outside=(event:PointerEvent)=>{if(!host.current?.contains(event.target as Node))setChooser(null);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setChooser(null);lastTrigger.current?.focus({preventScroll:true});}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);
    host.current?.querySelector<HTMLButtonElement>('[role="dialog"] button')?.focus({preventScroll:true});
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};
  },[chooser]);
  useEffect(()=>{if(chooser&&!selected)setChooser(null);},[chooser,selected]);
  const open=(id:string)=>{setChooser(null);onOpen(id);};
  return <div ref={host} className="shared-pins absolute inset-0 pointer-events-none z-30" aria-label="Shared reference pins">
    {pins.map(pin=>{
      const refs=pin.referenceIds.map(id=>byId.get(id)!),active=refs.some(r=>r.id===activeId),reviewed=refs.every(r=>r.status==='reviewed');
      const display=refs.find(r=>r.id===activeId)||refs[0],mixed=refs.some(r=>r.sourceUser!==display.sourceUser);
      const status=reviewed?'Reviewed':'Awaiting review';
      const label=refs.length===1?`Open ${display.intent} reference from User ${display.sourceUser} · ${status} · ${pin.anchors.map(a=>nodes.find(n=>n.id===a.elementId)?.label).join(', ')}`:`Choose from ${refs.length} shared references · ${status}`;
      return <button key={pin.key} type="button" data-reference-pin={display.id} data-element-id={(pin.anchors.find(a=>a.active)||pin.anchors[0]).elementId} className={`reference-pin user-${display.sourceUser} ${mixed?'mixed-users':''} ${active?'selected':''} ${reviewed?'reviewed':''}`} style={{left:pin.x-12,top:pin.y-12}} aria-label={label} title={refs.length===1?`User ${display.sourceUser} · ${referenceShortLabel(display)} · ${status}`:`${refs.length} references · Choose a conversation`} aria-expanded={refs.length>1?chooser===pin.key:undefined} aria-haspopup={refs.length>1?'dialog':undefined} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();lastTrigger.current=e.currentTarget;if(refs.length===1)open(display.id);else setChooser(chooser===pin.key?null:pin.key);}}>
        <span>{refs.length>1?refs.length:`${display.sourceUser}${ordered.findIndex(r=>r.id===display.id)+1}`}</span><span className="pin-status" aria-hidden="true">{reviewed?'✓':'•'}</span>{pin.anchors.length>1&&refs.length===1&&<span className="pin-target-count" aria-hidden="true">{pin.anchors.length}</span>}
      </button>;
    })}
    {selected&&<div role="dialog" aria-label="Shared reference conversations" className="pin-chooser pointer-events-auto" style={pinChooserBounds(selected,viewport)} onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
      <div className="pin-chooser-heading"><strong>Shared references</strong><button type="button" aria-label="Close conversation chooser" onClick={()=>{setChooser(null);lastTrigger.current?.focus({preventScroll:true});}}>×</button></div>
      <div className="pin-chooser-list">{selected.referenceIds.map(id=>{const ref=byId.get(id)!;return <button type="button" className="pin-conversation" aria-label={`Open ${ref.sourceUser}${ordered.findIndex(r=>r.id===ref.id)+1} · ${referenceShortLabel(ref)} · ${ref.status==='reviewed'?'Reviewed':'Awaiting review'}`} key={id} onClick={()=>open(id)}><span className={`chooser-author user-${ref.sourceUser}`} aria-hidden="true">{ref.sourceUser}</span><span className="chooser-label">{referenceShortLabel(ref)}<small>{ref.sourceUser}{ordered.findIndex(r=>r.id===ref.id)+1} · {ref.elementIds.length} objects · {new Date(ref.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></span><span className={`chooser-status ${ref.status}`}>{ref.status==='reviewed'?'Reviewed':'Awaiting'}</span></button>;})}</div>
    </div>}
  </div>;
}
