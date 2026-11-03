import React,{useEffect,useState} from 'react';
import {SlidersHorizontal,X} from 'lucide-react';
import type {UIElement} from '../types';
import {applyPatches,roots,type EditProposal,type Patch} from '../editing';
import {adjustColorProposal,hexToHSV,hsvToHex} from '../colorAdjustment';
import {ElementPreview} from './ReferencePreviewCard';
const names={bg:'Fill',color:'Text color',border:'Stroke'};
type Property=keyof typeof names;
export default function AdjustColor({ids,nodes,onPreview,onApply,onCancel}:{ids:string[];nodes:UIElement[];onPreview:(p:Patch[])=>void;onApply:(p:EditProposal,patches:Patch[])=>void;onCancel:()=>void}){
 const selected=nodes.filter(n=>ids.includes(n.id)),properties=(Object.keys(names) as Property[]).filter(k=>selected.some(n=>typeof n[k]==='string'&&/#[0-9a-f]{6}\b/i.test(n[k]!)));
 const [active,setActive]=useState<Property|null>(null),[values,setValues]=useState<Partial<Record<Property,string>>>({}),[hex,setHex]=useState('#000000');
 const [hsv,setHSV]=useState({h:0,s:0,v:0});
 const key=JSON.stringify([ids,nodes]);useEffect(()=>{setValues({});setActive(null);return()=>onPreview([]);},[key]);
 const proposal=adjustColorProposal(ids,nodes,values),patches=proposal.mappings.flatMap(m=>m.patches),after=applyPatches(nodes,patches),patchKey=JSON.stringify(patches);
 useEffect(()=>{onPreview(patches);},[patchKey]);
 function open(k:Property){const color=values[k]||selected.find(n=>n[k])?.[k]?.match(/#[0-9a-f]{6}\b/i)?.[0]||'#000000';setActive(k);setHex(color);setHSV(hexToHSV(color));}
 function change(color:string){setHex(color);if(active&&/^#[0-9a-f]{6}$/i.test(color)){setValues(current=>({...current,[active]:color}));setHSV(hexToHSV(color));}}
 function slider(k:'h'|'s'|'v',value:number){const next={...hsv,[k]:value},color=hsvToHex(next.h,next.s,next.v);setHSV(next);setHex(color);if(active)setValues(current=>({...current,[active]:color}));}
 return <section className="adjust-color" aria-label="Adjust color"><div className="adjust-color-rows">{properties.map(k=>{const colors=[...new Set(selected.flatMap(n=>n[k]?[values[k]||n[k]!.match(/#[0-9a-f]{6}\b/i)?.[0]]:[]))],color=colors[0];return <button type="button" className={`adjust-color-row ${active===k?'is-active':''}`} key={k} onClick={()=>open(k)}><i style={{backgroundColor:color}} aria-hidden="true"/><span><strong>{names[k]}</strong><small>{colors.length>1?'Mixed':color?.toUpperCase()}</small></span><SlidersHorizontal size={15}/></button>;})}</div>
 {active&&<section className="adjust-color-picker" aria-label={`${names[active]} color`}><header><strong>{names[active]} color</strong><button type="button" aria-label="Close color controls" onClick={()=>setActive(null)}><X size={14}/></button></header>
 <div className="adjust-color-wheel" role="slider" aria-label="Hue wheel" tabIndex={0} aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hsv.h)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();slider('h',(hsv.h+(e.key==='ArrowRight'?1:359))%360);}}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const box=e.currentTarget.getBoundingClientRect();slider('h',(Math.atan2(e.clientY-box.top-box.height/2,e.clientX-box.left-box.width/2)*180/Math.PI+450)%360);}} onPointerMove={e=>{if(e.buttons===1){const box=e.currentTarget.getBoundingClientRect();slider('h',(Math.atan2(e.clientY-box.top-box.height/2,e.clientX-box.left-box.width/2)*180/Math.PI+450)%360);}}}><div style={{backgroundColor:hsvToHex(hsv.h,100,100)}}><i style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(hex)?hex:'#000000'}}/></div></div>

 <label className="adjust-color-hex"><i style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(hex)?hex:'#000000'}}/><input aria-label="Hex color" value={hex.toUpperCase()} onChange={e=>change(e.target.value)} aria-invalid={!/^#[0-9a-f]{6}$/i.test(hex)}/></label></section>}
 <section className="adjust-color-preview"><h4>Preview</h4>{roots(ids,after).map(n=><div key={n.id}><ElementPreview element={n} nodes={after}/></div>)}</section>
 <div className="confirmation-actions"><button type="button" className="primary-action" disabled={!patches.length||!!active&&!/^#[0-9a-f]{6}$/i.test(hex)} onClick={()=>{onApply(proposal,patches);onPreview([]);onCancel();}}>Apply changes</button><button type="button" onClick={()=>{onPreview([]);onCancel();}}>Cancel</button></div></section>;
}
