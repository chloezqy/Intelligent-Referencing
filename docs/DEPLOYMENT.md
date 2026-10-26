# Deploy Smart Reference online

For the standalone demo with real semantic AI, use **[Vercel setup](VERCEL.md)**. The configuration below is for deploying the existing realtime backend.

## Realtime: one Render Node web service

Use **one always-on paid Node web service with a persistent disk**, serving both the React build and the existing Express backend. Do not create a Static Site for this app. `render.yaml` describes this setup; applying it creates billable resources. No external service has been created by this preparation.

The realtime transport is **authenticated HTTP POST + Server-Sent Events (SSE)**, not WebSockets. References, cursors, and selection events use `/api` on the same domain as the page. No `ws://`, `wss://`, frontend API URL, external realtime service, or CORS configuration is needed. SSE already flushes headers, disables proxy buffering, sends 15-second heartbeats, and reconnects with authenticated snapshot recovery. Render supports long-lived Node connections; verify SSE through the actual public proxy after deploying.

Official guides: [Render web services](https://render.com/docs/web-services), [persistent disks](https://render.com/docs/disks), [Blueprint configuration](https://render.com/docs/blueprint-spec), [Node versions](https://render.com/docs/node-version).

## Render dashboard settings

After reviewing and committing these local changes, push the repository branch you want to deploy. This guide does not authorize or perform that push or deployment.

Choose **New → Web Service**, connect this repository, and use:

| Setting | Value |
| --- | --- |
| Name | `smart-reference` (or your preferred name) |
| Branch | The branch containing the deployment changes |
| Root directory | Leave blank; `package.json` is at the repository root |
| Runtime | Node |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Instance plan | Starter or another paid always-on plan supporting a disk |
| Instance count | **1**, with no autoscaling or process clustering |
| Health check | `/api/health` |
| Disk name | `smart-reference-rooms` |
| Disk mount path | `/var/data` |
| Disk size | 1 GB initially; monitor usage |

Create the disk **before sharing rooms with users**. Render's default filesystem is ephemeral; only writes under the mounted disk survive replacement/deployment. A disk requires a paid service, and deploying a disk-backed service can interrupt connections briefly. Clients reconnect, but saved data survives.

Environment variables:

| Variable | Value / instructions |
| --- | --- |
| `NODE_ENV` | `production` |
| `ROOM_DATA_DIR` | `/var/data/smart-reference` |
| `TRUST_PROXY_HOPS` | `1` for this managed reverse-proxy setup |
| `PORT` | **Do not set**: the host supplies it; the server binds `0.0.0.0:$PORT` |
| `PUBLIC_ORIGIN` | Leave unset for the generated Render URL: `RENDER_EXTERNAL_URL` is detected automatically. For a custom domain, set its exact HTTPS origin, e.g. `https://reference.example.com`, with no path/query |
| `NODE_VERSION` | Usually unnecessary: `.node-version` pins major 24, and package engines require Node 24.x. If set manually, use Node 24.x |

No AI keys, Supabase credentials, or privileged frontend keys are required. Do not add secret variables with a `VITE_` prefix: those would be exposed to the browser. The production TypeScript loader (`tsx`) is a runtime dependency. Build tools still require dev dependencies, hence `--include=dev` in the build command.

Alternatively choose **New → Blueprint** and select this repository's `render.yaml`. Review the paid plan/disk and confirm creation yourself. It contains the same service settings and detects the generated public URL automatically.

Once deployed, use the service's public **HTTPS URL** for both participants. Create a new room there and copy the invitation from the app. Invitations use the browser's `location.origin`, so they automatically use the public domain. If you configure `PUBLIC_ORIGIN`, everyone must use that exact domain; using a different domain will reject state-changing browser requests. Do not use the old frontend-only Vercel page or localhost invitations.

## Railway alternative

Create one Node service from the repository, using Node 24.x. Set the build command to `npm ci --include=dev && npm run build`, the start command to `npm start`, and health check to `/api/health`. Attach a persistent **volume at `/var/data`**, set `NODE_ENV=production`, `ROOM_DATA_DIR=/var/data/smart-reference`, and `TRUST_PROXY_HOPS=1`. Generate a public domain through service networking and leave the provider's `PORT` in place. `RAILWAY_PUBLIC_DOMAIN` is detected automatically; use `PUBLIC_ORIGIN=https://YOUR-CUSTOM-DOMAIN` for a custom domain. Keep exactly one replica and ensure no overlapping server processes write to the same volume.

No Railway-specific config file is required when these dashboard overrides are configured. [Railway volumes](https://docs.railway.com/volumes), [SSE deployment](https://docs.railway.com/guides/streaming-ai-responses), [network limits](https://docs.railway.com/networking/public-networking/specs-and-limits). Proxy connection limits can cause occasional SSE reconnects; these must not be treated as lost room data.

## What persists

`ROOM_DATA_DIR/rooms.json` stores room membership/token hashes, shared references and comparison snapshots, notes, replies, review/archive status, and opening/navigation receipts. Writes use a temporary file and atomic rename. The entire file belongs to one Node process; it is not a multi-instance database.

Live cursors, selection presence, rate counters, and unsent comparison-draft snapshots are in memory. They may reset on restart/redeploy. Clients reconnect and republish local selection. Saved comparisons remain unchanged; refresh an unsent comparison after a server restart. Research attempt logs and browser identity live in browser storage, not the server file. Do not clear browser storage if you need the same A/B identity.

Local rooms are **not uploaded or migrated**. Start fresh rooms on the public domain: browser identities from localhost are not available on another origin. Changing the public domain later also changes access to browser-stored identities.

Back up `rooms.json` to a private destination using the host's supported disk backup/export tools. Treat backups as research data, restrict access, and establish retention/cleanup. Do not commit the file, serve it statically, or place it under `dist`. A disk provides persistence, not a substitute for backups.

## Security and prototype limits

- HTTPS is terminated by the hosting provider. Bearer tokens remain in authorization headers; only their hashes are saved server-side. Do not log or share tokens.
- Public origin checks protect browser writes behind the proxy; malformed/cross-origin requests are rejected. Forwarded headers are trusted only when configured for the known hosting proxy. Leave `TRUST_PROXY_HOPS=0` for direct local/LAN use.
- Basic security headers, JSON/body validation, per-IP write limits, authenticated cursor limits, and an eight-stream-per-user limit reduce accidental overload. These are prototype safeguards, not comprehensive abuse protection.
- There are no accounts, expiring invitations, admin controls, token revocation UI, or access-code gate. Anyone who discovers the public site can create rooms. Someone with an unclaimed invitation can claim User B. Treat invitation links as private capabilities and share them directly with your intended tester.
- Rooms have a global capacity of 500, each with at most 200 references and 100 responses per reference; archived references still count. Rooms do not expire automatically. Monitor disk use and server logs. For an unrestricted public launch or sensitive research, add controlled participant access, retention/admin tooling, and stronger abuse controls first.
- Keep **one instance/one process**. Live presence and drafts are process-local, and the JSON store has no distributed locking. Adding replicas would split collaboration and risk data loss. Scaling later requires shared transport/storage, which this deployment does not introduce.

## Verification

Before deployment:

```sh
npm run lint
npm test
npm run verify:production
```

The production smoke test builds the app, starts the actual production entry point on an unused local port, uses isolated temporary storage, verifies HTML/assets and JSON health, exchanges a live reference and response using authenticated SSE, restarts the server, and verifies room/response recovery. It does not create a hosting service or touch your existing rooms.

After deployment, with two independent computers/browser profiles:

1. Open the public URL and `/api/health`. The page loads; health returns HTTP 200 JSON with `backend: express-sse`.
2. A creates a room; confirm its invitation starts with the public HTTPS domain. B joins using that link.
3. Verify both identities online, live cursors and selections, and independent viewports. In browser Network, `/api/rooms/.../events` must be HTTP 200 `text/event-stream`, not HTML/404.
4. Share a reference/Compare; B receives it without refreshing, opens/locates targets, and replies. A receives the reply.
5. Refresh both clients; identities, reference, and reply recover. Archive/restore synchronizes.
6. Restart/redeploy the hosted service; reconnect, then verify saved references/replies recover from the disk. Recreate any unsent comparison draft.
7. Check the five task levels, especially Level 4/5's recipient open/locate/response evidence.

If creation fails with a text/HTML 404, you are using a static/frontend-only host. If writes return an origin error, open the exact `PUBLIC_ORIGIN` domain and check its HTTPS value. If all users hit rate limits together, check the proxy-hop setting. If rooms vanish after redeploy, verify the disk and `ROOM_DATA_DIR` mount path.

## Local development is unchanged

`npm run dev` starts Vite plus Express on `http://localhost:3000`, storing data in `.data/rooms.json`. No production environment variables are needed. Keep hosting-only settings in the dashboard, not your local `.env`. For local production preview, run `npm run build` followed by `npm start`.
