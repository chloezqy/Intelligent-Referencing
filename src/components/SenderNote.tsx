import React,{useEffect,useRef,useState} from 'react';
import {Sparkles,Pencil,Check,X} from 'lucide-react';
import MentionNote from './MentionNote';
import {createShareNoteRequests,type ShareNoteState} from '../shareNoteClient';
import {noteIdentity,noteSuggestionRange} from '../shareNoteInterpretation';
import type {UIElement} from '../types';
import type {MentionParticipant} from '../mentions';
import type {UserId} from '../collaboration';
export default function SenderNote({note,onNote,request,ids,nodes,members,self,active=true,quick=false}:{quick?:boolean;note:string;onNote:(text:string)=>void;request:string;ids:string[];nodes:UIElement[];members:MentionParticipant[];self?:UserId;active?:boolean}){
 const [state,setState]=useState<ShareNoteState>({status:'empty'}),[editing,setEditing]=useState(false),[edited,setEdited]=useState<string|null>(null),[suppressed,setSuppressed]=useState(''),[refresh,setRefresh]=useState(0),[resultKey,setResultKey]=useState('');
 const manager=useRef<ReturnType<typeof createShareNoteRequests>|null>(null);
 const identity=JSON.stringify(ids),key=JSON.stringify([identity,note,request,nodes]),currentKey=useRef(key);currentKey.current=key;
 if(!manager.current)manager.current=createShareNoteRequests(value=>{setState(value);setResultKey(currentKey.current);});
 useEffect(()=>{setEdited(null);setEditing(false);setSuppressed('');setState({status:'empty'});},[identity,request]);
 useEffect(()=>{setEdited(null);setEditing(false);if(!active||noteIdentity(note)===suppressed){manager.current!.cancel();setState({status:'empty'});return;}manager.current!.update({ids,note,request,nodes});return()=>manager.current!.cancel();},[key,active,suppressed,refresh]);
 useEffect(()=>()=>manager.current!.cancel(),[]);
 const result=resultKey===key?state.result:undefined,text=edited??result?.text??'';

 const label=nodes.find(n=>ids.includes(n.id)&&text.includes(n.label))?.label;
 const content=label?text.split(label).map((part,i)=><React.Fragment key={i}>{i>0&&<strong>{label}</strong>}{part}</React.Fragment>):text;
 const assistance=state.status==='generating'?<div className="sender-note-ai note-ai-loading" role="status"><Sparkles size={13}/>Clarifying your request…</div>:state.status==='error'?<div className="sender-note-ai note-ai-error" role="status">AI assistance unavailable. You can share your note.<button type="button" onClick={()=>setRefresh(v=>v+1)}>Retry</button></div>:state.status==='available'&&result?<section className="sender-note-ai" aria-label="AI interpretation"><header><span><Sparkles size={13}/>AI interpretation</span>{quick&&<button type="button" aria-label="Dismiss suggestion" onClick={()=>{manager.current!.cancel();setSuppressed(noteIdentity(note));setState({status:'empty'});setEdited(null);setEditing(false);}}><X size={12}/></button>}</header>{editing?<textarea aria-label="Edit AI interpretation" maxLength={400} rows={3} value={text} onChange={event=>setEdited(event.target.value)}/>:<p>{content}</p>}<div className="sender-note-ai-actions"><button type="button" onClick={()=>{setEdited(text);setEditing(!editing);}}><Pencil size={11}/>{editing?'Done':'Edit'}</button><button className="use-note-suggestion" type="button" disabled={!text.trim()} onClick={()=>{const accepted=text.trim();manager.current!.cancel();setSuppressed(noteIdentity(accepted));setEdited(null);setEditing(false);setState({status:'empty'});onNote(accepted);}}><Check size={12}/>Use suggestion</button></div></section>:null;
 return <div className="sender-note"><MentionNote attached quick={quick} highlight={result&&state.status==='available'?noteSuggestionRange(note,result.text):undefined} assistance={note.trim()?assistance:null} value={note} onChange={onNote} members={members} self={self}/></div>;
}
