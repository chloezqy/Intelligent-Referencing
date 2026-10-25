import type {CollaborationClient} from '../collaborationClient';
import React, { useEffect, useRef, useState } from 'react';
import { CanvasTransform } from '../workspace';
interface Props {camera:CanvasTransform;collaboration:CollaborationClient}
export default function CollaboratorCursors({camera,collaboration:c}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef({camera,c});latest.current={camera,c};
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const surface=host.current?.parentElement;if(!surface)return;
  let pending:{x:number;y:number;visible:boolean}|null=null,inFlight=false;
  const send=async()=>{if(!pending||inFlight)return;const next=pending;pending=null;inFlight=true;try{await latest.current.c.cursor(next.x,next.y,next.visible);}finally{inFlight=false;}};
  const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const r=surface.getBoundingClientRect(),t=latest.current.camera;const target=e.target as Element;pending={x:(e.clientX-r.left-t.x)/t.scale,y:(e.clientY-r.top-t.y)/t.scale,visible:!target.closest('[role="dialog"],.selection-context,.pin-chooser')};};
  const hide=()=>{pending={x:0,y:0,visible:false};void send();};
  const visibility=()=>{if(document.hidden)hide();};
  const timer=setInterval(()=>void send(),100);
  surface.addEventListener('pointermove',move,true);surface.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);document.addEventListener('visibilitychange',visibility);
  return()=>{clearInterval(timer);surface.removeEventListener('pointermove',move,true);surface.removeEventListener('pointerleave',hide);window.removeEventListener('blur',hide);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const other=c.session?.userId==='A'?'B':'A',cursor=c.cursors[other];
 const visible=c.connected&&c.room?.members.some(m=>m.userId===other&&m.online)&&cursor?.visible&&now-cursor.at<10000;
 return <div ref={host} className="collaborator-cursors" aria-hidden="true">{visible&&<div className={`collaborator-cursor user-${other}`} style={{left:cursor.x*camera.scale+camera.x,top:cursor.y*camera.scale+camera.y}}><svg width="18" height="22" viewBox="0 0 18 22"><path d="M1 1L16 12L9 13L6 20Z" fill="currentColor" stroke="white" strokeWidth="1.5"/></svg><span>User {other}</span></div>}</div>;
}
