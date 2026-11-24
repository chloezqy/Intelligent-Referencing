/** Screen-space floating surface centered above the selection, never below it. */
export function selectionActionLayout(box:{x:number;y:number;w:number;h:number}|null,camera:{x:number;y:number;scale:number},viewport:{width:number;height:number},size:{width:number;height:number}){
 const gap=10,margin=8,width=Math.min(size.width,Math.max(0,viewport.width-margin*2)),height=Math.min(size.height,Math.max(0,viewport.height-margin*2));
 const center=box?(box.x+box.w/2)*camera.scale+camera.x:viewport.width/2;
 const top=box?box.y*camera.scale+camera.y:margin;
 return {left:Math.max(margin,Math.min(viewport.width-width-margin,center-width/2)),top:Math.max(margin,Math.min(viewport.height-height-margin,top-gap-height))};
}
