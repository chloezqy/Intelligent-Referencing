import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import CollaborationPanel from './components/CollaborationPanel';
import {MOCK_NODES} from './data';
import {referenceLists,type SharedReference} from './collaboration';
const reference:SharedReference={id:'unread',sourceUser:'A',targetUser:'B',intent:'Review',label:'Saved label',elementIds:['hc1'],exemplarIds:[],scope:'exemplars',message:'Please review',createdAt:new Date().toISOString(),status:'open',responses:[]};
const noop=()=>{};
test('Compact list uses saved reference counts, avatars, actual previews, unread dots and neutral fallback titles',()=>{
 const viewed={...reference,id:'viewed',intent:'Look at this',message:'',activity:[{id:'opened',kind:'opened' as const,userId:'B' as const,elementIds:[],at:reference.createdAt}]};
 const resolved={...reference,id:'resolved',archivedAt:reference.createdAt};
 const html=renderToStaticMarkup(React.createElement(CollaborationPanel,{nodes:MOCK_NODES,collaboration:{mode:'demo',session:{userId:'B'},room:{references:[reference,viewed,resolved],members:[]}} as any,hasDraft:false,activeId:'viewed',openRevision:0,onResumeDraft:noop,onOpen:noop,onLocate:noop,onClear:noop}));
 assert.match(html,/role="tablist"/);assert.match(html,/Active \(2\)/);assert.match(html,/Resolved \(1\)/);assert.match(html,/data-reference-id="unread" data-unread="true"/);assert.match(html,/data-reference-id="viewed" data-unread="false"/);assert.doesNotMatch(html,/data-reference-id="resolved"/);
 assert.match(html,/Sender User A/);assert.match(html,/Preview of Product Card \(Nordic Lounge Chair\)/);assert.match(html,/Home · 1 object · Just now/);
 assert.doesNotMatch(html,/sent a request|Awaiting review|Viewed ·|Reset demo|<h3>References/);
 assert.match(html,/<strong title="Product Card \(Nordic Lounge Chair\)">Product Card \(Nordic Lounge Chair\)<\/strong>/);
});
test('Reopening an explicitly resolved reviewed reference returns it to Active without altering conversation evidence',()=>{
 const saved={...reference,status:'reviewed' as const,reviewedAt:reference.createdAt,archivedAt:reference.createdAt,responses:[{id:'reply',userId:'B' as const,message:'Reviewed',createdAt:reference.createdAt}]};
 assert.equal(referenceLists([saved]).archived.length,1);
 const {archivedAt,...reopened}=saved;
 assert.equal(referenceLists([reopened]).active.length,1);assert.equal(reopened.responses,saved.responses);assert.equal(reopened.reviewedAt,saved.reviewedAt);assert.equal(reopened.message,saved.message);
});
