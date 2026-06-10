# Event Manager — Project Spec

A simple mobile app for an event owner to manage events, assign workers, and track payments. Built mobile-first with full RTL support for Hebrew and Arabic.

## Two Users, Two Experiences

**Owner** (`Admin role`) — Creates events, assigns workers, sets pay per event, marks workers as paid. Full control of everything.

**Worker** (`Read-only role`) — Logs in and sees only their own upcoming shifts and payment status. Nothing else.

## App Screens — Owner Side

| Screen | Type | Purpose |
|---|---|---|
| Dashboard | Home | Today's events at a glance. Quick summary of unpaid workers. |
| Events | Core | Full list of all events (past & upcoming). Tap to open and manage. |
| Event Detail | Core | Date, venue, workers assigned, pay per worker, paid/unpaid status. |
| Staff | Core | Full list of workers. Add, edit, or remove. See their history. |
| Payments | Core | Overview of what's owed to each worker across all events. Mark as paid. |
| Settings | Support | Switch language (Hebrew / Arabic). Manage account. |

## App Screens — Worker Side

| Screen | Type | Purpose |
|---|---|---|
| My Shifts | Home | List of upcoming events the worker is assigned to. |
| My Payments | Core | What they've earned per event and whether it's been paid. |
| My Profile | Support | Name, language preference, log out. |

## Database — 4 Tables

**Users** — `id` · `name` · `phone` · `role (owner/worker)` · `language_preference` · `created_at`

**Events** — `id` · `title` · `date` · `venue` · `status (upcoming/done)` · `notes` · `created_by`

**Event_workers** — `id` · `event_id` · `worker_id` · `pay_amount` · `is_paid` · `paid_at`

**Notifications** *(Phase 2)* — `id` · `user_id` · `message` · `is_read` · `created_at`

## Design Principles — Keep It Simple

- Big tap targets, no tiny buttons — this owner uses the app while managing a live event.
- Full RTL support for Hebrew & Arabic — layout flips automatically.
- Color-coded statuses — green = paid, red = unpaid, blue = upcoming event.
- 3 taps max to complete any task — no deep menus or hidden options.

## Tech Stack

- **React Native + Expo** — Cross-platform mobile app (iOS & Android from one codebase).
- **Supabase** — Database, authentication, and real-time updates. Free to start.
- **Claude Code** — Builds the app with you step by step in your terminal.
- **Cowork** — Manages your spec doc, notes, and project files on your desktop.

## Build Order — Phase by Phase

1. **Project setup** — Expo project, Supabase account, folder structure, Claude Code initialized.
2. **Auth screens** — Login for owner and workers. Supabase handles passwords securely.
3. **Staff module** — Add/edit/list workers before events need them.
4. **Events module** — Create events, assign workers, set pay per worker.
5. **Payments module** — View what's owed, mark as paid, payment history.
6. **Worker view** — Read-only screens for workers — shifts and pay status.
7. **Language & polish** — Hebrew/Arabic toggle, RTL layout, final UI cleanup.
8. **Testing & deploy** — Test on real device, publish via Expo Go or app stores.
