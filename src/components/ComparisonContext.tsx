import {comparisonSides,sideLabel,sideDirection} from '../comparisonSides';
import React from 'react';
import {ChevronDown} from 'lucide-react';
import DesignReferenceIntent from './DesignReferenceIntent';
import ReferencePreviewCard from './ReferencePreviewCard';
import { ComparisonContext as Context, UserId, DesignReference, DESIGN_REFERENCE_PURPOSE } from '../collaboration';
import { UIElement } from '../types';
interface Props {context:Context;nodes:UIElement[];user?:UserId;onPurpose?:(purpose:string)=>void;compact?:boolean;visual?:boolean;showDesignIntent?:boolean;hideInsight?:boolean}
export function ComparisonPurpose({context,onPurpose,onDesignReference,showDesignControls=true}:{showDesignControls?:boolean;context:Context;onPurpose:(purpose:string)=>void;onDesignReference?:(value:DesignReference)=>void}){
 const design=context.purpose===DESIGN_REFERENCE_PURPOSE;
 const paired=Object.values(comparisonSides(context)).every(side=>side.elementIds.length>0);
 return <div className="comparison-purpose"><fieldset><legend>Comparison purpose</legend><label><input type="radio" name={`purpose-${context.snapshotId}`} checked={!design} onChange={()=>onPurpose('Compare differences')}/>Compare differences</label><label><input type="radio" name={`purpose-${context.snapshotId}`} checked={design} disabled={!paired} onChange={()=>onPurpose(DESIGN_REFERENCE_PURPOSE)}/>Use as a design reference</label></fieldset>
 {design&&showDesignControls&&onDesignReference&&<DesignReferenceIntent context={context} value={context.designReference||{direction:sideDirection(context),properties:[]}} onChange={onDesignReference}/>}
 {!paired&&<p className="subtle">Select a second object or compare with a collaborator to use a design reference.</p>}
 </div>;
}

export default function ComparisonContext({context,nodes,user,onPurpose,compact=false,visual=false,showDesignIntent=true,hideInsight=false}:Props){
 if(visual)return <div className="visual-comparison-context">
  <div className="reference-card-pair">{(['A','B'] as const).map(id=><ReferencePreviewCard key={id} title={context.sides?`Object ${id}`:undefined} ids={comparisonSides(context)[id].elementIds} nodes={nodes} user={comparisonSides(context)[id].selectedBy} self={user}/>)}</div>
  {showDesignIntent&&context.purpose===DESIGN_REFERENCE_PURPOSE&&context.designReference&&<DesignReferenceIntent context={context} value={context.designReference}/>}
  {!hideInsight&&context.purpose!==DESIGN_REFERENCE_PURPOSE&&<section className="comparison-insight" aria-label="Rule-based insight"><h4>Rule-based insight</h4><p>{context.interpretation.summary}</p></section>}
 </div>;
 const participants=<div className="comparison-participants">{(['A','B'] as const).map(id=><div key={id} className={`user-${id}`}><strong>{id===user?'Your selection':`User ${id}’s selection`}</strong><p>{context.selections[id].elementIds.length} {context.selections[id].elementIds.length===1?'object':'objects'} · {[...new Set(nodes.filter(n=>context.selections[id].elementIds.includes(n.id)).map(n=>n.screen))].join(', ')}</p></div>)}</div>;
 return <div className={`comparison-context ${compact?'compact-context':''}`}>
 {compact&&participants}
 <div className="comparison-relationship"><h4>{compact?'Relationship · rule-based':'Context suggestions · rule-based'}</h4><p>{context.interpretation.summary}</p></div>
 {!compact&&<><ul>{context.interpretation.evidence.map(e=><li key={e}>{e}</li>)}</ul>{participants}{onPurpose?<ComparisonPurpose context={context} onPurpose={onPurpose}/>:<p><strong>Purpose:</strong> {context.purpose}</p>}</>}
 </div>;
}
