> Current workflow: **gesture → live AI interpretations → explicit reference confirmation → editing actions → preview/apply → undo/redo**. See [Intelligent editing](docs/INTELLIGENT_EDITING.md) for the current architecture, five research tasks, and verification. Earlier sections below describe the retained collaboration infrastructure and its history.

# Smart Reference

**Point to the design. Explain why it matters. Bring someone else into the conversation.**

Smart Reference is a research prototype for discussing designs together. Instead of describing a button’s location in a message, you can select the button—or gesture across several related items—and send someone a reference that highlights exactly what you mean.

The prototype uses six example mobile shopping screens: Home, Search, Product Detail, Favorites, Cart and Checkout. They are sample designs to explore and discuss, not a working shopping app.

## What you can try

- Select individual items or several items together.
- Draw a rough gesture across items and review the suggested selection.
- Expand a selection to related items on one screen or across the design.
- Share selected items with another person, together with a purpose and a note.
- Open a received reference, find its targets, and reply or mark it reviewed.
- Work through five research tasks that progress from selection to collaboration.

**Standalone demo is the default:** Switch between User A and User B locally; both perspectives are manually controlled in one browser. Real collaboration remains available in References → Workspace mode, or with `?mode=realtime`; existing room links also open real-time mode. In that mode two actual people receive references and replies live. **Interpretation works immediately using rules.** Optional OpenAI semantic suggestions are now integrated but disabled until a server key is configured and a paid live test is approved.

## Find your way around

| Area | What it does |
| --- | --- |
| Top bar | Access the shared room, zoom controls, Fit view and Help. |
| Left icon rail | Open Layers, References or Tasks. Each panel opens beside the icons. |
| Layers | Browse the items that make up the sample screens. |
| Refine Selection | Inspect selected elements and change scope from the canvas action button. |
| References | Create or join a room, share references, and read or reply to requests. |
| Tasks | Choose a research level, read instructions and check progress. |
| Center canvas | Explore the six mobile screens. Pan and zoom to inspect their contents. |
| Bottom controls | Use the tool dropdown for Select, Rough Gesture, or Hand. Share and add notes through the contextual menu or inspector. |

The bottom input helps you describe why your collaborator should look at the selected items. It is not a general-purpose AI chat or a design-editing command box.

## Start with selection

1. Choose **Select** to click an item. Hold **Shift** while clicking to add or remove items from your selection.
2. Choose **Rough Gesture (G)** and draw across related items, such as two category chips on Home. Hold Shift while dragging for a precise rectangular selection.
3. Inspect the suggested interpretation. Use **Touched**, **Screen** or **All Screens** to adjust how broadly the reference applies. You can also use Select and Shift-click to correct individual targets.
4. Use **Share to User A/B** when you are ready to discuss the selection with someone.

Use **Hand** or hold **Space** while dragging to move around the canvas. Use the zoom controls to look closer, and **Fit view** to find all six screens again. Help contains the keyboard shortcuts.

Select can move elements locally; rough referencing uses its dedicated tool. Movement resets on refresh and is not synchronized. Resize, recolor and text editing are not implemented.

## Try it with another person

### User A: create and send

1. Open **References** or the room control in the top bar and choose **Real-time collaboration** in Workspace mode.
2. Choose **Create room as User A**.
3. Copy the invitation link and send it to the other person.
4. Select or gesture across the objects you want to discuss, then choose **Share to User A/B**.
5. Choose a purpose: **Review**, **Compare**, **Help** or **Look at this**.
6. Add a note explaining what needs attention, then choose **Send to User B**.

For example: “Compare the first product buttons on Home and Search. Should they use the same wording?”

### User B: open and respond

1. Open the invitation in a separate browser or browser profile and choose **Join as User B**.
2. Open the incoming reference in **References** to see its purpose, note and highlighted objects.
3. Choose **Locate referenced elements**, or locate each screen separately, to bring the objects into view.
4. Write a response or choose **Mark reviewed** to acknowledge the request.

Each person keeps their own view of the canvas. Receiving or opening a reference does not move your view; you decide when to locate it. Reference pins let you return to the discussion later.

Each room has two participant slots. Use the original browser or profile when returning to the room so it can recover your identity.

## The five research levels

Open **Tasks** and choose **Start task** before attempting a level.

| Level | Your task | What counts as completion |
| --- | --- | --- |
| **1 · Product Price Selection** | Select all 15 individual product prices across the screens. Exclude old prices and cart or checkout totals. | All intended prices are selected, with no missing or extra items. |
| **2 · Primary CTA Selection** | Select all 15 main action buttons, including checkout, order and Move All to Bag buttons. | All intended buttons are selected, with no missing or extra items. |
| **3 · Rough Gesture Interpretation** | Gesture across two Home category chips, correct the interpretation and finish with the four Home chips selected. | A successful gesture interpretation, a correction, the exact final selection and **Confirm reviewed selection**. |
| **4 · Shared Review Request** | As A, reference at least two related objects and send B a Review request with a note about design consistency. | B opens that reference, locates every target, and replies or marks it reviewed. |
| **5 · Collaborative Design Comparison** | As A, select the first product button on Home and the first on Search. Send B a Compare request with a context note. | The reference contains exactly those two buttons; B opens it, locates both and replies or marks it reviewed. |

For Levels 4–5, demo mode uses manually controlled A/B perspectives and labels completion as a demo scenario. Its research records are separate from real participant records. In real-time mode, A manages the task and B participates through References. Create a room before starting these levels. Offline real participants are never silently replaced by simulation.

You can switch levels without resetting them. **Next Task** appears after completion. **Reset task** starts a fresh attempt, so previous shared references cannot complete it. **Locate task area** only changes your view—it does not select anything or complete a task.

Completion checks recorded actions and selected objects. It does not judge the quality of a review, whether a note explains an inconsistency well, or whether someone understood the design.

## What is saved?

- **Shared room:** references, notes, replies, review status and recorded opening/navigation actions are saved by the running server.
- **Your browser:** your room identity, research attempts, progress and local interaction log are saved in browser storage. Clearing that storage loses those local records and can prevent you from rejoining as the same participant.
- **Research export:** choose **Export research events** in Tasks to download a record of attempts, selection methods, gestures, corrections and collaboration actions.

Refreshing normally restores your identity, task history and shared references. Keeping server records after a restart requires retaining the server’s data folder. Task logs remain local to each participant’s browser.

## Standalone demo

The default workspace needs no collaboration backend. Use the top-bar **User A / User B** switcher to demonstrate both sides manually:

1. As A, select or gesture and share a reference. Optionally check Invite to view now.
2. Switch to B. The incoming nudge offers **View reference** or **Later**. Only View navigates; switching never moves B to A’s targets automatically.
3. Open the existing conversation, reply and mark reviewed. Switch back to A to see the result.

Each perspective retains its own camera and selection. References, nudge dismissal and cameras recover on refresh. No replies, review events or collaborator cursors are generated automatically. For cross-user Compare, manually select targets in both perspectives first. This remains simulated collaboration in one browser, not real participant research evidence; AI interpretation is optional and disabled by default.

Use **References → Reset demo** to clear demo references and demo research history. Real rooms and their research records remain untouched. Demo state stays in this browser and origin; it is not shared across devices or tabs and is not evidence from another participant.

To run without the Node collaboration server:

```sh
npm run dev:standalone
# Or serve the production build:
npm run build
npm run preview:standalone
```

Both commands use port **3000** by default; stop other servers using that port first. A static host can serve `dist/` directly. Real-time mode on a static-only host will need the existing Node server; it does not silently fall back to simulation.

## Open the prototype locally

If someone has already started the prototype on your computer, open [localhost:3000](http://localhost:3000). Keep the server running while using it.

For first-time setup, install Node.js 22 or 24, open a terminal in this project’s folder, and run:

```bash
npm ci
npm run dev
```

For a built preview, run `npm run build` followed by `npm run preview`; this also starts the room server. Publishing only the frontend files does not enable collaboration.

Then open [localhost:3000](http://localhost:3000). If the terminal reports a different configured port, use that address instead. A “connection refused” message usually means the server is not running or the browser is using the wrong address.

**For two computers:** both people must connect to the same running server. A `localhost` link only works on the computer running it. Ask the person hosting the prototype for its network address and create the invitation from that address. Using it over different networks requires hosting the app online; an invitation alone does not make it publicly available.

## Current boundaries

This is an early research prototype, not a complete design editor or a Figma plugin. It supports shared referencing rather than simultaneous design editing. There are no user accounts or account recovery, live collaborator cursors, or model-generated design reviews.

The five task flows have been tested, including live collaboration between two independent browser sessions on one computer. Testing on two physical computers or a public deployment has not yet been verified.

For developers helping you run or extend the prototype, see the [technical setup and implementation notes](docs/TECHNICAL.md).

## Compare and discuss objects

Use **Compare with User A/B** to compare both users’ frozen selections. Or choose **Share to User A/B** and select the Compare intended action to compare objects within your own selection. The existing property table remains deterministic. No reference is sent until you press Send or Share comparison.

The comparison lists the sample objects’ actual text, dimensions, colors, corner radius, available typography and screen positions. Differences appear first; expand **Matching properties** to see what is the same. **Not specified** means that the sample data does not contain that property. This is a rule-based property comparison, not an AI opinion or a command to change the design.

After sharing, both people see pins attached to the referenced objects. Pins move with the design when you pan or zoom. Nearby pins combine into a count to keep the canvas clear: click the count to open its conversation, or choose a conversation if several overlap. All pins belonging to a reference open the same discussion. A check mark indicates reviewed status. Opening a pin highlights its targets without moving your view; **Locate referenced elements** moves your view when you choose.

These interactions adapt the object pins, contextual actions and comparison presentation from [Prototype 3](https://github.com/Rok1006/AI_Widget_Referencing/tree/main/src/prototypes/03-cross-application). The new React implementation uses Smart Reference’s real rooms and saved object IDs. Demo mode supports manual A/B perspectives; it does not import the old prototype’s scripted collaborator, automatic style matching or editing tools. Public backend deployment is still separate work.

## Keep references tidy

Click a single reference pin to open its pin-attached conversation. If a pin represents several overlapping references, it opens a small list with short labels, reference numbers, times and statuses. Full messages and replies appear only after you choose a reference, inside that same conversation popup.

To clear an old test reference from the canvas, open it and choose **Remove pin**. It disappears from both users’ pins and active lists immediately. Find it under **Archived** and choose **Restore pin** to bring it back. Either participant can archive or restore. Archiving preserves the original targets, notes, replies and task history; it does not count as a review. Archived conversations are read-only until restored.


### Share beneath the pin

The share action names the recipient: **Share to User A** or **Share to User B**. Its compact popup contains the intended action, note and Send button. It opens beneath the object’s temporary pin when space allows, otherwise moves above it to stay inside the canvas. Closing the popup keeps the unsent request; click its **+** pin to reopen it, or choose **Resume share popup** in References. **Cancel draft** discards it. Saved references remain listed in References; full conversations open beside their pins.

### Bring another user to your selection

Choose **Share to User A/B** and optionally check **Invite User A/B to view now**. Leave it unchecked for asynchronous sharing, even if the other user is online. The invitation belongs to the same reference. You can later open that conversation and choose **Invite User A/B to view** without creating another reference or losing replies. Each invitation has a separate viewed receipt. The recipient chooses **View** before their canvas moves, or **Later** to dismiss the notification for this page visit. Old Look at this invitations remain readable.

### Collaborator cursors

When both users are connected to the same room, each sees the other’s cursor over the canvas: purple for User A and teal for User B. Cursors track design coordinates, so each person can pan and zoom independently. They disappear when the pointer leaves the canvas, the tab loses focus, the participant disconnects, or updates become stale. Cursor positions are temporary presence data and are not saved in the room history.

### Compare what both users are selecting

Each participant sees the other’s current selection with a dashed outline and user label. These are live selections, separate from saved reference pins. Both users need to be online and have selected objects before **Compare with User A/B’s selection** becomes available.

Choose Compare to freeze both selections in the pin popup. **Context suggestions · rule-based** describes their relationship and offers possible purposes, such as visual or wording consistency for primary buttons. Choose a purpose or write your own, add a note, and press **Share comparison**. This uses metadata rules, not a real AI model.

The property table labels objects by the user who selected them; objects selected by both carry both labels. Changes to live selections never alter the draft or conversation. **Refresh comparison** explicitly captures the latest selections while retaining your purpose and note. Draft snapshots expire after one hour or a server restart; refresh the comparison if prompted. Saved comparisons and replies survive refresh and server restarts. The other user can open the reference, locate both sets of targets, and reply or mark it reviewed.

Manual Compare references within your own selection still work. All five research levels retain their existing completion checks. No design edits or viewports are synchronized.

### One selection tool

**Select (V or S)** selects and moves objects; Shift-click toggles objects and empty-canvas drag / Shift-drag provides box selection. **Rough Gesture (G)** draws over any object without moving it. Small movements within 6px remain clicks. **Hand (H)**, Space-drag and middle-button drag pan the canvas.

## Hosting online

Deployment preparation is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The recommended setup is one Render Node web service serving the frontend and existing Express/SSE backend together, with a persistent disk and a single instance. `render.yaml` provides the configuration. No public service has been deployed by these repository changes.

Use `npm run verify:production` to check the production build, realtime sharing, and persistent restart recovery locally before deploying.

### Progressive rough gesture interpretation

A gesture shows one compact popup naming the best inferred selection. The default is usable immediately; there is no extra confirmation step. **Adjust interpretation** opens scopes and a collapsed list of alternative interpretations inside the same popup. Share and Compare stay connected to that selection. Ordinary clicks keep the lightweight action pills, with selected elements and scope controls under **Refine Selection**.

Interpretations are labeled **geometric** (directly touched targets), **structural** (hierarchy/components), or **semantic** (functional relationships), and currently all are **rule-based**. These labels do not mean an AI model was called. Level 3 retains its explicit reviewed-selection step as research instrumentation, not a normal interaction requirement.


### Mentioning a room participant

In the Share popup's **Note** field, type `@` to search the participants who have joined the room. Choose a result with the mouse or use Up/Down and Enter; Escape dismisses the suggestions without closing the draft. You can mention both participants in one note. Initials and online/offline status reflect the actual room members.

References are always visible to the room. Without mentions, sharing adds the reference to the room list. Mentioning `@User A` or `@User B` adds a targeted in-app notification for that participant when you press Send; mentioning yourself does not notify you. Opening a mention notification opens the existing conversation without moving the viewport. **Invite to view now** remains a separate optional invitation with explicit navigation acceptance.

This prototype still supports only User A and User B. Mentions do not create accounts, invite arbitrary people, change access permissions, or alter the existing other-participant review assignment. Offline participants can receive the saved notification when they reconnect. Existing references retain their prior notification behavior.


### Comparison inspector

Compare drafts and saved Compare conversations open in the right-side inspector. Purpose, property differences, note and mentions stay together; the Share button stays visible in its footer. Close preserves an unsent draft—open References and choose Resume to continue. Selecting another object or starting a new selection gesture cancels that draft entirely, removing its temporary pin and Resume action. Ordinary Review/Help/Look at this requests still use compact pin popups. Refine Selection and Adjust interpretation retain selection scope controls; the redundant Selection navigation icon is removed.

The inspector can be resized from its left edge, including with arrow keys when the divider is focused. On narrow windows it overlays the right edge. Opening or resizing it does not pan or zoom; Locate remains explicit.


Reviewed references keep their conversations in References but no longer show canvas pins. The recipient’s Mark reviewed control sits below Send response. Reference navigation is available through the incoming View reference nudge; the conversation omits redundant locate, invite and remove-pin controls.


## Optional semantic AI interpretation

After a completed rough gesture, Compare and Share remain visible and Adjust interpretation expands immediately with Touched / Screen / All screens. The completed gesture requests AI interpretation once; repeated contexts reuse the existing cache. Candidate hover/focus and activation preview the exact objects without confirming or publishing a new selection. Press **Select objects** to confirm and open the right-side Edit inspector; editing remains in that inspector, never a floating toolbar. The interpretation surface contains AI candidates only, with a manual touched-object fallback on AI failure or empty results. Design-system review remains under the inspector’s Suggested actions. Ordinary clicks do not request AI. Opening Adjust interpretation explicitly starts AI analysis for the current selection, using the same cached request, loading, preview and confirmation flow as rough gestures. Suggestions never apply edits automatically.

### Local configuration — no live calls until approved

1. Add `OPENAI_API_KEY` to your private `.env` (already ignored by Git). Never use a `VITE_` prefix or put the key in frontend code.
2. Keep `AI_ENABLED=false` until you have approved a paid live test. The key alone does not enable calls.
3. After approval, set `AI_ENABLED=true`; optionally change `OPENAI_MODEL` (default `gpt-4.1-mini`). Restart with `npm run dev` and open `http://localhost:3000/?mode=demo` (or realtime mode). The same endpoint serves either mode without requiring a room.
4. Static-only `dev:standalone` / `preview:standalone`, including port 3001, cannot call a private AI endpoint. Referencing still works there; the AI button reports the unavailable endpoint.

The local Node endpoint rejects production and non-loopback traffic. For a hosted standalone demo, **[Vercel setup](docs/VERCEL.md)** serves the same AI logic through a same-domain serverless function without your local server. Configure server-side environment variables and protect the enabled deployment before using it.

### What goes to the model

The browser sends IDs, scope and context ID; the provider interface also supports optional intent. The server resolves the authoritative sample dataset, sending at most **24 selected objects and 64 candidate objects**, with labels, roles, visible text, parent/group hierarchy, screen and authored visual properties. Candidate retrieval is metadata-ranked with some cross-screen diversity, not an exhaustive semantic search. No screenshots, conversation notes, room identities, tokens or credentials are sent as model input. The API key appears only in the server-to-OpenAI authorization header. The request uses the Responses API with a strict JSON schema and `store:false`.

Every suggested/evidence ID is validated against the supplied candidate/selected IDs. Invalid, refused or incomplete responses do not become options. Missing key, errors and timeouts leave rule-based selection usable. Requests time out after 15 seconds server-side; there are no automatic paid retries. Identical successes are cached 10 minutes (maximum 100 entries), concurrent duplicates coalesce, and there are 6 uncached requests/minute per client, at most 2 simultaneous calls and 20 paid attempts/hour per server process. These local limits reset on server restart; they are not account-level spending controls.

### Verify a real call — only after approval

Open browser DevTools → Network, select a product title such as **Nordic Lounge Chair**, open interpretation details and click AI suggestions once. Inspect `/api/semantic/interpret`: a successful result includes `model`, OpenAI `responseId`, `cached` and validated candidates. Confirm the first fresh request has `cached:false`, an OpenAI response ID, and a corresponding request/usage entry in your OpenAI project dashboard. A repeat can have `cached:true` and must not be mistaken for another model call. Browser request headers must contain no OpenAI key.

Compare the normal rule-based alternatives with the AI’s proposed group. The offline evaluation fixture groups the lounge chair title, current price and Add to Bag button as purchase-decision information, while the current deterministic expansions do not return that exact cross-role group. This is a **mocked contract test, not demonstrated real-model quality**. The first approved live test is recorded in [AI live test](docs/AI_LIVE_TEST.md), including the real response ID and cached replay. For further evaluation: check grounded reasons, relevant IDs, unwanted extras, correction count and whether participants choose/ignore the suggestion before claiming improvement.

Tests use injected fake Responses payloads, never a live model. They cover the fixture, invalid IDs, refusals, timeouts, limits, caching, stale responses and disabled configuration. Official API references: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).


## Separate tools: Select → Rough Reference → Hand

The bottom toolbar now uses this order, keeping the same styling and icons:

- **Select (V; S alias):** click to select, Shift-click to toggle, drag an object to move locally, or drag empty canvas / Shift-drag for box selection.
- **Rough Gesture (G):** freely draw circles, curves, straight strokes or scribbles, even starting over a parent or child object. This tool never moves objects. The existing interpretation dropdown, scope correction and explicit AI suggestions remain available.
- **Hand (H):** pan. Space-drag and middle-button panning remain available.

Tool choice, not trajectory classification, determines whether a drag moves or references. The 6px threshold still separates clicks from drags. Movement is memory-only, constrained to the authored screen, and carries descendants of moved parents. It is never synchronized; refresh restores positions. Pins and outlines follow local geometry. Switching tools or canceling rolls back an unfinished move. The old trajectory helper remains isolated experimental code and is no longer imported by Canvas.

### Design-reference purpose in Compare

In Compare → Sharing options, choose **Use as a design reference**. User A's frozen selection is the reference and User B's is the target. Select one or more categories (Typography, Spacing, Colors, Corner radius), then optionally add a note, mentions or a view invitation and explicitly Share. These are requested categories, not automatic edits or inferred spacing values. Other purposes hide these controls; Custom purpose preserves free text.

The shared comparison stores optional `designReference: {direction: {referenceUser: 'A', targetUser: 'B'}, properties: [...]}` beside its existing purpose and frozen selections. Both demo storage and the realtime backend preserve it, and the recipient sees the saved direction/categories. Existing references without this field remain compatible; no migration or new AI request is required.

### Recovering a dismissed collaboration nudge

**Later** silences the currently known banner events only. The request remains unread in **References**, with its sender, targets/screens and intended action. The left References badge includes pending invitations and targeted unread requests. Unread items appear first; clicking one locates its saved targets and opens the same conversation. Opening records viewed activity; **Mark reviewed** remains a separate action.

Banner dismissals persist in this browser by mode, room and A/B perspective (and synchronize between tabs). Realtime viewed receipts remain server-backed; demo receipts remain in local room storage. A new explicit invitation can nudge again, without creating another reference or clearing prior review evidence.

### Design system referencing

Select an object → Adjust interpretation → **Review suggested tokens**, or open Compare → Suggested actions → **Design System**. The compact canvas entry reports deterministic candidate availability; it does not claim a model match or change the selection. **Suggest relevant tokens · AI** explicitly requests semantic relevance through the existing `/api/semantic/interpret` endpoint (`task: design-system`). It uses the same server-only `OPENAI_API_KEY`, `AI_ENABLED`, `OPENAI_MODEL`, authorization, limits, timeout, in-flight deduplication and ten-minute cache. No additional environment variables are needed.

Recorded values, library identities, exact matches and patches are deterministic. The model chooses only validated candidate property IDs and supplies a short relevance explanation. Library display decorations are excluded; current object values come from the validated document snapshot. Up to 32 selected roots and 160 candidate facts are supported. Spacing is available only when explicitly recorded; geometry is not interpreted as padding. Component examples are possible semantic matches, not formal instance bindings. Intentional differences may be retained.

Check individual properties to include them in the ordinary comparison request. **Preview selected changes** temporarily previews only checked differences; **Apply** commits them through existing batch history. Undo/redo remain available. Sharing does not apply changes. The existing saved comparison conversation shows checked property proposals, their original/proposed values and provenance. Changing targets, purpose, selected property categories or committed property values clears or invalidates stale proposals. Exact matches and manual editing remain available when AI is disabled or fails.

The token tests use injected Responses fixtures only. They verify candidate/value validation, partial/no matches, cache/disabled behavior, preview patches and demo/realtime sharing persistence; they do not establish live model quality.

### Selection and Compare inspectors

Manual selection first shows the contextual menu. Confirming an interpretation with Select objects opens the right-side Edit inspector. Edit explicitly opens **Selection**, with Details, contextual Suggested actions, and Design system review. Both normal and rough selections offer Share reference and Adjust interpretation, with Compare first when multiple objects are selected. The contextual menu has no Edit action. Share reference opens Selection at Sharing options; Compare opens Compare mode for multiple selected objects. No comparison draft or empty second participant is created. The inspector uses one editing controller, including proposal checkboxes, temporary preview, Apply, and undo/redo. AI editing remains explicitly requested. Closing Selection keeps the selection available.

Only an explicit **Compare** action creates a frozen comparison draft. Same-user and cross-user comparisons retain the existing preview, purpose, direction, sharing and conversation workflows. Compare becomes available for at least two selected objects or an eligible collaborator selection.

The canvas contextual action stack is hidden while the right-side inspector is open and remains available when it is closed. Compare is a quick shortcut into Compare mode, Editing controls remain inside the inspector; there is no floating editing toolbar. Sharing remains an optional final action. Selection includes the same intent, optional note/@mention and invitation fields as shared-reference composition, with Share reference in a pinned footer outside the content scroller. Sharing remains an explicit action and retains research-request metadata where applicable.

### Edit / Compare modes

The working inspector is titled **Selection** in both modes. Its pinned Edit / Compare switch controls the local workflow. Edit is the default mode when the user explicitly opens the inspector; ordinary canvas selection alone does not open it; explicit interpretation confirmation opens Edit. Compare reuses the existing frozen comparison draft; returning to Edit and back retains its purpose, direction, selected properties and checked proposals until the compared selections change. Switching cancels temporary previews and never applies edits or sends a request. The original comparison grouping and collaborator ownership remain authoritative. Compare is available for two or more local objects, a live collaborator selection, or an opened collaborator reference. An opened reference can supply its sender-owned objects even when the sender is offline; the existing draft endpoint validates and freezes those IDs. Two local objects continue to use same-user comparison rather than an older opened reference.

Sharing’s **Request intent** is communication metadata. Choosing Compare there does not change the local inspector mode or create a comparison snapshot. Edit sharing can send Review, Help, Look at this, or Compare requests through the existing reference service. Compare-mode sharing retains its comparison context. No extra Compare navigation button appears in Sharing options.
