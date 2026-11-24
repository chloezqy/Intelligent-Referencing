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
test('selection actions appear above properties with library, source, layout and an enabled command field',()=>{
 for(const ids of [['hc2-title'],['hc2-img'],['hc2'],['hc1','hc2']]){
  const html=render(ids),start=html.indexOf('aria-label="AI Actions"');
  assert.equal((html.match(/aria-label="AI Actions"/g)||[]).length,1);
  assert.ok(start>html.indexOf('design-selection-preview'));
  assert.ok(start<html.indexOf('<summary>Position'));
  assert.match(html,/Match library/);assert.match(html,/Pick source/);if(ids.length>1)assert.match(html,/More layout options/);
  assert.doesNotMatch(html,/coming soon|Find existing color styles|Match text styles|design-smart-row/);
  assert.match(html,/<input aria-label="Ask AI to change selection"[^>]*value=""/);
  assert.doesNotMatch(html,/<input aria-label="Ask AI to change selection"[^>]*disabled/);
 }
});
test('empty inspector places a compact AI prompt below Page',()=>{
 const html=renderToStaticMarkup(React.createElement(PageInspector));
 assert.match(html,/Select layers to see AI suggestions/);
 assert.ok(html.indexOf('AI Actions')>html.indexOf('page-background-section'));
 assert.ok(html.indexOf('AI Actions')<html.indexOf('>Styles<'));
 assert.doesNotMatch(html,/ai-command|No selection/);
 const shell=renderToStaticMarkup(React.createElement(AIActionsPanel,{count:3},'Actions'));
 assert.match(shell,/3 layers/);
});
