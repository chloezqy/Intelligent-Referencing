import React from 'react';
import {Hash} from 'lucide-react';
import type {UIElement} from '../types';
export default function FrameInspector({frames,nodes,onSelectContents}:{frames:UIElement[];nodes:UIElement[];onSelectContents:(ids:string[])=>void}){
 const onlyFrames=frames.every(node=>node.type==='screen');
 const contents=nodes.filter(node=>frames.some(frame=>node.parent===frame.id));
 return <div className="frame-inspector"><header><Hash size={16}/><strong>{onlyFrames?(frames.length===1?'Frame':`${frames.length} frames`):'Mixed selection'}</strong></header>
 {frames.map(frame=><section key={frame.id}><h3>{frame.label}</h3><dl>{Object.entries({X:frame.x,Y:frame.y,W:frame.w,H:frame.h}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><h4>Fill</h4><p className="frame-inspector-fill"><i style={{background:frame.bg||'#ffffff'}}/>{frame.bg||'None'}</p></section>)}
 <section><h4>Contents <small>{contents.length} layers</small></h4><button type="button" disabled={!contents.length} onClick={()=>onSelectContents(contents.map(node=>node.id))}>Select contents</button><p className="frame-inspector-hint">Enter selects child layers. Shift-click frame names to select multiple frames.</p></section>
 </div>;
}
