import React from 'react';
import type {ComparisonContext as Context,UserId} from '../collaboration';
import type {UIElement} from '../types';
import ComparisonContext from './ComparisonContext';
import ReferencePreviewCard from './ReferencePreviewCard';
import PropertyComparison from './PropertyComparison';
interface Props {context?:Context;contextId:string;ids:string[];nodes:UIElement[];user?:UserId}
export default function ComparisonOverview({context,contextId,ids,nodes,user}:Props){
 return <div className="comparison-overview">
  {context?<ComparisonContext context={context} nodes={nodes} user={user} visual/>:<ReferencePreviewCard ids={ids} nodes={nodes}/>}
  <PropertyComparison ownership={context} contextId={contextId} ids={ids} nodes={nodes} expanded visual/>
 </div>;
}
