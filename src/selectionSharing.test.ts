import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import SelectionSharing from './components/SelectionSharing';
import ReferenceSharingControls from './components/ReferenceSharingControls';
import ComparisonInspector from './components/ComparisonInspector';
import {MOCK_NODES} from './data';
const noop=()=>{},c={session:{userId:'A'},connected:true,busy:false,room:{members:[{userId:'A',online:true},{userId:'B',online:true}]},share:()=>{throw new Error('Sharing requires explicit submit');}} as any;
test('Selection sharing reuses explicit intent, note, mention and invitation controls without creating a comparison',()=>{
 const html=renderToStaticMarkup(React.createElement(SelectionSharing,{selection:{selectedIds:['hc1'],exemplarIds:['hc1'],label:'Card',scope:'exemplars'},nodes:MOCK_NODES,collaboration:c,footerHost:null,note:'',intent:'Review',onNote:noop,onIntent:noop,onShared:noop}));
 assert.match(html,/Sharing options/);assert.match(html,/Reference note/);assert.match(html,/Intended action/);assert.match(html,/Invite mentioned teammates/);assert.doesNotMatch(html,/Object B|Comparison purpose/);
 const compare=renderToStaticMarkup(React.createElement(ReferenceSharingControls,{comparison:true,c,note:'',intent:'Compare',onNote:noop,onIntent:noop,inviteNow:false,setInviteNow:noop}));assert.doesNotMatch(compare,/Intended action/);assert.match(compare,/Reference note/);
});
test('Selection sharing footer is outside the main scrolling content',()=>{
 const html=renderToStaticMarkup(React.createElement(ComparisonInspector,{mode:'selection',open:true,onClose:noop,contentRef:noop,footer:React.createElement('footer',{id:'selection-footer'},'Share reference')},React.createElement('section',null,'Selection content')));
 assert.ok(html.includes('Selection content</section></div><footer id="selection-footer">Share reference</footer>'));
});
test('Compare is a communication intent in Edit sharing, without comparison navigation controls',()=>{
 const html=renderToStaticMarkup(React.createElement(SelectionSharing,{selection:{selectedIds:['hc1'],exemplarIds:['hc1'],label:'Card',scope:'exemplars'},nodes:MOCK_NODES,collaboration:c,footerHost:null,note:'',intent:'Compare',onNote:noop,onIntent:noop,onShared:noop}));
 assert.match(html,/Request intent/);assert.match(html,/value="Compare"/);assert.doesNotMatch(html,/>Compare<\/button>|Comparison purpose|Selection mode/);
});
