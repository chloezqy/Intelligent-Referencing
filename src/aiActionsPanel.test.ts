import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import AIActionsPanel from './components/AIActionsPanel';
import EditingToolbar from './components/EditingToolbar';
import PageInspector from './components/PageInspector';
import {MOCK_NODES} from './data';
const noop=()=>{};
function render(ids:string[]){return renderToStaticMarkup(React.createElement(EditingToolbar,{selectionInspector:true,inline:true,selection:{selectedIds:ids,exemplarIds:ids,label:'Selection',scope:'exemplars'},nodes:MOCK_NODES,onPreview:noop,onApply:noop,onUndo:noop,onRedo:noop,canUndo:false,canRedo:false,sourceId:null,onSource:noop,picking:false,onPicking:noop,onState:noop}));}
test('one bottom panel contains relevant actions for text, image, card and multiple selections',()=>{
 for(const ids of [['hc2-title'],['hc2-img'],['hc2'],['hc1','hc2']]){
  const html=render(ids),start=html.indexOf('aria-label="AI Actions"');
  assert.equal((html.match(/aria-label="AI Actions"/g)||[]).length,1);
  assert.doesNotMatch(html,/Suggested actions|suggested actions/);
  assert.ok(start>html.indexOf('<summary>Export'));
  assert.ok(start>html.indexOf('<summary>Fill'));
  assert.match(html.slice(start),/Find existing color styles/);
  assert.equal((html.match(/>Match text styles</g)||[]).length,ids.includes('hc2-img')?0:1);
  assert.match(html,/aria-expanded="true"/);
  assert.match(html,/Submit change \(coming soon\)[^>]*title="Freeform commands are not supported yet/);
 }
});
test('empty inspector includes a clear nonfunctional command state',()=>{
 const html=renderToStaticMarkup(React.createElement(PageInspector));
 assert.match(html,/No selection/);assert.match(html,/Select a layer to see available actions/);
 assert.match(html,/placeholder="Describe a change\.\.\." disabled/);
 const shell=renderToStaticMarkup(React.createElement(AIActionsPanel,{count:3},'Actions'));
 assert.match(shell,/For 3 selected layers/);assert.match(shell,/class="ai-actions-heading" aria-expanded="true"/);
});
