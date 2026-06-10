# EventManager — Product Review
**Reviewer:** Claude (Product Consultant)
**Date:** June 10, 2026
**Version reviewed:** 1.0.0 (post Phase 9 polish)

---

## 1. What We Built Well

**Core loop is solid.** The three things an event producer does every day — create an event, assign workers with pay, mark them paid — all work cleanly in 3 taps or fewer. The original design principle was met.

**Role separation is exactly right.** Workers see only their own shifts and pay. They cannot edit anything. This removes the owner's fear of giving workers app access, which is a real blocker in this kind of business.

**RTL implementation is thorough.** Getting Hebrew RTL right in React Native is genuinely hard. The `rtl.js` bootstrap solution, the `flex-start = right` discipline, and the date formatting with `he-IL` locale all work together correctly. This is not trivial and was done properly.

**Dashboard is genuinely useful.** Today's events + this week at a glance, with a stat row showing unpaid count, is exactly what a busy owner needs when they open the app in the morning. The time-aware greeting is a small touch that makes the app feel personal.

**Payment tracking is the right model.** Grouping payments by worker (not by event) in the Payments screen is the correct choice — the owner's mental model when paying is "who do I owe?" not "what event was it?" The unpaid-first sort order is also the right call.

**Worker creation flow is smart.** Saving and restoring the owner session around `signUp()` is non-obvious and was solved correctly. Workers can be added without the owner being logged out — this would have been a critical UX failure otherwise.

**Color system is consistent.** Green = paid, red = unpaid, blue = upcoming is applied everywhere without exceptions. A user learns the system once and it holds throughout the app.

---

## 2. What Can Be Improved

**The language switcher does nothing.** Settings has Hebrew/Arabic options with a checkmark UI, but selecting Arabic has no effect. For a client who serves Arabic-speaking staff, this is a broken promise on the settings screen. Either ship it working or remove the option entirely before handoff. A placeholder that says "coming soon" is better than a control that silently does nothing.

**Pay amount editing is fragile.** Editing pay inline in EventDetailScreen uses `onEndEditing`, which is known to be unreliable on Android. An owner editing pay during a live event on an Android phone may silently lose their change. This should use an explicit "save" button or a modal with confirmation.

**Worker profile is read-only but has no depth.** The StaffList shows a worker's name and phone, and the EditWorker screen only edits those two fields. There's no way to see a worker's full history (how many events, total earned, total paid) from the staff module. The owner has to mentally cross-reference Staff and Payments.

**No confirmation that an event was saved.** After creating or editing an event, the app navigates back with no success feedback. A brief toast or banner ("האירוע נשמר") would reassure the user the save worked, especially on slow connections.

**AddEventScreen has no back button at the top.** There's only a "ביטול" button at the bottom of a scrollable form. If the owner opens Add Event by accident, or after scrolling down, they can't easily cancel without scrolling back up. Add a back arrow in the top bar.

**Time field is free text with no validation.** The time field accepts anything. An owner typing "8pm" instead of "20:00" will get unformatted display text in the event cards. This should be a time picker (the library is already installed) or at minimum enforce `HH:MM` format on blur.

**Dashboard "this week" misses done events.** If an event was marked done mid-week, it disappears from the dashboard. An owner reviewing Wednesday's paid event on Thursday can't find it on the dashboard. The query should include done events within the current week.

**Worker shifts don't show past events.** Workers only see upcoming shifts. There is no history view showing past events they worked. A worker asking "how many events did I work this month?" has no answer in the app.

---

## 3. Missing Features

**Push notifications (most impactful gap).** When the owner assigns a worker to an event, the worker finds out only if they open the app. In practice, workers will be told via WhatsApp and ignore the app. Push notifications on assignment — and a reminder the day before — would make the worker side of the app actually used. The infrastructure note (expo-notifications + Supabase Edge Function) is already documented in PROGRESS.md as Option D.

**Bulk payment marking.** The owner after a large event may need to mark 10 workers paid at once. Marking each one individually in the Payments SectionList is slow. A "mark all paid for this event" action on the EventDetail screen, or checkboxes in the Payments screen, would save significant time.

**Worker role/specialty.** All workers are treated identically. In reality, an event crew has a DJ, waitstaff, a photographer, security. The owner assigns "3 waiters and 1 DJ" — not just "4 workers." Adding a `role` or `specialty` field to workers (e.g., "מנהל במה", "צלם", "שרות") would make assignments far more useful.

**Event templates / duplication.** Many events are recurring or similar (same venue, same crew, similar pay). There is no way to duplicate an event. An owner who runs a weekly corporate dinner has to re-enter everything from scratch each time. A "שכפל אירוע" (Duplicate Event) option on EventDetail would save significant friction.

**Expense tracking.** Event producers have costs beyond worker pay — venue, equipment, catering. The app tracks what the owner owes workers but not what the event costs overall. Even a simple "הוצאות" notes field or a basic expense list per event would make this more complete as a business tool.

**Worker attendance / confirmation.** The owner assigns workers, but there's no mechanism for workers to confirm they're coming, or for the owner to record who actually showed up. A simple "אישר הגעה" confirmation from the worker side, or a post-event attendance checkbox on the owner side, would close an important operational loop.

**Search.** There is no search anywhere in the app. An owner looking for a specific past event or a worker named "יוסי" has to scroll through the full list. With 50+ events and 20+ workers, this becomes painful.

**Contact worker directly from the app.** Workers have phone numbers in their profiles but the app doesn't use them. A single tap to call or WhatsApp a worker from StaffList or EventDetail (using `Linking.openURL('tel:...')` or `wa.me/...`) would be a small addition with high daily-use value.

---

## 4. UX Improvements

**Make the Payments tab the owner's most prominent action.** The current tab order is Dashboard → Events → Staff → Payments → Settings. In real event management, the most frequent end-of-event action is paying workers. Payments should be the second tab, not the fourth.

**Add worker payment status to EventDetail.** The EventDetail screen shows assigned workers but not whether each is paid. The owner has to navigate to Payments to check. The paid/unpaid badge should be visible directly on the worker row in EventDetail, with a one-tap toggle — the same toggle that exists in Payments — so the owner can pay workers right from the event they just ran.

**Show phone number in StaffList.** Currently the StaffList shows name and the `#5B6EF5` avatar. Adding the phone number as a subtitle on each row lets the owner quickly dial without tapping into edit mode.

**"היום" badge on events list.** Events happening today should have a prominent "היום" highlight in the EventsList, not just the regular blue upcoming stripe. An owner scanning the list at 10am needs today's events to jump out immediately.

**Swipe-to-delete on lists.** Deleting a worker or removing them from an event currently requires tapping a small ✕ circle. A swipe-left gesture for delete (standard iOS pattern) is faster and more forgiving — it requires a deliberate swipe rather than an accidental tap.

**Keyboard dismiss on scroll.** On long forms (AddEvent, AddWorker), tapping outside a field doesn't always dismiss the keyboard. Add `keyboardShouldPersistTaps="handled"` on ScrollViews consistently so the keyboard doesn't cover the next field as you scroll down.

**Loading states on navigation.** When tapping an event row, there's no visual feedback while EventDetail loads. A brief loading indicator prevents double-taps and the perception of an unresponsive app.

---

## 5. Nice to Have Features

**Event status history / audit log.** A simple timestamped log of "event created", "worker assigned", "marked paid" per event would give the owner confidence that the app is a reliable record. Useful if there's ever a payment dispute.

**Summary report export.** A monthly PDF or CSV of events, workers, and payments. The data is all in Supabase — a "ייצא דו״ח" button that generates a simple summary could be done via a Supabase Edge Function and is something a business owner can show an accountant.

**Photo attachment per event.** Allow adding a photo or document (venue contract, floor plan) to an event. Low technical cost with Supabase Storage, high practical value for a producer.

**Worker notes field.** A private notes field on each worker visible only to the owner (e.g., "reliable", "needs ride", "don't book for weddings"). Small, but owners of any crew keep this information somewhere.

**Dark mode.** The current `#F4F6F9` background and `#1a1a2e` text palette is clean but entirely light. Dark mode would make the app easier to use during events in dark venues, which is the exact context this owner uses it in.

**App icon and splash screen.** Currently using default Expo assets. A branded icon makes the app feel like a product, not a prototype. This matters at client handoff.

**In-app changelog / "what's new."** When the owner updates the app, a brief "מה חדש" screen on first launch after an update communicates that the developer is actively maintaining it.

---

## 6. Potential Problems

**The language switcher is a trust risk.** As noted above — a settings control that does nothing will be the first thing the owner tests with an Arabic-speaking worker. When it fails to work, it damages confidence in the whole app. This needs to be removed or fixed before handoff, not left as a known issue.

**No input validation means bad data.** Phone fields accept any string. Pay amounts could theoretically be set to 0 by accident (the inline edit in EventDetail has no minimum guard). A worker created with no phone number just shows a blank. None of these crash the app, but they create silent data quality problems the owner will notice months later.

**Worker creation is a fragile multi-step flow with no recovery.** If the network drops between `signUp()` and the session restore, the owner is logged out and the worker account exists in Auth but has no profile row in `public.users`. This worker is now invisible in the app but exists in Supabase. There's no retry screen, no error recovery, and no admin tool in the app to detect orphaned accounts. For a client who adds workers infrequently, this edge case may never hit — but it should be documented explicitly in the handoff notes.

**Debug logs in ShiftsScreen must be removed.** `console.log('[ShiftsScreen] worker_id:', ...)` is still in the production code. This is a medium-severity issue that leaks internal implementation details and can confuse any future developer looking at the console.

**Single owner account, no backup.** There is only one owner account and it's set up manually via SQL in Supabase. If the owner forgets their password, the reset flow is standard Supabase email — which may or may not reach them depending on spam filters. There's no in-app "forgot password" flow. This should be documented clearly in the handoff and ideally a recovery procedure should be written down.

**The app is Hebrew-only in practice.** Even though `language_preference` exists in the schema and Arabic is in the UI, the app is 100% Hebrew strings. An Arabic-speaking worker who logs in sees Hebrew. If the client has Arabic-speaking staff, this is a day-one usability problem, not a future enhancement.

**No offline support.** All data is fetched live from Supabase on every screen focus. If the owner is at a venue with poor signal (common for events in basements, outdoor locations, remote venues), the app will show empty screens with no cached data and no informative error messages. At minimum, the app should show a clear "אין חיבור לאינטרנט" message rather than silently empty lists.

**Payments can be "unmarked" with no confirmation of who did it.** The toggle to reverse a payment (mark as unpaid) has a confirmation alert, but there's no timestamp or audit trail. If a payment was marked paid by mistake and later reversed, there's no record. Given that this is a payment tool, some form of action history would protect the owner.

---

## Summary: Priority Order for Next Work

| Priority | Item |
|---|---|
| 🔴 Must fix before handoff | Remove debug logs · Fix or remove language switcher · Delete dead files |
| 🟠 High value, low effort | Payment toggle in EventDetail · Phone tap-to-call · Back button in AddEvent · Time picker replacement |
| 🟡 High value, higher effort | Push notifications · Bulk pay marking · Worker confirmation/attendance · Event duplication |
| 🟢 Polish | Dark mode · Export report · App icon · Worker specialty field |
