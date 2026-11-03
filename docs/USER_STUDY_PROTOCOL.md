**Intelligent Referencing**

**USER STUDY PROTOCOL**

# 1. Purpose and study design

Evaluate whether a designer can (1) select intended groups at three levels of complexity using normal selection or Rough Gesture, (2) preview and apply the design system to multiple cards, (3) share an object reference and resolve it from User B’s perspective, and (4) selectively resolve a styling difference across layouts.

| Segment                     | Duration  |
| --------------------------- | --------- |
| Introduction and pre-survey | 4 min     |
| Orientation                 | 2 min     |
| Four core tasks             | 10–20 min |
| Final verbal survey         | 4 min     |
| Total                       | 20–30 min |

Method: formative, think-aloud usability observation. Participants choose their selection method independently at each level; they do not repeat levels using both methods. This single-condition study does not establish speed gains, a controlled comparison between selection methods, or causal AI benefits. Applying the complete design system is deterministic; observe optional AI suggestions separately when assessing AI judgment.

Study mode is a single-browser role-play: one participant switches between User A and User B. Do not present B’s behavior as that of an independent collaborator. A two-person study requires the real-time room workflow outside guided mode, separate browsers/people, both clients’ records, and facilitator timing. Guided mode resets to demo and does not aggregate paired real-time metrics.

# 2. Opening

**SAY**  “Thank you for helping us evaluate Smart Reference. We are testing the prototype, not you. It lets designers select objects, review suggestions, make changes, and discuss a reference with someone else. Some features use AI and may take time or make mistakes. As you work, please say what you are trying to do, what you expect, and anything that surprises you. Today you will use both User A and User B in the same browser. This simulates a handoff; there is no second person sending automatic replies. You can skip any task if you cannot or do not wish to continue.”

**MODERATOR**  Follow the consent procedure; separately request any required screen/audio recording consent.

# 3. Short verbal pre-task survey (4 min)

**ASK**

- How often do you use design tools, and how do you normally select a group or point a teammate to a particular object? Record frequency/tool and one example.
- How confident are you that you can select exactly the objects you intend in a complex design? 1 = not at all confident; 7 = extremely confident.
- How confident are you in deciding whether to use an AI design suggestion? Same 1–7 scale. What would you need to see before applying?

# 4. Orientation (2 min)

**MODERATOR**  Show six shopping screens, Layers, tool dropdown, zoom/Fit, Study panel, design-system board below the screens, and A/B perspective switcher. Explain pan and both selection methods. Normal selection follows the layer hierarchy: click selects an enclosing object, double-click drills into it, Cmd/Ctrl-click selects a deep layer, and Shift-click extends selection. Layers can also be expanded to select nested objects. Rough Gesture offers interpretations and scopes that the participant reviews and confirms. Permit brief practice on an unrelated object such as the navigation title.

**MODERATOR**  Switch User study mode Off → On in the top bar. The original document and a fresh User A demo are restored, and Study opens. Enter the assigned participant code, such as P1–P20, and select Start study. Use P0 for a pilot. Codes are entered manually; the system does not assign participants automatically.

**MODERATOR**  Explain that each completed level or task automatically opens the next prompt and starts its timer. Prompt reading is included in recorded time. Skip this level or Skip task advances without marking success. Keep verbal answers and assistance notes separately. Ask the task-specific questions below after the full task sequence so interviews do not inflate the next task’s timer.

# 5. Task 1 — Selection at three levels

**SAY**  “Complete three selection tasks. For each one, choose normal selection or Rough Gesture—whichever you prefer. You may choose a different method at each level. Select exactly the requested objects without extras. If you use Rough Gesture, review and confirm its interpretation.”

1. “Select the four ‘Add to Bag’ buttons on Home.”
2. “Select all eight category/filter chips across Home and Search.”
3. “Select all 15 product images across the shopping screens, including Favorites and Cart. Exclude the design-system sample.”

**OBSERVE**  Method choice at each level; hierarchy navigation; tool discovery; intended versus touched objects; interpretation and scope; candidate hover/selection; extra or missing objects; corrections; confirmation; cross-screen navigation.

**MODERATOR**  Each level is timed separately and completes when the exact target set is selected. Normal selection completes directly; Rough Gesture requires interpretation confirmation. Selection clears before the next level. Record skips and assistance separately from successful completion.

**ASK**

- Ease 1–7 for each level
- Confidence that the group matches intent 1–7 for each level
- Why did you choose that selection method?
- If you used Rough Gesture, what did you think would happen when you chose an interpretation?
- Where did navigating nested layers help or hinder you?

# 6. Task 2 — Apply the design system

**SAY**  “Select all four product cards on Home. Apply the design system, inspect the preview, and apply the changes to all four cards. Keep the product content unchanged.”

**OBSERVE**  Selecting complete cards rather than only their images; finding Apply design system in the existing purple Suggested actions block; understanding the library source and affected objects; current/proposed values; Preview versus Apply; optional use of AI recommendations.

**MODERATOR**  The design-system board below the screens contains the actual style sources. Full application updates applicable card, image-radius, typography, button, and internal-spacing styles while preserving product content and card layouts. Completion requires applied changes covering all four Home cards and final styles matching the library. Preview alone or a partial application does not complete the task.

**ASK**

- Ease 1–7
- Confidence in applied changes 1–7
- Perceived control 1–7 (none to complete)
- Did the preview make it clear what would change across all four cards?
- If you used an AI suggestion, what evidence made you accept or reject it?
- (Optional, after the timed sequence) ask participant to Undo and explain expected restoration

# 7. Task 3 — Reference handoff and User B review

**SAY**  “Select any part of the design and share a reference with User B. Then switch to User B, open the reference, and resolve it using Mark reviewed. You may add a note, mention, invitation, or reply if it helps.”

**OBSERVE**  Chosen reference and target scope; request intent and clarity; optional note/mention/invitation; finding the request as B; View/Later interruption control when used; reference pin/location; distinction between opening, replying, and marking reviewed.

**MODERATOR**  Any selected object or group qualifies. Completion requires a new reference shared from A to B during this task and marked reviewed by B. A specific object, intent, note, mention, invitation, or reply is not required. The prototype automatically returns to User A for the next task.

**ASK**

- Ease 1–7
- Clarity of A’s request 1–7
- What context was missing?
- What did Mark reviewed mean to you?

# 8. Task 4 — Cross-screen comparison

**SAY**  “Compare the first product card on Home and the first on Search. Keep their different layouts, but make the Search card use the Home card’s corner radius. Preview the specific change before applying it.”

**OBSERVE**  Selecting card roots; comparison discovery; selective resolution and direction; understanding AI recommendations versus recorded differences; preservation of differing layouts.

**MODERATOR**  Completion requires a comparison preview and an applied change to only the Search card’s corner radius, matching the current Home card. After successful Task 2, Home normally uses the library’s 12px radius. Verify source/target direction rather than assuming selection order. Completing or skipping this task opens the final study screen.

**ASK**

- Ease 1–7
- Confidence in the comparison change 1–7
- Why did you keep the size difference but change the radius?

# 9. Short verbal post-session survey (4 min)

**ASK**

- How confident are you now that you can select exactly the group you intend? 1–7, same pre-survey anchors.
- How confident are you now in deciding whether to use an AI design suggestion? 1–7, same anchors. What changed your confidence?
- Which part was most useful, and which part was most confusing or risky? How would this fit your usual design review workflow?
- Is there anything else you expected the prototype to do?

**MODERATOR**  Collect the task-specific follow-ups, then select Download study records on the final screen. Records are stored locally in this browser and site; the JSON includes all saved sessions. Check the participant code, three Task 1 level records, and Tasks 2–4. Retain completed, skipped, and interrupted outcomes separately.

**MODERATOR**  The concise export contains session/task identifiers, outcomes, timestamps, durations, interaction counts, and timestamped actions. Interactions count pointer presses and non-repeated keystrokes, including typing; study controls, pointer movement, and wheel scrolling are excluded. Task time includes prompt reading, AI waits, and time away from the tab. Survey responses and assistance notes remain outside the prototype.

**MODERATOR**  Turn study mode off after exporting. For the next participant, toggle it on to restore the original state and enter the next code. Existing study records remain saved. The reset control in References also restores the prototype and ends an active study; it does not erase study records.
