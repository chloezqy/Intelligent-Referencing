# Smart Reference: confirmed references and intelligent editing

This iteration extends the existing React canvas, authored commerce dataset, gesture geometry, semantic endpoint, and research/collaboration systems. The six original screens, IDs, coordinate system, camera interactions, selection shortcuts, and shared-reference workflows remain intact.

## Interaction

1. Rough Reference (R): draw through or around examples.
2. One **AI Interpretations** card requests real-time structured interpretations automatically. **Touched**, **This Screen**, and **Whole File** are the only scope controls. Scopes retain the original gesture IDs. Hover previews; clicking activates a candidate without committing it.
3. **Select …** commits the exact candidate IDs and dismisses interpretation. A failed/empty request offers Retry and explicit manual selection of directly touched objects. There is no visible deterministic suggestion list.
4. Confirmed references expose **Align**, **Match Styles**, **Typography**, **Colors**, **Design System**, and **Ask AI**. Conventional click, Shift-click, box and layer selections expose the same controls.
5. Each action proposes actual property changes. Inspect affected layer names and before/after values, enable individual mappings, preview on the real canvas, and Apply. Compact preview mode keeps the artwork visible; Customize returns to mapping controls. Cancel discards preview.
6. Batch edits and completed object drags occupy one undo entry. Cmd/Ctrl Z undoes; Cmd/Ctrl Shift Z redoes. Selection IDs stay unchanged. Edited properties persist in browser storage; undo history is session-local. Document edits are local, and are not synchronized by the collaboration server.

## Document and action contracts

`useDocument.ts` replaces the App-only position overlay with immutable object snapshots, patch validation, isolated preview patches, persistence and a 100-entry batch history. The renderer consumes previewed objects while proposals, research validation and AI requests consume committed objects. No image/text/label/role/parent mutation is permitted through editing patches. Library nodes and screens are protected from edit commands.

`editing.ts` resolves canonical selection roots and semantic descendants. Layout uses the existing world coordinates, requires sibling roots, moves descendants together, and rejects increased overflow of immediate parents. Width/height matching that would clip child content is disabled. Even spacing preserves a complete grid's row/column membership. A title-role typography edit changes only title layers. CTA color edits exclude favorite and secondary buttons.

`designSystem.ts` adds an in-file **Design System · Library** artboard below the commerce screens. It contains seven color swatches, five typography samples, primary/secondary buttons, a Product Card with semantic children, a chip, an input, and radius/spacing/shadow samples. Library proposals read styles from these actual objects. Layer hierarchy browsing and explicit Locate controls reach the library. Fit view preserves the original commerce overview.

A style source is an independent ID, with an amber outline; target selection stays intact. Sources can be chosen from the file hierarchy dropdown, searched by artboard/component/layer name, picked in Layers, or picked on the canvas. First Selected is an explicit source option. Styling preserves product text, images, labels and IDs. Source content is never duplicated.

## AI

The existing `/api/semantic/interpret` endpoint now supports both reference interpretation and `task: "editing"`. Privileged credentials stay on the server. Configure `AI_ENABLED=true` and `OPENAI_API_KEY` in the existing server environment; the existing `OPENAI_MODEL`, timeout, origin/access policies, cache and budget limits remain in force. A static-only Vite preview cannot call private AI handlers.

`gestureContext.ts` computes direct geometric evidence and eligible scope hierarchies. The server reconstructs authoritative IDs, hierarchy, semantic roles and content, accepting only validated editable properties from a current document snapshot. Selection output uses an ID-enumerated strict JSON schema and runtime ID/scope/evidence checks. Root-plus-descendant duplicates are normalized; identical candidate sets are collapsed. When AI chooses a homogeneous semantic role, the existing deterministic scope matcher resolves all eligible instances of that role and type (and component for cards). Mixed functional groups retain the exact validated IDs. This makes scope counts reliable without creating a competing heuristic interpretation list. Whole File includes all commerce layers rather than a top-64 ranking that could omit CTAs. Library samples are separate style sources unless gestured explicitly. Client cancellation and context keys discard obsolete results. A bounded per-gesture/scope/document cache reuses valid interpretations.

`actionIntent.ts` defines the allowlisted action plan: layout, library mapping, source style matching, typography and color; fixed role selectors and known tokens. The server and client validate plans independently. The compiler resolves every operation within the frozen confirmed reference. Model output cannot run code, supply arbitrary IDs, rewrite content, or modify unrelated objects. Both hand-authored and AI proposals use the same deterministic edit validation and preview/apply path.

## Research

Five v2 tasks cover chips, grid alignment, batch button color, in-file card library matching, and all 15 production primary CTAs. Editing tasks require exact confirmed target IDs, an applied batch operation on those targets, and verified committed properties/geometry. Content and hierarchy must be preserved. Preview is never completion evidence. Task 3 requires an actual fill change relative to the attempt baseline. Task 2 permits applying an already-correct even layout, but independently verifies geometry.

Logs record observed selection method, gesture/correction/action/undo/redo events, timestamps and baseline documents. No estimated time or click savings are displayed. V2 storage keys preserve old task logs. `legacyResearch.ts` retains v1 task definitions/evaluation for older collaboration evidence and existing server regressions. Collaborative sharing, attention, replies, comparisons, and review remain available in References.

## Verification

Run `npm run lint`, `npm test`, and `npm run build`. The test suite covers existing collaboration and geometry plus scope eligibility, current document reconstruction, schema/action validation, source/target isolation, content preservation, semantic descendant edits, library mapping toggles, grid repair, layout constraints, task final-state checks, and the mocked HTTP AI editing contract. Mocked endpoint fixtures do not claim live model quality. Manual browser checks exercise live interpretation and action proposals, conventional selection, preview/apply, source picking, and undo/redo.

### Verified on October 27, 2026

- TypeScript validation and production build passed; all **152 tests** passed.
- Native unbundled ESM imports, bundled Vercel JSON responses, browser-secret exclusion, production assets, authenticated SSE, persisted replies and server restart recovery passed the deployment smoke checks.
- Real browser + configured live AI: a gesture across two Home examples, changed to This Screen before the first request finished, produced distinct four-card, four-image and four-CTA interpretations. No selection was committed until Select.
- Task 4 completed through gesture → confirm four cards → Ask AI (“Match these cards to the design system.”) → complete mapping preview → Apply. Preview alone did not satisfy the final-state task checks. Cmd-Z restored the prior secondary CTA fills; Cmd-Shift-Z restored primary fills, without changing targets.
- Task 5 completed through two CTA examples → Whole File → confirm all 15 primary CTAs → library preview → Apply. Only the 15 CTA properties were targeted; 11 required changes because four already matched. The actual final-state and content-preservation checks passed.
- Conventional layer Shift-selection, source picking from the library with independent targets, direct library preview/apply, CTA-only color edits, and button Undo/Redo were also exercised in the browser.
