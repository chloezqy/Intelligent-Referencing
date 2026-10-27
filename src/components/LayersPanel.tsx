import React,{useState} from 'react';
import {Layers,ChevronRight,ChevronDown,Type,Square,Image,LocateFixed} from 'lucide-react';
import type {UIElement,InferredReference} from '../types';
interface Props{nodes:UIElement[];inferredRef:InferredReference|null;onSelectNode:(id:string,shift?:boolean)=>void;onLocate?:(ids:string[])=>void}
export default function LayersPanel({nodes,inferredRef,onSelectNode,onLocate}:Props){
 const [collapsed,setCollapsed]=useState<Record<string,boolean>>({'screen-favorites':true,'screen-cart':true,'screen-checkout':true});
 const selected=inferredRef?.selectedIds||[];
 const toggle=(id:string)=>setCollapsed(s=>({...s,[id]:!s[id]}));
 function row(n:UIElement,depth=0):React.ReactNode{
  const children=nodes.filter(c=>c.parent===n.id),isFrame=n.type==='screen',isCollapsed=collapsed[n.id]??(!isFrame),Icon=n.type==='text'?Type:n.type==='image'?Image:Square;
  return <div key={n.id}><div className={`layer-row ${selected.includes(n.id)?'selected':''}`} style={{paddingLeft:8+depth*12}}>
   {children.length>0?<button className="layer-expand" aria-label={`${isCollapsed?'Expand':'Collapse'} ${n.label}`} aria-expanded={!isCollapsed} onClick={()=>toggle(n.id)}>{isCollapsed?<ChevronRight size={12}/>:<ChevronDown size={12}/>}</button>:<span style={{width:20}}/>}
   <button className="layer-name" title={`${n.screen} / ${n.label}${n.library?' · Library style source':''}`} onClick={e=>isFrame?toggle(n.id):onSelectNode(n.id,e.shiftKey)} onDoubleClick={()=>onLocate?.([n.id])}><Icon size={12}/><span>{n.label}</span>{selected.includes(n.id)&&<small>Selected</small>}</button>
   {isFrame&&<button aria-label={`Locate ${n.label}`} title="Locate artboard" onClick={()=>onLocate?.(nodes.filter(c=>c.parent===n.id).map(c=>c.id))}><LocateFixed size={12}/></button>}
  </div>{!isCollapsed&&children.map(c=>row(c,depth+1))}</div>;
 }
 return <div className="layers-tree"><header><Layers size={14}/><b>Workspace Artboards</b><small>{nodes.filter(n=>n.type==='screen').length} artboards</small></header><div className="layer-scroll">{nodes.filter(n=>n.type==='screen').map(n=>row(n))}</div><p>Shift-click to add or remove · double-click to locate</p></div>;
}
