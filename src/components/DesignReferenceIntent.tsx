import React from 'react';
import {ArrowRight} from 'lucide-react';
import {DESIGN_REFERENCE_PROPERTIES,DesignReference} from '../collaboration';
interface Props {value:DesignReference;onChange?:(value:DesignReference)=>void}
export default function DesignReferenceIntent({value,onChange}:Props){
 return <section className="design-reference-intent" aria-label="Design reference intent">
  {!onChange&&<h4>Use as a design reference</h4>}
  <div className="design-reference-direction"><strong className="user-A">User A · Reference</strong><ArrowRight size={15} aria-label="to"/><strong className="user-B">User B · Target</strong></div>
  {onChange?<><fieldset><legend>Properties to reference</legend>{Object.entries(DESIGN_REFERENCE_PROPERTIES).map(([key,label])=><label key={key}><input type="checkbox" checked={value.properties.includes(key as keyof typeof DESIGN_REFERENCE_PROPERTIES)} onChange={e=>onChange({...value,properties:e.target.checked?[...value.properties,key as keyof typeof DESIGN_REFERENCE_PROPERTIES]:value.properties.filter(p=>p!==key)})}/>{label}</label>)}</fieldset>{!value.properties.length&&<p className="subtle">Choose at least one property.</p>}</>:<><p className="design-reference-property-list">{value.properties.map(key=>DESIGN_REFERENCE_PROPERTIES[key]).join(' · ')}</p><p className="subtle">Requested properties only; no design changes applied.</p></>}
 </section>;
}
