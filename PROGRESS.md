# EventManager App — Progress Report
**Last updated:** 2026-06-10 (rev 5)
**Project root:** `C:\Projects\EventManager\`
**App folder:** `C:\Projects\EventManager\EventManagerApp\`

---

## 1. What Has Been Built

### Phase 1 — Project Setup ✅
- Fresh Expo project scaffolded with **SDK 54** (`expo@54.0.35`, `react-native@0.81.5`, `react@19.1.0`) to match **Expo Go v54.0.2** on the owner's iPhone.
- Supabase client configured in `src/lib/supabase.js` with `AsyncStorage` for session persistence.
- Full folder structure established under `src/`.

### Phase 2 — Authentication ✅
- `src/lib/supabase.js` — Supabase client with `AsyncStorage`, `autoRefreshToken`, `persistSession`.
- `src/context/AuthContext.js` — React context exposing `session`, `profile`, `loading`, `signIn()`, `signOut()`. Fetches user row from `public.users` on login. Full `session` object exposed (needed for `session.user.email` in worker profile and settings).
- `src/screens/auth/LoginScreen.js` — Email + password login. Inline error via `Alert`. Loading spinner on button. `KeyboardAvoidingView` for iOS.
  - **UI polish**: Blue circle with "מא" initials. Card at `paddingTop: SCREEN_HEIGHT * 0.18`.
  - **iOS Save Password fix**: `textContentType="oneTimeCode"` + `autoComplete="off"` on password; `textContentType="username"` + `autoComplete="off"` on email.
- `App.js` — `SafeAreaProvider` → `AuthProvider` → `NavigationContainer` → `RootScreen`. Routes to `LoginScreen` / `OwnerTabs` / `WorkerTabs` based on session and `profile.role`.

### Phase 3 — Staff Module ✅
- `src/screens/owner/staff/StaffListScreen.js` — Lists all workers ordered by name. Avatar (initial, `#5B6EF5` circle), name, phone. **Real-time search bar** (below header) with `search-outline` Ionicons icon — filters by name and phone simultaneously; phone comparison strips non-digits. "לא נמצאו עובדים" empty state when search yields nothing. Search clears on screen blur via `useFocusEffect` cleanup. **Tap-to-call**: green `call-outline` Ionicons button (36×36, `#ECFDF5` bg) next to each worker — opens `tel:` via `Linking.openURL`. Delete button is a `32×32` `#FEE2E2` red circle with `✕`. `OfflineBanner` shown at top.
- `src/screens/owner/staff/AddWorkerScreen.js` — Form: name (RTL), phone, email, password. Creates auth account via `supabase.auth.signUp` with session save/restore flow. **Per-field inline validation**: name/email/password show "שדה חובה"; phone shows "מספר טלפון לא תקין" if not 9–10 digits. **Success toast** "העובד נוסף בהצלחה ✓" before navigating to StaffList.
- `src/screens/owner/staff/EditWorkerScreen.js` — Pre-filled name + phone form with same per-field validation. **Worker history at top of screen**:
  - **Stats card**: 4 columns — total events assigned (count), total earned (black `#1a1a2e`), total paid (green `#10B981`), total owed (red `#EF4444`). Same summary card style as PaymentsScreen.
  - **"היסטוריית אירועים"**: last 5 events the worker was assigned to, sorted by event date descending. Each row shows event title, date, pay amount, and paid/unpaid badge. Section hidden if worker has no history.
  - History loaded via `useEffect` on mount with a `event_workers` query (selects `worker_id, pay_amount, is_paid, events(id, title, date)`). `worker_id` must be in the select list or RLS silently returns no rows.
  - **Success toast** "הפרטים עודכנו בהצלחה ✓" before navigating back.
- `src/navigation/StaffStack.js` — Native stack: `StaffList` → `AddWorker` / `EditWorker`.
- Worker deletion calls Supabase RPC `delete_worker_account(user_id)`.

### Phase 3.5 — Hebrew / RTL ✅
- `src/i18n/he.js` — Single file with all Hebrew strings. Functions for dynamic strings.
- **`src/lib/rtl.js`** ← **CRITICAL FILE** — must be the VERY FIRST import in `App.js`:
  ```js
  import { I18nManager } from 'react-native';
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  ```
- **`App.js` RTL bootstrap**: `wasAlreadyRTL` check + `Updates.reloadAsync()` triggers native layout engine RTL flip on first launch. Throws silently in Expo Go dev mode — caught with `.catch(() => {})`.
- **RTL alignment rule**: `flex-start` = physical RIGHT, `flex-end` = physical LEFT in RTL context.
- **Date formatting** uses `'he-IL'` locale throughout.
- **Date parsing safety**: all `formatDate`/`parseDate` functions guard null/undefined/NaN and append `'T00:00:00'` to bare 10-char date strings (iOS UTC-midnight bug).
- **Back buttons**: `{rtl ? \`${t.back} →\` : \`← ${t.back}\`}` pattern.

### Phase 4 — Events Module ✅
- `src/screens/owner/events/EventsListScreen.js` — Lists all events ordered by date descending. Filter tabs: הכל / קרוב / הסתיים. **Real-time search bar** (below filter tabs) with `search-outline` Ionicons icon — filters by title and venue within the active filter tab. "לא נמצאו אירועים" empty state when search yields nothing. Search clears on screen blur. **"היום" badge**: events today show an orange `#F59E0B` "היום! 🎉" badge plus `borderWidth: 1.5, borderColor: '#F59E0B'` card border; always sort to top regardless of active filter (stable sort). `OfflineBanner` shown at top.
- `src/screens/owner/events/AddEventScreen.js` — Fields: title (RTL), date (calendar picker), **time (native time picker, default 20:00, saves as HH:MM)**, venue, notes. **Back arrow** in top row (Ionicons `arrow-forward-outline` in RTL). **Per-field validation**: title shows "שדה חובה" if empty. **Success toast** "האירוע נוצר בהצלחה ✓" before navigating to EventsList.
- `src/screens/owner/events/EditEventScreen.js` — Pre-filled edit form. Date picker. Time field is still free text (⚠ see Known Issues). **Success toast** "האירוע עודכן בהצלחה ✓" before navigating to EventDetail.
- `src/screens/owner/events/EventDetailScreen.js` — Full event management:
  - Top row: back button + **"⎘ שכפל"** duplicate button + "✏️ ערוך אירוע" edit button.
  - Title, Hebrew date + time, venue, notes.
  - **Status toggle**: `upcoming` = white card + grey border; `done` = solid `#10B981` green + white text.
  - **Worker rows**: pay amount editable via `TextInput` + `onEndEditing`. **Pay validation**: 0 or negative silently reverts (`payKeys` remount trick). Remove button = `32×32` `#FEE2E2` circle with `✕`.
  - **Per-worker payment toggle**: green "סמן כשלום ✓" when unpaid; grey "שולם ✓" label when paid. Confirmation alert → updates `is_paid = true, paid_at = now` → updates local state instantly. **Success toast** "סומן כשלום ✓".
  - **Bulk payment button**: when 2+ workers are unpaid, a green "סמן את כולם כשלום ✓" button appears below the workers list. Tapping shows confirmation alert "לסמן את כל העובדים באירוע זה כשלום? ([X] עובדים)". On confirm, single Supabase `update` for all unpaid rows (`event_id = eventId AND is_paid = false`), local state updated immediately, button auto-hides once all paid. **Success toast** "כל העובדים סומנו כשלום ✓".
  - **Duplicate event**: confirmation alert → inserts new event with today's date + same title/venue/time/notes/status=upcoming → **success toast** "האירוע שוכפל בהצלחה ✓" → `navigation.replace` to new EventDetail.
  - "+ שבץ עובד" expandable section with unassigned workers.
  - Delete event with Alert confirmation.

### Phase 5 — Owner Payments Module ✅
- `src/screens/owner/PaymentsScreen.js`:
  - Grand summary bar: סה"כ לתשלום / שולם / טרם שולם.
  - `SectionList` grouped by worker, sorted by unpaid amount descending.
  - Section header: `#5B6EF5` avatar, name, unpaid chip (red), paid chip (green).
  - Each row: event title, date, pay amount, toggle button.
  - Toggle: "סמן כשולם" = `#10B981` green; "בטל שולם" = `#F3F4F6` grey. Confirmation Alert before toggling.
  - `OfflineBanner` shown at top.

### Phase 6 — Worker View ✅
- `src/screens/worker/ShiftsScreen.js` — Upcoming shifts. Query `.select('*, events(*)')` filtered by `worker_id = profile.id`. Client-side filter `status === 'upcoming'`, sorted ascending by date. Days-until chip: red "היום!" / orange "מחר" / orange "בעוד N ימים" (≤7) / blue (>7). `profile?.id` in `useFocusEffect` deps to prevent stale closure. `OfflineBanner` shown at top.
- `src/screens/worker/WorkerPaymentsScreen.js` — Full payment history. Summary card (total earned / paid / pending). Colored stripe per card (green = paid, red = unpaid). `OfflineBanner` shown at top.
- `src/screens/worker/ProfileScreen.js` — Large `#27ae60` avatar, name, role badge. Info card: email from `session?.user?.email`, phone from `profile?.phone`. Sign out button.
- `src/navigation/WorkerTabs.js` — 3 tabs: MyShifts (`list-outline`), MyPayments (`wallet-outline`), Profile (`person-outline`). Active tint `#27ae60`.

### Phase 7 — Owner Dashboard ✅
- `src/screens/owner/DashboardScreen.js`:
  - **Header**: time-aware Hebrew greeting + today's full Hebrew date.
  - **Stats row**: 3 cards with coloured top border — upcoming events (blue), unpaid workers count (orange), unpaid total ₪ (red).
  - **"אירועי היום"** and **"השבוע הקרוב"** sections with tappable event rows.
  - `OfflineBanner` shown at top.

### Phase 8 — Owner Settings Screen ✅
- Built inline in `src/navigation/OwnerTabs.js` as `SettingsScreen` component:
  - Profile card: `#5B6EF5` avatar, owner name, email.
  - Language switcher: Hebrew tappable with checkmark. **Arabic is a non-tappable gray `Text` "ערבית — בקרוב"** — clearly signals unavailability.
  - App version: `1.0.0`.
  - Sign out button (red).

### Phase 9 — UI Polish Pass ✅
Full visual redesign applied to all screens.

**Global design tokens:**
| Token | Value |
|---|---|
| Primary | `#5B6EF5` |
| Background | `#F4F6F9` |
| Cards | `#FFFFFF` |
| Inactive / placeholder | `#9CA3AF` |
| Success / paid | `#10B981` |
| Error / unpaid | `#e74c3c` |
| Text dark | `#1a1a2e` |
| Today highlight | `#F59E0B` |

### Phase 10 — UX Improvements & Polish ✅

- **`src/components/Toast.js`** — `useToast()` hook + `Toast` component. Fades in (200ms) → holds (2100ms) → fades out (200ms). Green `#10B981`, `position: 'absolute'`, `bottom: 32`, `pointerEvents="none"`. Used in 6 screens.
- **`src/components/OfflineBanner.js`** — `NetInfo` subscriber. Auto-shows/hides when connectivity changes. Amber `#FEF3C7` background, `wifi-outline` Ionicons icon (size 18), Hebrew text in `#92400E`. Added to 6 screens: Dashboard, EventsList, StaffList, Payments, ShiftsScreen, WorkerPayments.
- **Payment toggle in EventDetail** — per-worker paid/unpaid toggle without leaving the event screen.
- **Bulk payment in EventDetail** — "סמן את כולם כשלום ✓" button when 2+ workers unpaid; single DB write; local state update.
- **Worker history in EditWorkerScreen** — stats card + last 5 events with amounts and badges.
- **Real-time search in StaffList** — name + phone, clears on blur.
- **Real-time search in EventsList** — title + venue, within active filter tab, clears on blur.
- **Duplicate event** — one-tap from EventDetail; `navigation.replace` to new event.
- **"היום" badge** — orange border + badge on today's events in EventsList; always sorted to top.
- **Tap to call** — `call-outline` button in StaffList opens native dialer.
- **Back button on AddEvent** — RTL-aware Ionicons arrow in top row.
- **Time picker in AddEvent** — native iOS spinner + Android modal. Default 20:00. Saves HH:MM.
- **Input validation** — per-field inline errors across AddWorker, EditWorker, AddEvent. Phone: 9–10 digits. Required fields: "שדה חובה". Pay amount reverts silently if 0 or negative.
- **Success toast** after every save action across all forms.

---

## 2. Complete File Map

```
EventManagerApp/
├── App.js                                        ← Entry point, RTL bootstrap, role routing
├── src/
│   ├── i18n/
│   │   └── he.js                                 ← All Hebrew strings
│   ├── lib/
│   │   ├── rtl.js                                ← RTL bootstrap — MUST be first import in App.js
│   │   ├── supabase.js                           ← Supabase client (gitignored — has live keys)
│   │   └── supabase.example.js                   ← Template committed to git for new cloners
│   ├── context/
│   │   └── AuthContext.js                        ← session, profile, signIn, signOut
│   ├── components/
│   │   ├── ScreenWrapper.js                      ← SafeAreaView wrapper, background #F4F6F9
│   │   ├── Toast.js                              ← useToast() hook + Toast component
│   │   └── OfflineBanner.js                      ← NetInfo-based offline indicator
│   ├── navigation/
│   │   ├── OwnerTabs.js                          ← 5 tabs + inline SettingsScreen
│   │   ├── WorkerTabs.js                         ← 3 tabs
│   │   ├── StaffStack.js                         ← StaffList → AddWorker / EditWorker
│   │   └── EventsStack.js                        ← EventsList → AddEvent / EditEvent / EventDetail
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.js
│       ├── owner/
│       │   ├── DashboardScreen.js
│       │   ├── PaymentsScreen.js
│       │   ├── events/
│       │   │   ├── EventsListScreen.js
│       │   │   ├── AddEventScreen.js
│       │   │   ├── EditEventScreen.js
│       │   │   └── EventDetailScreen.js
│       │   └── staff/
│       │       ├── StaffListScreen.js
│       │       ├── AddWorkerScreen.js
│       │       └── EditWorkerScreen.js
│       └── worker/
│           ├── ShiftsScreen.js
│           ├── WorkerPaymentsScreen.js
│           └── ProfileScreen.js
```

**Dead files** (not imported anywhere — safe to delete):
- `src/screens/owner/OwnerHome.js`
- `src/screens/worker/WorkerHome.js`

---

## 3. Tech Stack

| Tool | Version | Reason |
|---|---|---|
| Expo | 54.0.35 | Matches owner's Expo Go v54.0.2 on iPhone |
| React Native | 0.81.5 | SDK 54 compatible |
| React | 19.1.0 | SDK 54 compatible |
| Supabase JS | ^2.107.0 | Database, auth |
| AsyncStorage | 2.2.0 | Session persistence |
| React Navigation (bottom-tabs + native-stack) | SDK 54 | Screen navigation |
| react-native-screens | ~4.16.0 | Navigation dependency |
| react-native-safe-area-context | ~5.6.0 | iPhone notch/status bar |
| expo-status-bar | ~3.0.9 | Status bar styling |
| expo-updates | SDK 54 | `Updates.reloadAsync()` for one-time RTL reload |
| @react-native-community/datetimepicker | SDK 54 | Native date + time pickers |
| @react-native-community/netinfo | SDK 54 | Offline detection for OfflineBanner |
| @expo/vector-icons (Ionicons) | bundled with Expo | Tab icons, back arrows, call button, search icon, wifi icon |

---

## 4. Database Schema

```sql
-- public.users (extends auth.users)
id uuid PRIMARY KEY (FK → auth.users, cascade delete)
name text NOT NULL
phone text
role text CHECK (role IN ('owner', 'worker'))
language_preference text DEFAULT 'en' CHECK (IN ('en', 'he', 'ar'))
created_at timestamptz

-- public.events
id uuid PRIMARY KEY (gen_random_uuid)
title text NOT NULL
date timestamptz NOT NULL
time text                          ← optional HH:MM string, e.g. "20:00"
venue text
status text DEFAULT 'upcoming' CHECK (IN ('upcoming', 'done'))
notes text
created_by uuid (FK → public.users, set null on delete)
created_at timestamptz

-- public.event_workers
id uuid PRIMARY KEY (gen_random_uuid)
event_id uuid (FK → public.events, cascade delete)
worker_id uuid (FK → public.users, cascade delete)
pay_amount numeric(10,2) DEFAULT 0
is_paid boolean DEFAULT false
paid_at timestamptz
UNIQUE(event_id, worker_id)
```

**Schema migration applied (run manually in Supabase SQL editor):**
```sql
ALTER TABLE public.events ADD COLUMN time text;
```

> ⚠️ `event_workers` does **not** have a `created_at` column. Querying with `.order('created_at')` on this table returns an error and silently yields no rows. Sort by `events.date` in JS instead (as done in EditWorkerScreen history).

---

## 5. RLS Policies

The active set of policies is in `supabase_rls_fix.sql` + `supabase_worker_rls.sql`. The original `supabase_schema.sql` policies had a circular recursion bug — **DO NOT re-apply**.

**public.users**
- `users can read own profile` — SELECT where `auth.uid() = id`
- `owners can read all users` — SELECT where JWT `app_metadata.role = 'owner'`
- `owners can insert users` — INSERT (same JWT check)
- `owners can update users` — UPDATE (same JWT check)
- `owners can delete users` — DELETE (same JWT check)
- Self-insert policy — allows new worker to insert their own profile row immediately after `signUp`

**public.events**
- `owners can manage events` — ALL where JWT `app_metadata.role = 'owner'`
- `workers can read assigned events` — SELECT where `EXISTS (SELECT 1 FROM event_workers WHERE event_id = events.id AND worker_id = auth.uid())`

**public.event_workers**
- `owners can manage assignments` — ALL where JWT `app_metadata.role = 'owner'`
- `workers can read own assignments` — SELECT where `worker_id = auth.uid()`

**Key decisions:**
1. Role read from JWT `app_metadata` (not `public.users`) — eliminates circular recursion.
2. `app_metadata` only writable by service role — prevents privilege escalation.
3. If worker shifts/payments appear empty again, re-run `supabase_worker_rls.sql`.

**RLS quirk — must select filtered columns:**
When filtering `event_workers` by `worker_id`, the column `worker_id` must appear in the `.select()` string or RLS silently returns 0 rows (confirmed in EditWorkerScreen history fix). Always include filtered columns in the select list.

**Supabase RPC:**
```sql
delete_worker_account(user_id uuid)
-- SECURITY DEFINER; verifies caller is owner; deletes from auth.users (cascades everywhere)
```

---

## 6. Key Technical Decisions

### Worker Creation Flow
Because `supabase.auth.signUp()` replaces the current session:
1. Save owner `access_token` + `refresh_token` via `getSession()`.
2. Call `signUp()` → session switches to new worker.
3. Insert worker `public.users` row while authenticated as worker (self-insert policy).
4. Restore owner session via `supabase.auth.setSession({ access_token, refresh_token })`.
5. Show success toast, navigate to `StaffList` after 800ms.

### Navigation Architecture
- `NavigationContainer` at root (`App.js`).
- `headerShown: false` everywhere — all screens draw their own back/nav buttons.
- Stack navigators nested inside tab navigators.
- Navigation params for `EventDetailScreen` **must** use `{ eventId: string }`.
- `navigation.replace('EventDetail', { eventId })` used for duplicate — prevents back-navigation to original event.

### Toast Pattern
`useToast()` returns `showToast(msg)`, `toastMessage`, `toastOpacity`. Screens render `<Toast message={toastMessage} opacity={toastOpacity} />` as a sibling of `KeyboardAvoidingView` inside `ScreenWrapper`. `position: 'absolute'` + `pointerEvents="none"` overlays without blocking interaction. Pattern: `showToast(msg); setTimeout(() => navigation.navigate(...), 800)`.

### Pay Amount Revert (EventDetail)
`TextInput` uses `defaultValue` (uncontrolled) for performance. When `updatePay` receives 0 or negative, it increments `payKeys[assignmentId]` — changing the TextInput's `key` prop forces React to unmount/remount it, resetting `defaultValue` to the original DB value without a full reload.

### Bulk Pay (EventDetail)
Single `supabase.update` with `.eq('event_id', eventId).eq('is_paid', false)` — one DB write for all unpaid workers. Local state patched immediately with `prev.map(a => a.is_paid ? a : { ...a, is_paid: true, paid_at: now })`. Button hidden via computed `assignments.filter(a => !a.is_paid).length >= 2`.

### Worker History (EditWorkerScreen)
Loads on mount via `useEffect`. Query: `.select('worker_id, pay_amount, is_paid, events(id, title, date)').eq('worker_id', worker.id)`. Client-side sort by `events.date` descending to get last 5. `worker_id` must be in select list due to RLS behaviour.

### RTL Architecture
- `src/lib/rtl.js` imported as the first import in `App.js`.
- `const rtl = I18nManager.isRTL` at module level in each screen — frozen to `true`.
- **In RTL mode: `flex-start` = RIGHT, `flex-end` = LEFT.**
- `marginEnd`/`marginStart` used instead of `marginLeft`/`marginRight`.

### Date Parsing
All `formatDate`/`parseDate` functions:
1. Guard `if (!dateStr) return '—'`
2. Append `'T00:00:00'` when `dateStr.length === 10` (bare date) to force local-time parsing on iOS
3. Guard `if (isNaN(d.getTime())) return '—'`

### iOS Save Password Popup Prevention
- Email: `textContentType="username"` + `autoComplete="off"`
- Password: `textContentType="oneTimeCode"` + `autoComplete="off"`

### Owner User Setup (one-time, manual)
1. Create user in Supabase Auth dashboard.
2. Insert row in `public.users` with `role = 'owner'`.
3. Set `app_metadata`:
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = raw_app_meta_data || '{"role":"owner"}'::jsonb
   WHERE id = '<uuid>';
   ```
4. Sign out and back in to get a fresh JWT.

---

## 7. What Is Currently Working

| Feature | Status |
|---|---|
| Login with email/password | ✅ |
| Stay logged in after app restart | ✅ |
| Role-based routing (owner vs worker) | ✅ |
| Sign out | ✅ |
| Full Hebrew UI / RTL layout | ✅ |
| iOS Save Password popup suppressed | ✅ |
| View staff list with search (name + phone) | ✅ |
| Tap-to-call worker from StaffList | ✅ |
| Add worker (creates auth + profile, session restored) | ✅ |
| Edit worker name/phone | ✅ |
| Worker history stats (events, earned, paid, owed) | ✅ |
| Worker event history list (last 5 events) | ✅ |
| Delete worker (auth + profile removed via RPC) | ✅ |
| Per-field inline validation on all forms | ✅ |
| Phone number format validation (9–10 digits) | ✅ |
| View events list with filter tabs | ✅ |
| Search events by title + venue (within active filter) | ✅ |
| "היום! 🎉" badge + today-first sorting in EventsList | ✅ |
| Create new event (title, date, time picker, venue, notes) | ✅ |
| Back button on AddEvent screen (RTL-aware arrow) | ✅ |
| Edit existing event | ✅ |
| View event detail with full content | ✅ |
| Assign worker to event with pay amount | ✅ |
| Edit pay amount inline (reverts silently if 0 or negative) | ✅ |
| Remove worker from event | ✅ |
| Toggle event status (upcoming ↔ done) | ✅ |
| Mark individual worker as paid from EventDetail | ✅ |
| Bulk "mark all paid" for events with 2+ unpaid workers | ✅ |
| Duplicate event from EventDetail | ✅ |
| Delete event | ✅ |
| Native calendar date picker (iOS inline + Android modal) | ✅ |
| Native time picker in AddEvent (iOS spinner + Android modal) | ✅ |
| Owner bottom tabs with Ionicons (5 tabs) | ✅ |
| Owner Dashboard with stats + today/this-week events | ✅ |
| Open event from Dashboard | ✅ |
| Owner payments overview (SectionList by worker) | ✅ |
| Mark / unmark worker payment as paid (PaymentsScreen) | ✅ |
| Settings screen — profile, language, version, logout | ✅ |
| Arabic language option shows "בקרוב" (non-tappable) | ✅ |
| Success toast after every save action | ✅ |
| Offline banner on 6 screens (auto show/hide) | ✅ |
| Worker: view upcoming shifts with days-until chip | ✅ |
| Worker: view full payment history | ✅ |
| Worker: profile screen with email + phone | ✅ |
| Worker bottom tabs with Ionicons (3 tabs) | ✅ |

---

## 8. Bugs Fixed (Full History)

| # | Bug | Fix |
|---|---|---|
| 1 | RLS circular recursion — owner policy queried `public.users` to check role | Rewrote policies to read role from JWT `app_metadata` |
| 2 | `AddWorkerScreen` used `Alert.alert` unreliably | Replaced with inline error banners, now success toast |
| 3 | `I18nManager.forceRTL` calls placed between import statements in `App.js` | Moved to `src/lib/rtl.js` imported as first import |
| 4 | RTL did not take effect on first launch | `wasAlreadyRTL` check + `Updates.reloadAsync()` on first native launch |
| 5 | Date input in `AddEventScreen` was free-text | Replaced with `@react-native-community/datetimepicker` |
| 6 | `WorkerPaymentsScreen` crashed — `formatDate` called with null | Added null + NaN guards; `T00:00:00` fix |
| 7 | `ShiftsScreen` loaded forever — invalid Supabase query syntax on joined columns | Replaced with client-side filter/sort |
| 8 | Worker shifts showed empty with correct data — RLS on `event_workers`/`events` missing | Ran `supabase_worker_rls.sql` |
| 9 | `ProfileScreen` showed `'—'` for email — `profile.email` doesn't exist | Changed to `session?.user?.email` |
| 10 | iOS date parsing: bare `YYYY-MM-DD` treated as UTC midnight | All formatDate functions append `'T00:00:00'` |
| 11 | Status toggle appeared same for both states | Redesigned: upcoming = grey outline, done = solid green |
| 12 | Opening event from Dashboard did nothing — wrong nav param | Fixed Dashboard to pass `{ eventId: event.id }` |
| 13 | Worker shifts invisible despite data loading — FlatList collapsed to 0 height | Added `style={{ flex: 1 }}` to FlatList in ShiftsScreen |
| 14 | Worker shifts empty (stale closure bug) — `useCallback` deps were `[]`, captured `profile = null` | Added `profile?.id` to deps array |
| 15 | iOS Save Password popup on every login | `textContentType="oneTimeCode"` + `autoComplete="off"` on password |
| 16 | Form screens misaligned — `paddingHorizontal` on ScrollView outer `style` doesn't apply on iOS | Moved padding to `contentContainerStyle` |
| 17 | `rtl = false` in all screens — `const rtl = I18nManager.isRTL` captured before `forceRTL` ran | Created `src/lib/rtl.js`; imported as first import in App.js |
| 18 | `Updates.reloadAsync()` silently crashing in Expo Go | Wrapped in `.catch(() => {})` |
| 19 | `flexDirection: 'row-reverse'` broke RTL headers | In RTL mode `row-reverse` double-reverses; reverted to `row` |
| 20 | `alignSelf: 'flex-end'` pushed content to physical LEFT in RTL | Changed to `alignSelf: 'flex-start'` (= right edge in RTL) |
| 21 | `alignItems: 'flex-end'` on Dashboard ScrollView pushed entire content LEFT | Removed; native RTL handles alignment |
| 22 | Debug `console.log` statements in `ShiftsScreen.js` leaking worker IDs | Removed all three log lines |
| 23 | Arabic language option silently did nothing when tapped | Replaced `TouchableOpacity` with non-tappable gray "ערבית — בקרוב" `Text` |
| 24 | Time field in AddEvent was free text — no format enforcement | Replaced with native `DateTimePicker` mode="time", default 20:00, saves HH:MM |
| 25 | No validation on required form fields | Per-field `fieldErrors` state; red border + "שדה חובה" inline |
| 26 | Phone field accepted any string | Validates 9–10 digits; shows "מספר טלפון לא תקין" inline |
| 27 | Pay amount could be set to 0 or negative silently | `updatePay` checks `pay <= 0`; bumps `payKeys[id]` to remount TextInput |
| 28 | `EditWorkerScreen` save showed `Alert` | Replaced with success toast + auto-navigate after 800ms |
| 29 | No success feedback after any save action | `Toast.js` + `useToast()` hook across all screens |
| 30 | AddEventScreen had no way to cancel without scrolling to bottom | Added RTL-aware Ionicons back arrow in top row |
| 31 | No visual distinction for events happening today | Orange "היום! 🎉" badge, card border `#F59E0B`, today-first sort |
| 32 | StaffList search matched name only — phone search broken | Split `qDigits` from `q`; name uses `q.toLowerCase()`, phone uses `qDigits` (digits only) |
| 33 | `@react-native-community/netinfo` missing — OfflineBanner crashed on load | Ran `npx expo install @react-native-community/netinfo` |
| 34 | Worker history in EditWorkerScreen showed all zeros | Query used `.order('created_at')` but `event_workers` has no `created_at` column — Supabase returned error silently; removed the order clause, sort by event date in JS instead |
| 35 | Worker history query returned 0 rows despite worker having assignments | `worker_id` not in select list — RLS silently blocked rows; added `worker_id` to `.select()` |

---

## 9. Known Remaining Issues

| # | Issue | Severity | File |
|---|---|---|---|
| 1 | **EditEventScreen time field is still free text** — AddEvent was upgraded to a time picker but EditEvent was not | Medium | `EditEventScreen.js` |
| 2 | **Pay amount edit uses `onEndEditing`** — may not fire reliably on Android | Low | `EventDetailScreen.js` |
| 3 | **Worker creation fragile multi-step flow** — network drop between `signUp` and `setSession` leaves orphaned auth account with no `public.users` row | Low | `AddWorkerScreen.js` |
| 4 | **No pagination** on events or staff lists | Low | `EventsListScreen.js`, `StaffListScreen.js` |
| 5 | **Two dead files exist** — not imported, safe to delete | Cosmetic | `OwnerHome.js`, `WorkerHome.js` |
| 6 | **Dashboard only queries `upcoming` events** — events marked done mid-week disappear from "this week" section | Low | `DashboardScreen.js` |
| 7 | **`WorkerPaymentsScreen` stale closure risk** — `useFocusEffect` deps are `[]` not `[profile?.id]` | Low | `WorkerPaymentsScreen.js` |

---

## 10. What Is Next

### Must Do Before Client Handoff
1. **Fix EditEventScreen time field** — replace free-text `TextInput` with native `DateTimePicker` in `mode="time"` (same implementation as AddEventScreen).
2. **Delete dead files**: `OwnerHome.js`, `WorkerHome.js`.
3. **Fix WorkerPaymentsScreen stale closure** — add `profile?.id` to `useFocusEffect` deps.
4. **Test on real device after clean restart** — verify RTL layout is correct throughout.

### High-Value Additions
- **Push notifications** — `expo-notifications` + Supabase Edge Function; notify worker on assignment and day-before reminder.
- **Worker confirmation / attendance** — "אישר הגעה" from worker side, or post-event attendance checkbox on owner side.
- **Worker specialty field** — `role`/`specialty` on workers (e.g. "צלם", "מנהל במה") makes assignments meaningful.
- **Expense tracking** — basic per-event cost fields beyond worker pay.

### Option A — EAS Build / Deploy
- Update `app.json` with bundle ID, app name, version.
- Create `eas.json` with `development`, `preview`, `production` profiles.
- Run `eas build --platform ios --profile preview` for a TestFlight IPA.

### Option B — Arabic Language
Make the Arabic option functional: `src/i18n/ar.js` translations file + language context read by all screens.

### Option C — Polish
Dark mode · Export report (PDF/CSV via Edge Function) · App icon + splash screen · Worker notes field · Event audit log.

---

## 11. Environment & Credentials Reference

| Item | Value |
|---|---|
| Supabase URL | `https://inefvqnklgdtmddoglcf.supabase.co` |
| Supabase SQL Editor | https://supabase.com/dashboard/project/inefvqnklgdtmddoglcf/sql/new |
| Supabase Auth Users | https://supabase.com/dashboard/project/inefvqnklgdtmddoglcf/auth/users |
| Supabase Table Editor | https://supabase.com/dashboard/project/inefvqnklgdtmddoglcf/editor |
| Node version | v24.16.0 |
| npm version | 11.16.0 |
| Expo Go on iPhone | v54.0.2 |

**To run the app:**
```bash
cd C:\Projects\EventManager\EventManagerApp
npx expo start
```
Scan QR code with Expo Go on iPhone. After any RTL-related code change, **fully close and reopen Expo Go** (not just Reload JS) for the native layout engine to apply RTL direction.

**SQL files in project root (`C:\Projects\EventManager\`):**
- `supabase_schema.sql` — original schema; **DO NOT re-run** (circular RLS bug in policies)
- `supabase_rls_fix.sql` — corrected RLS policies using `app_metadata` for role checks
- `supabase_worker_rls.sql` — worker-specific policies for `event_workers` + `events`; re-run if worker shifts/payments stop loading
