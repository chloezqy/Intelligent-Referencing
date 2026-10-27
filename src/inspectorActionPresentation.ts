import type {UIElement} from './types';
import type {ComparisonContext} from './collaboration';
import type {InspectorAction} from './inspectorEditing';
import {compareReferenceElements} from './referencePresentation';
import {visualDifferences} from './visualComparison';
import {comparisonSides} from './comparisonSides';
export const ACTION_TITLES:Record<InspectorAction,string>={Align:'Align elements','Match Styles':'Match styles',Typography:'Adjust typography',Colors:'Adjust colors','Design System':'Find design system matches','Ask AI':'Ask AI for recommendations'};
const styleKeys=['spacing','background','color','radius','fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','border'];
export function inspectorActionPresentation(available:InspectorAction[],ids:string[],nodes:UIElement[],context?:ComparisonContext){
 const sides=context?comparisonSides(context):undefined;
 const compared=compareReferenceElements(sides?[...new Set([...sides.A.elementIds,...sides.B.elementIds])]:ids,nodes);
 // Use all meaningful rows, rather than the five-row visual summary cap.
 const keys=new Set(compared.rows.filter(r=>r.state==='different').filter(r=>!context||visualDifferences({...compared,rows:[r]},context).total>0).map(r=>r.key));
 const descriptions:Record<InspectorAction,string>={Align:'Review alignment and spacing within the same frame.','Match Styles':'Choose which recorded style differences to match.',Typography:'Review font properties before proposing changes.',Colors:'Review fill, text and border colors.','Design System':'Review relevant existing tokens and component styles.','Ask AI':'Request optional recommendations for these objects.'};
 const ranked:InspectorAction[]=[];
 const add=(action:InspectorAction,condition=true)=>{if(condition&&available.includes(action)&&!ranked.includes(action))ranked.push(action);};
 add('Match Styles',styleKeys.some(k=>keys.has(k)));add('Typography',['fontSize','fontWeight','fontFamily','lineHeight','letterSpacing'].some(k=>keys.has(k)));add('Colors',['background','color','border'].some(k=>keys.has(k)));add('Design System');add('Ask AI');add('Align',keys.has('dimensions')||keys.has('spacing'));add('Match Styles',context?.purpose==='Use as a design reference');
 const primary=ranked.slice(0,3),secondary=available.filter(a=>!primary.includes(a));
 const matchDetails=compared.rows.filter(r=>styleKeys.includes(r.key)&&keys.has(r.key)).slice(0,2).map(r=>`${r.label}: ${[...new Set(r.values)].slice(0,2).join(' vs. ')}`).join(' · ');
 return {primary,secondary,descriptions,matchDetails};
}
