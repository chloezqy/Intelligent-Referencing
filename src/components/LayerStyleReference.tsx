import {MousePointer2} from 'lucide-react';
import React,{useEffect,useRef,useState} from 'react';
import {requestAI} from '../aiClient';
import {layerStyleProposal,suggestedLayerId} from '../layerStyleReference';
import {applyPatches,proposalPatches,type EditProposal,type Patch} from '../editing';
import type {UIElement} from '../types';
import {ElementPreview} from './ReferencePreviewCard';
const labels:Record<string,string>={bg:'Background color',color:'Text color',radius:'Corner radius',border:'Stroke',shadow:'Shadow',spacing:'Spacing',fontFamily:'Font family',fontSize:'Font size',fontWeight:'Font weight',lineHeight:'Line height',letterSpacing:'Letter spacing'};
export default function LayerStyleReference({properties,ids,nodes,sourceId,onSource,picking,onPicking,onPreview,onApply,onCancel}:{properties?:string[];ids:string[];nodes:UIElement[];sourceId:string|null;onSource:(id:string|null)=>void;picking:boolean;onPicking:(v:boolean)=>void;onPreview:(p:Patch[])=>void;onApply:(p:EditProposal,patches:Patch[])=>void;onCancel:()=>void}){
 const [busy,setBusy]=useState(true),[suggested,setSuggested]=useState<string|null>(null),[message,setMessage]=useState('');
 const manual=useRef(false),key=JSON.stringify([ids,nodes,properties]);
 useEffect(()=>{const abort=new AbortController();manual.current=false;onSource(null);setBusy(true);setSuggested(null);setMessage('');
 void(async()=>{try{const contextId=crypto.randomUUID(),result=await requestAI({task:'editing',contextId,targetIds:ids,document:nodes,instruction:(properties?`Only match these properties: ${properties.join(', ')}. `:'')+'Suggest exactly one matchStyles reference layer for these targets. Choose a semantically related existing layer using role, type, hierarchy and screen context. Preserve content; use role all. Do not suggest other operations or invent IDs.'},{signal:abort.signal});
 const id=suggestedLayerId(result.plan,ids,nodes);if(!abort.signal.aborted&&!manual.current){setSuggested(id);onSource(id);}
 }catch{if(!abort.signal.aborted&&!manual.current)setMessage('No suggested reference');}finally{if(!abort.signal.aborted)setBusy(false);}})();
 return()=>{abort.abort();onPreview([]);};},[key]);
 useEffect(()=>{if(!picking)return;const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onPicking(false);}};window.addEventListener('keydown',escape,true);return()=>window.removeEventListener('keydown',escape,true);},[picking]);
 let proposal:EditProposal|undefined,issue='';try{if(sourceId)proposal=layerStyleProposal(ids,nodes,sourceId,properties);}catch(e){issue=(e as Error).message;}
 useEffect(()=>{if(issue&&sourceId)onPicking(true);},[sourceId,issue]);
 const patches=proposal?proposalPatches(proposal,proposal.mappings.map(m=>m.id),nodes):[],patchKey=JSON.stringify(patches);
 useEffect(()=>{onPreview(patches);},[patchKey]);
 const after=applyPatches(nodes,patches),source=nodes.find(n=>n.id===sourceId),targets=nodes.filter(n=>ids.includes(n.id));
 return <section className="layer-style-reference" aria-label="Match another layer">
 {busy&&!source&&<p role="status">Finding a relevant reference…</p>}{message&&!source&&<p role="status">{message}</p>}
 <div className="comparison-before-after"><div><small>Current selection</small>{targets.map(n=><div key={n.id}><ElementPreview element={n} nodes={nodes}/><small>{n.label}</small></div>)}</div><div><small>{sourceId===suggested?'Suggested reference':'Chosen reference'}</small>{source?<><ElementPreview element={source} nodes={nodes}/><small>{source.screen} · {source.label}</small></>:<p>No suggested reference</p>}</div></div>
 <div className="layer-reference-pick"><button type="button" aria-pressed={picking} onClick={()=>{manual.current=true;onPicking(!picking);}}><MousePointer2 size={14} aria-hidden="true"/>Pick another layer</button></div>
 {picking&&<p role="status">Choose a compatible layer on the canvas or in Layers. Escape to cancel.</p>}{issue&&<p role="status">{issue}</p>}
 {proposal&&<><h4>Proposed changes</h4>{!patches.length?<p>Styles already match</p>:<>{targets.map(n=><div className="layer-reference-result" key={n.id}><small>After{targets.length>1?` · ${n.label}`:''}</small><ElementPreview element={after.find(a=>a.id===n.id)!} nodes={after}/></div>)}<dl className="library-change-summary">{patches.flatMap(p=>Object.entries(p.changes).map(([key,next])=><div key={`${p.id}-${key}`}><dt>{labels[key]||key}{targets.length>1?` · ${nodes.find(n=>n.id===p.id)?.label}`:''}</dt><dd>{String(nodes.find(n=>n.id===p.id)?.[key as keyof UIElement]??'Not recorded')} → {String(next)}</dd></div>))}</dl></>}</>}
 <div className="confirmation-actions"><button type="button" className="primary-action" disabled={!proposal||!patches.length||picking} onClick={()=>{if(proposal){onApply(proposal,patches);onPreview([]);onCancel();}}}>Apply changes</button><button type="button" onClick={()=>{onPreview([]);onPicking(false);onCancel();}}>Cancel</button></div>
 </section>;
}
