import React from 'react';
import type {UIElement} from '../types';
import type {Patch} from '../editing';
import {usePreviewComparison} from '../usePreviewComparison';
import {ElementPreview} from './ReferencePreviewCard';

/** Legacy Compare suggestions share the same temporary hover interaction. */
export default function CanvasComparisonCards({before,after,nodes,afterNodes,patches,onPreview}:{before:UIElement;after:UIElement;nodes:UIElement[];afterNodes:UIElement[];patches:Patch[];onPreview:(p:Patch[])=>void}){
 const comparison=usePreviewComparison(patches,onPreview);
 return <div className="comparison-before-after"><div {...comparison.card('before','Current',[before.id])}><small>Current</small><ElementPreview element={before} nodes={nodes}/></div><div {...comparison.card('after','Proposed',[before.id])}><small>Proposed</small><ElementPreview element={after} nodes={afterNodes}/></div></div>;
}
