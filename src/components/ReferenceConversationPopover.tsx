import type {CollaborationClient} from '../collaborationClient';
import React, { useEffect, useRef, useState } from 'react';
import { SharedReference } from '../collaboration';
import { UIElement } from '../types';
import { CanvasTransform } from '../workspace';
import { sharePopoverLayout } from '../referencePresentation';
import ReferenceConversation from './ReferenceConversation';
interface Props {reference:SharedReference;nodes:UIElement[];camera:CanvasTransform;collaboration:CollaborationClient;onClose:()=>void;onLocate:(ref:SharedReference)=>void;onClear:()=>void}
export default function ReferenceConversationPopover({reference,nodes,camera,collaboration,onClose,onLocate,onClear}:Props){
 const host=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null);
 const [viewport,setViewport]=useState({width:800,height:600}),[height,setHeight]=useState(360);
 useEffect(()=>{const el=host.current;if(!el)return;const observer=new ResizeObserver(()=>setViewport({width:el.clientWidth,height:el.clientHeight}));observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const el=popup.current;if(!el)return;const observer=new ResizeObserver(()=>setHeight(el.getBoundingClientRect().height));observer.observe(el);el.focus({preventScroll:true});return()=>observer.disconnect();},[]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!popup.current?.contains(e.target as Node))onClose();};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();onClose();}};document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true);return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true);};},[onClose]);
 const layout=sharePopoverLayout(reference.elementIds,nodes,camera,viewport,height);
 return <div ref={host} className="absolute inset-0 pointer-events-none">{layout&&<div ref={popup} tabIndex={-1} role="dialog" aria-label={reference.sourceUser===collaboration.session?.userId?`Your request to User ${reference.targetUser}`:`Request from User ${reference.sourceUser}`} className="share-popover conversation-popover collab-panel pointer-events-auto" style={{...layout.popup,zIndex:60}} onPointerDown={e=>e.stopPropagation()}><ReferenceConversation key={reference.id} active={reference} nodes={nodes} collaboration={collaboration} onLocate={onLocate} onClear={onClear}/>{collaboration.error&&<p role="alert" className="connection-error">{collaboration.error}</p>}</div>}</div>;
}
