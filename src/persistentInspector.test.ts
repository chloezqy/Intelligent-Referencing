import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import ComparisonInspector from './components/ComparisonInspector';
import InspectorHeaderControls from './components/InspectorHeaderControls';
import EditingToolbar from './components/EditingToolbar';
import {MOCK_NODES} from './data';
const noop=()=>{};
const controls={mode:'demo' as const,session:{userId:'A'} as any,room:{members:[{userId:'A',online:true},{userId:'B',online:false}]} as any,onPerspective:noop};
test('Inspector puts profile and presentation above Design tabs and zoom beside the tabs',()=>{
 const html=renderToStaticMarkup(React.createElement(ComparisonInspector,{mode:'selection',workMode:'edit',contentRef:noop,headerControls:React.createElement(InspectorHeaderControls,controls),zoomControls:React.createElement('button',{'aria-label':'Zoom to fit'},'46%')},'Select a layer to inspect its properties.'));
 assert.ok(html.indexOf('figma-inspector-actions')<html.indexOf('design-inspector-tabs'));
 assert.match(html,/Demo perspective/);assert.match(html,/Zoom to fit/);assert.match(html,/Present/);assert.match(html,/>Share</);
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(app,/<TopBar|InspectorUserControls/);
});
test('typography suggestions offer style matching beside the direct inspector controls',()=>{
 const html=renderToStaticMarkup(React.createElement(EditingToolbar,{selectionInspector:true,inline:true,selection:{selectedIds:['hc2-title'],exemplarIds:['hc2-title'],label:'Title',scope:'exemplars'},nodes:MOCK_NODES,onPreview:noop,onApply:noop,onUndo:noop,onRedo:noop,canUndo:false,canRedo:false,sourceId:null,onSource:noop,picking:false,onPicking:noop,onState:noop}));
 const start=html.indexOf('aria-label="Typography suggested actions"'),end=html.indexOf('<summary>Fill',start),group=html.slice(start,end);
 assert.ok(start>=0);assert.equal((group.match(/<h4>Suggested actions/g)||[]).length,1);
 assert.match(group,/>Match text styles</);
 assert.doesNotMatch(group,/>Adjust typography</);
 assert.doesNotMatch(html,/inspector-action-card|>Ask AI<|>Match another layer<|>Find matching text styles</);
});
test('application keeps shell independent from sharing, Apply, selection and confirmed gesture state',()=>{
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(app,/selectionInspectorOpen|setSelectionInspectorOpen|open=\{inspectorOpen\}/);
 assert.match(app,/selectionMode&&!selectionPending&&!inferredRef&&<PageInspector\//);
 assert.match(app,/Confirm the interpretation to inspect its properties/);
 assert.match(app,/inspectorOpen=\{compareInspectorOpen\|\|pickingSource\|\|document.preview.length>0\}/);
 assert.match(app,/onCancel=\{\(\)=>\{setDraft\(null\);setDraftPopoverOpen\(false\);setInspectorMode\('edit'\)/);
 assert.match(app,/onAcceptReference=\{intent=>shareSelection\('',intent\)\}/);
});
