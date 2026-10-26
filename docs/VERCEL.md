# Vercel: standalone demo with real semantic AI

Vercel serves the Vite frontend from `dist/` and runs `api/semantic/interpret.ts` as a Node function at **POST /api/semantic/interpret** on the same domain. It calls the existing OpenAI Responses integration in `server/semantic.ts`; it does not start `server/index.ts`, bind a port, initialize the room store, or connect to your computer.

The default collaboration mode is the manual, simulated A/B demo. Use `https://YOUR-DOMAIN/?mode=demo`. References, notifications, perspectives and viewports remain in that browser's local storage, separate from real participant evidence. There is no shared room database or persistent disk on Vercel.

## Dashboard setup

Import this repository using its repository root as **Root Directory**. Review and deploy only when ready; no service or deployment was created by this change.

| Setting | Value |
| --- | --- |
| Framework Preset | Vite (not Express) |
| Node.js version | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Start Command | None; Vercel invokes the function |
| Function duration | 30 seconds, configured in `vercel.json`; OpenAI timeout remains 15 seconds |

Do not configure a proxy/rewrite to localhost or an external Node service. The API file is discovered separately from the Vite assets. No SPA catch-all rewrite is needed: current application navigation uses the root URL and query parameters. Do not replace API responses with `index.html`.

In **Settings → Environment Variables**, configure:

| Variable | Value | Environment |
| --- | --- | --- |
| `OPENAI_API_KEY` | Your private OpenAI project key | Production; Preview only if you want paid AI on previews |
| `AI_ENABLED` | `true` to allow the existing explicit AI suggestions button; `false` to disable | Production; Preview separately |
| `OPENAI_MODEL` | `gpt-4.1-mini` (existing default; optional) | Same as the key |
| `PUBLIC_ORIGIN` | `https://YOUR-PUBLIC-DOMAIN`, no path or trailing slash | Optional for a custom domain; configure per environment if different |

Vercel supplies `VERCEL=1`, `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` automatically when system environment variables are exposed. Leave **Automatically expose System Environment Variables** enabled. The function accepts browser origins matching the current deployment URL, production URL, or `PUBLIC_ORIGIN`. Vercel domain aliases not covered by those URLs require `PUBLIC_ORIGIN`.

No `VITE_OPENAI_API_KEY`, frontend API URL, CORS settings, `PORT`, `ROOM_DATA_DIR`, or `TRUST_PROXY_HOPS` is required. Never put keys in variables prefixed `VITE_`: Vite embeds those in browser code. Redeploy after changing environment variables.

## Access and usage controls

Before enabling AI, configure **Settings → Deployment Protection → Vercel Authentication** for every environment/domain with an enabled key, including the production domain. Confirm the chosen protection level actually covers your URL; protecting previews alone does not protect a public production alias. If your plan does not support protecting that domain, keep `AI_ENABLED=false` there and use a protected deployment for this research demo.

The application intentionally has no account system. The function's origin check blocks other websites' browser calls, **not scripts that forge Origin**. Deployment Protection is the access control; keeping the key private alone does not prevent strangers from invoking an unprotected paid endpoint. The application cannot verify your dashboard protection settings.

Existing cache, duplicate coalescing, six uncached requests/minute per client, two simultaneous calls and twenty attempts/hour are retained **per warm function instance**. Cold starts and horizontal scaling reset or split those limits. They are not a durable global budget. A cache miss after a cold start is expected. Keep the protected demo audience small; public unrestricted use needs durable rate/budget enforcement. Setting `AI_ENABLED=false` and redeploying disables new calls in that deployment.

## Verify after deploying

No live model call or Vercel deployment was performed during implementation. All automated OpenAI responses are mocks.

1. Open the public Vercel URL with `?mode=demo`, sign in through protection, and open browser DevTools → Network. No local Node server is needed.
2. Without incurring a model call: send an empty JSON POST in the browser console:
   ```js
   const r = await fetch('/api/semantic/interpret', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: '{}'
   });
   console.log(r.status, await r.json());
   ```
   Expect **400** for invalid selection when configured/enabled, or **503** if disabled/missing key. Both prove the deployed function answered JSON. HTML/404 means function routing/build configuration is wrong. A protection redirect means sign in first. **403** means check the allowed origin/system variables.
3. After approving one paid test, select the **Nordic Lounge Chair** title and open **Adjust interpretation → AI suggestions** once. This is the only AI trigger. Normal clicking, gestures, sharing and comparison do not automatically call a model.
4. Verify the Network request URL is `https://YOUR-DOMAIN/api/semantic/interpret`, not localhost. A 200 JSON response should contain `model`, a real `responseId` beginning `resp_`, `cached:false` and validated candidates. Cross-check the request in OpenAI project usage/logs and the function invocation in Vercel Observability. Browser requests must contain no OpenAI authorization key.
5. AI options appear in the existing interpretation controls with **semantic · AI** labels. They do not replace the selection until chosen. A valid response can contain no suggestions.
6. Replay that exact successful request in Network once: a warm instance should return `cached:true` and the same response ID. A different/cold instance can make a new paid call; serverless caching does not guarantee a free repeat. Do not replay if another paid call is not approved. The UI also suppresses repeats for the current loaded selection.
7. Set `AI_ENABLED=false`, redeploy, and verify the AI action returns a graceful disabled message while deterministic alternatives and demo handoff still work.

## Local development and realtime

`npm run dev` remains the existing Node + Vite application, including local realtime rooms and the loopback-only AI route. Its private `.env` still works. `npm run dev:standalone` alone has no AI backend. Vercel does not deploy the long-lived realtime room server; `?mode=realtime` and old room links need that existing server elsewhere. No transport, stored reference format, selection UI or model prompt was changed.

## Verification performed locally

`npm run lint`, `npm test`, `npm run build`, and `npm run verify:vercel`.

The Vercel adapter tests exercise the existing frontend provider against a production-mode HTTP function with non-loopback forwarded client addresses and deployed-style origins. They verify structured candidates, response IDs, cache hits, no browser key, validation, disabled AI, errors/timeouts, origin checks and JSON boundaries. The bundle smoke test builds the real function entry and serves it with the static frontend while AI is forced off; it does not start the collaboration server. These checks validate the deployment path locally, not Vercel's remote infrastructure or a live OpenAI call.

Official references: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [function duration](https://vercel.com/docs/functions/configuring-functions/duration), [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [OpenAI server-side authentication](https://developers.openai.com/api/reference/overview).
