# Smart Reference

**HCI research prototype exploring AI smart referencing.**

**Team:** [Chloe Zhu](https://www.linkedin.com/in/chloezhuqy/), [Hilary Chan](https://www.linkedin.com/in/hiu-lam-hilary-chan-2b9369205), [Jenny Lee](https://www.linkedin.com/in/yunjeongjennylee/)

Smart Reference explores how designers can point to objects, clarify what they mean, and act on that reference. It combines rough gestures, AI selection interpretations, selective style matching, and object-linked design conversations in a Figma-style workspace.

## Current prototype

The canvas contains six editable mobile shopping mockups and a separate **Studio Blue** design-system board. The screens use a warm editorial style; the library uses blue accents and different typography, surfaces, corners, and spacing. This makes style changes easy to inspect during a demo.

- **Select or gesture:** click layers, select groups, or draw with Smart Gesture. In Adjust interpretation, choose where to find matches (Drawn area, This screen or All screens) and review AI suggestions before confirming.
- **Take action:** the right sidebar puts AI Actions below the selection preview. Match library styles, pick a source layer, choose property categories, inspect changes, and Apply or Copy.
- **Ask for a change:** submit a command such as “Make the buttons pill-shaped.” Validated edits apply to the selected targets and support Undo.
- **Compare:** select two layers, compare recorded properties, and resolve specific differences while keeping intentional layout differences.
- **Reference and discuss:** References → Active includes the current selection and saved open requests. Share through the canvas context menu, switch A/B perspectives, reply, or mark a request reviewed.

This is a working interaction prototype. The shopping screens are design objects, not a checkout application. Applied edits stay in the current browser; collaboration shares references and conversations rather than co-editing the document. Library matching copies style values rather than creating live component bindings.

## Run locally

Use **Node.js 24.x**.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open [localhost:3000](http://localhost:3000). This runs both the frontend and backend. The default demo uses manually controlled User A and User B in one browser.

AI requires server-side configuration in `.env`:

```dotenv
AI_ENABLED=true
OPENAI_API_KEY=your-private-key
OPENAI_MODEL=gpt-4.1-mini
```

Restart the server after changing configuration. Keep the key server-side; never prefix it with `VITE_`. Enabled AI requests use the configured OpenAI project and may incur charges. Manual selection, library/source matching, property editing, and local reference sharing work without AI. Smart Gesture can fall back to manually confirming touched objects when AI is unavailable.

`npm run dev:standalone` serves the frontend only. It has no AI or real-time room backend; AI requests there return 404. If the app shows a missing AI endpoint, stop the standalone server and run `npm run dev`, then open `http://localhost:3000`.

## A short demo

1. Use **Smart Gesture (G)** across two Home examples. Change scope, inspect the proposed groups, and confirm the intended selection.
2. Select the four Home card roots. Choose **Match library**, select the categories, review before/after values, toggle the eye for a canvas preview, and Apply. Undo to show the original warm styling.
3. Choose **Pick source** and a compatible card from Search. Copy only Corners to show selective matching across different layouts.
4. Select a card and ask **“Make the buttons pill-shaped.”** Inspect the result and Undo.
5. Share a reference from the canvas menu. Switch to User B using the right-sidebar profile control, open the saved request in References, and reply or mark it reviewed.

For a clean run, use **References → Reset demo**. This restores the authored screens and clears local demo references and edits while retaining research records. Existing local edits can otherwise mask changes to the sample dataset after an update.

See the [demo guide](docs/DEMO.md) for suggested examples and the expected visual changes.

## Controls

| Action | Control |
| --- | --- |
| Select / add to selection | V, click / Shift-click |
| Reach nested layers | Double-click, Cmd/Ctrl-click, or expand Layers |
| Select child / parent layers | Enter / Shift-Enter |
| Smart Gesture | G; Shift adds another region |
| Pan | H, Space-drag, or middle drag |
| Zoom / fit | Cmd/Ctrl-scroll / right-sidebar zoom control |
| Undo / redo | Cmd/Ctrl-Z / Cmd/Ctrl-Shift-Z |
| Clear selection | Escape |

## Collaboration and deployment

- **Demo:** default mode (`?mode=demo`). One person switches between A/B; data is stored in that browser.
- **Real-time:** `?mode=realtime` on the Node server. Create a room in References and open its invitation in another browser/profile. HTTP commands and SSE synchronize references, replies, presence, and review status.
- **Vercel:** frontend plus the serverless AI endpoint; supports the local A/B demo. See [Vercel setup](docs/VERCEL.md).
- **Persistent Node hosting:** supports real-time rooms and durable room storage. See [deployment](docs/DEPLOYMENT.md).

## Development

```sh
npm run lint                 # TypeScript
npm test                     # Unit and integration tests; AI responses are mocked
npm run build                # Production frontend
npm run verify:vercel        # Serverless adapter smoke test
npm run verify:production    # Full Node deployment smoke test
```

The app uses React, TypeScript, Vite, Tailwind/CSS, Lucide icons, Express, and server-side OpenAI Responses. The mock document lives in `src/data.ts`; authoritative style sources live in `src/designSystem.ts`.

## Documentation

- [Documentation index](docs/README.md) — current guides, retained research material, and cleanup decisions.
- [Technical guide](docs/TECHNICAL.md) — architecture, AI triggers, editing contracts, and persistence.
- [AI reliability](docs/AI_RELIABILITY.md) — limits, caching, errors, and deployment checks.
- [Research protocol](docs/research/USER_STUDY_PROTOCOL.md) — retained facilitator material; its guided-study launcher is not exposed in the current simplified UI.

Automated tests verify behavior and validation, not AI recommendation quality or research outcomes. Historical live-call evidence is kept separately in the documentation index.
