import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeftRight,Layers,ChevronRight} from 'lucide-react';
import Sparkles from './AIIcon';
import type {ComparisonContext} from '../collaboration';
import type {UIElement} from '../types';
import {comparisonSides} from '../comparisonSides';
import {referenceProperties,referencePropertyLabels,unifiedReferenceProposal,unifiedPatches,referenceChangeCount,type ReferenceShareDetails} from '../unifiedReference';
import {useComparisonRecommendations} from '../useComparisonRecommendations';
import {ruleBasedRecommendations,RECOMMENDATION_REASONS} from '../comparisonRecommendations';
import {tokenFacts,type TokenSuggestion} from '../designSystemReferencing';
import {type EditProposal,type Patch} from '../editing';
import {ElementPreview} from './ReferencePreviewCard';
import ComparisonPreview from './ComparisonPreview';
import DesignSystemReview from './DesignSystemReview';
export interface UnifiedReferenceEditorProps {
 onPreview:(patches:Patch[])=>void;onApply:(proposal:EditProposal,patches:Patch[])=>boolean;
 onUndo:()=>void;onRedo:()=>void;canUndo:boolean;canRedo:boolean;
}
interface Props extends UnifiedReferenceEditorProps {key?:string;context:ComparisonContext;nodes:UIElement[];sharing:(details:ReferenceShareDetails)=>React.ReactNode;onCancel:()=>void}
const colorPattern=/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%a-z]+\)|transparent)$/i;
function Values({values}:{values:string[]}){return <>{[...new Set(values)].map((value,index)=><span className="reference-recorded-value" key={value}>{index>0&&' / '}{colorPattern.test(value)&&<i style={{backgroundColor:value}} aria-hidden="true"/>}{value||'Empty text'}</span>)}</>;}
export default function UnifiedReferenceWorkflow({context,nodes,onPreview,onApply,onUndo,onRedo,canUndo,canRedo,sharing,onCancel}:Props){
 const sides=comparisonSides(context),identity=JSON.stringify([context.snapshotId,sides]);
 const initial=context.designReference?.direction.referenceSide||(context.designReference?.direction.referenceUser==='B'?'B':'A');
 const [direction,setDirection]=useState<'A'|'B'>(initial),[selected,setSelected]=useState<string[]>([]),[overrides,setOverrides]=useState<TokenSuggestion[]>([]),[message,setMessage]=useState(''),[applying,setApplying]=useState(false);
 const [libraryRequested,setLibraryRequested]=useState(false);
 const busy=useRef(false),lastApplied=useRef(''),content=useRef<HTMLDivElement>(null),preview=useRef<HTMLDivElement>(null),pendingReveal=useRef(false);
 const properties=useMemo(()=>referenceProperties(context,nodes,direction),[context,nodes,direction]);
 const keys=selected.filter(key=>properties.transferable.some(row=>row.key===key));
 const facts=tokenFacts(properties.target,nodes);
 const validOverrides=overrides.filter(s=>facts.some(f=>f.id===s.fact.id&&JSON.stringify(f)===JSON.stringify(s.fact)));
 const proposalResult=useMemo(()=>{try{return {proposal:unifiedReferenceProposal(context,nodes,direction,keys,validOverrides),error:''};}catch(error){return {proposal:null,error:(error as Error).message};}},[context,nodes,direction,keys.join('|'),JSON.stringify(validOverrides)]);
 const proposal=proposalResult.proposal,patches=unifiedPatches(proposal),patchKey=JSON.stringify(patches),count=referenceChangeCount(keys,validOverrides,proposal);
 const ai=useComparisonRecommendations(context,nodes),rules=ruleBasedRecommendations(context,nodes);
 useEffect(()=>{lastApplied.current='';setDirection(initial);setSelected([]);setOverrides([]);setMessage('');pendingReveal.current=false;onPreview([]);},[identity]);
 useEffect(()=>{onPreview(patches);return()=>onPreview([]);},[patchKey]);
 useEffect(()=>{
  if(!proposal||!pendingReveal.current)return;
  pendingReveal.current=false;
  const frame=requestAnimationFrame(()=>{const el=preview.current,scroll=content.current;if(!el||!scroll)return;const r=el.getBoundingClientRect(),v=scroll.getBoundingClientRect();if(r.top>=v.top&&r.top+120<=v.bottom)return;const delta=r.top<v.top?r.top-v.top-8:Math.min(r.top-v.top-8,r.top+120-v.bottom+8);scroll.scrollBy({top:delta,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
  return()=>cancelAnimationFrame(frame);
 },[!!proposal]);
 const toggle=(key:string)=>{if(!keys.length&&!validOverrides.length)pendingReveal.current=true;setSelected(keys.includes(key)?keys.filter(k=>k!==key):[...keys,key]);setMessage('');};
 const swap=()=>{const next=direction==='A'?'B':'A',available=referenceProperties(context,nodes,next);onPreview([]);setDirection(next);setSelected(keys.filter(key=>available.transferable.some(row=>row.key===key)));setOverrides([]);setMessage('');pendingReveal.current=false;};
 const cancel=()=>{onPreview([]);setSelected([]);setOverrides([]);onCancel();};
 const apply=()=>{if(!proposal||!patches.length||busy.current||lastApplied.current===patchKey)return;busy.current=true;setApplying(true);try{const committed=onApply(proposal,patches);if(!committed)throw Error('No changes were applied. Review the selected properties and try again.');lastApplied.current=patchKey;onPreview([]);setSelected([]);setOverrides([]);setMessage(`Applied ${count} ${count===1?'change':'changes'}.`);}catch(error){setMessage(`Could not apply ${keys.map(key=>referencePropertyLabels[key]||key).join(', ')||'selected library properties'}: ${(error as Error).message}`);}finally{busy.current=false;setApplying(false);}};
 const card=(label:string,ids:string[],side:string)=><article className={`reference-role-card ${label==='Reference'?'is-reference':''}`} aria-label={`${label} Layer ${side}`}><header>{label.toUpperCase()} <small>Layer {side}</small></header><div className="reference-role-thumbnails">{ids.slice(0,1).map(id=>{const n=nodes.find(n=>n.id===id);return n?<span className="reference-role-thumbnail" key={id}><ElementPreview element={n} nodes={nodes}/></span>:<small key={id}>Unavailable layer</small>;})}</div><strong>{ids.map(id=>nodes.find(n=>n.id===id)?.label.replace(/^Product Card \((.*)\)$/,'$1')||'Unavailable layer').join(', ')||'No layers selected'}</strong><small className="reference-role-screen">{[...new Set(ids.map(id=>nodes.find(n=>n.id===id)?.screen).filter(Boolean))].map(screen=>nodes.find(n=>n.type==='screen'&&n.screen===screen)?.label||`${screen} screen`).join(', ')}</small>{ids.length>1&&<small>{ids.length} layers</small>}</article>;
 const indexById=new Map(properties.comparison.elements.map((node,index)=>[node.id,index]));
 const values=(ids:string[],row:typeof properties.comparison.rows[number])=>ids.map(id=>{const n=nodes.find(n=>n.id===id),recorded=row.key==='background'?n?.bg:row.key==='color'?n?.color:undefined;return recorded??row.values[indexById.get(id)!]??'Not specified';});
 const summary=`Reference: Layer ${direction} → Target: Layer ${direction==='A'?'B':'A'}. Selected properties: ${keys.map(key=>referencePropertyLabels[key]||properties.transferable.find(row=>row.key===key)?.label||key).join(', ')||'None'}${validOverrides.length?`. Library overrides: ${validOverrides.map(s=>`${s.fact.tokenLabel} (${s.fact.property})`).join(', ')}`:''}.`;
 return <div className="unified-reference-workflow">
  <div ref={content} className="unified-reference-content">
   <div className="reference-role-pair">{card('Reference',properties.reference,direction)}<button className="reference-swap" type="button" aria-label="Swap reference and target" title="Swap reference and target" onClick={swap}><ArrowLeftRight size={16}/></button>{card('Target',properties.target,direction==='A'?'B':'A')}</div>
   <section className="reference-property-selection" aria-label="Properties to match"><header><h3>Properties to match</h3><small>{keys.length} of {properties.transferable.length} selected</small></header>
    {ai.loading&&<small className="reference-ai-status" role="status">Analyzing design relationships…</small>}
    {ai.message&&<div className="reference-ai-status" role="status"><small>AI unavailable · Rule-based suggestions shown.</small>{ai.retryable&&<button type="button" onClick={ai.request}>Retry</button>}</div>}
    {!properties.transferable.length&&<p className="reference-empty">No compatible changes available.</p>}
    {properties.reference.length!==1&&<p className="reference-empty">Choose one reference layer to transfer properties.</p>}
    {properties.transferable.map(row=>{const recommendation=ai.results.find(r=>r.key===row.key)||rules.find(r=>r.key===row.key),checked=keys.includes(row.key);return <label key={row.key} className={`reference-property-row ${checked?'is-selected':''}`}>
     <div className="reference-property-heading"><strong>{referencePropertyLabels[row.key]||row.label}</strong><input type="checkbox" aria-label={`Match ${referencePropertyLabels[row.key]||row.label}`} title="Select property to match" checked={checked} onChange={()=>toggle(row.key)}/></div>
     <div className="reference-property-values"><div><small>Current</small><Values values={values(properties.target,row)}/></div><span className="property-transfer-arrow" aria-hidden="true">→</span><div><small>Proposed</small><Values values={values(properties.reference,row)}/></div></div>
     {recommendation&&<small className={`reference-row-recommendation ${recommendation.category}`} title={`${recommendation.source==='model'?'AI suggestion':'Rule-based'} · ${RECOMMENDATION_REASONS[recommendation.reason]}`}>{recommendation.source==='model'&&<Sparkles size={11}/>}<span className="sr-only">{recommendation.source==='model'?'AI suggestion: ':'Rule-based: '}</span>{recommendation.category==='intentional'?'May be intentional':'Suggested match'}</small>}
    </label>;})}
   <details className="reference-all-properties"><summary>View all properties</summary><div className="reference-all-table-scroll" role="region" aria-label="Complete property comparison" tabIndex={0}><table><caption className="sr-only">All recorded properties, current target and proposed reference values</caption><thead><tr><th scope="col">Property</th><th scope="col">Current</th><th scope="col">Proposed</th></tr></thead><tbody>{properties.comparison.rows.map(row=><tr key={row.key}><th scope="row">{referencePropertyLabels[row.key]||row.label}</th><td><Values values={values(properties.target,row)}/></td><td><Values values={values(properties.reference,row)}/></td></tr>)}</tbody></table></div></details>
   </section>

   {proposal&&<div ref={preview} className="unified-reference-preview"><ComparisonPreview hideActions selectable={false} proposal={proposal} enabled={proposal.mappings.map(m=>m.id)} nodes={nodes} onPreview={onPreview} onToggle={()=>{}} onApply={apply} onCancel={cancel} supportingMessage={null}/></div>}
   {proposalResult.error&&<p className="reference-feedback" role="alert">{proposalResult.error}</p>}
   <section className="reference-other-actions" aria-label="Other actions"><h3>Other actions</h3><details className="reference-library-assistance" onToggle={event=>{if(event.currentTarget.open)setLibraryRequested(true);}}><summary><Layers size={14}/><span>Find library matches</span><ChevronRight size={13}/></summary>{libraryRequested&&<LibraryChoices key={`${identity}-${direction}`} targetIds={properties.target} nodes={nodes} onSelected={next=>{if(!proposal&&next.length)pendingReveal.current=true;setOverrides(next);setMessage('');}}/>}{validOverrides.length>0&&<small>Library overrides: {validOverrides.map(s=>`${s.fact.tokenLabel} · ${s.fact.property}`).join(', ')}</small>}</details>
   {sharing({summary,direction,keys,overrides:validOverrides})}</section>
   <div className="reference-history" aria-label="Editing history"><button type="button" disabled={!canUndo} onClick={()=>{onPreview([]);setSelected([]);setOverrides([]);lastApplied.current='';onUndo();setMessage('Changes undone.');}}>Undo</button><button type="button" disabled={!canRedo} onClick={()=>{onPreview([]);setSelected([]);setOverrides([]);lastApplied.current='';onRedo();setMessage('Changes restored.');}}>Redo</button></div>
   {message&&<p className="reference-feedback" role="status">{message}</p>}
  </div>
  <footer className="reference-workflow-footer"><p>{count?`${count} ${count===1?'property will':'properties will'} be updated on the target.`:'No properties selected.'}</p><div><button type="button" className="primary-action" disabled={!proposal||!patches.length||applying} onClick={apply}>{applying?'Applying…':count?`Apply ${count} ${count===1?'change':'changes'}`:'Apply changes'}</button><button type="button" onClick={cancel}>Cancel</button></div></footer>
 </div>;
}
function LibraryChoices({targetIds,nodes,onSelected}:{key?:string;targetIds:string[];nodes:UIElement[];onSelected:(s:TokenSuggestion[])=>void}){return <DesignSystemReview selectionOnly requestOnOpen ids={targetIds} nodes={nodes} onPropose={()=>{}} onSelected={onSelected}/>;}
