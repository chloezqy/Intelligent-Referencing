import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectionActionLayout} from './selectionActionLayout';
test('Action surface sits beside the selection top and flips away from canvas edges',()=>{
 const camera={x:0,y:0,scale:1},viewport={width:1000,height:700},size={width:292,height:196};
 assert.deepEqual(selectionActionLayout({x:100,y:100,w:100,h:100},camera,viewport,size),{left:212,top:100});
 const flipped=selectionActionLayout({x:850,y:580,w:100,h:100},camera,viewport,size);
 assert.deepEqual(flipped,{left:546,top:496});
});
test('Measured action and detail sizes stay within laptop and narrow viewports under zoom',()=>{
 for(const viewport of [{width:723,height:635},{width:360,height:500},{width:240,height:300}])for(const scale of [.1,.5,1.5])for(const size of [{width:292,height:196},{width:292,height:460}]){
  const point=selectionActionLayout({x:2000,y:800,w:375,h:812},{x:-100,y:-20,scale},viewport,size);
  assert.ok(point.left>=8&&point.top>=8);
  assert.ok(point.left+Math.min(size.width,viewport.width-16)<=viewport.width-8);
  assert.ok(point.top+Math.min(size.height,viewport.height-16)<=viewport.height-8);
 }
});

test('Pointer anchor places the stack close to the selection click at every zoom',()=>{
 const box={x:0,y:0,w:600,h:800},anchor={x:80,y:90};
 for(const scale of [.5,1,1.5]){
  const result=selectionActionLayout(box,{x:20,y:30,scale},{width:1200,height:1000},{width:336,height:184},anchor);
  assert.equal(result.left,anchor.x*scale+20+12);
  assert.equal(result.top,anchor.y*scale+30-6);
 }
});

test('Rough interpretation follows selection bounds rather than the gesture release point',()=>{
 const result=selectionActionLayout({x:100,y:80,w:140,h:300},{x:0,y:0,scale:1},{width:1000,height:700},{width:305,height:120});
 assert.deepEqual(result,{left:252,top:80});
 // The stack offset places the overlapping icon at 252 and panel edge at 265.
 assert.equal(result.left-31+44,265);
});
