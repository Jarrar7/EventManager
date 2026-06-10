# EventManager App — Progress Report
**Last updated:** 2026-06-10 (rev 4)
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
  - **UI polish**: Blue circle with "מא" initials. Card at `paddingTop: SCREEN_HEIGHT * 0.18`. Labels `alignSelf: 'flex-start'`.
  - **iOS Save Password fix**: `textContentType="oneTimeCode"` + `autoComplete="off"` on password field; `textContentType="username"` + `autoComplete="off"` on email field.
- `App.js` — `SafeAreaProvider` → `AuthProvider` → `NavigationContainer` → `RootScreen`. Routes to `LoginScreen` / `OwnerTabs` / `WorkerTabs` based on session and `profile.role`.

### Phase 3 — Staff Module ✅
- `src/screens/owner/staff/StaffListScreen.js` — Lists all workers ordered by name. Avatar (initial, `#5B6EF5` circle), name, phone. Tap to edit. Delete button is a `32×32` `#FEE2E2` red circle with `✕`. **Tap-to-call button**: green `call-outline` Ionicons button (36×36, `#ECFDF5` background) next to each worker's phone number — taps open `tel:` via `Linking.openURL`. Empty state. Refreshes on focus.
- `src/screens/owner/staff/AddWorkerScreen.js` — Form: name (RTL), phone, email, password (LTR). Creates auth account via `supabase.auth.signUp` with session save/restore flow. **Per-field inline validation**: name/email/password show red "שדה חובה" if empty; phone shows "מספר טלפון לא תקין" if not 9–10 digits. Red border on invalid fields. Errors clear as you type. **Success toast** "העובד נוסף בהצלחה ✓" shown for 2.5s before navigating to StaffList.
- `src/screens/owner/staff/EditWorkerScreen.js` — Pre-filled name (RTL) + phone (LTR). Same per-field validation. **Success toast** "הפרטים עודכנו בהצלחה ✓" before navigating back (replaces previous Alert).
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
- `src/screens/owner/events/EventsListScreen.js` — Lists all events ordered by date descending. Filter tabs: הכל / קרוב / הסתיים. **"היום" badge**: events happening today show an orange `#F59E0B` "היום! 🎉" badge replacing the normal status badge, plus `borderWidth: 1.5, borderColor: '#F59E0B'` card border. **Today's events always sort to the top** regardless of the active filter tab (stable sort — other events keep original order).
- `src/screens/owner/events/AddEventScreen.js` — Fields: title (RTL), date (calendar picker), **time (native time picker, default 20:00, saves as HH:MM)**, venue (RTL), notes (RTL multiline). **Back arrow** in top row (Ionicons `arrow-forward-outline` in RTL / `arrow-back-outline` in LTR). **Per-field validation**: title shows "שדה חובה" if empty. **Success toast** "האירוע נוצר בהצלחה ✓" before navigating to EventsList.
- `src/screens/owner/events/EditEventScreen.js` — Pre-filled edit form. Date picker. Time field is still free text (⚠ see Known Issues). **Success toast** "האירוע עודכן בהצלחה ✓" before navigating to EventDetail.
- `src/screens/owner/events/EventDetailScreen.js` — Full event management:
  - Top row: back button + **"⎘ שכפל"** (duplicate) button + "✏️ ערוך אירוע" edit button.
  - Title, Hebrew date + time, venue, notes.
  - **Status toggle**: `upcoming` = white card with grey border + grey text; `done` = solid `#10B981` green + white text.
  - **Worker rows**: pay amount editable via `TextInput` + `onEndEditing`. **Pay validation**: entering 0 or negative silently reverts the input (via `payKeys` remount trick — no DB write). Remove button = `32×32` `#FEE2E2` circle with `✕`.
  - **Payment toggle per worker**: green "סמן כשלום ✓" button when unpaid; gray "שולם ✓" label when paid. Tapping shows confirmation alert "לסמן את [שם] כשלום עבור [אירוע]?". On confirm, updates `is_paid = true` and `paid_at` in `event_workers`, updates local state instantly. **Success toast** "סומן כשלום ✓".
  - **Duplicate event**: "⎘ שכפל" button shows confirmation alert "לשכפל את האירוע "[שם]"?". On confirm, inserts new event with today's date and same title/venue/time/notes/status=upcoming. **Success toast** "האירוע שוכפל בהצלחה ✓", then navigates to new EventDetail via `navigation.replace`.
  - "+ שבץ עובד" expandable section with unassigned workers.
  - Delete event with Alert confirmation.

### Phase 5 — Owner Payments Module ✅
- `src/screens/owner/PaymentsScreen.js`:
  - Grand summary bar: סה"כ לתשלום / שולם / טרם שולם.
  - `SectionList` grouped by worker, sorted by unpaid amount descending.
  - Section header: `#5B6EF5` avatar, name, unpaid chip (red), paid chip (green).
  - Each row: event title, date, pay amount, toggle button.
  - Toggle: "סמן כשולם" = `#10B981` green; "בטל שולם" = `#F3F4F6` grey with grey text.
  - Confirmation Alert before toggling. Disabled + spinner while in-flight.

### Phase 6 — Worker View ✅
- `src/screens/worker/ShiftsScreen.js` — Upcoming shifts. Query: `.select('*, events(*)')` filtered by `worker_id = profile.id`. Client-side filter `status === 'upcoming'`, sorted ascending by date. Days-until chip: red "היום!" / orange "מחר" / orange "בעוד N ימים" (≤7) / blue (>7). FlatList `style={{ flex: 1 }}`. **Debug logs removed.**
- `src/screens/worker/WorkerPaymentsScreen.js` — Full payment history. Summary card. Colored stripe per card (green = paid, red = unpaid).
- `src/screens/worker/ProfileScreen.js` — Large `#27ae60` green avatar, name, role badge. Info card: email from `session?.user?.email`, phone from `profile?.phone`. Sign out button.
- `src/navigation/WorkerTabs.js` — 3 tabs: MyShifts (`list-outline`), MyPayments (`wallet-outline`), Profile (`person-outline`). Active tint `#27ae60`, inactive `#9CA3AF`.

### Phase 7 — Owner Dashboard ✅
- `src/screens/owner/DashboardScreen.js`:
  - **Header**: time-aware Hebrew greeting + today's full Hebrew date.
  - **Stats row**: 3 cards with coloured top border (blue/orange/red).
  - **"אירועי היום"** and **"השבוע הקרוב"** sections with tappable event rows.

### Phase 8 — Owner Settings Screen ✅
- Built inline in `src/navigation/OwnerTabs.js` as `SettingsScreen` component:
  - Profile card: `#5B6EF5` avatar with initial, owner name, email.
  - Language switcher: Hebrew option with tappable checkmark. **Arabic option is now a non-tappable gray Text label "ערבית — בקרוב"** (`#9CA3AF`) — not a button, no `onPress`. Clearly signals unavailability without silently failing.
  - App version: `1.0.0` hardcoded.
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

**ScrollView padding pattern** (applied to all form/detail screens):
```js
<ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
// scroll: { flex: 1 }
// container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }
```

### Phase 10 — UX Improvements & Polish ✅
New additions beyond the original spec:

- **`src/components/Toast.js`** — Reusable animated success toast. `useToast()` hook returns `showToast(msg)`, `toastMessage`, `toastOpacity` (Animated.Value). Component fades in (200ms) → holds (2100ms) → fades out (200ms). Positioned absolutely at `bottom: 32`, green `#10B981`, `borderRadius: 12`, `pointerEvents="none"`. Used in 5 screens.
- **Payment toggle in EventDetail** — Owner can mark a worker paid without leaving the event screen. Syncs automatically with PaymentsScreen since both read from `event_workers`.
- **Duplicate event** — One-tap event duplication from EventDetail. New event gets today's date; owner lands on the duplicate to adjust date and assign workers.
- **"היום" badge** — Today's events float to top of EventsList and are visually highlighted with orange border and badge.
- **Tap to call** — Green phone icon in StaffList opens native dialer for workers with a phone number.
- **Back button on AddEvent** — RTL-aware Ionicons arrow in top-left (physical) corner.
- **Time picker in AddEvent** — Native iOS spinner + Android modal. Default 20:00. Always saves valid HH:MM — no free-text format errors.
- **Input validation** — Per-field inline errors (red text + red border) across AddWorker, EditWorker, AddEvent. Phone validates 9–10 digits. Required fields show "שדה חובה". Pay amount reverts silently if 0 or negative.

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
│   │   └── supabase.js                           ← Supabase client
│   ├── context/
│   │   └── AuthContext.js                        ← session, profile, signIn, signOut
│   ├── components/
│   │   ├── ScreenWrapper.js                      ← SafeAreaView wrapper, background #F4F6F9
│   │   └── Toast.js                              ← useToast() hook + Toast component
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
| @expo/vector-icons (Ionicons) | bundled with Expo | Tab bar icons, back arrows, call button |

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
2. `app_metadata` is only writable by service role — prevents privilege escalation.
3. If worker shifts/payments ever appear empty again, re-run `supabase_worker_rls.sql`.

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
- Navigation params for `EventDetailScreen` **must** use `{ eventId: string }`. Both `EventsListScreen` and `DashboardScreen` pass this correctly.
- `navigation.replace('EventDetail', { eventId })` used for duplicate — prevents "go back" from returning to the old event.

### Toast Pattern
`useToast()` returns `showToast(msg)`, `toastMessage`, `toastOpacity`. Screens render `<Toast message={toastMessage} opacity={toastOpacity} />` as a sibling of `KeyboardAvoidingView` inside `ScreenWrapper` — uses `position: 'absolute'` and `pointerEvents="none"` so it overlays without blocking interaction. For screens that navigate away after saving, the pattern is `showToast(msg); setTimeout(() => navigation.navigate(...), 800)` — user sees confirmation before the transition.

### Pay Amount Revert (EventDetail)
`TextInput` uses `defaultValue` (uncontrolled) for performance. When `updatePay` receives 0 or negative, it increments `payKeys[assignmentId]` which changes the TextInput's `key` prop, forcing React to unmount and remount it — resetting `defaultValue` to the original DB value without a full screen reload.

### RTL Architecture — FINAL STATE
- `src/lib/rtl.js` imported as the first import in `App.js` — guarantees `I18nManager.isRTL = true` before any screen module evaluates.
- `const rtl = I18nManager.isRTL` at module level in each screen — frozen to `true`.
- **In RTL mode: `flex-start` = RIGHT, `flex-end` = LEFT.** All alignment styles use `flex-start` to push content to the right edge.
- `flexDirection: 'row'` auto-flips in RTL.
- `marginEnd`/`marginStart` used instead of `marginLeft`/`marginRight`.

### Date Parsing
All `formatDate`/`parseDate` functions:
1. Guard `if (!dateStr) return '—'`
2. Append `'T00:00:00'` when `dateStr.length === 10` (bare date) to force local-time parsing on iOS
3. Guard `if (isNaN(d.getTime())) return '—'`

### Time Field
- **AddEventScreen**: native `DateTimePicker` in `mode="time"`, iOS uses `spinner` display, Android uses native modal. Default 20:00. Saves as `HH:MM` string.
- **EditEventScreen**: still free-text `TextInput` with `maxLength={5}` — see Known Issues.

### iOS Save Password Popup Prevention
LoginScreen inputs:
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
| View staff list with phone numbers | ✅ |
| Tap-to-call worker from StaffList | ✅ |
| Add worker (creates auth + profile, session restored) | ✅ |
| Edit worker name/phone | ✅ |
| Delete worker (auth + profile removed via RPC) | ✅ |
| Per-field inline validation on all forms | ✅ |
| Phone number format validation (9–10 digits) | ✅ |
| View events list with filter tabs | ✅ |
| "היום! 🎉" badge + today-first sorting in EventsList | ✅ |
| Create new event (title, date, time picker, venue, notes) | ✅ |
| Back button on AddEvent screen (RTL-aware arrow) | ✅ |
| Edit existing event | ✅ |
| View event detail with full content | ✅ |
| Assign worker to event with pay amount | ✅ |
| Edit pay amount inline (reverts silently if 0 or negative) | ✅ |
| Remove worker from event | ✅ |
| Toggle event status (upcoming ↔ done) | ✅ |
| Mark worker as paid directly from EventDetail | ✅ |
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
| Arabic language option shows "בקרוב" (not a broken button) | ✅ |
| Success toast after every save action | ✅ |
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
| 19 | `flexDirection: 'row-reverse'` broke RTL headers | In RTL mode `row-reverse` double-reverses layout; reverted to `row` |
| 20 | `alignSelf: 'flex-end'` pushed content to physical LEFT in RTL | Changed to `alignSelf: 'flex-start'` (= right edge in RTL) |
| 21 | `alignItems: 'flex-end'` on Dashboard ScrollView pushed entire content area to physical LEFT | Removed; native RTL handles alignment |
| 22 | Debug `console.log` statements in `ShiftsScreen.js` leaking worker IDs to console | Removed all three log lines |
| 23 | Arabic language option in Settings silently did nothing when tapped | Replaced `TouchableOpacity` with non-tappable gray "ערבית — בקרוב" `Text` label |
| 24 | Time field in AddEvent was free text — no format enforcement | Replaced with native `DateTimePicker` in `mode="time"`, default 20:00, saves as HH:MM |
| 25 | No validation on required form fields — could submit empty name, email, etc. | Per-field `fieldErrors` state; red border + inline "שדה חובה" error text |
| 26 | Phone field accepted any string — silent bad data | Validates 9–10 digits; shows "מספר טלפון לא תקין" inline |
| 27 | Pay amount could be set to 0 or negative silently | `updatePay` checks `pay <= 0`; bumps `payKeys[id]` to remount TextInput with original value |
| 28 | `EditWorkerScreen` save showed `Alert` — inconsistent with rest of app | Replaced with success toast + auto-navigate after 800ms |
| 29 | No success feedback after any save action — owner couldn't tell if save worked | `Toast.js` component + `useToast()` hook; shown after every save across all screens |
| 30 | AddEventScreen had no way to cancel without scrolling to bottom | Added RTL-aware Ionicons back arrow in top row |
| 31 | No visual distinction for events happening today | Orange "היום! 🎉" badge, card border `#F59E0B`, today-first sort in EventsList |

---

## 9. Known Remaining Issues

| # | Issue | Severity | File |
|---|---|---|---|
| 1 | **EditEventScreen time field is still free text** — AddEvent was upgraded to a time picker but EditEvent was not. Owner can type anything into the time field when editing an existing event. | Medium | `EditEventScreen.js` |
| 2 | **Pay amount edit uses `onEndEditing`** — may not fire reliably on Android | Low | `EventDetailScreen.js` |
| 3 | **Worker creation fragile multi-step flow** — if app crashes between `signUp` and `setSession`, owner is logged out and the worker account exists in Auth but has no profile row in `public.users`. No recovery path. | Low | `AddWorkerScreen.js` |
| 4 | **No pagination on events or staff lists** | Low | `EventsListScreen.js`, `StaffListScreen.js` |
| 5 | **Two dead files exist and should be deleted** | Cosmetic | `OwnerHome.js`, `WorkerHome.js` |
| 6 | **Dashboard only queries `upcoming` events** — "this week" section won't show events already marked `done` | Low | `DashboardScreen.js` |
| 7 | **`WorkerPaymentsScreen` stale closure risk** — `useFocusEffect` deps are `[]` (not `[profile?.id]`) — same bug that was fixed in ShiftsScreen | Low | `WorkerPaymentsScreen.js` |
| 8 | **No input validation on phone number field in EditWorkerScreen** if the existing phone in DB was set without validation (legacy data) | Cosmetic | `EditWorkerScreen.js` |

---

## 10. What Is Next

### Must Do Before Client Handoff
1. **Fix EditEventScreen time field** — replace free-text `TextInput` with native `DateTimePicker` in `mode="time"` (same implementation as AddEventScreen).
2. **Delete dead files**: `OwnerHome.js`, `WorkerHome.js`.
3. **Fix WorkerPaymentsScreen stale closure** — add `profile?.id` to `useFocusEffect` deps, same as ShiftsScreen fix.
4. **Test on real device after clean restart** — verify RTL layout is correct throughout after the `rtl.js` fix.

### Option A — EAS Build / Deploy
Configure production build so the app runs without Expo Go:
- Update `app.json` with bundle ID, app name, version
- Create `eas.json` with `development`, `preview`, `production` profiles
- Run `eas build --platform ios --profile preview` for a TestFlight IPA
- Submit to TestFlight for permanent install

### Option B — Settings Language Toggle (real)
Make the Arabic option actually switch the app into Arabic RTL mode. Requires an Arabic translations file `src/i18n/ar.js` and a language context that all screens read from.

### Option C — Push Notifications
When owner assigns a worker to an event, worker receives an Expo push notification. Requires:
- `expo-notifications` package
- Store push tokens in `public.users`
- Trigger from a Supabase Edge Function or owner's device

### Option D — Higher-Value UX (from Product Review)
- **Bulk payment marking** — "mark all paid for this event" action on EventDetail
- **Worker history in StaffList** — show total events worked and total earned from the staff module
- **Event duplication already done** ✅ — further improvement: carry worker assignments across when duplicating a recurring event
- **"Forgot password" flow** — currently no in-app recovery; owner must use Supabase email reset

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
