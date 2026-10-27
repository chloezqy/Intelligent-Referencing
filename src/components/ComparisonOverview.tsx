import DesignReferenceIntent from './DesignReferenceIntent';
import {DESIGN_REFERENCE_PURPOSE} from '../collaboration';
import React from 'react';
import type {ComparisonContext as Context,UserId} from '../collaboration';
import type {UIElement} from '../types';
import ComparisonContext from './ComparisonContext';
import ReferencePreviewCard from './ReferencePreviewCard';
import PropertyComparison from './PropertyComparison';
interface Props {context?:Context;contextId:string;ids:string[];nodes:UIElement[];user?:UserId;showDesignIntent?:boolean;proposedChanges?:React.ReactNode;purposeControls?:React.ReactNode}
export default function ComparisonOverview({context,contextId,ids,nodes,user,showDesignIntent=true,proposedChanges,purposeControls}:Props){
 return <div className="comparison-overview">
  {context?<ComparisonContext context={context} nodes={nodes} user={user} visual hideInsight showDesignIntent={false}/>:<ReferencePreviewCard ids={ids} nodes={nodes}/>}
  {purposeControls||context&&<p className="comparison-purpose-summary">{context.purpose==='Compare selected elements'?'Compare differences':context.purpose}</p>}
  {!purposeControls&&showDesignIntent&&context?.purpose===DESIGN_REFERENCE_PURPOSE&&context.designReference&&<DesignReferenceIntent context={context} value={context.designReference}/>}
  <PropertyComparison ownership={context} contextId={contextId} ids={ids} nodes={nodes} expanded visual/>
  {proposedChanges}
 </div>;
}
