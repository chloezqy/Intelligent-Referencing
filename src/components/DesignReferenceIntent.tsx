import React from 'react';
import {ArrowRight} from 'lucide-react';
import {DESIGN_REFERENCE_PROPERTIES,DesignReference,ComparisonContext} from '../collaboration';
import {referenceSides,sideDirection,sideLabel} from '../comparisonSides';
interface Props {value:DesignReference;context?:ComparisonContext;onChange?:(value:DesignReference)=>void}
export default function DesignReferenceIntent({value,context,onChange}:Props){
 const resolved=context?referenceSides({...context,designReference:value}):undefined;
 const reference=resolved?sideLabel(context!,resolved.referenceSide):`User ${value.direction.referenceUser}`;
 const target=resolved?sideLabel(context!,resolved.targetSide):`User ${value.direction.targetUser}`;
 return <section className="design-reference-intent" aria-label="Design reference intent">
  {!onChange&&<h4>Design reference</h4>}
  <div className="design-reference-direction"><strong>{reference} · Reference</strong><ArrowRight size={15} aria-label="to"/><strong>{target} · Target</strong>{onChange&&context&&resolved&&<button type="button" onClick={()=>onChange({...value,direction:sideDirection(context,resolved.targetSide),proposedChanges:undefined})}>Swap</button>}</div>
  {onChange?<><fieldset><legend>Properties to reference</legend>{Object.entries(DESIGN_REFERENCE_PROPERTIES).map(([key,label])=><label key={key}><input type="checkbox" checked={value.properties.includes(key as keyof typeof DESIGN_REFERENCE_PROPERTIES)} onChange={e=>onChange({...value,properties:e.target.checked?[...value.properties,key as keyof typeof DESIGN_REFERENCE_PROPERTIES]:value.properties.filter(p=>p!==key),proposedChanges:undefined})}/>{label}</label>)}</fieldset>{!value.properties.length&&<p className="subtle">Choose at least one property.</p>}</>:<p className="design-reference-property-list">{value.properties.map(key=>DESIGN_REFERENCE_PROPERTIES[key]).join(' · ')}</p>}
 </section>;
}
