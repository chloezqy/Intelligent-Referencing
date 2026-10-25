import React,{useState} from 'react';
interface Props {open:boolean;onClose:()=>void;contentRef:(node:HTMLDivElement|null)=>void;children?:React.ReactNode}
export default function ComparisonInspector({open,onClose,contentRef,children}:Props){
 const [width,setWidth]=useState(420);
 const resize=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,initial=width;const el=e.currentTarget;el.onpointermove=event=>setWidth(Math.max(360,Math.min(560,initial+start-event.clientX)));const finish=()=>{el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;};el.onpointerup=finish;el.onpointercancel=finish;};
 return <aside aria-label="Comparison inspector" hidden={!open} className="comparison-inspector" style={{width}}>
 <header className="panel-heading"><strong>Compare</strong><button aria-label="Close comparison inspector" onClick={onClose}>Close</button></header>
 <div ref={contentRef} className="comparison-inspector-content">{children}</div>
 <div role="separator" tabIndex={0} aria-label="Resize comparison inspector" aria-orientation="vertical" aria-valuenow={width} aria-valuemin={360} aria-valuemax={560} className="inspector-resizer" onPointerDown={resize} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setWidth(w=>Math.max(360,Math.min(560,w+(e.key==='ArrowLeft'?10:-10))));}}}/>
 </aside>;
}
