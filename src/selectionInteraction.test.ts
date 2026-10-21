import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isSelectionDrag,selectionDragKind} from './selectionInteraction';
import {inferSelection} from './utils';
import {MOCK_NODES} from './data';
test('Clicks tolerate up to 6 screen pixels and jitter does not accumulate into a gesture',()=>{
 const start={x:100,y:100};assert.equal(isSelectionDrag(start,[{x:106,y:100}]),false);
 assert.equal(isSelectionDrag(start,Array.from({length:100},(_,i)=>({x:100+(i%2?2:-2),y:101}))),false);
 assert.equal(isSelectionDrag(start,[{x:106.1,y:100}]),true);
});
test('Drag classification is explicit and independent of world zoom',()=>{
 assert.equal(selectionDragKind(false),'drawing');assert.equal(selectionDragKind(true),'rect-selecting');
 for(const scale of [.1,.5,1,1.5]){const worldDelta=7/scale;assert.equal(isSelectionDrag({x:0,y:0},[{x:worldDelta*scale,y:0}]),true);}
});
test('A two-point stroke can establish a rough reference',()=>{
 const chip=MOCK_NODES.find(n=>n.screen==='Home'&&n.role==='filterChip')!;
 const results=inferSelection([{x:chip.x-4,y:chip.y+chip.h/2},{x:chip.x+chip.w+4,y:chip.y+chip.h/2}],MOCK_NODES);
 assert.ok(results.some(r=>r.exemplarIds.includes(chip.id)));
});
