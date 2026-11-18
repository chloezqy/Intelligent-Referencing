import {test} from 'node:test';
import assert from 'node:assert/strict';
import {closeSmartGesture,smartGestureEvidence} from './smartGesture';
import type {UIElement} from './types';
const node=(id:string,x:number,y:number,w=20,h=20)=>({id,type:'image',label:id,x,y,w,h}) as UIElement;
test('Open loops close without mutating their original points',()=>{
 const path=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}];
 const closed=closeSmartGesture(path);assert.deepEqual(closed[0],closed.at(-1));assert.equal(path.length,4);
 assert.deepEqual(smartGestureEvidence(path,[node('inside',40,40),node('far',300,300)],1),['inside']);
});
test('Loose strokes have an 18 pixel hit tolerance at every zoom',()=>{
 for(const scale of [.25,.5,1,2]){
  const nodes=[node('near',30/scale,15/scale,20/scale,20/scale),node('far',300/scale,300/scale)];
  assert.deepEqual(smartGestureEvidence([{x:0,y:0},{x:70/scale,y:0}],nodes,scale),['near']);
 }
});
test('Unfinished arcs use their region as fallback, while empty canvas stays empty',()=>{
 const arc=[{x:0,y:0},{x:100,y:0},{x:100,y:100}];
 assert.deepEqual(smartGestureEvidence(arc,[node('inside-arc',0,80,5,5)],1),['inside-arc']);
 assert.deepEqual(smartGestureEvidence(arc,[node('far',500,500)],1),[]);
 assert.deepEqual(smartGestureEvidence(arc,[{...node('screen',0,0,100,100),type:'screen'}],1),[]);
});
