import React from 'react';
import {Eye,Plus,SlidersVertical} from 'lucide-react';
export default function PageInspector(){
 return <div className="figma-page-inspector">
  <section className="page-background-section"><h3>Page</h3><div className="page-color-row"><div className="page-color-value"><span className="page-color-swatch"/>F5F5F5<span className="page-opacity">100 <span>%</span></span></div><button type="button" disabled aria-label="Page visibility"><Eye size={16}/></button></div></section>
  <section className="page-property-section"><h3>Styles</h3><button type="button" disabled aria-label="Add style"><Plus size={16}/></button></section>
  <section className="page-property-section page-export"><h3>Export</h3><button type="button" disabled aria-label="Add export"><Plus size={16}/></button></section>
  <section className="page-property-section"><h3>MCP <span className="mcp-connection-placeholder" title="Visual placeholder">1 connection</span></h3><button type="button" disabled aria-label="MCP settings"><SlidersVertical size={15}/></button></section>
 </div>;
}
