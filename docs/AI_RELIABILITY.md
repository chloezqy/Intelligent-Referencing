# AI reliability for research testing

All six task types use POST /api/semantic/interpret and the same server-side Responses transport. Explicit suggestion actions initiate requests directly: Find library styles/tokens, Adjust interpretation, and design-reference AI suggestions need no second AI button. Identical requests reuse the shared cache. Ordinary selection, switching panels, and opening a review do not call the model. Completing a rough gesture or changing its interpretation scope automatically requests AI; cached identical contexts are reused and failures require an explicit retry. Failed requests offer Retry AI. Rule-based interpretation and deterministic editing/matching remain available.

## Recovery and usage controls

- Up to three total attempts for provider 429 rate limits and temporary 5xx errors, exponential backoff with jitter, honoring Retry-After (seconds or HTTP date).
- Quota/billing failures and invalid keys are never automatically retried. Timeouts/network failures are not automatically retried because the provider may already have processed the request. Users can retry explicitly.
- The entire server request has a 25-second budget including an up-to-8-second queue wait, leaving headroom under Vercel's existing 30-second function duration. Each upstream attempt has at most fifteen seconds, bounded by the remaining total budget. Browser timeout: 28 seconds.
- Four distinct jobs run concurrently per warm process; up to twenty wait. Concurrent identical requests share one job. Cached successes avoid spending a session allowance.
- Each browser tab uses a random session ID in X-Smart-Reference-Session, stored in sessionStorage. Limits: 20 uncached logical requests/minute and 120/hour per session. A generous network backstop of 240/minute reduces abuse without treating an entire testing room as one six-request client.
- Server successes cache for ten minutes, maximum 100 entries. The shared browser transport caches successful model responses for ten minutes and coalesces repeated clicks. Context IDs are excluded from cache identity; actual inputs/selection/design properties remain included. Failures are not permanently cached. Retry-After cooldowns prevent immediate repeated clicks.
- These controls and queues are local to each warm Vercel instance, not a durable global quota, authentication system, or spending ceiling. Use Vercel Deployment Protection and OpenAI project budgets/limits. Horizontal scaling/cold starts can repeat requests on different instances.

## Safe diagnostics

Frontend error codes distinguish insufficient_quota, invalid_api_key, rate_limit, timeout, upstream_error, invalid_response, configuration_error, session_limit, and server_busy. Responses include a safe correlation requestId, retryable flag and, when appropriate, retryAfter. Provider messages, account details, keys, notes, and raw payloads are never included in error responses or logs.

Function logs emit semantic_ai_failure with correlation ID, bounded task name, safe code, HTTP/upstream status, and elapsed time. For configuration_error check server settings/model access; for insufficient_quota check the OpenAI project billing/credits/spend limits; for rate_limit inspect project rate limits and stagger sessions if needed. No error is described as quota exhaustion unless the provider identifies a billing/quota failure.

## Deployment checklist (manual account access required)

1. Set server-only OPENAI_API_KEY, AI_ENABLED=true, and OPENAI_MODEL=gpt-4.1-mini (or the intended Responses + structured-output compatible model with access in the key's project). Never use a VITE_ key variable.
2. Keep PUBLIC_ORIGIN aligned with the deployed origin. Existing Vercel same-origin checks and Deployment Protection remain required; preview and production environments have separate settings.
3. Redeploy after environment changes. The endpoint remains /api/semantic/interpret; the provider endpoint is https://api.openai.com/v1/responses.
4. Confirm project credits/billing, budgets, model permissions and request/token limits in OpenAI. More retries cannot repair insufficient_quota or invalid_api_key.
5. Open Vercel function logs and correlate requestId after a failed explicit AI action. Successful results still contain actual model provenance and validated real-object suggestions.
6. Run npm run lint, npm test, npm run build, npm run verify:vercel, and npm run verify:production locally before rollout. Tests mock upstream responses and do not prove a live deployment's secrets/billing/access are configured.

No live paid calls or Vercel environment changes were made as part of this reliability audit.
