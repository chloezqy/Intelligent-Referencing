import React,{useEffect,useRef,useState} from 'react';
import {Library} from 'lucide-react';
import type {UIElement} from '../types';
import {ACTION_CATEGORIES,categoryProposal,selectionStyleChanges,unevenSpacing,type ActionCategory} from '../selectionAIActions';
import {applyPatches,changedPatches,descendants,layoutPatches,proposalPatches,roots,type EditProposal,type LayoutOperation,type Patch} from '../editing';
import {compileActionPlan,validateActionPlan} from '../actionIntent';
import {requestAI} from '../aiClient';
import AIActionsPanel,{AIIcon} from './AIActionsPanel';
interface Props {key?:string;ids:string[];nodes:UIElement[];sourceId:string|null;onSource:(id:string|null)=>void;picking:boolean;onPicking:(v:boolean)=>void;onPreview:(patches:Patch[])=>void;onApply:(proposal:EditProposal,patches:Patch[])=>void;onUndo:()=>void;canUndo:boolean;onState:(state:string)=>void;onEvent?:(type:string,details?:{patches:Patch[];ids:string[]})=>void;onLocateLibrary?:()=>void}
const alignment:[LayoutOperation,string][]=[['left','Align left'],['center','Align horizontal centers'],['right','Align right'],['top','Align top'],['middle','Align vertical centers'],['bottom','Align bottom']];
const moreActions:[LayoutOperation,string][]=[['horizontal','Distribute horizontally'],['vertical','Distribute vertically'],['spacing','Even spacing'],['width','Match width'],['height','Match height']];
const fieldLabels:Record<string,string>={bg:'Fill',color:'Text color',border:'Stroke',fontFamily:'Font',fontSize:'Size',fontWeight:'Weight',lineHeight:'Line height',letterSpacing:'Letter spacing',radius:'Radius',shadow:'Shadow',spacing:'Spacing',x:'X',y:'Y',w:'Width',h:'Height'};
const display=(v:unknown)=>v===undefined?'Default':String(v);
export default function SelectionAIActions({ids,nodes,sourceId,onSource,picking,onPicking,onPreview,onApply,onUndo,canUndo,onState,onEvent,onLocateLibrary}:Props){
 const [mode,setMode]=useState<'library'|'source'|null>(null),[categories,setCategories]=useState<ActionCategory[]>([]),[preview,setPreview]=useState(false),[more,setMore]=useState(false),[dismissed,setDismissed]=useState(false);
 const [instruction,setInstruction]=useState(''),[submitted,setSubmitted]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState('');
 const pending=useRef<AbortController|null>(null),key=ids.join('|'),identity=JSON.stringify([ids,nodes]),currentIdentity=useRef(identity);currentIdentity.current=identity;
 const committedIdentity=useRef<string|null>(null);
 const selected=roots(ids,nodes),editable=selected.length>0&&selected.every(n=>!n.library);
 const source=nodes.find(n=>n.id===sourceId),spacing=unevenSpacing(ids,nodes);
 let changes:ReturnType<typeof selectionStyleChanges>=[],issue='';
 try{if(mode==='library'||mode==='source'&&sourceId)changes=selectionStyleChanges(ids,nodes,mode==='source'?sourceId!:undefined);}catch(error){issue=(error as Error).message;}
 const chosen=changes.filter(c=>categories.includes(c.category));
 let proposal:EditProposal|undefined;
 try{if(chosen.length)proposal=categoryProposal(ids,nodes,changes,categories,mode==='source'?sourceId!:undefined);}catch(error){issue=(error as Error).message;}
 const patches=proposal?proposalPatches(proposal,proposal.mappings.map(m=>m.id),nodes):[];
 const patchKey=JSON.stringify(patches);
 useEffect(()=>{pending.current?.abort();setMode(null);setCategories([]);setPreview(false);setMore(false);setDismissed(false);setInstruction('');setSubmitted('');setBusy(false);setMessage('');setResult('');onPreview([]);onPicking(false);return()=>{pending.current?.abort();onPreview([]);};},[key]);
 useEffect(()=>{
  if(busy){pending.current?.abort();setMessage('The document changed. Submit the command again.');}
  if(committedIdentity.current&&committedIdentity.current!==identity){setResult('');setSubmitted('');committedIdentity.current=null;}
  setBusy(false);setPreview(false);setCategories([]);onPreview([]);
 },[nodes]);
 useEffect(()=>{setCategories([]);setPreview(false);onPreview([]);},[sourceId]);
 useEffect(()=>{onPreview(preview?patches:[]);},[preview,patchKey]);
 useEffect(()=>{if(!picking&&!more)return;const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();onPicking(false);setMore(false);}};window.addEventListener('keydown',escape,true);return()=>window.removeEventListener('keydown',escape,true);},[picking,more]);
 function reset(){pending.current?.abort();setBusy(false);onPreview([]);setPreview(false);setCategories([]);setMessage('');setResult('');setSubmitted('');setMore(false);onPicking(false);}
 function start(next:'library'|'source'){reset();setMode(next);setDismissed(true);onEvent?.('action_menu_opened');if(next==='library'){setCategories([...ACTION_CATEGORIES]);setPreview(true);}else{onSource(null);onPicking(true);}onState(next==='library'?'Previewing Changes':'Choosing Action');}
 function commit(p:EditProposal,summary:string){try{const edits=changedPatches(nodes,proposalPatches(p,p.mappings.map(m=>m.id),nodes));if(!edits.length){setMessage('These properties already match.');return;}onPreview([]);setPreview(false);committedIdentity.current=JSON.stringify([ids,applyPatches(nodes,edits)]);onApply(p,edits);onEvent?.('ai_action_applied',{patches:edits,ids:[...ids]});onPicking(false);setMode(null);setCategories([]);setResult(summary);setMessage('');setDismissed(true);setMore(false);onState('Changes Applied');}catch(error){setMessage((error as Error).message);}}
 function layout(op:LayoutOperation,title:string){try{const edits=layoutPatches(ids,nodes,op);commit({title,targetIds:[...ids],mappings:[{id:'layout',label:title,patches:edits}]},`${title} applied to ${selected.length} layers.`);}catch(error){setMessage((error as Error).message);}}
 async function ask(event:React.FormEvent){event.preventDefault();if(!editable||busy||!instruction.trim())return;reset();setMode(null);const text=instruction.trim();setSubmitted(text);setBusy(true);setDismissed(true);const controller=new AbortController();pending.current=controller;const snapshot=identity,contextId=crypto.randomUUID();onEvent?.('ai_edit_requested');
  try{const response=await requestAI({task:'editing',contextId,targetIds:[...ids],instruction:text,document:nodes},{signal:controller.signal});if(controller.signal.aborted||currentIdentity.current!==snapshot)return;if(response.contextId!==contextId)throw Error('The selection changed. Try again.');const plan=validateActionPlan(response.plan,nodes),p=compileActionPlan(plan,ids,nodes);commit(p,plan.title);setInstruction('');}
  catch(error){if(!controller.signal.aborted&&currentIdentity.current===snapshot)setMessage((error as Error).message);}finally{if(!controller.signal.aborted)setBusy(false);}
 }
 function dismiss(){reset();setMode(null);setDismissed(true);}
 function undo(){onPreview([]);onUndo();setResult('');setSubmitted('');setMessage('Changes undone.');onState('Reference Confirmed');}
 function layoutButton(op:LayoutOperation,title:string,icon=false){let reason='';try{layoutPatches(ids,nodes,op);}catch(error){reason=(error as Error).message;}return <button type="button" key={op} title={reason||title} aria-label={title} disabled={busy||!!reason} onClick={()=>layout(op,title)}>{icon?<AIIcon name={op}/>:title}</button>;}
 const excluded=new Set(descendants(ids,nodes).map(n=>n.id));
 const sources=nodes.filter(n=>n.type!=='screen'&&!excluded.has(n.id)&&selected.some(target=>target.type===n.type));
 return <AIActionsPanel count={selected.length}>
  <div className="ai-flow-actions"><button type="button" disabled={!editable||busy} aria-pressed={mode==='library'} onClick={()=>start('library')}><Library size={14} className="ai-flow-icon" aria-hidden="true"/>Match library</button><button type="button" disabled={!editable||busy} aria-pressed={mode==='source'} onClick={()=>start('source')}><AIIcon name={mode==='source'?'pick-active':'pick'}/>Pick source</button></div>
  {!editable&&<p className="ai-actions-empty">Select editable layers to make changes.</p>}
  {mode==='source'&&<div className="ai-flow-source"><label>Source layer<select aria-label="Source layer" value={sourceId||''} onChange={e=>{onSource(e.target.value||null);onPicking(false);}}><option value="">Choose a source…</option>{sources.map(n=><option key={n.id} value={n.id}>{n.screen} / {n.label}</option>)}</select></label><button type="button" aria-pressed={picking} onClick={()=>onPicking(!picking)}>{picking?'Cancel picking':'Pick on canvas'}</button>{picking&&<p role="status">Choose a source on the canvas or in Layers. Your targets stay selected. Escape to cancel.</p>}</div>}
  {mode&&<div className="ai-flow-suggestion"><div className="ai-flow-message"><AIIcon/><p>{issue||(!sourceId&&mode==='source'?'Pick a source layer to see compatible styles.':changes.length?`${mode==='library'?'Library':source?.label} has ${changes.length} style ${changes.length===1?'change':'changes'}. Pick what to ${mode==='library'?'apply':'copy'}.`:'These styles already match.')}</p></div>
   {!!changes.length&&<><div className="ai-flow-categories" role="group" aria-label="Property categories">{ACTION_CATEGORIES.map(category=>{const count=changes.filter(c=>c.category===category).length;return count?<button type="button" key={category} aria-pressed={categories.includes(category)} onClick={()=>setCategories(previous=>previous.includes(category)?previous.filter(c=>c!==category):[...previous,category])}>{category}<span>{count}</span></button>:null;})}</div>
   {!!chosen.length&&<><div className="ai-flow-details-heading"><strong>{chosen.length} selected changes</strong><button type="button" aria-label={preview?'Hide style preview':'Preview selected styles'} aria-pressed={preview} onClick={()=>{setPreview(!preview);onEvent?.('edit_preview_toggled');onState(preview?'Choosing Action':'Previewing Changes');}}><AIIcon name="eye"/></button></div><details className="ai-flow-review"><summary>Review before & after</summary><div className="ai-flow-details">{chosen.map(change=><div className="ai-flow-change" key={change.id}><small>{nodes.find(n=>n.id===change.targetId)?.label} · {fieldLabels[change.property]}</small><div>{change.category==='Colors'&&change.property!=='border'&&<i style={{backgroundColor:String(change.before??'transparent')}}/>}<span title={display(change.before)}>{display(change.before)}</span><b>→</b>{change.category==='Colors'&&change.property!=='border'&&<i style={{backgroundColor:String(change.after)}}/>}<span title={display(change.after)}>{display(change.after)}</span></div></div>)}</div></details></>}
   </>}
   <div className="ai-flow-footer"><button type="button" className="ai-flow-primary" disabled={!proposal||picking||!!issue} onClick={()=>{if(proposal)commit(proposal,`${mode==='library'?'Applied library styles':'Copied source styles'} · ${chosen.length} properties across ${new Set(chosen.map(c=>c.targetId)).size} layers.`);}}>{mode==='library'?'Apply':'Copy'}{chosen.length?` ${chosen.length}`:''}</button><button type="button" onClick={dismiss}>Dismiss</button>{mode==='library'&&onLocateLibrary&&<button type="button" onClick={onLocateLibrary}>View library</button>}</div>
  </div>}
  {!mode&&!dismissed&&spacing&&<div className="ai-flow-suggestion"><div className="ai-flow-message"><AIIcon/><p>Gaps are uneven ({spacing.gaps.map(v=>Math.round(v*10)/10).join(', ')} px). Make them all {Math.round(spacing.gap*10)/10} px?</p></div><div className="ai-flow-footer"><button type="button" className="ai-flow-primary" onClick={()=>layout('spacing','Even spacing')}>Even spacing</button><button type="button" onClick={()=>setDismissed(true)}>Dismiss</button></div></div>}
  {submitted&&<p className="ai-flow-user">{submitted}</p>}
  {(busy||result||message)&&<div className="ai-flow-suggestion" role="status"><div className="ai-flow-message"><AIIcon/><p>{busy?'Making changes…':message||result}</p></div>{busy?<button type="button" onClick={()=>{pending.current?.abort();setBusy(false);setMessage('Request cancelled.');}}>Cancel</button>:result&&<div className="ai-flow-footer"><button type="button" disabled={!canUndo} onClick={undo}>Undo</button><button type="button" onClick={()=>{setResult('');setSubmitted('');}}>Dismiss</button></div>}</div>}
  {selected.length>1&&<div className="ai-flow-layout"><div role="group" aria-label="Align and distribute">{alignment.map(([op,title])=>layoutButton(op,title,true))}<span/><button type="button" aria-label="More layout options" aria-expanded={more} onClick={()=>setMore(!more)}><AIIcon name="more"/></button></div>{more&&<div className="ai-flow-more" role="group" aria-label="More layout options">{moreActions.map(([op,title])=>layoutButton(op,title))}</div>}</div>}
  <form className="ai-command" onSubmit={ask}><AIIcon/><input aria-label="Ask AI to change selection" maxLength={500} placeholder="Ask AI to change…" disabled={!editable||busy} value={instruction} onChange={e=>setInstruction(e.target.value)}/><button type="submit" aria-label="Submit change" disabled={!editable||busy||!instruction.trim()}><AIIcon name="send"/></button></form>
 </AIActionsPanel>;
}
