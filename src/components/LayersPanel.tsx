import React,{useState,useRef} from 'react';
import {ChevronRight,ChevronDown,Type,Square,Image,Hash,Group,RectangleHorizontal,Search,ListChevronsDownUp,PanelLeftClose,Check,LockKeyhole,X} from 'lucide-react';
import type {UIElement,InferredReference} from '../types';
interface Props{nodes:UIElement[];inferredRef:InferredReference|null;onSelectNode:(id:string,shift?:boolean)=>void;onSelectNodes?:(ids:string[])=>void;onLocate?:(ids:string[])=>void;onClose?:()=>void}
export default function LayersPanel({nodes,inferredRef,onSelectNode,onSelectNodes,onLocate,onClose}:Props){
 const [collapsed,setCollapsed]=useState<Record<string,boolean>>({'screen-favorites':true,'screen-cart':true,'screen-checkout':true});
 const [pagesOpen,setPagesOpen]=useState(true),[layersOpen,setLayersOpen]=useState(true),[findOpen,setFindOpen]=useState(false),[query,setQuery]=useState('');
 const selected=inferredRef?.selectedIds||[],anchor=useRef<string|null>(null);
 const children=(id:string|undefined)=>nodes.filter(n=>n.parent===id);
 const visible=(parent:string|undefined):UIElement[]=>children(parent).flatMap(n=>[n,...((collapsed[n.id]??(n.type!=='screen'))?[]:visible(n.id))]);
 const selectLayer=(n:UIElement,e:React.MouseEvent)=>{const rows=visible(undefined),from=rows.findIndex(r=>r.id===anchor.current),to=rows.findIndex(r=>r.id===n.id);if(e.shiftKey&&from>=0&&onSelectNodes)onSelectNodes(rows.slice(Math.min(from,to),Math.max(from,to)+1).map(r=>r.id));else{onSelectNode(n.id,e.metaKey||e.ctrlKey);anchor.current=n.id;}};
 const toggle=(id:string)=>setCollapsed(s=>({...s,[id]:!(s[id]??(nodes.find(n=>n.id===id)?.type!=='screen'))}));
 const collapseAll=()=>{const keep=new Set<string>();for(const id of selected){let parent=nodes.find(n=>n.id===id)?.parent;while(parent){keep.add(parent);parent=nodes.find(n=>n.id===parent)?.parent;}}setCollapsed(Object.fromEntries(nodes.filter(n=>children(n.id).length).map(n=>[n.id,!keep.has(n.id)])));};
 const matches=(n:UIElement):boolean=>!query||n.label.toLowerCase().includes(query.toLowerCase())||children(n.id).some(matches);
 function row(n:UIElement,depth=0):React.ReactNode{
  if(!matches(n))return null;
  const nested=children(n.id),isFrame=n.type==='screen',isCollapsed=!query&&(collapsed[n.id]??(!isFrame)),Icon=isFrame||n.type==='card'?Hash:n.type==='group'||n.type==='header'||n.type==='tabbar'?Group:n.type==='text'?Type:n.type==='image'?Image:n.type==='button'||n.type==='input'||n.type==='chip'?RectangleHorizontal:Square;
  return <div key={n.id} role="none"><div role="treeitem" aria-level={depth+1} aria-selected={selected.includes(n.id)} aria-expanded={nested.length?!isCollapsed:undefined} data-layer-id={n.id} className={`layer-row ${isFrame?'is-frame':''} ${selected.includes(n.id)?'selected':''}`} style={{paddingLeft:8+depth*16}}>
   {nested.length?<button className="layer-expand" aria-label={`${isCollapsed?'Expand':'Collapse'} ${n.label}`} aria-expanded={!isCollapsed} onClick={()=>toggle(n.id)}>{isCollapsed?<ChevronRight size={12}/>:<ChevronDown size={12}/>}</button>:<span className="layer-expand-spacer"/>}
   <button className="layer-name" title={`${n.screen} / ${n.label}${n.library?' · Library style source':''}`} onClick={e=>selectLayer(n,e)} onDoubleClick={()=>onLocate?.([n.id])}><Icon className="layer-type-icon" size={14} strokeWidth={1.5}/><span>{n.label}</span></button>
   {n.library&&<LockKeyhole className="layer-readonly" size={11} aria-label="Library source"/>}
  </div>{!isCollapsed&&nested.length>0&&<div role="group">{nested.map(c=>row(c,depth+1))}</div>}</div>;
 }
 return <div className="layers-tree figma-file-panel">
  <header className="file-panel-header"><div><strong>Mobile Commerce Workspace</strong><span>Drafts</span></div>{onClose&&<button aria-label="Close panel" title="Minimize sidebar" onClick={onClose}><PanelLeftClose size={16}/></button>}</header>
  <section className="file-pages"><button className="file-section-title" aria-expanded={pagesOpen} onClick={()=>setPagesOpen(!pagesOpen)}>{pagesOpen?<ChevronDown size={12}/>:<ChevronRight size={12}/>}<span>Pages</span></button>{pagesOpen&&<button className="file-page active" aria-current="page" onClick={()=>{setQuery('');setFindOpen(false);}}><Check size={12}/><span>Page 1</span></button>}</section>
  <div className="file-layers-header"><button className="file-section-title" aria-expanded={layersOpen} onClick={()=>setLayersOpen(!layersOpen)}>{layersOpen?<ChevronDown size={12}/>:<ChevronRight size={12}/>}<span>Layers</span></button><div><button aria-label="Find layers" title="Find layers" aria-pressed={findOpen} onClick={()=>{setFindOpen(!findOpen);setQuery('');}}><Search size={14}/></button><button aria-label="Collapse layers" title="Collapse layers" onClick={collapseAll}><ListChevronsDownUp size={15}/></button></div></div>
  {findOpen&&<div className="layer-find"><Search size={13}/><input autoFocus aria-label="Find layers" value={query} placeholder="Find layers…" onChange={e=>setQuery(e.target.value)}/><button aria-label="Close find" onClick={()=>{setFindOpen(false);setQuery('');}}><X size={12}/></button></div>}
  {layersOpen&&<div className="layer-scroll" role="tree" aria-label="Layers" aria-multiselectable="true">{nodes.filter(n=>n.type==='screen').map(n=>row(n))}{query&&!nodes.some(n=>n.label.toLowerCase().includes(query.toLowerCase()))&&<p className="layer-empty">No matching layers</p>}</div>}
 </div>;
}
