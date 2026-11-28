import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import SharePopover from './components/SharePopover';
import {MOCK_NODES} from './data';
import {sharePopoverLayout} from './referencePresentation';
const noop=()=>{};
test('contextual sharing uses the existing floating workflow without duplicate Edit sharing',()=>{
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 assert.match(app,/onAcceptReference=\{intent=>shareSelection\('',intent\)\}/);
 assert.doesNotMatch(app,/SelectionSharing|revealSharing/);
});
test('single and multiple selections retain all sharing controls and explicit submission',()=>{
 for(const ids of [['hc1'],['hc1','hc2']]){
 const html=renderToStaticMarkup(React.createElement(SharePopover,{
 draft:{elementIds:ids,exemplarIds:ids,scope:'exemplars',label:'Selected objects'},
 nodes:MOCK_NODES,camera:{x:0,y:0,scale:.5},collaboration:{session:{userId:'A'},room:{members:[{userId:'A',online:true},{userId:'B',online:true}]},connected:true,busy:false,share:()=>{throw Error('Must require submit');}} as any,
 visible:true,onVisible:noop,note:'',intent:'',onNote:noop,onIntent:noop,onCancel:noop,onShared:noop,onRoom:noop,onLocate:noop,onDesignReference:noop,onComparisonPurpose:noop,onRefreshComparison:noop,comparisonChanged:false,
 }));
 assert.match(html,/role="dialog"/);assert.doesNotMatch(html,/share-draft-pin/);assert.match(html,/>Share reference</);
 assert.doesNotMatch(html,/Intended action|<select/);assert.match(html,/Teammates in this file/);assert.match(html,/Share with User B/);assert.match(html,/More options/);assert.match(html,/>Send reference</);
 assert.match(html,/Reference note/);assert.match(html,/Add a message \(optional\)…/);assert.doesNotMatch(html,/notified automatically/);assert.doesNotMatch(html,/type="checkbox"/);assert.match(html,/Close sharing popup/);assert.doesNotMatch(html,/>Cancel</);
 }
});
test('floating sharing stays within small canvas bounds even for offscreen selections',()=>{
 for(const camera of [{x:0,y:0,scale:.5},{x:-5000,y:5000,scale:2}]){
 const layout=sharePopoverLayout(['hc1'],MOCK_NODES,camera,{width:280,height:240},600)!;
 assert.ok(layout.popup.left>=0&&layout.popup.top>=0);
 assert.ok(layout.popup.left+layout.popup.width<=280);
 assert.ok(layout.popup.top+layout.popup.maxHeight<=240);
 }
});

test('comparison submission lives in Sharing options while the fixed footer only cancels',()=>{
 const source=readFileSync(new URL('./components/SharePopover.tsx',import.meta.url),'utf8');
 assert.match(source,/<div className="comparison-share-submit">\{submitButton\}<\/div>/);
 assert.match(source,/quick-more-options/);assert.match(source,/intent.trim\(\)\|\|'Look at this'/);
});
