import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ErrorBoundary from './components/ErrorBoundary';

test('a render crash shows the recovery screen with the error message instead of a blank page',()=>{
 const state=ErrorBoundary.getDerivedStateFromError(new TypeError('Cannot read properties of undefined'));
 const boundary=new ErrorBoundary();boundary.props={children:React.createElement('p',null,'App')};
 boundary.state=state;
 const html=renderToStaticMarkup(boundary.render() as React.ReactElement);
 assert.match(html,/Something went wrong/);
 assert.match(html,/TypeError: Cannot read properties of undefined/);
 assert.match(html,/>Reload</);
 assert.match(html,/>Reset demo data</);
 assert.doesNotMatch(html,/>App</);
});

test('without an error the app renders normally',()=>{
 const html=renderToStaticMarkup(React.createElement(ErrorBoundary,null,React.createElement('p',null,'App')));
 assert.equal(html,'<p>App</p>');
});
