import React,{useEffect,useRef,useState} from 'react';
import {MousePointer2,Hand,ChevronDown,Check,Frame,Square,PenTool,Type,MessageCircle,Shapes,Braces,Brush,MousePointerSquareDashed,Layers2,CodeXml} from 'lucide-react';
import Sparkles from './AIIcon';
import type {ToolMode} from '../types';
export const CANVAS_TOOLS=[{mode:'pointer',label:'Select',key:'V',icon:MousePointer2},{mode:'reference',label:'Smart Gesture',key:'G',icon:Sparkles},{mode:'pan',label:'Hand',key:'H',icon:Hand}] as const;
const placeholders=[{label:'Frame',icon:Frame},{label:'Shape',icon:Square},{label:'Pen',icon:PenTool},{label:'Text',icon:Type},{label:'Code',icon:Braces},{label:'Comment',icon:MessageCircle},{label:'Resources',icon:Shapes}];
export default function CanvasToolbar({mode,onChange}:{mode:ToolMode;onChange:(mode:ToolMode)=>void}){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),toggle=useRef<HTMLButtonElement>(null);
 const active=CANVAS_TOOLS.find(tool=>tool.mode===mode)||CANVAS_TOOLS[0],Icon=active.icon;
 const choose=(next:ToolMode)=>{onChange(next);setOpen(false);toggle.current?.focus();};
 useEffect(()=>{if(!open)return;const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 useEffect(()=>setOpen(false),[mode]);
 const focusOption=(index:number)=>root.current?.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]')[index]?.focus();
 return <div ref={root} className="canvas-toolstrip" role="toolbar" aria-label="Canvas tools" onKeyDown={event=>{
  if(event.key==='Escape'){event.stopPropagation();setOpen(false);toggle.current?.focus();return;}
  const tool=!event.metaKey&&!event.ctrlKey&&!event.altKey&&CANVAS_TOOLS.find(item=>item.key===event.key.toUpperCase());if(tool){event.preventDefault();event.stopPropagation();choose(tool.mode);return;}
  if(open&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const options=Array.from(root.current!.querySelectorAll('[role=menuitemradio]')),index=options.indexOf(document.activeElement!);focusOption(event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowUp'?-1:1)+3)%3);}
 }}>
  <div className="canvas-tool-choice">
   <button type="button" className="canvas-tool-active" aria-label={`${active.label} (${active.key})`} aria-pressed="true" title={mode==='reference'?'Draw to select · Hold Shift to add another region':`${active.label} (${active.key})`} onClick={()=>{onChange(active.mode);setOpen(false);}}><Icon size={20}/></button>
   <button ref={toggle} type="button" className="canvas-tool-chevron" aria-label="Choose selection tool" aria-haspopup="menu" aria-expanded={open} aria-controls="canvas-tool-menu" onClick={()=>setOpen(!open)} onKeyDown={event=>{if(event.key==='ArrowDown'&&!open){event.preventDefault();setOpen(true);requestAnimationFrame(()=>focusOption(0));}}}><ChevronDown size={12}/></button>
   {open&&<div id="canvas-tool-menu" className="canvas-tool-menu" role="menu" aria-label="Selection tools">{CANVAS_TOOLS.map(tool=>{const ItemIcon=tool.icon;return <button type="button" key={tool.mode} role="menuitemradio" aria-checked={mode===tool.mode} title={tool.mode==='reference'?'Draw to select · Hold Shift to add another region':undefined} onClick={()=>choose(tool.mode)}><span className="canvas-tool-check">{mode===tool.mode&&<Check size={14}/>}</span><ItemIcon size={17}/><span>{tool.label}</span><kbd>{tool.key}</kbd></button>;})}</div>}
  </div>
  {placeholders.map(tool=>{const PlaceholderIcon=tool.icon;return <button type="button" className="canvas-tool-placeholder" disabled aria-disabled="true" key={tool.label} aria-label={`${tool.label} — Coming soon`} title={`${tool.label} · Coming soon`}><PlaceholderIcon size={20} strokeWidth={1.5}/>{tool.label!=='Resources'&&<ChevronDown size={10}/>}</button>;})}
  <div className="canvas-toolbelt" aria-label="Editor modes">{([{label:'Draw',icon:Brush},{label:'Design',icon:MousePointerSquareDashed},{label:'Motion',icon:Layers2},{label:'Dev Mode',icon:CodeXml}]).map(item=><button type="button" disabled aria-label={item.label} key={item.label} className={item.label==='Design'?'mode-design':''}><item.icon size={17} strokeWidth={1.5}/></button>)}</div>
 </div>;
}
