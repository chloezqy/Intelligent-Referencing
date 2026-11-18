import type {Point} from './types';
interface PointerSample {clientX:number;clientY:number;timeStamp:number}
interface SampleEvent extends PointerSample {getCoalescedEvents?:()=>PointerSample[]}
export interface GestureSamples {screenPoints:Point[];path:Point[];lastSampleTime:number}
/** Raw and coalesced events can overlap. Retain their ordered hardware samples,
 * including the dispatched endpoint, without replaying older points. */
export function appendGestureSamples(target:GestureSamples,event:SampleEvent,toCanvas:(point:PointerSample)=>Point){
 const samples=[...(event.getCoalescedEvents?.()||[]),event];
 for(const point of samples){
  if(!Number.isFinite(point.clientX)||!Number.isFinite(point.clientY)||point.timeStamp<target.lastSampleTime)continue;
  const previous=target.screenPoints.at(-1);
  if(point.timeStamp===target.lastSampleTime&&previous?.x===point.clientX&&previous?.y===point.clientY)continue;
  target.screenPoints.push({x:point.clientX,y:point.clientY});target.path.push(toCanvas(point));target.lastSampleTime=point.timeStamp;
 }
}
