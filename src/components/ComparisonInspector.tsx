import React,{useState} from 'react';
interface Props {workMode?:'edit'|'compare';onModeChange?:(mode:'edit'|'compare')=>void;compareAvailable?:boolean;headerControls?:React.ReactNode;footer?:React.ReactNode;mode?:'selection'|'compare';count?:number;contentRef:(node:HTMLDivElement|null)=>void;children?:React.ReactNode}
export default function ComparisonInspector({workMode,onModeChange,compareAvailable=false,headerControls,footer,mode='compare',contentRef,children,count}:Props){
 const selection=mode==='selection';
 const [width,setWidth]=useState(selection?360:420);
 const resize=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);const start=e.clientX,initial=width;const el=e.currentTarget;el.onpointermove=event=>setWidth(Math.max(360,Math.min(560,initial+start-event.clientX)));const finish=()=>{el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;};el.onpointerup=finish;el.onpointercancel=finish;};
 return <aside aria-label={selection?'Selection inspector':'Comparison inspector'} className={`comparison-inspector ${selection?'selection-inspector':''} ${workMode?'working-inspector':''}`} style={{width}}>

 <div className="inspector-fixed-header">{headerControls}
 <header className="panel-heading"><div className="design-inspector-tabs" role="tablist" aria-label="Inspector view"><button type="button" role="tab" aria-selected={workMode!=='compare'} onClick={()=>onModeChange?.('edit')}>Design</button><button type="button" role="tab" aria-selected="false" disabled title="Prototyping is not supported in this prototype.">Prototype</button></div></header>
 {workMode==='compare'&&onModeChange&&<div className="design-compare-navigation"><button type="button" onClick={()=>onModeChange('edit')}>← Back to Design</button><strong>Compare{count!==undefined?' · '+count+' objects':''}</strong></div>}
 </div>

 <div ref={contentRef} className="comparison-inspector-content" tabIndex={-1}>{children}</div>
 {footer}
 <div role="separator" tabIndex={0} aria-label={selection?'Resize selection inspector':'Resize comparison inspector'} aria-orientation="vertical" aria-valuenow={width} aria-valuemin={360} aria-valuemax={560} className="inspector-resizer" onPointerDown={resize} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setWidth(w=>Math.max(360,Math.min(560,w+(e.key==='ArrowLeft'?10:-10))));}}}/>
 </aside>;
}
