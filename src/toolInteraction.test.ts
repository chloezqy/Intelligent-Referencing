import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toolDragIntent,moveTargets,movePositions} from './toolInteraction';
import {MOCK_NODES} from './data';
import {inferSelection} from './utils';
test('Tool choice determines drag behavior independently of trajectory',()=>{
 assert.equal(toolDragIntent('pointer',true,false),'move');assert.equal(toolDragIntent('pointer',false,false),'box');assert.equal(toolDragIntent('pointer',true,true),'box');
 for(const onObject of [true,false])for(const shift of [true,false])assert.equal(toolDragIntent('reference',onObject,shift),'reference');
});
test('Select movement snapshots descendants once, supports multiple targets and cancellation',()=>{
 const snapshot=moveTargets(MOCK_NODES,'hc1',['hc1','hc1-title','hc2-title']);assert.equal(snapshot.filter(n=>n.id==='hc1-title').length,1);assert.ok(snapshot.some(n=>n.id==='hc1-img'));assert.ok(snapshot.some(n=>n.id==='hc2-title'));
 const moved=movePositions(snapshot,{x:10,y:10},MOCK_NODES);for(const n of snapshot){assert.equal(moved[n.id].x,n.x+10);assert.equal(moved[n.id].y,n.y+10);}
 const restored=movePositions(snapshot,{x:0,y:0},MOCK_NODES);assert.equal(restored['hc1-title'].x,MOCK_NODES.find(n=>n.id==='hc1-title')!.x);
 assert.deepEqual(moveTargets(MOCK_NODES,'screen-home',[]),[]);
});
test('Moves stay within authored screen; immutable IDs and original data remain unchanged',()=>{
 const before=JSON.stringify(MOCK_NODES),snapshot=moveTargets(MOCK_NODES,'hc1-title',[]),positions=movePositions(snapshot,{x:10000,y:10000},MOCK_NODES),target=snapshot[0],frame=MOCK_NODES.find(n=>n.type==='screen'&&n.screen===target.screen)!;
 assert.ok(positions[target.id].x+target.w<=frame.x+frame.w);assert.ok(positions[target.id].y+target.h<=frame.y+frame.h);assert.equal(JSON.stringify(MOCK_NODES),before);
});
test('Rough Reference can start on a parent and circle a nested favorite without a move intent',()=>{
 const target=MOCK_NODES.find(n=>n.id==='hc1-fav')!,r=target.w/2+4,cx=target.x+target.w/2,cy=target.y+target.h/2;
 const loop=Array.from({length:33},(_,i)=>({x:cx+r*Math.cos(i/32*Math.PI*2),y:cy+r*Math.sin(i/32*Math.PI*2)}));
 assert.equal(toolDragIntent('reference',true,false),'reference');assert.ok(inferSelection(loop,MOCK_NODES).some(i=>i.selectedIds.includes(target.id)));
 const scribble=[{x:target.x-5,y:cy},{x:target.x+target.w+5,y:cy+3},{x:target.x-4,y:cy-2}];assert.equal(toolDragIntent('reference',true,false),'reference');assert.ok(inferSelection(scribble,MOCK_NODES).length);
});
