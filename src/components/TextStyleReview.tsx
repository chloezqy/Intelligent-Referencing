import React,{useEffect,useRef,useState} from 'react';
import {MousePointer2} from 'lucide-react';
import {requestAI} from '../aiClient';
import {canvasTextReferences,textStyleLibrary,textStyleTargets,textStyleProposal,validateTextStyleSuggestions,type TextStyleSuggestion} from '../textStyleMatching';
import type {UIElement} from '../types';
import {proposalPatches,type Patch,type EditProposal} from '../editing';
import ComparisonPreview from './ComparisonPreview';
type Choice={targetId:string;styleId:string;reason:string;source:'model'|'manual'};
export default function TextStyleReview({ids,nodes,sourceId=null,onSource=()=>{},picking=false,onPicking=()=>{},onPreview,onApply,onCancel}:{ids:string[];nodes:UIElement[];sourceId?:string|null;onSource?:(id:string|null)=>void;picking?:boolean;onPicking?:(v:boolean)=>void;onPreview:(p:Patch[])=>void;onApply:(proposal:EditProposal,patches:Patch[])=>void;onCancel:()=>void}){
 const styles=textStyleLibrary(nodes),references=[...styles,...canvasTextReferences(ids,nodes)],targets=textStyleTargets(ids,nodes),key=JSON.stringify([ids,nodes]);
 const [ranked,setRanked]=useState<TextStyleSuggestion[]>([]),[chosen,setChosen]=useState<Choice[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[pickError,setPickError]=useState(''),[attempt,setAttempt]=useState(0);
 const manual=useRef(false);
 useEffect(()=>{const abort=new AbortController();manual.current=false;onSource(null);setBusy(true);setChosen([]);setRanked([]);setError('');setPickError('');
 void(async()=>{try{const contextId=crypto.randomUUID(),result=await requestAI({task:'text-styles',canvasReferences:true,contextId,targetIds:ids,document:nodes},{signal:abort.signal,force:attempt>0}),suggestions=validateTextStyleSuggestions(result.textStyleSuggestions,ids,nodes,true);
 if(!abort.signal.aborted){setRanked(suggestions);if(!manual.current){const seen=new Set<string>();setChosen(suggestions.filter(s=>!seen.has(s.targetId)&&!!seen.add(s.targetId)));}}}catch(e){if(!abort.signal.aborted)setError((e as Error).message);}finally{if(!abort.signal.aborted)setBusy(false);}})();return()=>{abort.abort();onPreview([]);};},[key,attempt]);
 useEffect(()=>{if(!sourceId)return;const source=canvasTextReferences(ids,nodes).find(n=>n.id===sourceId);if(!source){setPickError('Choose a text layer outside the target selection.');onPicking(true);return;}manual.current=true;setPickError('');setChosen(targets.map(t=>({targetId:t.id,styleId:sourceId,reason:'Manually selected canvas reference',source:'manual'})));},[sourceId]);
 useEffect(()=>{if(!picking)return;const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onPicking(false);setPickError('');}};window.addEventListener('keydown',escape,true);return()=>window.removeEventListener('keydown',escape,true);},[picking]);
 const proposal=textStyleProposal(chosen,ids,nodes),enabled=proposal.mappings.map(m=>m.id),patches=proposalPatches(proposal,enabled,nodes),patchKey=JSON.stringify(patches);
 useEffect(()=>{onPreview(patches);},[patchKey]);
 const cancel=()=>{onPreview([]);onPicking(false);onCancel();};
 function choose(styleId:string){manual.current=true;onPicking(false);setPickError('');setChosen(targets.map(t=>({targetId:t.id,styleId,reason:'Manually selected library style',source:'manual'})));}
 const options=<section className="text-reference-options" aria-label="Choose another reference"><div className="text-reference-options-header"><h4>Choose another reference</h4></div>

 {ranked.filter(s=>!chosen.some(c=>c.targetId===s.targetId&&c.styleId===s.styleId)).slice(0,2).map(s=><button type="button" className="color-style-alternative" key={`${s.targetId}-${s.styleId}`} title={s.reason} onClick={()=>{manual.current=true;onPicking(false);setChosen(current=>[...current.filter(c=>c.targetId!==s.targetId),s]);}}>{references.find(t=>t.id===s.styleId)?.token?.replace('Typography / ','')||references.find(t=>t.id===s.styleId)?.label}</button>)}
 <details className="color-style-browser"><summary>Other available text styles</summary><div className="text-style-library">{styles.map(s=><button type="button" key={s.id} disabled={!targets.length} aria-pressed={chosen.some(c=>c.styleId===s.id)} onClick={()=>choose(s.id)}><span className="text-style-sample" style={{fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,color:s.color}}>Aa</span><span>{s.token?.replace('Typography / ','')}</span></button>)}</div></details><div className="layer-reference-pick"><button type="button" aria-pressed={picking} onClick={()=>{manual.current=true;onSource(null);onPicking(!picking);}}><MousePointer2 size={14} aria-hidden="true"/>Pick source</button></div> {picking&&<p role="status">Pick a text layer on the canvas or in Layers. Escape to cancel.</p>}{pickError&&<p role="status">{pickError}</p>}</section>;
 return <section className="color-style-review text-style-review" aria-label="Match text styles">
 {busy&&!chosen.length&&<p role="status">Finding a typography reference…</p>}{error&&!chosen.length&&<><p role="status">{error} Choose a reference below.</p><button type="button" onClick={()=>setAttempt(a=>a+1)}>Retry AI</button></>}
 {chosen.map(c=>{const reference=references.find(s=>s.id===c.styleId);return <div className="color-style-recommendation" key={c.targetId} title={c.reason}><div className="text-style-choice"><strong>{reference?.library?reference.token?.replace('Typography / ',''):`${reference?.label} · ${reference?.screen}`}</strong><small>{c.source==='model'?'AI suggested':'Selected'} · {reference?.library?'Design system':'Canvas layer'}</small></div></div>;})}
 {!busy&&!error&&!chosen.length&&<p>No suggested reference. Choose one below.</p>}
 {chosen.length>0?<ComparisonPreview compact selectable={false} applyDisabled={picking} emptyMessage="Styles already match" beforeChanges={<>{options}<h4 className="text-style-changes-heading">Changes</h4></>} variant="typography" proposal={proposal} enabled={enabled} nodes={nodes} onToggle={()=>{}} onApply={()=>{onApply(proposal,patches);cancel();}} onCancel={cancel}/>:<>{options}<div className="confirmation-actions"><button type="button" className="primary-action" disabled>Apply changes</button><button type="button" onClick={cancel}>Cancel</button></div></>}
 </section>;
}
