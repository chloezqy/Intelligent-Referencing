import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendGestureSamples,GestureSamples} from './gestureSamples';
import {isSelectionDrag} from './selectionInteraction';
import {smartGestureEvidence} from './smartGesture';
import type {UIElement} from './types';
const sample=(x:number,y:number,timeStamp:number)=>({clientX:x,clientY:y,timeStamp});
const convert=(p:{clientX:number;clientY:number})=>({x:p.clientX,y:p.clientY});
const start=():GestureSamples=>({screenPoints:[{x:0,y:0}],path:[{x:0,y:0}],lastSampleTime:0});
test('A fast circle delivered entirely at pointerup retains its full area',()=>{
 const stroke=start();appendGestureSamples(stroke,{...sample(0,0,5),getCoalescedEvents:()=>[sample(100,0,1),sample(100,100,2),sample(0,100,3)]},convert);
 assert.equal(isSelectionDrag(stroke.screenPoints[0],stroke.screenPoints),true);
 assert.deepEqual(stroke.path.at(-1),{x:0,y:0});
 assert.deepEqual(smartGestureEvidence(stroke.path,[{id:'inside',type:'image',x:40,y:40,w:20,h:20} as UIElement],1),['inside']);
});
test('Raw samples survive a later pointermove that replays older coalesced points',()=>{
 const stroke=start();appendGestureSamples(stroke,sample(100,0,1),convert);appendGestureSamples(stroke,sample(100,100,2),convert);
 appendGestureSamples(stroke,{...sample(0,100,3),getCoalescedEvents:()=>[sample(100,0,1),sample(100,100,2)]},convert);
 assert.deepEqual(stroke.path,[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]);
});
test('Always include dispatched endpoints and support browsers without coalesced events',()=>{
 const stroke=start();appendGestureSamples(stroke,{...sample(30,20,2),getCoalescedEvents:()=>[sample(20,10,1)]},convert);
 appendGestureSamples(stroke,sample(40,30,3),convert);assert.deepEqual(stroke.path.at(-1),{x:40,y:30});assert.equal(stroke.path.length,4);
});
