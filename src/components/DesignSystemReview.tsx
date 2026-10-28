import React,{useEffect,useRef,useState} from 'react';
import type {UIElement} from '../types';
import {TOKEN_LABELS,tokenValue,exactTokenSuggestions,tokenFacts,filterTokenFacts,tokenProposal,validateTokenSuggestions,TokenSuggestion} from '../designSystemReferencing';
import type {EditProposal} from '../editing';
const cache=new Map<string,TokenSuggestion[]>();
export function SharedTokenSuggestions({suggestions,nodes}:{suggestions:TokenSuggestion[];nodes:UIElement[]}){return <div className="token-review-list">{suggestions.map(s=><div key={s.fact.id}><strong>{TOKEN_LABELS[s.fact.property]} · {s.fact.tokenLabel}</strong><small>{nodes.find(n=>n.id===s.fact.targetId)?.label||'Unavailable object'} · {tokenValue(s.fact.property,s.fact.current)} → {tokenValue(s.fact.property,s.fact.proposed)}</small><small>{s.source==='model'?'AI suggestion':'Exact rule-based match'} · {s.reason}</small></div>)}</div>;}
export default function DesignSystemReview({properties,ids,nodes,onPropose,onSelected}:{properties?:string[];ids:string[];nodes:UIElement[];onPropose:(p:EditProposal,origin:'model'|'deterministic')=>void;onSelected:(s:TokenSuggestion[])=>void}){
 const facts=filterTokenFacts(tokenFacts(ids,nodes),properties),key=JSON.stringify([ids,facts]),current=useRef(key);current.current=key;
 const [results,setResults]=useState<TokenSuggestion[]>([]),[checked,setChecked]=useState<string[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const abort=useRef<AbortController|null>(null);
 useEffect(()=>{abort.current?.abort();setResults(exactTokenSuggestions(facts));setChecked([]);setBusy(false);setMessage('');onSelected([]);if(facts.length)void request();return()=>abort.current?.abort();},[key]);
 const changes=results.filter(s=>!s.fact.exact);
 const showTargets=new Set(changes.map(s=>s.fact.targetId)).size>1;
 const select=(next:string[])=>{setChecked(next);onSelected(results.filter(s=>next.includes(s.fact.id)));};
 async function request(){if(!facts.length)return;const controller=new AbortController();abort.current?.abort();abort.current=controller;setBusy(true);setMessage('');try{
  let suggestions=cache.get(key);
  if(!suggestions){const contextId=crypto.randomUUID(),response=await fetch('/api/semantic/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'design-system',contextId,targetIds:ids,properties,document:nodes}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('AI unavailable. Exact matches and editing controls remain available.');
   const result=await response.json();if(!response.ok)throw new Error(result.error||'AI unavailable.');if(result.contextId!==contextId)throw new Error('Selection changed.');suggestions=validateTokenSuggestions(result.tokenSuggestions,facts);cache.set(key,suggestions);if(cache.size>12)cache.delete(cache.keys().next().value!);
  }
  if(!controller.signal.aborted&&current.current===key){setResults(suggestions);select([]);setMessage(suggestions.length?'':'No meaningful design system suggestions. Differences may be intentional.');}
 }catch(error){if(!controller.signal.aborted)setMessage('AI unavailable. Exact matches remain available.');}finally{if(!controller.signal.aborted)setBusy(false);}}
 return <div className="design-system-review">{busy&&<p role="status">Finding relevant tokens…</p>}{!facts.length&&<p>No recorded properties support a library match.</p>}
 <div className="token-review-list">{changes.map(s=><label key={s.fact.id}><input type="checkbox" checked={checked.includes(s.fact.id)} onChange={()=>select(checked.includes(s.fact.id)?checked.filter(id=>id!==s.fact.id):[...checked,s.fact.id])}/><span><strong>{TOKEN_LABELS[s.fact.property]}{showTargets&&` · ${nodes.find(n=>n.id===s.fact.targetId)?.label}`}</strong><small>Current: {tokenValue(s.fact.property,s.fact.current)}</small><small>{s.fact.tokenLabel} · {tokenValue(s.fact.property,s.fact.proposed)}</small><small className="token-suggestion-source" title={s.reason}>{s.source==='model'?'AI suggestion':'Exact match'}</small></span></label>)}</div>
 {!busy&&facts.length>0&&results.length>0&&!changes.length&&<p>No library style changes needed.</p>}
 {changes.length>0&&<><small>{checked.length} {checked.length===1?'property':'properties'} selected</small><button type="button" disabled={!results.some(s=>checked.includes(s.fact.id)&&!s.fact.exact)} onClick={()=>{try{const chosen=results.filter(s=>checked.includes(s.fact.id));onPropose(tokenProposal(chosen,ids,nodes),chosen.some(s=>s.source==='model')?'model':'deterministic');}catch(error){setMessage((error as Error).message);}}}>Preview selected changes</button></>}{message&&<p role="status">{message}</p>}
 </div>;
}
