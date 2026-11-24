import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectionActionLayout} from './selectionActionLayout';
test('floating row is centered above selection with a 10px screen-space gap',()=>{
 const result=selectionActionLayout({x:300,y:300,w:200,h:100},{x:0,y:0,scale:1},{width:1000,height:700},{width:360,height:38});
 assert.deepEqual(result,{left:220,top:252});
});
test('viewport edges clamp the menu horizontally and to the canvas top, never below the selection',()=>{
 const camera={x:0,y:0,scale:1},viewport={width:1000,height:700},size={width:292,height:196};
 assert.deepEqual(selectionActionLayout({x:100,y:100,w:100,h:100},camera,viewport,size),{left:8,top:8});
 assert.deepEqual(selectionActionLayout({x:850,y:580,w:100,h:100},camera,viewport,size),{left:700,top:374});
});
test('measured surfaces fit narrow viewports and remain screen-sized at every zoom',()=>{
 for(const viewport of [{width:723,height:635},{width:360,height:500},{width:240,height:300}])for(const scale of [.1,.5,1.5])for(const size of [{width:460,height:38},{width:336,height:460}]){
  const point=selectionActionLayout({x:2000,y:800,w:375,h:812},{x:-100,y:-20,scale},viewport,size);
  assert.ok(point.left>=8&&point.top>=8);
  assert.ok(point.left+Math.min(size.width,viewport.width-16)<=viewport.width-8);
  assert.ok(point.top+Math.min(size.height,viewport.height-16)<=viewport.height-8);
 }
 for(const scale of [.5,1,1.5]){
  const result=selectionActionLayout({x:400,y:600,w:200,h:100},{x:20,y:30,scale},{width:1600,height:1200},{width:336,height:38});
  assert.equal(result.left,500*scale+20-168);assert.equal(result.top,600*scale+30-10-38);
 }
});
test('expanded content grows upward around the same selection center',()=>{
 const box={x:200,y:600,w:300,h:100},camera={x:0,y:0,scale:1},viewport={width:1000,height:800};
 const row=selectionActionLayout(box,camera,viewport,{width:360,height:38});
 const panel=selectionActionLayout(box,camera,viewport,{width:336,height:400});
 assert.equal(row.left+180,panel.left+168);assert.equal(row.top+38,panel.top+400);
});
