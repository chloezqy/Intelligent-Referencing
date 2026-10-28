import React,{useState} from 'react';
interface Props {workMode?:'edit'|'compare';onModeChange?:(mode:'edit'|'compare')=>void;compareAvailable?:boolean;footer?:React.ReactNode;mode?:'selection'|'compare';count?:number;open:boolean;onClose:()=>void;contentRef:(node:HTMLDivElement|null)=>void;children?:React.ReactNode}
export default function ComparisonInspector({workMode,onModeChange,compareAvailable=false,footer,mode='compare',open,onClose,contentRef,children,count}:Props){
 const selection=mode==='selection';
 const [width,setWidth]=useState(420);
 const resize=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,initial=width;const el=e.currentTarget;el.onpointermove=event=>setWidth(Math.max(360,Math.min(560,initial+start-event.clientX)));const finish=()=>{el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;};el.onpointerup=finish;el.onpointercancel=finish;};
 return <aside aria-label={selection?'Selection inspector':'Comparison inspector'} hidden={!open} className={`comparison-inspector ${selection?'selection-inspector':''} ${workMode?'working-inspector':''}`} style={{width}}>
 <header className="panel-heading"><div className="comparison-inspector-title"><strong>{workMode||selection?'Selection':'Compare'}</strong>{count!==undefined&&<span>{count} {count===1?'object':'objects'}</span>}</div><button aria-label={selection?'Close selection inspector':'Close comparison inspector'} onClick={onClose}>Close</button></header>
 {workMode&&onModeChange&&<div className="inspector-mode-switch" role="group" aria-label="Selection mode"><button type="button" aria-pressed={workMode==='edit'} onClick={()=>onModeChange('edit')}>Edit</button><button type="button" aria-pressed={workMode==='compare'} disabled={!compareAvailable} title={compareAvailable?undefined:'Select at least two objects or a collaborator selection to compare.'} onClick={()=>onModeChange('compare')}>Compare</button></div>}
 <div ref={contentRef} className="comparison-inspector-content">{children}</div>
 {footer}
 <div role="separator" tabIndex={0} aria-label={selection?'Resize selection inspector':'Resize comparison inspector'} aria-orientation="vertical" aria-valuenow={width} aria-valuemin={360} aria-valuemax={560} className="inspector-resizer" onPointerDown={resize} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setWidth(w=>Math.max(360,Math.min(560,w+(e.key==='ArrowLeft'?10:-10))));}}}/>
 </aside>;
}
