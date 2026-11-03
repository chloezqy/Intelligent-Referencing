import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import ComparisonInspector from './components/ComparisonInspector';
import InspectorUserControls from './components/InspectorUserControls';
import TopBar from './components/TopBar';
import EditingToolbar from './components/EditingToolbar';
import {MOCK_NODES} from './data';
const noop=()=>{};
const controls={mode:'demo' as const,session:{userId:'A'} as any,room:{members:[{userId:'A',online:true},{userId:'B',online:false}]} as any,onPerspective:noop};
test('persistent header puts presence above tabs and perspective in top bar with no close control',()=>{
 const html=renderToStaticMarkup(React.createElement(ComparisonInspector,{mode:'selection',workMode:'edit',contentRef:noop,headerControls:React.createElement(InspectorUserControls,controls)},'Select a layer to inspect its properties.'));
 assert.ok(html.indexOf('inspector-user-controls')<html.indexOf('design-inspector-tabs'));
 assert.match(html,/User A: online/);assert.match(html,/User B: offline/);assert.doesNotMatch(html,/Demo perspective/);
 assert.doesNotMatch(html,/hidden=|Close|onClose/);
 const top=renderToStaticMarkup(React.createElement(TopBar,{...controls,scale:1,connected:true,onZoomIn:noop,onZoomOut:noop,onZoomFit:noop,onShowHelp:noop,onOpenRoom:noop}));
 assert.doesNotMatch(top,/header-presence/);assert.match(top,/Demo perspective/);assert.ok(top.indexOf('Demo · Simulated collaboration')<top.indexOf('Demo perspective'));assert.match(top,/Shared room/);
});
test('typography suggestions share a single labelled group and retain the planned order',()=>{
 const html=renderToStaticMarkup(React.createElement(EditingToolbar,{selectionInspector:true,inline:true,selection:{selectedIds:['hc2-title'],exemplarIds:['hc2-title'],label:'Title',scope:'exemplars'},nodes:MOCK_NODES,onPreview:noop,onApply:noop,onUndo:noop,onRedo:noop,canUndo:false,canRedo:false,sourceId:null,onSource:noop,picking:false,onPicking:noop,onState:noop}));
 const start=html.indexOf('aria-label="Typography suggested actions"'),end=html.indexOf('<summary>Fill',start),group=html.slice(start,end);
 assert.ok(start>=0);assert.equal((group.match(/<h4>Suggested actions/g)||[]).length,1);
 const labels=['Adjust typography','Find matching text styles','Match another layer'];
 for(let i=0;i<labels.length-1;i++)assert.ok(group.indexOf('>'+labels[i]+'<')<group.indexOf('>'+labels[i+1]+'<'));
 assert.doesNotMatch(html,/inspector-action-card|>Ask AI</);
});
test('application keeps shell independent from sharing, Apply, selection and confirmed gesture state',()=>{
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(app,/selectionInspectorOpen|setSelectionInspectorOpen|open=\{inspectorOpen\}/);
 assert.match(app,/Select a layer to inspect its properties/);
 assert.match(app,/Confirm the interpretation to inspect its properties/);
 assert.match(app,/inspectorOpen=\{compareInspectorOpen\|\|pickingSource\|\|document.preview.length>0\}/);
 assert.match(app,/onCancel=\{\(\)=>\{setDraft\(null\);setDraftPopoverOpen\(false\);setInspectorMode\('edit'\)/);
 assert.match(app,/onAcceptReference=\{intent=>shareSelection\('',intent\)\}/);
});
