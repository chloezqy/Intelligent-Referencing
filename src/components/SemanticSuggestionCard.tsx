import React from 'react';
import {SemanticCandidate} from '../semanticInterpretation';
import {semanticSuggestionPresentation} from '../semanticSuggestionPresentation';
import {UIElement} from '../types';

export default function SemanticSuggestionCard({previewChoice=false,candidate,nodes,selected,onPreview,onSelect}:{previewChoice?:boolean;key?:string;candidate:SemanticCandidate;nodes:UIElement[];selected:boolean;onPreview:(preview:boolean)=>void;onSelect:()=>void}){
 const summary=semanticSuggestionPresentation(candidate,nodes);
 return <article className="semantic-suggestion-card" onMouseEnter={()=>onPreview(true)} onMouseLeave={()=>onPreview(false)} onFocus={()=>onPreview(true)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))onPreview(false);}}>
  <button type="button" className="semantic-suggestion-select" aria-pressed={selected} onClick={onSelect}>
   <span className="semantic-suggestion-heading"><strong>{summary.title}</strong><span className="semantic-object-count">{summary.count} {summary.count===1?'object':'objects'}</span></span>
   <span className="semantic-suggestion-context">{summary.context}</span>
   <span className="semantic-suggestion-action">{previewChoice?(selected?'Preview active · confirm below':'Preview this reference'):(selected?'Selected':'Select objects')}</span>
  </button>
 </article>;
}
