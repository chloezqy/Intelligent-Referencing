import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MOCK_NODES} from './data';
import {canvasSelectionTarget,mergeLayerSelection,nestedSelection} from './selectionInteraction';
import CanvasFrameLabels from './components/CanvasFrameLabels';
import FrameInspector from './components/FrameInspector';
const frame=MOCK_NODES.find(node=>node.id==='screen-home')!,noop=()=>{};
test('frames can be selected without changing the existing child drill-in behavior',()=>{
 assert.equal(canvasSelectionTarget(frame.id,MOCK_NODES,[])?.id,frame.id);
 assert.equal(canvasSelectionTarget('hc1-title',MOCK_NODES,[])?.id,'hc1');
 assert.equal(canvasSelectionTarget('hc1-title',MOCK_NODES,[frame.id])?.id,'hc1');
 assert.equal(canvasSelectionTarget('hc1-title',MOCK_NODES,['hc1'],{drill:true})?.id,'hc1-title');
 assert.deepEqual(mergeLayerSelection(['hc1-title'],'screen-home',MOCK_NODES,true),['screen-home']);
 assert.deepEqual(mergeLayerSelection(['screen-home'],'hc1-title',MOCK_NODES,true),['hc1-title']);
 assert.deepEqual(mergeLayerSelection(['screen-home'],'screen-search',MOCK_NODES,true),['screen-home','screen-search']);
 assert.ok(nestedSelection([frame.id],MOCK_NODES,'children').includes('hc1'));
});
test('all frames have editor labels at screen coordinates with selected state and no scaled typography',()=>{
 const frames=MOCK_NODES.filter(n=>n.type==='screen');
 for(const scale of [.25,1,2]){
  const html=renderToStaticMarkup(React.createElement(CanvasFrameLabels,{frames,camera:{x:20,y:30,scale},selectedIds:[frame.id],onSelect:noop,onPointerDown:noop}));
  assert.equal((html.match(/aria-label="Select frame /g)||[]).length,7);
  assert.ok(html.includes(`left:${20+frame.x*scale}px;top:${30+frame.y*scale-25}px`));
  assert.match(html,/aria-pressed="true"/);assert.doesNotMatch(html,/font-mono|01 · Home Feed|transform:scale/);
 }
});
test('frame inspector exposes actual bounds and child selection without offering object AI actions',()=>{
 const html=renderToStaticMarkup(React.createElement(FrameInspector,{frames:[frame],nodes:MOCK_NODES,onSelectContents:noop}));
 assert.match(html,/>Frame</);assert.match(html,/Home Screen/);assert.match(html,/>375</);assert.match(html,/>812</);assert.match(html,/>Select contents</);
 assert.doesNotMatch(html,/Multiple layers|No position properties|Match library|Ask AI/);
});
