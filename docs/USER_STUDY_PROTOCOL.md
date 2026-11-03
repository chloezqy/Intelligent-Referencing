# Smart Reference — formative user study protocol

Draft · November 3, 2026 · based on repository HEAD `9cd8221` plus the study-mode changes in this workspace.

## Purpose and study design

Evaluate whether a designer can (1) express a group through a rough gesture and check its interpretation, (2) preview and apply the design system consistently to a group of cards, and (3) send an actionable object reference and understand it from User B’s perspective. Task 4 tests selective consistency across layouts.

Plan approximately 30–40 minutes: introduction and pre-survey 5 minutes, orientation 2 minutes, three automatically sequenced core tasks 15–20 minutes, comparison task 4 minutes, final verbal survey 4–5 minutes. This is a formative usability session, with think-aloud and observed behavior. It does not establish speed gains over another tool or causal AI benefits without a separate comparison condition.

The implemented **User study mode is single-browser role-play**: the participant switches between User A and User B. Do not report this as an independent collaborator’s behavior. For a separate two-person study, use the existing real-time room workflow outside guided mode, assign A and B to different people/browsers, and collect both clients’ records plus facilitator timing. Guided mode currently resets to demo; it does not aggregate paired real-time metrics.

## Starting state and facilitator preparation

Use **User study mode Off → On** in the top bar. It resets to the baseline and asks for a participant ID such as **P1**. Use **P0** for a pilot test. Enter the ID and press **Start study** (or Enter). The first task appears and recording begins. The system detects completion, records the result, and automatically prompts and starts the next task. After Task 1’s three selection levels and Tasks 2–4 it shows Study complete. A Skip task button advances without success; each Task 1 level can be skipped separately. Skipping the final task opens the export screen. There are no task selectors, per-task start controls, surveys or survey note fields in the prototype. Keep all verbal survey answers in a separate facilitator notes sheet. Toggle off and on for the next participant.

Baseline:

- Original authored commerce document and in-file design library, including existing style differences. Do not standardize the design first: that would remove the need for judgment and editing.
- User A in standalone demo, no references/replies/invitations, no selected objects, no unsent drafts, no temporary previews, no undo/redo history or remembered A/B views.
- Select tool, original panel sizes and a fitted overview of the six commerce screens. A timed task frames its relevant area without preselecting its targets. Each task prompt appears automatically with its timer; prompt reading is included.
- Study records and existing research archives are retained. Reset leaves real-time room identities and server rooms intact; it exits the current room locally into demo.

Use one browser, one tab, one zoom level and consistent window size across participants. Keep facilitator notes separately from the prototype. Prefer a desktop viewport at least 1440 px wide because the prototype has multiple side panels. Do not clear site storage between participants; export records after each session. **Reset prototype** ends an active study and restores the baseline; it does not begin a new timed session. Toggling **User study mode Off** stops recording without changing the design.

Pilot the exact tasks on the intended host before recruiting: verify that rough gesture returns the four Home filters and that Apply design system previews and updates all four Home product cards. Actual AI outputs can vary. Use the existing configured semantic endpoint; static-only hosting cannot supply private model calls. Record model/host configuration and any outage in facilitator notes. An unavailable AI-assisted selection task remains incomplete. If it cannot continue, record the reason externally and toggle study mode off; the attempt is stored as interrupted. This implementation was checked with automated fixtures; it does not assert current live-model quality.

## Opening script (read aloud)

“Thank you for helping us evaluate Smart Reference. We are testing the prototype, not you. It lets designers select objects, review suggestions, make changes, and discuss a reference with someone else. Some features use AI and may take time or make mistakes.

“As you work, please say what you are trying to do, what you expect, and anything that surprises you. You can ignore suggestions you disagree with. I may ask what you are thinking, but I will try not to tell you how to complete a task. You may stop or take a break at any time.

“Today you will use both User A and User B in the same browser. This simulates a handoff; there is no second person sending automatic replies.”

Follow the study’s existing consent procedure before collecting data. Ask separately for any screen/audio recording required by that procedure. Use participant codes in facilitator notes and exports, without names or contact details.

## Short verbal pre-task survey (2–3 minutes)

Ask aloud before entering the participant ID, and record concise responses in your separate facilitator notes sheet:

1. “How often do you use design tools, and how do you normally select a group or point a teammate to a particular object?” Record frequency/tool and one example.
2. “How confident are you that you can select exactly the objects you intend in a complex design?” 1 = not at all confident, 7 = extremely confident.
3. “How confident are you in deciding whether to use an AI design suggestion?” Same 1–7 scale. “What would you need to see before applying one?”

## Orientation (up to 2 minutes, untimed)

Show the six sample shopping screens, Layers, tool dropdown, zoom/Fit, Study panel, and A/B perspective switcher. Explain click, Shift-click, pan and Rough Gesture availability. Allow a short practice on an unrelated object such as the navigation title. Do not demonstrate the task’s exact filters, desired AI properties, or sharing sequence. Complete orientation before toggling study mode on for the coded session, so the toggle restores the baseline after practice.

The prototype presents four tasks in sequence, with three separately timed levels inside Task 1. Entering P# starts Task 1, level 1. On verified completion, the current timer stops and the next prompt and timer begin automatically; earlier design edits remain. Each transition clears selection, returns to A/Select, and frames the next target without selecting it. Reading each prompt is included in task time.

Use neutral reminders: “What are you expecting here?” or “Please keep thinking aloud.” Record all help externally. Do not conduct between-task interviews while the automatic sequence is running: collect the short task-specific follow-ups below after all four tasks, referring back to each task. If an outage or prolonged difficulty prevents progress, record it externally and toggle study mode off. The current attempt is saved as interrupted; the system never marks it successful merely to advance.

## Task 1 — selection at three levels

Participants may choose normal selection or Rough Gesture independently at every level. They do not repeat each level under both conditions. Record method choice as observed behavior; this self-selection design does not support a controlled causal speed comparison between methods.

1. **Home buttons:** “Select exactly the four Add to Bag buttons on Home.” Targets: `hc1-cta`–`hc4-cta`.
2. **Two-screen filters:** “Select exactly all eight filters across Home and Search.” Targets: the four Home category chips and four Search filters.
3. **Whole-file images:** “Select all 15 product images across the shopping screens, including Favorites and Cart. Exclude the design-system sample.”

The prototype automatically clears the previous selection, frames the next level, prompts the participant and records its time/interactions separately. Each level requires the exact target set without extras. Normal selections complete directly; Rough Gesture selections require an explicit interpretation confirmation. Exports include selection level, selection events, methods used and final selection method. A mixed-method attempt retains both methods rather than being forced into one experimental condition.

Normal selection respects hierarchy: a first click on a nested button/image selects its enclosing card, double-click drills a level down, Enter selects children, and Shift-Enter selects parents. Cmd/Ctrl-click deep-selects, as in Figma. After drilling into one object, Shift-click can add corresponding nested objects elsewhere. The Layers panel supports expanding parents, Cmd/Ctrl-click for individual additions and Shift-click for a visible range. Do not demonstrate the exact targets before timing.

**Observe:** hierarchy navigation, tool choice, scope changes, exact versus excessive targets, correction effort and cross-screen navigation. Rough Gesture remains independent of normal click hierarchy.

**Verbal follow-up after the sequence:** ease 1–7 and confidence 1–7 for each level; ask why the participant chose each method and where nested selection helped or hindered them. Keep notes outside the prototype.

## Task 2 — apply the design system to all Home product cards

**Read:** “Select all four product cards on Home. Apply the design system, review the preview, and confirm the changes. Keep the product content unchanged.”

**Observe:** selecting complete card roots rather than only images, understanding the source library and scope of the batch, reviewing before/after values for all four cards, and distinguishing preview from Apply. The full application is sourced directly from the visible library; it does not depend on AI choosing a handful of property suggestions. Optional AI-assisted selection and individual property recommendations remain available.

**Automatic success:** recorded Apply actions covering `hc1`, `hc2`, `hc3` and `hc4`, and verified final styling matching the in-file library for every applicable mapping. Batch application, AI library actions and separate per-card applications all qualify. Completion does not depend on a particular button, preview-event name or internal token label. Product content and hierarchy must remain preserved. A partial edit, a single image, preview alone, or a style change applied to fewer cards does not complete the task.

**Moderator fallback path:** select the four card roots (Shift-click or use Layers; Rough Gesture may also identify the cards) → **Apply design system** inside the existing purple Appearance Suggested actions block → review all four before/after cards and listed changes → **Apply changes**. **View design system** navigates to the source board below the screens.

The complete mapping includes card surface, border, radius, shadow and recorded inset; title/price/detail typography; primary and secondary button styling where applicable; and image corner radius. Product-specific image fills, text, prices, card dimensions, screen membership and card positions are preserved. The canvas library is organized into Color palette, Typography, Product card, Controls, and Shape & spacing. The displayed samples are the actual editor sources.

**Brief verbal follow-up, after the automatic sequence:** ease 1–7; confidence in the applied changes 1–7; “Did the preview make it clear what would change across the four cards?” Save `T2` notes externally. If evaluating AI judgment separately, probe optional suggestions outside this automatic task; full library application itself is deterministic.

## Task 3 — share any reference and resolve as User B

**Read:** “Select any part of the design and share a reference with User B. Then switch to User B, open the reference, and resolve it using Mark reviewed.”

**Automatic success:** a new reference shared during this task with nonempty targets, from A to B, reaches reviewed status. Both collaboration adapters restrict Mark reviewed to the recipient, so this is evidence that B resolved it. Any selected object or group and any request intent qualify. Notes, mentions, view invitations, replies, and separately locating the targets are optional, not completion gates. Old references cannot complete a fresh attempt.

**Observe:** what objects participants choose, whether the handoff is clear, how B finds the reference, and whether reviewed/resolved status is understood. The task advances automatically to comparison once B marks the shared reference reviewed.

**Brief verbal follow-up after the sequence:** ease 1–7; “How clear was what User A wanted User B to do?” 1–7; “What context was missing?” Record optional communication and review quality separately from binary completion.

## Task 4 — comparison (included in the automatic sequence)

**Read:** “Compare the first product card on Home and the first on Search. Keep their different layouts, but make the Search card use the Home card’s corner radius. Preview the specific change before applying it.”

**Automatic success:** comparison preview observed and a committed patch changing only `sc1.radius` to `hc1.radius` (Search 14px → the current Home radius, normally 12px after Task 2); every other authored property remains as it was when this task started.

**Moderator fallback path:** click first Home card root, Shift-click first Search card root (Layers can help target roots) → Compare → Compare differences → Resolve Corner radius only → Resolve selected differences → Object A (Home) to Object B (Search) → Preview changes → Apply changes. Inspect direction; do not assume order when selections were made differently.

Ask ease 1–7 and “Why did you keep the size difference but change the radius?” Save `T4` notes. Task 4 completes the guided sequence and opens the completion/export screen.

## Short verbal post-session survey (3–4 minutes)

Ask after the tasks and record under `FINAL` in your separate facilitator notes sheet:

1. “How confident are you now that you can select exactly the group you intend?” 1–7; same anchors as pre-survey.
2. “How confident are you now in deciding whether to use an AI design suggestion?” 1–7; same anchors as pre-survey. “What changed your confidence?”
3. “Which part was most useful, and which part was most confusing or risky? How would this fit your usual design review workflow?”

Finish with: “Is there anything else you expected the prototype to do?” Download study records from the completion screen, then toggle study mode off. Check the participant code, four task outcomes and notes before moving to the next participant.

## Measures, coding and analysis

| Construct | Instrument / operational definition | Interpretation |
| --- | --- | --- |
| Completion | Verified auto-complete versus skipped/interrupted; analyze each attempt separately | Do not count assisted success as unassisted; mark assistance in notes |
| Time | Automatic task start → first verified completion or toggle off; seconds | Wall time includes prompt reading, think-aloud, model latency and tab absence; not active work time |
| Interactions | Pointerdown + nonrepeat keydown inside the prototype, including typing | A drag counts once; study controls, pointermove and wheel scrolling are excluded. This is not “click count” or semantic action count |
| Gesture effort | Recorded gesture attempts, scope changes, candidates and selection events | Separate intended corrections from accidental input using observations |
| Edit decisions | Library preview, committed patches, undo/redo events, moderator notes | A valid patch shows execution, not whether the choice was good |
| Collaboration | Shared/opened/located/replied/reviewed timestamps and actor IDs, attached to one reference | Demo A/B actors are manually controlled roles; not separate people |
| Perceived usability/control | Task-specific ease/confidence/control/clarity ratings and explanations | Retain ratings per task, rather than averaging unrelated constructs |
| Learning/confidence | Identical pre/post confidence items | Self-report change, not demonstrated skill improvement |

Export schema v2 contains session ID, participant code, protocol version, mode, and task records. Each task has an ID/group/selection level, outcome, UTC start/end timestamps, duration in milliseconds, physical interaction count, and a timestamped event timeline. Selection events retain object IDs and method; reference events retain the reference ID and actor; applied edits retain only object count and changed property names. Document snapshots, patch values, full prompts, messages and survey notes are excluded. Internal completion checking still uses the full local document. Surveys are administered verbally and stored in separate facilitator notes, never in the prototype. It does not export room credentials. Current storage is local to the browser origin; export before clearing storage. Reload ends an unfinished restored attempt as interrupted and requires a fresh session for a controlled baseline. Treat incomplete and interrupted times as stopped observations, not successful completion times. An unfinished export’s elapsed value is provisional.

For a small formative sample, report counts and individual task outcomes, median/range of successful-task times and interactions, assistance, failures/outages, and recurring qualitative themes. Do not imply efficiency improvements from this single condition. Keep the AI configuration and task order consistent, or annotate differences.

## Facilitator notes template

```text
Participant code:          Date / facilitator:
Prototype revision/host:   Browser / viewport:
AI configuration:         Session ID:
Consent/recording handled according to existing procedure:
Pre: design-tool experience/workflow; selection confidence /7; AI confidence /7; evidence needed:

Task | Outcome | Time s | Interactions | Ease /7 | Confidence /7 | Help / errors / comments
T1   |         |        |              |         |               |
T2   |         |        |              |         |               | Control /7:
T3   |         |        |              |         |               | Clarity /7:
T4   |         |        |              |         |               | Optional:

FINAL: selection confidence /7; AI confidence /7; explanation:
Most useful / most confusing / missing context:
Outages, tab absence, procedural prompts, deviations:
Export filename / session ID checked:
```

## Concise export and skip analysis

Treat `complete`, `skipped`, `interrupted` and `in_progress` as different outcomes. Skip ends the current attempt immediately and advances; it never creates success evidence. Task 1 levels are separate records, so a skipped level does not discard the other levels. Repeated P# sessions have distinct session IDs.

`interactionCount` counts pointer presses and non-repeat keystrokes, including typing. Study controls are excluded. The event timeline also contains semantic actions such as selection, gesture, scope change, preview, committed edit and reference review; these provide context and must not be added to the physical interaction count. Times are UTC ISO timestamps, and duration includes prompt reading, AI waits and tab absence. `tab_hidden`/`tab_visible` events support coding interruptions. No literal typed keys or input values are exported.

The export contains all saved sessions in the current browser. Download study records from the final screen, or from Study with mode off. The simplified v2 export also works for previously saved records; any missing historical fields remain absent rather than being invented.
