import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

/** NASA_API_KEY exists ONLY in the local Vite Node server. Never use VITE_NASA_API_KEY:
 * Vite publishes all VITE_* environment values into client-side JavaScript.
 * The /nasa-api proxy also avoids browser-side CORS problems during local demos.
 * Deployed static builds use public DEMO_KEY with NASA's restrictive rate limit.
 */
export default defineConfig(({mode})=>{
  const config=loadEnv(mode,process.cwd(),'');
  const nasaApiKey=config.NASA_API_KEY?.trim()||'DEMO_KEY';
  return {plugins:[react()],
    server:{proxy:{'/nasa-api':{
      target:'https://api.nasa.gov',changeOrigin:true,secure:true,
      rewrite:(path:string)=>{
        const url=new URL(path.replace(/^\/nasa-api/,'') ,'https://api.nasa.gov');
        url.searchParams.set('api_key',nasaApiKey);
        return url.pathname+url.search;
      },
    }}},
  };
});
