import {useLayoutEffect} from 'react';

/** Move only floating presentation; document positions and selection stay untouched. */
export function useDraggablePanel(element:HTMLElement|null,key:string,enabled=true){
 useLayoutEffect(()=>{
  if(!element||!enabled)return;
  const parent=element.parentElement;if(!parent)return;
  let position:{x:number;y:number}|null=null,drag:{id:number;x:number;y:number;left:number;top:number;started:boolean}|null=null;
  let suppressClick=false;
  const place=()=>{
   if(!position)return;
   const width=element.offsetWidth,height=element.offsetHeight;
   position={x:Math.max(8,Math.min(position.x,Math.max(8,parent.clientWidth-width-8))),y:Math.max(8,Math.min(position.y,Math.max(8,parent.clientHeight-height-8)))};
   const translate=`${position.x-element.offsetLeft}px ${position.y-element.offsetTop}px`;
   if(element.style.translate!==translate)element.style.translate=translate;
  };
  const down=(event:PointerEvent)=>{
   const target=event.target as HTMLElement;
   const handle=target.closest('[data-panel-drag-handle]');
   if(event.button!==0||!handle||!element.contains(handle)||target.closest('input,textarea,select,a')||target.closest('button')!==handle&&target.closest('button'))return;
   const rect=element.getBoundingClientRect(),bounds=parent.getBoundingClientRect();
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left-bounds.left,top:rect.top-bounds.top,started:false};
  };
  const move=(event:PointerEvent)=>{
   if(!drag||event.pointerId!==drag.id)return;
   if(!drag.started&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<4)return;
   if(!drag.started){drag.started=true;element.setPointerCapture(event.pointerId);element.classList.add('is-panel-dragging');}
   event.preventDefault();event.stopPropagation();
   position={x:drag.left+event.clientX-drag.x,y:drag.top+event.clientY-drag.y};place();
  };
  const up=(event:PointerEvent)=>{
   if(!drag||event.pointerId!==drag.id)return;
   suppressClick=drag.started;
   if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);
   drag=null;element.classList.remove('is-panel-dragging');
  };
  const click=(event:MouseEvent)=>{if(suppressClick){suppressClick=false;event.preventDefault();event.stopImmediatePropagation();}};
  element.addEventListener('pointerdown',down);element.addEventListener('click',click,true);
  window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  const resize=new ResizeObserver(place);resize.observe(element);resize.observe(parent);
  const mutation=new MutationObserver(place);mutation.observe(element,{attributes:true,attributeFilter:['style']});
  return()=>{resize.disconnect();mutation.disconnect();element.removeEventListener('pointerdown',down);element.removeEventListener('click',click,true);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(drag&&element.hasPointerCapture(drag.id))element.releasePointerCapture(drag.id);element.style.translate='';element.classList.remove('is-panel-dragging');};
 },[element,key,enabled]);
}
