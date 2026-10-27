import type {UIElement} from './types.js';
export const COLORS = {Primary:'#4f46e5',Secondary:'#0f766e',Surface:'#f8fafc','Text Primary':'#172033','Text Secondary':'#64748b',Border:'#cbd5e1','On Primary':'#ffffff'};
export const TYPOGRAPHY = {
 Heading:{fontFamily:'Inter, sans-serif',fontSize:24,fontWeight:'700',lineHeight:1.2,letterSpacing:-.4,color:COLORS['Text Primary']},
 Body:{fontFamily:'Inter, sans-serif',fontSize:13,fontWeight:'600',lineHeight:1.4,letterSpacing:0,color:COLORS['Text Primary']},
 Caption:{fontFamily:'Inter, sans-serif',fontSize:11,fontWeight:'400',lineHeight:1.4,letterSpacing:.1,color:COLORS['Text Secondary']},
 'Button Label':{fontFamily:'Inter, sans-serif',fontSize:11,fontWeight:'600',lineHeight:1.2,letterSpacing:.2,color:COLORS['On Primary']},
 Price:{fontFamily:'Inter, sans-serif',fontSize:14,fontWeight:'700',lineHeight:1.3,letterSpacing:0,color:COLORS.Primary},
};
export const COMPONENT_STYLES = {
 'Primary Button':{bg:COLORS.Primary,color:COLORS['On Primary'],radius:10,border:'1px solid transparent',...TYPOGRAPHY['Button Label']},
 'Secondary Button':{bg:'#ffffff',color:COLORS.Primary,radius:10,border:`1px solid ${COLORS.Primary}`,fontWeight:'600'},
 'Product Card':{bg:COLORS.Surface,radius:12,border:`1px solid ${COLORS.Border}`,shadow:'0 3px 10px #17203318',spacing:16},
 'Filter Chip':{bg:'#eef2ff',color:COLORS.Primary,radius:12,border:'1px solid #c7d2fe'},
 'Input Field':{bg:COLORS.Surface,color:COLORS['Text Primary'],radius:10,border:`1px solid ${COLORS.Border}`},
};
export function buildLibrary():UIElement[]{
 const x=80,y=1120,screen='Design System' as const;
 const frame:UIElement={id:'screen-design-system',type:'screen',x,y,w:1420,h:650,label:'Design System · Library',screen,bg:'#ffffff',radius:16,library:true};
 const nodes:UIElement[]=[frame];
 const add=(n:Omit<UIElement,'parent'|'screen'|'library'> & {parent?:string})=>nodes.push({...n,parent:n.parent||frame.id,screen,library:true});
 add({id:'ds-heading',type:'text',x:x+28,y:y+24,w:600,h:40,label:'Library / Heading',text:'Design System · Nordic Living',...TYPOGRAPHY.Heading});
 Object.entries(COLORS).forEach(([name,bg],i)=>add({id:`ds-color-${i}`,type:'rect',x:x+28+i*122,y:y+88,w:110,h:64,label:`Color / ${name}`,text:name,bg,color:name==='Surface'||name==='Border'||name==='On Primary'?'#172033':'#ffffff',radius:8,fontSize:11,token:`Color / ${name}`}));
 Object.entries(TYPOGRAPHY).forEach(([name,style],i)=>add({id:`ds-type-${i}`,type:'text',x:x+28,y:y+180+i*40,w:350,h:34,label:`Typography / ${name}`,text:`${name} · The thoughtful home`,...style,token:`Typography / ${name}`}));
 const cardId='ds-product-card';
 add({id:cardId,type:'card',x:x+420,y:y+190,w:200,h:280,label:'Product Card / Default',component:'ProductCard',role:'card',...COMPONENT_STYLES['Product Card']});
 add({id:`${cardId}-img`,parent:cardId,type:'image',x:x+436,y:y+206,w:168,h:100,label:'Library Product Image',role:'productImage',bg:'#e0e7ff',text:'Sample image',radius:10});
 add({id:`${cardId}-title`,parent:cardId,type:'text',x:x+436,y:y+322,w:168,h:22,label:'Library Product Title',role:'productTitle',text:'Default Product',...TYPOGRAPHY.Body});
 add({id:`${cardId}-price`,parent:cardId,type:'text',x:x+436,y:y+354,w:168,h:22,label:'Library Price',role:'price',text:'$120.00',...TYPOGRAPHY.Price});
 add({id:`${cardId}-cta`,parent:cardId,type:'button',x:x+436,y:y+420,w:168,h:34,label:'Library Primary Button',role:'primaryCTA',text:'Add to Bag',...COMPONENT_STYLES['Primary Button']});
 Object.entries(COMPONENT_STYLES).filter(([name])=>name!=='Product Card').forEach(([name,style],i)=>add({id:`ds-component-${i}`,type:name==='Input Field'?'input':name==='Filter Chip'?'chip':'button',x:x+680,y:y+190+i*66,w:260,h:42,label:`Component / ${name}`,text:name,...style}));
 ['Radius / Medium · 12px','Spacing / Default · 16px','Shadow / Small'].forEach((name,i)=>add({id:`ds-property-${i}`,type:'rect',x:x+1000,y:y+190+i*80,w:350,h:60,label:name,text:name,bg:'#f8fafc',radius:12,spacing:16,shadow:'0 3px 10px #17203318',fontSize:14}));
 return nodes;
}
