/** Only a changed user selection reveals Resolve; initial/context state stays quiet. */
export function resolutionSelectionTransition(previous:{identity:string;count:number},identity:string,count:number){
 if(previous.identity!==identity)return null;
 if(previous.count===0&&count>0)return 'reveal';
 if(previous.count>0&&count===0)return 'clear';
 return null;
}
export function resolutionScrollDelta(header:{top:number;bottom:number},viewport:{top:number;bottom:number},panelBottom:number,previewTop?:number){
 const bottom=Math.min(previewTop===undefined?header.bottom+140:previewTop+80,panelBottom);
 return header.top<viewport.top+8?header.top-viewport.top-8:Math.max(0,Math.min(bottom-viewport.bottom+8,header.top-viewport.top-8));
}
