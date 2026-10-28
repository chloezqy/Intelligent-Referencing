import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import CanvasToolbar,{CANVAS_TOOLS} from './components/CanvasToolbar';
test('Canvas toolbar exposes exactly one active functional tool and six inert placeholders',()=>{
 for(const tool of CANVAS_TOOLS){
  const html=renderToStaticMarkup(React.createElement(CanvasToolbar,{mode:tool.mode,onChange:()=>{throw new Error('Rendering cannot change tool');}}));
  assert.match(html,new RegExp(`aria-label="${tool.label} \\(${tool.key}\\)"`));
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.equal((html.match(/aria-disabled="true"/g)||[]).length,6);
  assert.match(html,/aria-expanded="false"/);assert.doesNotMatch(html,/role="menuitemradio"/);
  const labels=['Frame','Shape','Pen','Text','Comment','Resources'];let previous=-1;for(const label of labels){const at=html.indexOf(`aria-label="${label} — Coming soon"`);assert.ok(at>previous);previous=at;}
 }
 assert.deepEqual(CANVAS_TOOLS.map(tool=>tool.key),['V','G','H']);
});
