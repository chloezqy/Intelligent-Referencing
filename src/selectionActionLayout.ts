/** Place one measured contextual surface beside the selection, within the canvas. */
export function selectionActionLayout(box:{x:number;y:number;w:number;h:number}|null,camera:{x:number;y:number;scale:number},viewport:{width:number;height:number},size:{width:number;height:number},anchor?:{x:number;y:number}|null){
 const gap=12,margin=8,width=Math.min(size.width,Math.max(0,viewport.width-margin*2)),height=Math.min(size.height,Math.max(0,viewport.height-margin*2));
 const right=anchor?anchor.x*camera.scale+camera.x:box?(box.x+box.w)*camera.scale+camera.x:margin;
 const left=anchor?anchor.x*camera.scale+camera.x:box?box.x*camera.scale+camera.x:margin;
 const bottom=anchor?anchor.y*camera.scale+camera.y:box?(box.y+box.h)*camera.scale+camera.y:margin;
 let x=right+gap,y=anchor?bottom-6:box?box.y*camera.scale+camera.y:margin;
 if(x+width>viewport.width-margin)x=left-gap-width;
 if(anchor&&y+height>viewport.height-margin)y=bottom-height-gap;
 return {left:Math.max(margin,Math.min(viewport.width-width-margin,x)),top:Math.max(margin,Math.min(viewport.height-height-margin,y))};
}
