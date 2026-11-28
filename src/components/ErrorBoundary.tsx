import React from 'react';
import {resetPrototypeStorage} from '../study';

type State={error:Error|null};

/** Shows a recovery screen instead of a blank page when part of the app crashes while rendering. */
export default class ErrorBoundary extends React.Component<{children:React.ReactNode},State>{
 // The project has no @types/react, so declare the fields this class reads.
 declare props:Readonly<{children:React.ReactNode}>;
 state:State={error:null};
 static getDerivedStateFromError(error:Error):State{return {error};}
 componentDidCatch(error:Error,info:React.ErrorInfo){console.error('Smart Reference crashed:',error,info.componentStack);}
 private resetDemo=()=>{try{resetPrototypeStorage(localStorage);}catch{}location.reload();};
 render(){
  const {error}=this.state;
  if(!error)return this.props.children;
  return <main className="error-screen" role="alert">
   <div className="error-screen-card">
    <h1>Something went wrong</h1>
    <p>Part of the prototype stopped working. Reloading usually fixes it. If it keeps happening, reset the demo data: this clears shared references and edits stored in this browser, and keeps study records.</p>
    <details><summary>Error details</summary><pre>{error.name}: {error.message}</pre></details>
    <div className="error-screen-actions">
     <button type="button" className="primary-action" onClick={()=>location.reload()}>Reload</button>
     <button type="button" className="secondary-action" onClick={this.resetDemo}>Reset demo data</button>
    </div>
   </div>
  </main>;
 }
}
