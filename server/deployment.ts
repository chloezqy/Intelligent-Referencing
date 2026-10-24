export interface DeploymentOptions {publicOrigin?:string;trustProxyHops:number}
export function deploymentOptions(env:NodeJS.ProcessEnv=process.env):DeploymentOptions{
 const hops=Number(env.TRUST_PROXY_HOPS||0);
 if(!Number.isInteger(hops)||hops<0||hops>5)throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
 const configured=env.PUBLIC_ORIGIN||env.RENDER_EXTERNAL_URL||(env.RAILWAY_PUBLIC_DOMAIN?`https://${env.RAILWAY_PUBLIC_DOMAIN}`:'');
 let publicOrigin:string|undefined;
 if(configured){const url=new URL(configured);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('PUBLIC_ORIGIN must be an HTTP(S) origin without a path, credentials, query, or fragment.');if(env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('Production PUBLIC_ORIGIN must use HTTPS.');publicOrigin=url.origin;}
 return {trustProxyHops:hops,publicOrigin};
}
