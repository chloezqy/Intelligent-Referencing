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
/** These samples are also the authoritative style sources consumed by the editor. */
export const PRODUCT_IMAGE_STYLE={bg:'#e0e7ff',radius:10};
export function buildLibrary():UIElement[]{
 const x=80,y=1120,screen='Design System' as const;
 const frame:UIElement={id:'screen-design-system',type:'screen',x,y,w:1420,h:1,label:'Design System · Library',screen,bg:'#ffffff',radius:16,library:true};
 const nodes:UIElement[]=[frame];
 const add=(n:Omit<UIElement,'parent'|'screen'|'library'> & {parent?:string})=>nodes.push({...n,parent:n.parent||frame.id,screen,library:true});
 const label=(id:string,text:string,dx:number,dy:number,w=330,size=12)=>add({id,type:'text',x:x+dx,y:y+dy,w,h:26,label:text,text,fontFamily:'Inter, sans-serif',fontSize:size,fontWeight:size>=16?'700':'400',color:COLORS['Text Secondary'],textAlign:'left'});
 add({id:'ds-heading',type:'text',x:x+28,y:y+24,w:900,h:40,label:'Library / Heading',text:'Nordic Living · Design system',...TYPOGRAPHY.Heading,textAlign:'left'});
 label('ds-intro','Shared sources for Apply design system · styles transfer; product content and card sizes stay intact.',28,66,1320);
 label('ds-colors-heading','01 · Color palette',28,104,600,16);
 Object.entries(COLORS).forEach(([name,bg],i)=>{
  const dx=28+i*196;
  add({id:`ds-color-${i}`,type:'rect',x:x+dx,y:y+144,w:174,h:56,label:`Color / ${name}`,bg,border:`1px solid ${COLORS.Border}`,radius:8,token:`Color / ${name}`});
  label(`ds-color-name-${i}`,name,dx,204,174);label(`ds-color-value-${i}`,bg,dx,228,174);
 });
 label('ds-type-heading','02 · Typography',28,284,360,16);
 Object.entries(TYPOGRAPHY).forEach(([name,style],i)=>{
  const dy=328+i*88;
  add({id:`ds-type-${i}`,type:'text',x:x+28,y:y+dy,w:350,h:38,label:`Typography / ${name}`,text:`${name} · Nordic Living`,...style,textAlign:'left',...(name==='Button Label'?{bg:COLORS.Primary,radius:8}:{}),token:`Typography / ${name}`});
  label(`ds-type-meta-${i}`,`${style.fontSize}px / ${style.fontWeight} / line ${style.lineHeight} / tracking ${style.letterSpacing}px`,28,dy+40,360);
 });
 label('ds-card-heading','03 · Product card',420,284,270,16);
 const cardId='ds-product-card';
 add({id:cardId,type:'card',x:x+420,y:y+328,w:240,h:300,label:'Product Card / Default',component:'ProductCard',role:'card',...COMPONENT_STYLES['Product Card']});
 add({id:`${cardId}-img`,parent:cardId,type:'image',x:x+436,y:y+344,w:208,h:100,label:'Library Product Image',role:'productImage',text:'Product image',...PRODUCT_IMAGE_STYLE});
 add({id:`${cardId}-title`,parent:cardId,type:'text',x:x+436,y:y+460,w:208,h:22,label:'Library Product Title',role:'productTitle',text:'Default Product',...TYPOGRAPHY.Body});
 add({id:`${cardId}-price`,parent:cardId,type:'text',x:x+436,y:y+494,w:208,h:22,label:'Library Price',role:'price',text:'$120.00',...TYPOGRAPHY.Price});
 add({id:`${cardId}-cta`,parent:cardId,type:'button',x:x+436,y:y+566,w:208,h:34,label:'Library Primary Button',role:'primaryCTA',text:'Add to Bag',...COMPONENT_STYLES['Primary Button']});
 label('ds-card-fill',`Surface ${COMPONENT_STYLES['Product Card'].bg} · border ${COLORS.Border}`,420,652,290);
 label('ds-card-metrics','Radius 12px · inset 16px · small shadow',420,680,290);
 label('ds-image-note','Image radius 10px; keep each product image.',420,708,290);
 label('ds-content-note','Titles: Body · prices: Price · details: Caption',420,736,290);
 label('ds-components-heading','04 · Controls',730,284,290,16);
 Object.entries(COMPONENT_STYLES).filter(([name])=>name!=='Product Card').forEach(([name,style],i)=>{
  const dy=328+i*112;
  add({id:`ds-component-${i}`,type:name==='Input Field'?'input':name==='Filter Chip'?'chip':'button',x:x+730,y:y+dy,w:282,h:42,label:`Component / ${name}`,text:name,...style});
  label(`ds-component-meta-${i}`,`Radius ${style.radius}px · ${style.bg}`,730,dy+50,282);
 });
 label('ds-tokens-heading','05 · Shape & spacing',1050,284,340,16);
 add({id:'ds-property-0',type:'rect',x:x+1050,y:y+328,w:330,h:60,label:'Radius / Medium · 12px',text:'Radius · 12px',bg:COLORS.Surface,radius:12,fontSize:14});
 label('ds-radius-note','Cards and filters · controls use 10px',1050,396,330);
 add({id:'ds-property-1',type:'rect',x:x+1050,y:y+456,w:330,h:64,label:'Spacing / Default · 16px',bg:COLORS.Surface,spacing:16});
 add({id:'ds-spacing-inner',parent:'ds-property-1',type:'rect',x:x+1066,y:y+472,w:298,h:32,label:'Spacing inset illustration',text:'16px inset',bg:'#e0e7ff',fontSize:12});
 label('ds-spacing-note','Card content inset · not grid/card spacing',1050,528,330);
 add({id:'ds-property-2',type:'rect',x:x+1050,y:y+588,w:330,h:60,label:'Shadow / Small',text:'Small shadow',bg:COLORS.Surface,radius:12,shadow:COMPONENT_STYLES['Product Card'].shadow,fontSize:14});
 label('ds-shadow-note',COMPONENT_STYLES['Product Card'].shadow,1050,656,330);
 frame.h=Math.ceil(Math.max(...nodes.slice(1).map(n=>n.y+n.h))-y+28);
 return nodes;
}
