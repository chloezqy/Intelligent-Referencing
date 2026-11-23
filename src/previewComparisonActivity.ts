import {createContext} from 'react';

/** A comparison remains open even when its Current view has no preview patches. */
export function createPreviewComparisonActivity(publish:(active:boolean)=>void){
 let count=0;
 return ()=>{
  count++;publish(true);
  let released=false;
  return ()=>{if(released)return;released=true;count--;publish(count>0);};
 };
}
export const PreviewComparisonActivityContext=createContext<{register:ReturnType<typeof createPreviewComparisonActivity>;spotlight:(owner:symbol,ids:string[])=>void}|null>(null);
