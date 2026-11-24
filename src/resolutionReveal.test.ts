import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolutionSelectionTransition,resolutionScrollDelta} from './resolutionReveal';
test('Resolve reveals once per zero-to-positive cycle and respects cancellation and context changes',()=>{
 assert.equal(resolutionSelectionTransition({identity:'a',count:0},'a',1),'reveal');
 for(const count of [1,2,3])assert.equal(resolutionSelectionTransition({identity:'a',count:1},'a',count),null);
 assert.equal(resolutionSelectionTransition({identity:'a',count:2},'a',0),'clear');
 assert.equal(resolutionSelectionTransition({identity:'a',count:0},'b',1),null);
 assert.equal(resolutionSelectionTransition({identity:'a',count:0},'a',0),null);
});
test('Resolve scrolling reveals the header and preview start without overscrolling',()=>{
 const viewport={top:100,bottom:600};
 assert.equal(resolutionScrollDelta({top:200,bottom:250},viewport,900),0);
 assert.equal(resolutionScrollDelta({top:550,bottom:600},viewport,1000),148);
 assert.equal(resolutionScrollDelta({top:50,bottom:100},viewport,900),-58);
 assert.equal(resolutionScrollDelta({top:550,bottom:580},viewport,590),0);
 assert.equal(resolutionScrollDelta({top:300,bottom:380},viewport,1000,650),138);
});
