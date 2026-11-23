import {createPreviewComparisonActivity} from './previewComparisonActivity';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createPreviewComparison} from './previewComparison';
import {MOCK_NODES} from './data';
import {libraryProposal,proposalPatches,applyPatches,type Patch} from './editing';
import ComparisonPreview from './components/ComparisonPreview';

const proposal=libraryProposal(['hc1','hc2'],MOCK_NODES);
const patches=proposalPatches(proposal,proposal.mappings.map(m=>m.id),MOCK_NODES);
test('hover and keyboard comparison switch the whole enabled proposal without editing the document',()=>{
 let visible:Patch[]=patches,appearance='after';
 const comparison=createPreviewComparison(p=>visible=p,m=>appearance=m);
 comparison.update(patches);
 for(let i=0;i<10;i++){
  comparison.enter('before');assert.deepEqual(visible,[]);assert.equal(appearance,'before');
  comparison.enter('after');assert.deepEqual(visible,patches);
 }
 comparison.enter('before');comparison.leave();assert.deepEqual(visible,patches);
 comparison.focus('before');assert.deepEqual(visible,[]);
 comparison.enter('before');comparison.focus('after');assert.deepEqual(visible,patches);
 comparison.focus('before');assert.deepEqual(visible,[]);
 comparison.blur();assert.deepEqual(visible,patches);
 // The proposal, source snapshot and Apply patches are independent of transient display.
 comparison.enter('before');assert.notDeepEqual(applyPatches(MOCK_NODES,patches),MOCK_NODES);
 assert.equal(MOCK_NODES.find(n=>n.id==='hc1')!.radius,16);
 assert.deepEqual(proposalPatches(proposal,proposal.mappings.map(m=>m.id),MOCK_NODES),patches);
});
test('excluded changes and new references restore only the latest patches, and closed sessions ignore stale events',()=>{
 const calls:Patch[][]=[];
 const comparison=createPreviewComparison(p=>calls.push(p),()=>{});
 comparison.update(patches);comparison.enter('before');
 const next=patches.slice(0,1);comparison.update(next);comparison.leave();assert.deepEqual(calls.at(-1),next);
 comparison.focus('before');comparison.enter('after');comparison.leave();assert.deepEqual(calls.at(-1),[]);
 comparison.blur();assert.deepEqual(calls.at(-1),next);
 comparison.close();const count=calls.length;
 comparison.leave();comparison.enter('after');comparison.focus('after');comparison.blur();
 assert.equal(calls.length,count);
});
test('shared library, typography and Compare preview cards expose keyboard-accessible canvas comparison',()=>{
 for(const variant of ['design-system','typography','comparison'] as const){
  const html=renderToStaticMarkup(React.createElement(ComparisonPreview,{variant,proposal,enabled:proposal.mappings.map(m=>m.id),nodes:MOCK_NODES,onPreview:()=>{},onToggle:()=>{},onApply:()=>{},onCancel:()=>{}}));
  assert.match(html,/tabindex="0" role="group" aria-label="(?:Before|Current) canvas preview"/);
  assert.match(html,/data-preview-appearance="after" data-preview-active="true"/);
  assert.match(html,/>Apply changes</);assert.match(html,/>Cancel</);
 }
});

test('comparison activity suppresses contextual actions while Current clears canvas patches, and releases on close',()=>{
 let active=false,visible:Patch[]=patches;
 const register=createPreviewComparisonActivity(value=>active=value),release=register();
 const comparison=createPreviewComparison(value=>visible=value,()=>{});comparison.update(patches);
 comparison.enter('before');assert.deepEqual(visible,[]);assert.equal(active,true);
 comparison.enter('after');assert.equal(active,true);
 const second=register();release();release();assert.equal(active,true);
 second();assert.equal(active,false);
 const next=register();assert.equal(active,true);next();assert.equal(active,false);
});
