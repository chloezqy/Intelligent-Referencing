import React from 'react';
import {Hash} from 'lucide-react';
import type {UIElement} from '../types';
import type {CanvasTransform} from '../workspace';
interface Props {frames:UIElement[];camera:CanvasTransform;selectedIds:string[];disabled?:boolean;onPointerDown:(event:React.PointerEvent,frame:UIElement)=>void;onSelect:(frame:UIElement,shift:boolean)=>void}
/** Editor chrome stays in screen pixels; frame artwork remains in world coordinates. */
export default function CanvasFrameLabels({frames,camera,selectedIds,disabled,onPointerDown,onSelect}:Props){
 return <div className="canvas-frame-labels" aria-label="Frames">{frames.map(frame=><button key={frame.id} type="button" className="canvas-frame-label" aria-label={`Select frame ${frame.label}`} aria-pressed={selectedIds.includes(frame.id)} disabled={disabled} style={{left:camera.x+frame.x*camera.scale,top:camera.y+frame.y*camera.scale-25,maxWidth:Math.max(24,frame.w*camera.scale)}} onPointerDown={event=>onPointerDown(event,frame)} onClick={event=>{event.stopPropagation();if(event.detail===0)onSelect(frame,event.shiftKey);}}><Hash size={12} aria-hidden="true"/><span>{frame.label}</span></button>)}</div>;
}
