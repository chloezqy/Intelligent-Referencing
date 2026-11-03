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

import {canvasSelectionTarget,nestedSelection,mergeLayerSelection,canvasMarqueeTargets} from './selectionInteraction';
test('normal canvas click selects a product card before its nested button or image',()=>{
 assert.equal(canvasSelectionTarget('hc1-cta',MOCK_NODES,[])?.id,'hc1');
 assert.equal(canvasSelectionTarget('hc1-img',MOCK_NODES,[])?.id,'hc1');
 assert.equal(canvasSelectionTarget('hc1-cta',MOCK_NODES,['hc1'])?.id,'hc1');
 assert.equal(canvasSelectionTarget('hc1-cta',MOCK_NODES,['hc1'],{drill:true})?.id,'hc1-cta');
 assert.equal(canvasSelectionTarget('hc1-img',MOCK_NODES,['hc1-cta'])?.id,'hc1-img');
});
test('deep selection and matching Shift-click retain Figma-style access to nested layers',()=>{
 assert.equal(canvasSelectionTarget('hc1-cta',MOCK_NODES,[],{deep:true})?.id,'hc1-cta');
 assert.equal(canvasSelectionTarget('hc2-cta',MOCK_NODES,['hc1-cta'],{extend:true})?.id,'hc2-cta');
 assert.equal(canvasSelectionTarget('hc2-img',MOCK_NODES,['hc1-cta'],{extend:true})?.id,'hc2');
 assert.deepEqual(mergeLayerSelection(['hc1'],'hc1-cta',MOCK_NODES,true),['hc1-cta']);
 assert.deepEqual(mergeLayerSelection(['hc1-cta','hc2-cta'],'hc1-cta',MOCK_NODES,true),['hc2-cta']);
});
test('Enter selects children; Shift-Enter selects parents; ordinary marquee does not deep-select',()=>{
 assert.ok(nestedSelection(['hc1'],MOCK_NODES,'children').includes('hc1-cta'));
 assert.deepEqual(nestedSelection(['hc1-cta'],MOCK_NODES,'parent'),['hc1']);
 assert.deepEqual(canvasMarqueeTargets(['hc1','hc1-img','hc1-cta','hc2-cta'],MOCK_NODES,[]),['hc1','hc2']);
 assert.deepEqual(canvasMarqueeTargets(['hc1','hc1-cta'],MOCK_NODES,[],true),['hc1-cta']);
});
