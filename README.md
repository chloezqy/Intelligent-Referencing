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

**The collaboration is real:** two people connect to the same room and receive references and replies live. **The interpretation is rule-based:** the prototype uses where you draw and information already attached to the sample elements. It does not currently use an external AI model.

## Find your way around

| Area | What it does |
| --- | --- |
| Top bar | Access the shared room, zoom controls, Fit view and Help. |
| Left icon rail | Open Layers, References, Selection or Tasks. Each panel opens beside the icons. |
| Layers | Browse the items that make up the sample screens. |
| Selection | Inspect your current selection and change its scope. |
| References | Create or join a room, share references, and read or reply to requests. |
| Tasks | Choose a research level, read instructions and check progress. |
| Center canvas | Explore the six mobile screens. Pan and zoom to inspect their contents. |
| Bottom controls | Switch between Select, Smart Reference and Pan. Add a note to a reference request. |

The bottom input helps you describe why your collaborator should look at the selected items. It is not a general-purpose AI chat or a design-editing command box.

## Start with selection

1. Choose **Select** to click an item. Hold **Shift** while clicking to add or remove items from your selection.
2. Choose **Smart Reference** and draw across a few related items, such as two category chips on Home.
3. Inspect the suggested interpretation. Use **Touched**, **Screen** or **All Screens** to adjust how broadly the reference applies. You can also use Select and Shift-click to correct individual targets.
4. Use **Share to User A/B** when you are ready to discuss the selection with someone.

Use **Pan** or hold **Space** while dragging to move around the canvas. Use the zoom controls to look closer, and **Fit view** to find all six screens again. Help contains the keyboard shortcuts.

You can select and reference the sample content, but you cannot currently move, resize, recolor or edit its text.

## Try it with another person

### User A: create and send

1. Open **References** or the room control in the top bar.
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

For Levels 4–5, A manages the task and B participates through References. Create a room before starting these levels. If B is offline, the panel tells you; it does not substitute a simulated person.

You can switch levels without resetting them. **Next Task** appears after completion. **Reset task** starts a fresh attempt, so previous shared references cannot complete it. **Locate task area** only changes your view—it does not select anything or complete a task.

Completion checks recorded actions and selected objects. It does not judge the quality of a review, whether a note explains an inconsistency well, or whether someone understood the design.

## What is saved?

- **Shared room:** references, notes, replies, review status and recorded opening/navigation actions are saved by the running server.
- **Your browser:** your room identity, research attempts, progress and local interaction log are saved in browser storage. Clearing that storage loses those local records and can prevent you from rejoining as the same participant.
- **Research export:** choose **Export research events** in Tasks to download a record of attempts, selection methods, gestures, corrections and collaboration actions.

Refreshing normally restores your identity, task history and shared references. Keeping server records after a restart requires retaining the server’s data folder. Task logs remain local to each participant’s browser.

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

Select two or more objects, then choose **Compare** in the small selection toolbar. A compact share popup opens beneath a temporary pin on the selected objects. Expand **Targets and comparison** to inspect the comparison before sending. Nothing is sent until you press **Send**. You can also choose **Ask for review**, or use **More → Ask for help**. For one object, Review, Help and Share are available directly.

The comparison lists the sample objects’ actual text, dimensions, colors, corner radius, available typography and screen positions. Differences appear first; expand **Matching properties** to see what is the same. **Not specified** means that the sample data does not contain that property. This is a rule-based property comparison, not an AI opinion or a command to change the design.

After sharing, both people see pins attached to the referenced objects. Pins move with the design when you pan or zoom. Nearby pins combine into a count to keep the canvas clear: click the count to open its conversation, or choose a conversation if several overlap. All pins belonging to a reference open the same discussion. A check mark indicates reviewed status. Opening a pin highlights its targets without moving your view; **Locate referenced elements** moves your view when you choose.

These interactions adapt the object pins, contextual actions and comparison presentation from [Prototype 3](https://github.com/Rok1006/AI_Widget_Referencing/tree/main/src/prototypes/03-cross-application). The new React implementation uses Smart Reference’s real rooms and saved object IDs. It does not include the old prototype’s scripted User B, automatic style matching or editing tools. Public backend deployment is still separate work.

## Keep references tidy

Click a single reference pin to open its conversation in **References**. If a pin represents several overlapping references, it opens a small list with short labels, reference numbers, times and statuses. Full messages and replies appear only after you choose a reference, inside the References panel.

To clear an old test reference from the canvas, open it and choose **Archive reference**. It disappears from both users’ pins and active lists immediately. Find it under **Archived** and choose **Restore reference** to bring it back. Either participant can archive or restore. Archiving preserves the original targets, notes, replies and task history; it does not count as a review. Archived conversations are read-only until restored.


### Share beneath the pin

The share action names the recipient: **Share to User A** or **Share to User B**. Its compact popup contains the intended action, note and Send button. It opens beneath the object’s temporary pin when space allows, otherwise moves above it to stay inside the canvas. Closing the popup keeps the unsent request; click its **+** pin to reopen it, or choose **Resume share popup** in References. **Cancel draft** discards it. Saved references and replies continue to use the existing References panel.

### Bring another user to your selection

Select objects and choose **Bring User A/B here**. This opens a **Look at this** request with fixed targets; press **Send** to deliver it. The recipient gets a small notification with **View** and **Later**. View zooms to the objects and opens the conversation. It never moves their canvas before they choose View. The sender can see a “viewed the referenced elements” receipt in the conversation; this records a visit, not continuous live viewing. Later hides the notification for the current page visit; the saved reference remains in References. Offline recipients receive it when they reconnect.

### Collaborator cursors

When both users are connected to the same room, each sees the other’s cursor over the canvas: purple for User A and teal for User B. Cursors track design coordinates, so each person can pan and zoom independently. They disappear when the pointer leaves the canvas, the tab loses focus, the participant disconnects, or updates become stale. Cursor positions are temporary presence data and are not saved in the room history.

### Compare what both users are selecting

Each participant sees the other’s current selection with a dashed outline and user label. These are live selections, separate from saved reference pins. Both users need to be online and have selected objects before **Compare with User A/B’s selection** becomes available.

Choose Compare to freeze both selections in the pin popup. **Context suggestions · rule-based** describes their relationship and offers possible purposes, such as visual or wording consistency for primary buttons. Choose a purpose or write your own, add a note, and press **Share comparison**. This uses metadata rules, not a real AI model.

The property table labels objects by the user who selected them; objects selected by both carry both labels. Changes to live selections never alter the draft or conversation. **Refresh comparison** explicitly captures the latest selections while retaining your purpose and note. Draft snapshots expire after one hour or a server restart; refresh the comparison if prompted. Saved comparisons and replies survive refresh and server restarts. The other user can open the reference, locate both sets of targets, and reply or mark it reviewed.

Manual Compare references within your own selection still work. All five research levels retain their existing completion checks. No design edits or viewports are synchronized.
