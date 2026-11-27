import {requestAI} from './aiClient';
import type {UIElement} from './types';
import {meaningfulShareNote,validateShareNoteInterpretation,type ShareNoteInterpretation} from './shareNoteInterpretation';
export interface ShareNoteInput {ids:string[];note:string;request:string;nodes:UIElement[]}
export async function loadShareNote(input:ShareNoteInput,signal?:AbortSignal){
 const contextId=crypto.randomUUID();
 const result=await requestAI({task:'share-note',contextId,elementIds:input.ids,note:input.note,request:input.request,document:input.nodes},{signal});
 if(result.contextId!==contextId||typeof result.model!=='string'||result.interpretation?.source!=='model')throw Error('Invalid note interpretation response.');
 const {source,...value}=result.interpretation;return validateShareNoteInterpretation(value,input.ids,input.note,input.nodes);
}
export type ShareNoteState={status:'empty'|'waiting'|'generating'|'available'|'error';result?:ShareNoteInterpretation};
/** Debounce and invalidate locally while the shared transport coalesces and caches real requests. */
export function createShareNoteRequests(onState:(state:ShareNoteState)=>void,load=loadShareNote,schedule:(fn:()=>void,ms:number)=>any=setTimeout,unschedule:(id:any)=>void=clearTimeout){
 let version=0,timer:any,abort:AbortController|undefined;
 const cancel=()=>{version++;if(timer!==undefined)unschedule(timer);timer=undefined;abort?.abort();};
 return {cancel,update(input:ShareNoteInput|null){cancel();const own=version;if(!input||!meaningfulShareNote(input.note)||!input.request.trim()||!input.ids.length){onState({status:'empty'});return;}
 onState({status:'waiting'});timer=schedule(()=>{timer=undefined;abort=new AbortController();onState({status:'generating'});load(input,abort.signal).then(result=>{if(version===own)onState(result.kind==='clear'?{status:'empty'}:{status:'available',result});},()=>{if(version===own)onState({status:'error'});});},1000);}};
}
