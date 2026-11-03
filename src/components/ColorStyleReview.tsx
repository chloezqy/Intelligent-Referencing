import React,{useEffect,useRef,useState} from 'react';
import {requestAI} from '../aiClient';
import {colorPalette,colorStyleFacts,validateColorSuggestions,colorStyleProposal} from '../colorStyleMatching';
import {type TokenSuggestion} from '../designSystemReferencing';
import type {UIElement} from '../types';
import type {Patch,EditProposal} from '../editing';
import {proposalPatches} from '../editing';
import ComparisonPreview from './ComparisonPreview';
export default function ColorStyleReview({ids,nodes,onPreview,onApply,onCancel}:{ids:string[];nodes:UIElement[];onPreview:(p:Patch[])=>void;onApply:(p:EditProposal,patches:Patch[])=>void;onCancel:()=>void}){
 const facts=colorStyleFacts(ids,nodes),palette=colorPalette(nodes),key=JSON.stringify([ids,facts,nodes]);
 const [suggestions,setSuggestions]=useState<TokenSuggestion[]>([]),[chosen,setChosen]=useState<TokenSuggestion[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const manual=useRef(false);
 useEffect(()=>{const abort=new AbortController();manual.current=false;setBusy(true);setError('');setChosen([]);setSuggestions([]);
 void(async()=>{try{const contextId=crypto.randomUUID(),result=await requestAI({task:'design-system',colorPalette:true,colorPaletteVersion:1,contextId,targetIds:ids,properties:['colors'],document:nodes},{signal:abort.signal,force:attempt>0});if(result.colorPaletteVersion!==1)throw Error('The AI server needs to be updated for palette matching.');const ranked=validateColorSuggestions(result.tokenSuggestions,facts);if(!abort.signal.aborted){setSuggestions(ranked);if(!manual.current){const seen=new Set<string>();setChosen(ranked.filter(s=>{const k=`${s.fact.targetId}:${s.fact.property}`;if(seen.has(k))return false;seen.add(k);return true;}));}}}catch(e){if(!abort.signal.aborted)setError((e as Error).message);}finally{if(!abort.signal.aborted)setBusy(false);}})();return()=>{abort.abort();onPreview([]);};},[key,attempt]);
 const selected=chosen.filter(s=>!s.fact.exact);let proposal:EditProposal|undefined;
 if(selected.length)proposal=colorStyleProposal(selected,ids,nodes);
 const patches=proposal?proposalPatches(proposal,proposal.mappings.map(m=>m.id),nodes):[],patchKey=JSON.stringify(patches);
 useEffect(()=>{onPreview(patches);},[patchKey]);
 function chooseToken(tokenId:string){manual.current=true;const seen=new Set<string>();setChosen(facts.filter(f=>f.tokenId===tokenId).filter(f=>{const k=`${f.targetId}:${f.property}`;if(seen.has(k))return false;seen.add(k);return true;}).map(fact=>({fact,reason:'Manually selected library style',source:'deterministic'})));}
 function chooseSuggestion(s:TokenSuggestion){manual.current=true;setChosen(current=>[...current.filter(c=>c.fact.targetId!==s.fact.targetId||c.fact.property!==s.fact.property),s]);}
 return <section className="color-style-review" aria-label="Existing color styles">
 {busy&&<p role="status">Finding relevant color styles…</p>}{error&&<><p role="status">{error} Browse existing styles below.</p><button type="button" onClick={()=>setAttempt(a=>a+1)}>Retry AI</button></>}
 {chosen.length>0&&<><h4>Color styles</h4>{chosen.map(s=><div className="color-style-recommendation" key={s.fact.id} title={s.reason}><i aria-hidden="true" style={{backgroundColor:palette.find(t=>t.id===s.fact.tokenId)?.value}}/><div><strong>{s.fact.tokenLabel.replace('Color / ','')}</strong><small>{s.fact.property==='bg'?'Fill':s.fact.property==='color'?'Text':'Stroke'} · {s.source==='model'?'AI suggested':'Selected'}</small></div></div>)}</>}
 {!busy&&!error&&!chosen.length&&<p>No suggested color style. Explore the library below.</p>}
 {suggestions.filter(s=>!chosen.some(c=>c.fact.id===s.fact.id)).slice(0,2).map(s=><button type="button" className="color-style-alternative" title={s.reason} key={s.fact.id} onClick={()=>chooseSuggestion(s)}><i aria-hidden="true" style={{backgroundColor:palette.find(t=>t.id===s.fact.tokenId)?.value}}/>{s.fact.tokenLabel.replace('Color / ','')}</button>)}
 <details className="color-style-browser"><summary>Other available color styles</summary><div className="color-style-palette">{palette.map(t=><button type="button" key={t.id} title={t.value} aria-pressed={chosen.some(s=>s.fact.tokenId===t.id)} disabled={!facts.some(f=>f.tokenId===t.id)} onClick={()=>chooseToken(t.id)}><i aria-hidden="true" style={{backgroundColor:t.value}}/><span>{t.name}</span>{t.role&&<small>{t.role}</small>}</button>)}</div></details>
 {proposal?<ComparisonPreview variant="design-system" proposal={proposal} enabled={proposal.mappings.map(m=>m.id)} nodes={nodes} onToggle={()=>{}} onApply={()=>{onApply(proposal!,patches);onPreview([]);onCancel();}} onCancel={()=>{onPreview([]);onCancel();}}/>:<>{chosen.length>0&&<p>Already uses this style. No changes necessary.</p>}<div className="confirmation-actions"><button type="button" className="primary-action" disabled>Apply changes</button><button type="button" onClick={()=>{onPreview([]);onCancel();}}>Cancel</button></div></>}
 </section>;
}
