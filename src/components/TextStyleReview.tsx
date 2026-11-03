import React,{useEffect,useRef,useState} from 'react';
import {requestAI} from '../aiClient';
import {textStyleLibrary,textStyleTargets,textStyleProposal,validateTextStyleSuggestions,type TextStyleSuggestion} from '../textStyleMatching';
import type {UIElement} from '../types';
import {proposalPatches,type Patch,type EditProposal} from '../editing';
import ComparisonPreview from './ComparisonPreview';
import {ElementPreview} from './ReferencePreviewCard';
type Choice={targetId:string;styleId:string;reason:string;source:'model'|'manual'};
export default function TextStyleReview({ids,nodes,onPreview,onApply,onCancel}:{ids:string[];nodes:UIElement[];onPreview:(p:Patch[])=>void;onApply:(proposal:EditProposal,patches:Patch[])=>void;onCancel:()=>void}){
 const styles=textStyleLibrary(nodes),targets=textStyleTargets(ids,nodes),key=JSON.stringify([ids,nodes]);
 const [ranked,setRanked]=useState<TextStyleSuggestion[]>([]),[chosen,setChosen]=useState<Choice[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const manual=useRef(false);
 useEffect(()=>{const abort=new AbortController();manual.current=false;setBusy(true);setChosen([]);setRanked([]);setError('');
 void(async()=>{try{const contextId=crypto.randomUUID(),result=await requestAI({task:'text-styles',contextId,targetIds:ids,document:nodes},{signal:abort.signal,force:attempt>0}),suggestions=validateTextStyleSuggestions(result.textStyleSuggestions,ids,nodes);
 if(!abort.signal.aborted){setRanked(suggestions);if(!manual.current){const seen=new Set<string>();setChosen(suggestions.filter(s=>!seen.has(s.targetId)&&!!seen.add(s.targetId)));}}}catch(e){if(!abort.signal.aborted)setError((e as Error).message);}finally{if(!abort.signal.aborted)setBusy(false);}})();return()=>{abort.abort();onPreview([]);};},[key,attempt]);
 const proposal=textStyleProposal(chosen,ids,nodes),enabled=proposal.mappings.map(m=>m.id),patches=proposalPatches(proposal,enabled,nodes),patchKey=JSON.stringify(patches);
 useEffect(()=>{onPreview(patches);},[patchKey]);
 const cancel=()=>{onPreview([]);onCancel();};
 function choose(styleId:string){manual.current=true;setChosen(targets.map(t=>({targetId:t.id,styleId,reason:'Manually selected library style',source:'manual'})));}
 return <section className="color-style-review text-style-review" aria-label="Existing text styles">
 {busy&&<p role="status">Finding relevant text styles…</p>}{error&&<><p role="status">{error} Browse existing styles below.</p><button type="button" onClick={()=>setAttempt(a=>a+1)}>Retry AI</button></>}
 {chosen.length>0&&<>{chosen.map(c=><div className="color-style-recommendation" key={c.targetId} title={c.reason}><div className="text-style-choice"><strong>{styles.find(s=>s.id===c.styleId)?.token?.replace('Typography / ','')}</strong><small>{c.source==='model'?'AI suggested':'Selected'}{chosen.length>1?` · ${targets.find(t=>t.id===c.targetId)?.label}`:''}</small></div></div>)}</>}
 {!busy&&!error&&!chosen.length&&<p>No suggested text style. Browse the library below.</p>}
 {ranked.filter(s=>!chosen.some(c=>c.targetId===s.targetId&&c.styleId===s.styleId)).slice(0,2).map(s=><button type="button" className="color-style-alternative" key={`${s.targetId}-${s.styleId}`} title={s.reason} onClick={()=>{manual.current=true;setChosen(current=>[...current.filter(c=>c.targetId!==s.targetId),s]);}}>{styles.find(t=>t.id===s.styleId)?.token?.replace('Typography / ','')}</button>)}
 <details className="color-style-browser"><summary>Other available text styles</summary><div className="text-style-library">{styles.map(s=><button type="button" key={s.id} aria-pressed={chosen.some(c=>c.styleId===s.id)} onClick={()=>choose(s.id)}><span className="text-style-sample" style={{fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,color:s.color}}>Aa</span><span>{s.token?.replace('Typography / ','')}</span></button>)}</div></details>
 {chosen.length>0&&patches.length>0?<ComparisonPreview compact selectable={false} variant="typography" proposal={proposal} enabled={enabled} nodes={nodes} onToggle={()=>{}} onApply={()=>{onApply(proposal,patches);cancel();}} onCancel={cancel}/>:<>{chosen.length>0&&<><div className="comparison-before-after">{targets.map(t=><div key={t.id}><ElementPreview element={t} nodes={nodes}/></div>)}</div><p>Already matches this style</p></>}<div className="confirmation-actions"><button type="button" className="primary-action" disabled>Apply changes</button><button type="button" onClick={cancel}>Cancel</button></div></>}
 </section>;
}
