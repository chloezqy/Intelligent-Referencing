import React from 'react';
import {Layers} from 'lucide-react';
import type {UIElement} from '../types';
import type {UserId} from '../collaboration';
import {previewElements} from '../visualComparison';

function ElementPreview({element,nodes}:{element:UIElement;nodes:UIElement[]}){
 // SVG scales authored coordinates without a live canvas, screenshots or external assets.
 return <svg className="element-preview" viewBox={`0 0 ${Math.max(1,element.w)} ${Math.max(1,element.h)}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Preview of ${element.label}`}>
  {previewElements(element,nodes).map(node=><svg key={node.id} x={node.x-element.x} y={node.y-element.y} width={Math.max(1,node.w)} height={Math.max(1,node.h)} overflow="hidden">
   <rect width="100%" height="100%" rx={node.radius||0} fill={node.bg||'transparent'} stroke={node.border?.match(/#[0-9a-f]{3,8}|rgba?\([^)]+\)/i)?.[0]||'none'}/>
   {node.text&&<text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill={node.color||'#18181b'} fontSize={node.fontSize||12} fontWeight={node.fontWeight||400}>{node.text}</text>}
  </svg>)}
 </svg>;
}
interface Props {key?:string;ids:string[];nodes:UIElement[];user?:UserId;self?:UserId}
export default function ReferencePreviewCard({ids,nodes,user,self}:Props){
 const selected=ids.map(id=>nodes.find(node=>node.id===id));
 const screens=[...new Set(selected.flatMap(node=>node?.screen?[node.screen]:[]))];
 return <article className={`reference-preview-card ${user?`user-${user}`:'unowned-reference-card'}`} aria-label={user?`User ${user} references`:'Selected references'}>
  <header><span className="preview-identity" aria-hidden="true">{user||<Layers size={13}/>}</span><div><strong>{user?`User ${user}`:'Selected references'}{user&&user===self&&<small> · You</small>}</strong><p>{screens.join(', ')||'Screen unavailable'}</p></div><span className="preview-count">{ids.length} {ids.length===1?'object':'objects'}</span></header>
  <div className="reference-preview-tiles">{selected.slice(0,3).map((node,index)=><figure key={ids[index]}>
   <div className="reference-preview-art">{node?<ElementPreview element={node} nodes={nodes}/>:<span>Element unavailable</span>}</div>
   <figcaption title={node?.label||ids[index]}>{node?.label||`Unavailable · ${ids[index]}`}</figcaption>
  </figure>)}</div>
  {!ids.length&&<p className="subtle">No selected objects</p>}
  {ids.length>3&&<p className="preview-more">+{ids.length-3} more selected</p>}
 </article>;
}
