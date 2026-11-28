import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ReferenceConversation,{conversationTime} from './components/ReferenceConversation';
import {MOCK_NODES} from './data';
import type {SharedReference} from './collaboration';
const ref:SharedReference={id:'thread',sourceUser:'A',targetUser:'B',intent:'Review',label:'Card',elementIds:['hc1'],exemplarIds:[],scope:'exemplars',message:'Please review this card.',createdAt:'2026-11-28T12:00:00Z',status:'open',responses:[{id:'reply',userId:'B',message:'I will take a look.',createdAt:'2026-11-28T12:10:00Z'}]};
const render=(user='B',reference=ref)=>renderToStaticMarkup(React.createElement(ReferenceConversation,{active:reference,nodes:MOCK_NODES,collaboration:{session:{userId:user},connected:true,busy:false} as any,onClose:()=>{},onLocate:()=>{},onClear:()=>{}}));
test('Comment thread presents messages, accessible header actions and compact reply input',()=>{
 const html=render();assert.equal((html.match(/<header[\s\S]*?<\/header>/)![0].match(/<button/g)||[]).length,2);assert.match(html,/Review request/);assert.match(html,/Please review this card/);assert.match(html,/I will take a look/);assert.doesNotMatch(html,/Close conversation|Mark reviewed/);assert.match(html,/Mark as resolved/);assert.match(html,/Locate reference/);assert.match(html,/Reply to User A/);assert.match(html,/title="Send response" disabled/);assert.match(html,/dateTime="2026-11-28T12:00:00Z" title=/);assert.doesNotMatch(html,/Your note|Sent to User|conversation-note-label|Follow up<|Send response<\/button>/);
 assert.match(render('A'),/Mark as resolved/);assert.match(render('A'),/Follow up with User B/);
 const archived=render('B',{...ref,archivedAt:'2026-11-28T13:00:00Z',message:''});assert.match(archived,/Resolved/);assert.match(archived,/Reopen reference/);assert.match(archived,/No additional note/);assert.match(archived,/<textarea[^>]*disabled/);
});
test('Relative times stay concise and handle future and invalid timestamps',()=>{
 const now=Date.parse('2026-11-28T12:10:00Z');assert.equal(conversationTime(ref.createdAt,now),'10 minutes ago');assert.equal(conversationTime('2026-11-28T12:11:00Z',now),'Just now');assert.equal(conversationTime('bad',now),'');
});
