import React from 'react';
import type {ComparisonContext as Context,UserId} from '../collaboration';
import type {UIElement} from '../types';
import ComparisonContext from './ComparisonContext';
import ReferencePreviewCard from './ReferencePreviewCard';
import PropertyComparison from './PropertyComparison';
interface Props {context?:Context;contextId:string;ids:string[];nodes:UIElement[];user?:UserId;showDesignIntent?:boolean;proposedChanges?:React.ReactNode}
export default function ComparisonOverview({context,contextId,ids,nodes,user,showDesignIntent=true,proposedChanges}:Props){
 return <div className="comparison-overview">
  {context?<ComparisonContext context={context} nodes={nodes} user={user} visual showDesignIntent={showDesignIntent}/>:<ReferencePreviewCard ids={ids} nodes={nodes}/>}
  {proposedChanges}
  <PropertyComparison ownership={context} contextId={contextId} ids={ids} nodes={nodes} expanded visual/>
 </div>;
}
