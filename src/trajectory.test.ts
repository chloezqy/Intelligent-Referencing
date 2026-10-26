import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyTrajectory,trajectoryMetrics} from './trajectory';
import {inferSelection} from './utils';
import {MOCK_NODES} from './data';
const line=Array.from({length:11},(_,i)=>({x:i*4,y:0}));
const circle=(r:number,n=32)=>Array.from({length:n+1},(_,i)=>({x:50+r*Math.cos(i/n*Math.PI*2),y:50+r*Math.sin(i/n*Math.PI*2)}));
test('Screen-pixel click threshold rejects jitter at every world zoom',()=>{
 for(const zoom of [.1,.5,1,2]){const path=[{x:0,y:0},{x:5/zoom*zoom,y:0},{x:0,y:0}];assert.equal(classifyTrajectory(path,{movable:true,final:true}),'click');}
 assert.equal(classifyTrajectory([{x:0,y:0},{x:6,y:0}],{movable:false,final:true}),'click');
});
test('Straight movable drags wait for sufficient travel and time, then lock without switching',()=>{
 assert.equal(classifyTrajectory(line.slice(0,5),{movable:true,elapsedMs:200}),'pending');
 assert.equal(classifyTrajectory(line,{movable:true,elapsedMs:60}),'pending');
 assert.equal(classifyTrajectory(line,{movable:true,elapsedMs:150}),'move');
 assert.equal(classifyTrajectory([...line,...circle(20)],{movable:true,locked:'move',final:true}),'move');
 assert.equal(classifyTrajectory(line,{movable:false,elapsedMs:150}),'reference');
});
test('Circles, small loops, arcs, reversals and scribbles classify by trajectory rather than start position',()=>{
 for(const radius of [5,10,30])assert.equal(classifyTrajectory(circle(radius),{movable:true,elapsedMs:200}),'reference');
 assert.equal(classifyTrajectory(circle(20).slice(0,14),{movable:true,elapsedMs:200}),'reference');
 const scribble=[{x:0,y:0},{x:20,y:0},{x:5,y:12},{x:25,y:14},{x:3,y:26}];assert.equal(classifyTrajectory(scribble,{movable:true}),'reference');
 assert.equal(classifyTrajectory([{x:0,y:0},{x:25,y:0},{x:1,y:0}],{movable:true}),'reference');
});
test('Ambiguous strokes do not move; Shift takes precedence and sparse strokes still reference',()=>{
 const short=[{x:0,y:0},{x:12,y:2}];assert.equal(classifyTrajectory(short,{movable:true,elapsedMs:200}),'pending');assert.equal(classifyTrajectory(short,{movable:true,final:true,elapsedMs:200}),'reference');
 assert.equal(classifyTrajectory(circle(20),{movable:true,shift:true}),'box');assert.equal(classifyTrajectory(short,{movable:false,final:true}),'reference');
 assert.ok(trajectoryMetrics(circle(20)).closed);
});
test('Loop starting on parent card can reference a small enclosed nested target',()=>{
 const target=MOCK_NODES.find(n=>n.id==='hc1-fav')!,parent=MOCK_NODES.find(n=>n.id===target.parent)!;
 const cx=target.x+target.w/2,cy=target.y+target.h/2,r=target.w/2+4;
 const path=circle(r).map(p=>({x:p.x-50+cx,y:p.y-50+cy}));
 assert.ok(path[0].x>=parent.x&&path[0].x<=parent.x+parent.w);
 assert.equal(classifyTrajectory(path,{movable:true}),'reference');
 assert.ok(inferSelection(path,[parent,target]).some(i=>i.selectedIds.includes(target.id)));
});
test('Mild straight-line pointer noise does not prevent movement intent, while settled intents stay locked',()=>{
 const noisy=line.map((p,i)=>({...p,y:i%2?.3:-.3}));
 assert.equal(classifyTrajectory(noisy,{movable:true,elapsedMs:150}),'move');
 assert.equal(classifyTrajectory(line,{movable:true,locked:'reference'}),'reference');
 assert.equal(classifyTrajectory(line,{movable:true,locked:'box'}),'box');
});
