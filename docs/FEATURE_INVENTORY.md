# Current prototype feature inventory

Inspected November 3, 2026. Source baseline: HEAD `9cd8221` (“match color”), plus the reset/study implementation in this workspace. This inventory describes the code, rather than assuming the older README/demo walkthrough is current.

| Area | Implemented behavior | Main implementation |
| --- | --- | --- |
| Document | Six authored mobile commerce screens plus an in-file Design System library; semantic IDs, roles, components and parent hierarchy | `data.ts`, `designSystem.ts` |
| Navigation | Pan, zoom, fit, keyboard shortcuts, layer hierarchy, locate actions, resizable panels | `Canvas.tsx`, `workspace.ts`, `LayersPanel.tsx` |
| Conventional selection | Click, Shift-click, box select; object dragging with descendants; Select/Rough Gesture/Hand tools | `selectionInteraction.ts`, `toolInteraction.ts`, `CanvasToolbar.tsx` |
| Rough gesture | Stroke/circle/scribble coverage through objects; model interpretation candidates; scope Touched/Screen/All screens; candidate hover/focus previews; explicit confirmation; touched-object fallback on unavailable/empty AI | `gestureContext.ts`, `semanticInterpretation.ts`, `useSemanticSuggestions.ts`, `Canvas.tsx` |
| Inspector | Persistent right Design inspector; selection details and editable property sections; contextual suggested actions; Compare navigation; shared editor controller | `DesignInspector.tsx`, `EditingToolbar.tsx`, `ComparisonInspector.tsx` |
| Direct edits | Recorded position, dimensions and styling; align/distribute/even-spacing operations; color adjustment; typography controls; batch operations by semantic descendants | `designInspectorProperties.ts`, `editing.ts`, `AdjustColor.tsx` |
| Style sources | Match from a chosen layer, first-selected source, in-file design-system tokens; source search/dropdown/canvas picking; source and targets stay independent | `layerStyleReference.ts`, `LayerStyleReference.tsx`, `inspectorEditing.ts` |
| Text and color matching | Specialized typography/color style review with eligible in-file sources, category-specific values and preview/apply | `textStyleMatching.ts`, `colorStyleMatching.ts`, `TextStyleReview.tsx`, `ColorStyleReview.tsx` |
| Smart editing | Natural-language Ask AI compiles validated action plans; design-system matching requests semantic relevance among deterministic token facts; individual proposal/property choices | `actionIntent.ts`, `DesignSystemReview.tsx`, `designSystemReferencing.ts` |
| Preview/history | Temporary canvas appearance and current/proposed values; explicit Apply/Cancel; batch undo/redo; committed local storage; stale proposals invalidated by target/document changes | `useDocument.ts`, `ComparisonPreview.tsx`, `editing.ts` |
| Comparison | Same-user selected objects or frozen selections from A/B; opened references can supply collaborator objects; property table, differences/matching properties and side ownership | `comparisonSides.ts`, `comparisonContext.ts`, `PropertyComparison.tsx` |
| Difference resolution | Recorded differences with independent technical Resolve checkboxes; choose direction A→B/B→A; preview and selective Apply | `comparisonResolution.ts`, `EditingToolbar.tsx` |
| Comparison recommendations | Automatic semantic analysis for a comparison, categories and explanations; labeled rule-based fallback; no automatic edits | `comparisonRecommendations.ts`, `useComparisonRecommendations.ts` |
| Design reference | Explicit reference/target direction, swap, property categories (typography/spacing/colors/radius), deterministic transfer preview, optional AI proposed changes | `DesignReferenceIntent.tsx`, `designChanges.ts`, `DesignChangeSuggestions.tsx` |
| Request collaboration | Review/Compare/Help/Look at this/custom intent; draft notes and mentions; frozen targets; comparison proposals; optional invitation; request-review preparation remains unsent until Share | `SelectionSharing.tsx`, `SharePopover.tsx`, `ReferenceSharingControls.tsx` |
| Recipient attention | View/Later nudge, unread References badge, persistent dismissal by user/mode/room, explicit invitations on existing references; independent camera | `referenceAttention.ts`, `mentions.ts`, `App.tsx` |
| Conversations | Object pins, clustered pins, pin-attached popovers, locate targets, replies, reviewed status, archive/restore; reviewed conversations appear in Archived | `ReferencePins.tsx`, `ReferenceConversation.tsx`, `referencePresentation.ts` |
| Review assistance | Explicit “Suggest review focus with AI” for a Review note; possible referenced property and related element; Inspect on canvas then Compare | `reviewFocus.ts`, `ReviewFocus.tsx` |
| Proposed-change discussion | Share selected model suggestions as proposals; recipient accepts/dismisses them as review metadata, distinct from applying local edits | `designChanges.ts`, `DesignChangeSuggestions.tsx` |
| Demo collaboration | Manually switch A/B in one browser; per-user cameras/selections; local references/replies/attention; no automatic collaborator behavior | `useDemoCollaboration.ts`, `demoCollaboration.ts` |
| Real-time collaboration | Create/join private two-slot rooms, authenticated SSE updates, selection/cursor presence, invitations, durable references/replies/activity and room recovery | `useCollaboration.ts`, `server/app.ts`, `server/store.ts` |
| Existing research | Five v2 tasks: filter selection, spacing, batch button color, card library matching and all-screen CTA matching; baseline/event export and final-state checks. Older v1 collaboration research retained separately | `research.ts`, `useResearch.ts`, `legacyResearch.ts` |
| New user study | Toggle on → enter P# → three tasks automatically prompted, detected and advanced; task times/interactions saved locally with JSON export. Surveys remain outside the prototype | `study.ts`, `useStudy.ts`, `StudyPanel.tsx` |
| New reset | Original authored document, fresh demo room and A perspective, no remembered cameras, selections, previews or history. Remounts workspace; keeps study/research archives and real room identities | `resetPrototypeStorage` in `study.ts`, root `App.tsx` |
| AI infrastructure | Shared semantic endpoint for interpretation, editing, design-system matching, comparison analysis, design changes and review focus; server-only credentials, strict schemas/ID validation, bounded retries/queue/cache/rate limits, document snapshots and stale-result handling | `aiClient.ts`, `server/semantic.ts`, `server/openaiTransport.ts`, `api/semantic/interpret.ts` |

## Differences from the provided walkthrough

The workflow remains select/gesture → clarify → preview/apply or share. The current code uses a persistent Design inspector, and its labels/entry points have evolved: do not depend on an older floating Edit action. Design-system matching starts a semantic request when opened, whereas recipient review-focus suggestions require an explicit request. Comparison recommendations analyze automatically but resolving properties remains explicit.

The four existing Home card radii are 16; the first Search card is 14. Layout and content differences between grid/list cards are intentional context for the comparison task. The first Home product image is `hc1-img` (Nordic Lounge Chair). The four Home filters are `home-chip-0` through `home-chip-3`. Keeping original inconsistencies is preferable to preparing a perfectly standardized design for a study.

## Boundaries that affect study interpretation

- These are sample design objects, not functioning shopping screens or a full design-authoring environment. The Prototype inspector tab is disabled.
- AI can recommend interpretations or styles; its outputs require validation and user decisions. Model quality and availability are not established by mocked regression tests.
- Actual document edits and their history are local. Sharing a reference does not synchronize applied document patches to another real-time client.
- Semantic library relevance is not a formal component-instance binding. Missing properties stay missing; spacing is supported only where recorded.
- Demo roles are not independent participants. The new guided mode intentionally uses demo and exports that fact. Real-time infrastructure remains available outside guided mode.
- Time is wall-clock task time. Interaction counts include typing, and are distinct from semantic events. Recorded success does not judge note quality, review reasoning, or design suitability.

See [the study protocol](USER_STUDY_PROTOCOL.md) for the full script, reset rationale, measurement definitions and moderator notes sheet.

## Validation of this change

TypeScript and the production build passed. The full suite passed **265/265** tests, including seven new study tests covering exact gesture confirmation, AI preview/commit provenance and content preservation, recipient evidence, selective comparison, metric definitions, and reset isolation. Earlier runs exposed timing sensitivity in existing backend tests; the final standard full-suite run passed. Browser automation was unstable in this environment, so a complete visual walkthrough and fresh live-AI pilot remain unverified. No live-model calls were made for these tests.

### Complete library application update

Task 2 now applies the design system to the four Home product cards. The native Design inspector has a direct Apply design system action and a View design system shortcut. Full application uses the actual source samples, previews every selected card, and commits through ordinary undo/redo. Optional AI property recommendations remain selective and separate. The library board below the screens now separates the palette, typography, product-card anatomy, controls, and shape/spacing samples; labels and values correspond to the same styles read by the editor.

Validation for the Home-card update: the full suite passed **270/270** tests. The updated batch preview and Apply were also exercised in Chrome: four-card selection, all four previews, committed surface/radius/inset values, changed CTA styling, and navigation to the organized source board were verified. Study sessions now retain the task ID/title/prompt and protocol version so revised Task 2 records are distinguishable from earlier pilot sessions.

### Task 2 completion detection fix

Completion now uses centrally recorded commits and verified library styling on all four Home cards. It accepts AI library actions, the dedicated full-library action, and separate per-card applications, normalizes nested selections, and ignores internal token labels. The observer uses the same tested completion transition that unlocks Task 3. Preview alone, partial styling, incorrect targets and undo back to the original styles remain incomplete.

### Selection levels, nested selection and integrated design-system action

The guided sequence now includes Task 1 levels for four Home CTAs, eight Home/Search filters and all 15 product images, followed by design-system application, collaboration and comparison. Either selection method is accepted at every level and recorded without forcing repeat conditions. Normal canvas selection traverses parent/child hierarchy, with double-click drilling, Enter/Shift-Enter, Cmd/Ctrl deep selection and hierarchy-aware marquee; explicit Layers-panel selection remains available. Apply design system now replaces the corner-radius-only entry inside the existing purple Appearance suggestions block; its working full preview/apply logic remains intact and the separate top-level section was removed.

### Level 3 completion recovery

An explicit interpretation confirmation now carries its selected object IDs into the study log. All selection levels accept confirmed AI expansion initiated from a normal click, as well as a Rough Gesture; completion no longer requires a gesture event for the former. Confirmation must follow and match the current selection. Level 3 still requires exactly the 15 production product images, excludes the library sample, and advances to design-system editing. The study prompt displays target/extra counts. Regression checks cover normal-click AI expansion, stale confirmations, library-image substitutions, and whole-file role expansion across Home, Search, Detail, Favorites and Cart.

### Simplified reference-sharing completion

Task 3 accepts any object/group and request intent. A new A-to-B reference must be shared during the attempt and marked reviewed by B; no particular image, note, mention, invitation, locate event or reply is required. It then automatically advances to comparison. Regression coverage rejects sharing without resolution, wrong recipients, empty targets and stale references.

### Skip and concise export

Every study step has a one-click skip control. Skipped attempts retain their timing and interactions, advance automatically and remain distinct from completion; skipping the final step opens export. Export schema v2 contains session/task context and timestamped interaction events, not full document snapshots, style patches, repeated prompts or message contents. Internal verification data stays local.

### Board alignment and File/Layers sidebar

Library titles and annotations are left-aligned, the footer is removed, and the board height fits the authored contents plus 28px bottom padding. Typography specimens use a tighter vertical rhythm. The sidebar follows the current Figma File-panel structure with a document header, Pages section, compact type-icon rows, blue selection treatment, find and collapse controls. Row dividers, Selected badges and the instructional footer are removed; disclosure controls and selection names have distinct roles. Layer/shape styles remain the same authoritative editing sources.
