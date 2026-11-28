import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import IncomingReferenceNotice from './components/IncomingReferenceNotice';
import type {SharedReference} from './collaboration';
import {MOCK_NODES} from './data';
const reference:SharedReference={id:'notice',sourceUser:'B',targetUser:'A',elementIds:['hc1'],exemplarIds:[],scope:'exemplars',intent:'Review',label:'Saved object',message:'Do not preview this private note',createdAt:new Date().toISOString(),status:'open',responses:[]};
const render=(ref=reference,connected=true)=>renderToStaticMarkup(React.createElement(IncomingReferenceNotice,{reference:ref,nodes:MOCK_NODES,connected,onView:()=>{throw Error('Requires a click');},onLater:()=>{throw Error('Requires a click');}}));
test('Incoming banner uses actual sender, object and timestamp without note previews or close controls',()=>{
 const html=render();assert.match(html,/User B shared a reference/);assert.match(html,/Product Card \(Nordic Lounge Chair\)/);assert.match(html,/Just now/);assert.match(html,/dateTime=/);assert.match(html,/title=/);assert.match(html,/>View reference</);assert.match(html,/>Later</);assert.doesNotMatch(html,/Do not preview|Close|×/);
});
test('Incoming banner supports grouped and unavailable objects and disconnected viewing',()=>{
 assert.match(render({...reference,elementIds:['hc1','hc2','hc1']}),/2 layers selected/);
 assert.match(render({...reference,elementIds:['gone']}),/Saved object/);
 assert.match(render(reference,false),/class="incoming-reference-view" disabled/);
 assert.doesNotMatch(render(reference,false),/class="incoming-reference-later" disabled/);
});
