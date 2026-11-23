import {PreviewComparisonActivityContext} from './previewComparisonActivity';
import React,{useLayoutEffect,useRef,useState,useContext} from 'react';
import type {Patch} from './editing';
import {createPreviewComparison,type PreviewAppearance} from './previewComparison';

export function usePreviewComparison(patches:Patch[],onPreview?: (patches:Patch[])=>void){
 const comparisonContext=useContext(PreviewComparisonActivityContext),registerComparison=comparisonContext?.register;
 const spotlight=useRef(comparisonContext?.spotlight);spotlight.current=comparisonContext?.spotlight;
 const interactive=!!onPreview;
 useLayoutEffect(()=>interactive?registerComparison?.():undefined,[registerComparison,interactive]);
 const [appearance,setAppearance]=useState<PreviewAppearance>('after');
 const callback=useRef(onPreview);callback.current=onPreview;
 const session=useRef<{key:string;controller:ReturnType<typeof createPreviewComparison>}|null>(null);
 const key=JSON.stringify(patches),latest=useRef(patches);latest.current=patches;
 useLayoutEffect(()=>{
  const owner=Symbol('preview-spotlight');
  const current=createPreviewComparison(value=>callback.current?.(value),setAppearance,ids=>spotlight.current?.(owner,ids));
  current.update(latest.current);session.current={key,controller:current};setAppearance('after');
  return()=>{current.close();if(session.current?.controller===current)session.current=null;};
 },[key]);
 const current=()=>session.current?.key===key?session.current.controller:null;
 const card=(mode:PreviewAppearance,label:string,targetIds:string[])=>onPreview?{
  tabIndex:0,role:'group','aria-label':`${label} canvas preview`,
  'data-preview-appearance':mode,'data-preview-active':appearance===mode,
  onPointerEnter:(event:React.PointerEvent)=>{if(event.pointerType!=='touch')current()?.enter(mode,targetIds);},
  onPointerLeave:(event:React.PointerEvent)=>{if(event.pointerType!=='touch')current()?.leave();},
  onPointerCancel:()=>current()?.leave(),
  onFocus:(event:React.FocusEvent<HTMLElement>)=>{if(event.currentTarget.matches(':focus-visible'))current()?.focus(mode,targetIds);},
  onBlur:()=>current()?.blur(),
 }:{};
 return {card,close:()=>current()?.close()};
}
