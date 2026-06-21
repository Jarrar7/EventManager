# EventManager App — Progress Report
**Last updated:** 2026-06-21 (rev 7)
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
  - **Forgot password flow**: "שכחתי סיסמה?" link at bottom of login card. Tapping switches card to email-input mode. Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'eventmanager://reset-password' })`. Shows success/error Alert in Hebrew. "חזרה להתחברות" link returns to login form.
  - **iOS Save Password fix**: `textContentType="oneTimeCode"` + `autoComplete="off"` on password; `textContentType="username"` + `autoComplete="off"` on email.
  - **Full theme support** (Phase 12): card, inputs, button, labels all use design tokens. Theme toggle button in top-right corner.
- `src/screens/auth/ResetPasswordScreen.js` — Shown when the app opens via a password-reset deep link (`eventmanager://reset-password#access_token=...`). Two `TextInput` fields (new password + confirm), validates length ≥ 6 and match, calls `supabase.auth.updateUser({ password })`, then signs out.
  - **⚠ EAS only**: Deep link requires a production EAS build. Expo Go does not register custom URL schemes.
- `App.js` — `SafeAreaProvider` → `ThemeProvider` → `QueryClientProvider` → `AuthProvider` → `NavigationContainer` → `RootScreen`. Routes based on session and `profile.role`. Handles deep-link password reset via `Linking`. `StatusBar style="auto"` adapts to theme.

### Phase 3 — Staff Module ✅
- `src/screens/owner/staff/StaffListScreen.js` — Lists all workers ordered by name. Avatar (initial, `c.primarySoft` circle with `c.accentGlyph` initial), name, phone. **Real-time search bar** — filters by name and phone simultaneously. **Tap-to-call**: green call button. Delete button. `OfflineBanner` at top.
- `src/screens/owner/staff/AddWorkerScreen.js` — Form: name, phone, email, password. Creates auth account via `supabase.auth.signUp` with session save/restore. **Per-field inline validation**. **Success toast** before navigating to StaffList. Full theme tokens applied.
- `src/screens/owner/staff/EditWorkerScreen.js` — Pre-filled name + phone. **Worker header**: 54px avatar (c.primarySoft/c.accentGlyph), name 18/800, "עובד מאז…" subtitle muted. **3-tile stat row** (StatTile component: 38×38 disc, events/total/paid using statIndigoBg/statPeachBg/statGreenBg). **History rows**: radius 14, padding 13/15, title 14/700, date 12 muted, amount 15/800, paid/unpaid badge. Full theme tokens applied.
- `src/navigation/StaffStack.js` — Native stack: `StaffList` → `AddWorker` / `EditWorker`.

### Phase 3.5 — Hebrew / RTL ✅
- `src/i18n/he.js` — Single file with all Hebrew strings and functions for dynamic strings.
- **`src/lib/rtl.js`** ← **CRITICAL** — must be the VERY FIRST import in `App.js`. Sets `I18nManager.allowRTL(true)` and `I18nManager.forceRTL(true)`.
- **RTL rule**: `flex-start` = physical RIGHT, `flex-end` = physical LEFT in RTL mode.
- **Date formatting** uses `'he-IL'` locale. **Date parsing** guards null/NaN and appends `'T00:00:00'` to bare 10-char strings.

### Phase 4 — Events Module ✅
- `src/screens/owner/events/EventsListScreen.js` — Filter pills (הכל/קרוב/הסתיים), real-time search, date chip cards (54px chip width, `c.primarySoft` bg; today variant `borderColor c.primary 1.5px`). "היום! 🎉" badge + today-first sort. Full theme tokens.
- `src/screens/owner/events/AddEventScreen.js` — Title, date+time 2-column row (gap 12, trailing icon in c.textMuted), venue, multiline notes (minHeight 94). Back arrow top-left. Per-field validation. Success toast. Full theme tokens.
- `src/screens/owner/events/EditEventScreen.js` — Pre-filled edit form, native time picker (upgraded from free text). Success toast.
- `src/screens/owner/events/EventDetailScreen.js` — Full event management: 56×56 emoji disc (c.emojiBg), title 24/800, meta rows with c.primary icons, 3-up payment summary (סה״כ/שולם/נותר) with 1px c.border dividers, worker cards (46px avatar, paid/unpaid badge), per-worker payment toggle, bulk pay button, duplicate event, delete event, assign worker. Full theme tokens.
- `src/navigation/EventsStack.js` — EventsList → AddEvent / EditEvent / EventDetail.

### Phase 5 — Owner Payments Module ✅
- `src/screens/owner/PaymentsScreen.js` — Summary card with 3 cells separated by 1px c.border dividers. `SectionList` grouped by worker, unpaid-first sort. Worker section headers with c.primarySoft avatar, "✓ שולם הכל" green when all paid. Payment rows: radius 12, borderWidth 1, opacity 0.8 when paid. Toggle via `useMutation`. Full theme tokens.

### Phase 6 — Worker View ✅
- `src/screens/worker/ShiftsScreen.js` — **Filter pills (הכל/קרוב/הסתיים)** — fetches all event_workers (not just upcoming), filters client-side by `events.status`. Date chip (54px, c.primarySoft or c.border for done). Trailing column: pay 16/800 + status badge (gap 7). DaysChip: red today / peach ≤7 days / indigo >7 days. Full theme tokens.
- `src/screens/worker/WorkerPaymentsScreen.js` — Title + 3-cell summary card with 1px dividers. "אירועים" section label 13/800 uppercase. History rows: radius 14, padding 13/15, event title 14/700, date 12 muted, amount 15/800, paid/pending badge. Full theme tokens.
- `src/screens/worker/ProfileScreen.js` — Centered block: 84px avatar radius 42, `c.primarySoft`/`c.accentGlyph` initial 34/800. Name 22/800. Role badge (c.primarySoft radius 10). Info card with 40px icon discs (mail + phone) + label 12 muted + value 15/700 LTR. Sign-out: c.redSoft bg, c.red text. Full theme tokens.
- `src/navigation/WorkerTabs.js` — 3 tabs with **CustomTabBar** (same spec as OwnerTabs). Height 78, paddingTop 10, c.tabBarBg, borderTopWidth 1 c.tabBarBorder, home indicator 134×5 radius 3 c.homeIndicator centered bottom 8.

### Phase 7 — Owner Dashboard ✅
- `src/screens/owner/DashboardScreen.js` — Header: 50px avatar (c.heroCircle bg, c.accentGlyph initial), greeting 13/700 muted, name 23/800. Hero stat card: c.heroFill bg, radius 16, decorative circle (position absolute, 92×92, top -26 right -24), ₪unpaidTotal 40/800 letterSpacing -1. Two foot tiles (c.card, radius 12). 3-tile quick-stat trio: today (statPeachBg/Fg), this week (statGreenBg/Fg), upcoming (statIndigoBg/Fg). Event rows with date chip 54px, c.primarySoft bg. `useFocusEffect` + `invalidateQueries` for live stats. Full theme tokens.

### Phase 8 — Owner Settings Screen ✅
- Built inline in `src/navigation/OwnerTabs.js` as `SettingsScreen` component:
  - Profile card: 52px avatar (c.heroCircle/c.accentGlyph), name 17/800, email LTR muted.
  - Section labels 13/800 uppercase.
  - Grouped cards with 1px c.border dividers.
  - Arabic row: non-tappable "בקרוב" badge (c.primarySoft bg, c.accentGlyph text, radius 9).
  - **Appearance row**: shows theme toggle with sun/moon icon (same icon logic as LoginScreen toggle).
  - Sign-out: c.redSoft bg, c.red text, radius 12, paddingVertical 15, marginTop 28.

### Phase 9 — UI Polish Pass ✅
Superseded by Phase 12 (Warm Minimal design system). All Phase 9 tokens replaced with design system tokens.

### Phase 10 — UX Improvements ✅
- **`src/components/Toast.js`** — `useToast()` hook + `Toast` component. Fades in 200ms → holds 2100ms → fades out 200ms. Green `c.green`, position absolute bottom 32, pointerEvents="none".
- **`src/components/OfflineBanner.js`** — `NetInfo` subscriber, auto show/hide. Used in 6 screens.
- All UX improvements from Product Review implemented: payment toggle in EventDetail, bulk pay, worker history in EditWorker, search in both lists, duplicate event, "היום" badge, tap-to-call, back button on AddEvent, native time picker, per-field validation, success toasts, forgot password, ResetPasswordScreen.

### Phase 11 — React Query / Performance ✅

`@tanstack/react-query@4.44.0`. `QueryClient` in `App.js` with `staleTime: 2min`, `cacheTime: 10min`, `retry: 1`.

| Screen | Query Key |
|---|---|
| DashboardScreen | `['dashboard', profile?.id]` |
| EventsListScreen | `['events']` |
| StaffListScreen | `['staff']` |
| PaymentsScreen | `['payments']` |
| ShiftsScreen | `['shifts', profile?.id]` |
| WorkerPaymentsScreen | `['worker-payments', profile?.id]` |
| EventDetailScreen | `['event-detail', eventId]` |

- `isLoading` (no cache) → full-screen ActivityIndicator. `isFetching` (cache hit, background refresh) → small top indicator.
- `useFocusEffect + invalidateQueries` retained only in DashboardScreen for live stats.

### Phase 12 — Warm Minimal Design System ✅ ← NEW

Full light/dark theme implementation across every screen in the app.

#### Foundation Files

**`src/theme/colors.js`** — 20-token palette for both light and dark:

| Token | Light | Dark |
|---|---|---|
| `background` | `#F8F6F3` | `#0F1117` |
| `card` | `#FFFFFF` | `#1A1D27` |
| `border` | `#F0EDE8` | `#2A2D3A` |
| `text` | `#1F2937` | `#F9FAFB` |
| `textMuted` | `#6B7280` | `#9CA3AF` |
| `primary` | `#6366F1` | `#6366F1` |
| `primarySoft` | `#EEF2FF` | `#1E1B4B` |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` |
| `accentGlyph` | `#6366F1` | `#A5B4FC` |
| `green` | `#10B981` | `#34D399` |
| `greenSoft` | `#E8F5EE` | `#052E16` |
| `red` | `#EF4444` | `#F87171` |
| `redSoft` | `#FDECEC` | `#2D0A0A` |
| `heroFill` | `#F5F3FF` | `#1E2035` |
| `heroCircle` | `#ECE8FB` | `#252840` |
| `statPeachBg/Fg` | `#FEE9DC` / `#E8743B` | `#1E1B4B` / `#818CF8` |
| `statGreenBg/Fg` | `#E8F5EE` / `#10B981` | `#052E16` / `#34D399` |
| `statIndigoBg/Fg` | `#EEF2FF` / `#6366F1` | `#2D0A0A` / `#F87171` |
| `emojiBg` | `#EEF2FF` | `#1E1B4B` |
| `tabBarBg` | `#FFFFFF` | `#1A1D27` |
| `tabBarBorder` | `#F0EDE8` | `#2A2D3A` |
| `tabInactive` | `#9CA3AF` | `#6B7280` |
| `homeIndicator` | `rgba(31,41,55,0.22)` | `rgba(255,255,255,0.30)` |

**`src/theme/shadows.js`** — `cardShadow` object (shadowColor `#000`, offset 0/1, opacity 0.06, radius 3, elevation 2). Applied only when `theme === 'light'`; dark mode uses no shadow (transparent cards on dark bg need no depth separation).

**`src/context/ThemeContext.js`** — `ThemeProvider` with:
  - Initial state from `useColorScheme()` (React Native) — first-launch users get their device's system theme automatically.
  - AsyncStorage persistence on key `@theme` — user's manual toggle preference survives app restarts.
  - `useTheme()` hook exposes `{ theme, toggleTheme, c }` where `c = colors[theme]`.
  - `ThemeProvider` wraps the tree in `App.js` above `QueryClientProvider`.

#### Typography Scale

| Role | Size | Weight | Used On |
|---|---|---|---|
| heroValue | 40 | 800 | Dashboard unpaid total |
| screenTitle | 25 | 800 | Screen headers (Dashboard, ShiftsScreen, etc.) |
| cardTitle | 24 | 800 | EventDetail title |
| workerName | 22/18 | 800 | ProfileScreen / EditWorker |
| ownerName | 23 | 800 | Dashboard greeting |
| sectionName | 17 | 800 | Settings profile name |
| listTitle | 16 | 800 | Event cards |
| statValue | 21 | 800 | Quick stat tiles |
| bodyStrong | 15 | 700 | Info values, history amounts |
| fieldLabel | 13 | 700 | Form labels |
| sectionLabel | 13 | 800 | Section headers (uppercase) |
| statLabel | 11/10.5 | 600 | Stat subtitles, tab labels |

#### Spacing & Radius Rules

- **Gutters**: 22px horizontal padding on all screens.
- **Card radius**: 16px outer cards, 14px history rows, 12px inputs/buttons/filter pills, 11px badges, 10px chips.
- **Border rule**: every card gets `borderWidth: 1, borderColor: c.border`.
- **Shadow rule**: `...(theme === 'light' ? cardShadow : {})` spread on every card.
- **Root background**: every screen root uses `c.background`.

#### Theme Toggle Button

A 40×40 round button (borderRadius 20, c.card bg, c.border border) with:
- `moon-outline` icon when in light mode (tapping → dark)
- `sunny-outline` icon when in dark mode (tapping → light)

Present in two places:
1. **LoginScreen** — positioned `position: 'absolute', top: 56, end: 20` (RTL-aware, right corner).
2. **SettingsScreen** — in the Appearance row of the grouped settings card.

Both call `toggleTheme()` from `useTheme()`. The whole app updates instantly (context re-render propagates to all screens).

#### Screens Converted to Design System

| Screen | File | Status |
|---|---|---|
| LoginScreen | `auth/LoginScreen.js` | ✅ |
| DashboardScreen | `owner/DashboardScreen.js` | ✅ |
| EventsListScreen | `owner/events/EventsListScreen.js` | ✅ |
| EventDetailScreen | `owner/events/EventDetailScreen.js` | ✅ |
| AddEventScreen | `owner/events/AddEventScreen.js` | ✅ |
| PaymentsScreen | `owner/PaymentsScreen.js` | ✅ |
| StaffListScreen | `owner/staff/StaffListScreen.js` | ✅ |
| AddWorkerScreen | `owner/staff/AddWorkerScreen.js` | ✅ |
| EditWorkerScreen | `owner/staff/EditWorkerScreen.js` | ✅ |
| SettingsScreen (inline) | `navigation/OwnerTabs.js` | ✅ |
| OwnerTabs CustomTabBar | `navigation/OwnerTabs.js` | ✅ |
| WorkerTabs CustomTabBar | `navigation/WorkerTabs.js` | ✅ |
| ShiftsScreen | `worker/ShiftsScreen.js` | ✅ |
| WorkerPaymentsScreen | `worker/WorkerPaymentsScreen.js` | ✅ |
| ProfileScreen | `worker/ProfileScreen.js` | ✅ |
| ScreenWrapper | `components/ScreenWrapper.js` | ✅ |

**Not yet converted** (no visible UI while logged out or rarely visited):
- `ResetPasswordScreen` — deep-link only, reached via email. Low priority.
- `EditEventScreen` — form fields still use hardcoded colors. Medium priority.

#### Custom Tab Bars

Both `OwnerTabs.js` and `WorkerTabs.js` use `tabBar={props => <CustomTabBar {...props} />}` instead of React Navigation's built-in tab bar (which can't read from ThemeContext). `CustomTabBar`:
- Height 78, paddingTop 10, paddingHorizontal 8.
- `c.tabBarBg` background, `borderTopWidth: 1, borderColor: c.tabBarBorder`.
- Each tab: `flex: 1, alignItems: 'center', gap: 5`. Label 10.5/600. Active `c.primary`, inactive `c.tabInactive`.
- Home indicator: 134×5 pill, radius 3, `c.homeIndicator` bg, `position: 'absolute', bottom: 8`, centered via `left: '50%', marginLeft: -67`.

#### Inline Style vs StyleSheet Pattern

`StyleSheet.create()` is static — theme colors cannot be referenced at module load time. Pattern used throughout:
- **Static layout** (flex, padding, radius, fontSize) → `StyleSheet.create()`.
- **Dynamic theme colors** → inline style objects or style arrays: `[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadow]`.
- **Shadow** → always spread as the last element: `...(theme === 'light' ? cardShadow : {})`.

---

## 2. Complete File Map

```
EventManagerApp/
├── App.js                                        ← Entry: RTL bootstrap, ThemeProvider, QueryClientProvider, deep-link handler, role routing
├── index.js                                      ← Expo entry point
├── src/
│   ├── theme/
│   │   ├── colors.js                             ← 20-token light/dark palette
│   │   └── shadows.js                            ← cardShadow (light-mode only)
│   ├── context/
│   │   ├── ThemeContext.js                       ← ThemeProvider + useTheme(); system theme default + AsyncStorage persistence
│   │   └── AuthContext.js                        ← session, profile, signIn, signOut
│   ├── i18n/
│   │   └── he.js                                 ← All Hebrew strings
│   ├── lib/
│   │   ├── rtl.js                                ← RTL bootstrap — MUST be first import in App.js
│   │   ├── supabase.js                           ← Supabase client (gitignored — has live keys)
│   │   └── supabase.example.js                   ← Template committed to git for new cloners
│   ├── components/
│   │   ├── ScreenWrapper.js                      ← SafeAreaView wrapper using c.background
│   │   ├── Toast.js                              ← useToast() hook + Toast component
│   │   └── OfflineBanner.js                      ← NetInfo-based offline indicator
│   ├── navigation/
│   │   ├── OwnerTabs.js                          ← 5 tabs + inline SettingsScreen + CustomTabBar
│   │   ├── WorkerTabs.js                         ← 3 tabs + CustomTabBar
│   │   ├── StaffStack.js                         ← StaffList → AddWorker / EditWorker
│   │   └── EventsStack.js                        ← EventsList → AddEvent / EditEvent / EventDetail
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.js                    ← Login + forgot-password + theme toggle button
│       │   └── ResetPasswordScreen.js            ← Deep-link password reset (EAS build only)
│       ├── owner/
│       │   ├── DashboardScreen.js
│       │   ├── PaymentsScreen.js
│       │   ├── events/
│       │   │   ├── EventsListScreen.js
│       │   │   ├── AddEventScreen.js
│       │   │   ├── EditEventScreen.js            ← ⚠ Not yet converted to design system
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

---

## 3. Tech Stack

| Tool | Version | Reason |
|---|---|---|
| Expo | 54.0.35 | Matches owner's Expo Go v54.0.2 on iPhone |
| React Native | 0.81.5 | SDK 54 compatible |
| React | 19.1.0 | SDK 54 compatible |
| Supabase JS | ^2.107.0 | Database, auth |
| AsyncStorage | 2.2.0 | Session persistence + theme preference |
| React Navigation (bottom-tabs + native-stack) | SDK 54 | Screen navigation |
| react-native-screens | ~4.16.0 | Navigation dependency |
| react-native-safe-area-context | ~5.6.0 | iPhone notch/status bar |
| expo-status-bar | ~3.0.9 | `style="auto"` for system-themed status bar |
| expo-updates | SDK 54 | `Updates.reloadAsync()` for RTL reload |
| @react-native-community/datetimepicker | SDK 54 | Native date + time pickers |
| @react-native-community/netinfo | SDK 54 | Offline detection for OfflineBanner |
| @expo/vector-icons (Ionicons) | bundled | Tab icons, back arrows, call button, theme toggle (sun/moon) |
| **@tanstack/react-query** | **4.44.0** | **Data caching — instant navigation, background refresh** |

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

> ⚠️ `event_workers` does **not** have a `created_at` column. Querying with `.order('created_at')` returns an error and yields no rows. Sort by `events.date` in JS instead.

---

## 5. RLS Policies

The active set of policies is in `supabase_rls_fix.sql` + `supabase_worker_rls.sql`. **DO NOT re-run `supabase_schema.sql`** (circular recursion bug in original policies).

**public.users** — owner reads/writes all; workers read own row; self-insert on signup.
**public.events** — owners manage all; workers read assigned events only.
**public.event_workers** — owners manage all; workers read own assignments only.

**Key rule**: Role is read from JWT `app_metadata` (not `public.users`) to avoid circular recursion. `app_metadata` is only writable by service role — no privilege escalation possible.

**RLS quirk**: When filtering `event_workers` by `worker_id`, the column must appear in the `.select()` string or RLS silently returns 0 rows.

**Supabase RPC**: `delete_worker_account(user_id uuid)` — SECURITY DEFINER; verifies caller is owner; deletes from `auth.users` (cascades everywhere).

---

## 6. Key Technical Decisions

### Theme Architecture
- `ThemeProvider` wraps the entire tree in `App.js`, above `QueryClientProvider`.
- `useState` initializer calls `useColorScheme()` — first-launch users get system theme without any flicker.
- AsyncStorage write on every `toggleTheme()` call; read on mount to restore saved preference.
- Saved preference wins over system theme once set (explicit user choice respected).
- `cardShadow` applied only in `theme === 'light'` — dark cards on dark backgrounds need no elevation.
- Static layout in `StyleSheet.create()`; dynamic color as inline style arrays; shadow spread last.

### Custom Tab Bar (Both Navigators)
React Navigation's built-in tab bar props (`tabBarActiveTintColor`, etc.) cannot respond to context changes. Custom solution: a `CustomTabBar` component defined inside each navigator file that calls `useTheme()` internally. Passed to `Tab.Navigator` via `tabBar={props => <CustomTabBar {...props} />}`. No performance overhead — re-renders only on theme change.

### Worker Creation Flow
1. Save owner `access_token` + `refresh_token` via `getSession()`.
2. Call `signUp()` — session switches to new worker.
3. Insert worker `public.users` row while authenticated as worker (self-insert policy).
4. Restore owner session via `supabase.auth.setSession(...)`.
5. Show toast, navigate after 800ms.

### Navigation Architecture
- `headerShown: false` everywhere — screens draw their own nav elements.
- `navigation.replace('EventDetail', { eventId })` for duplicate — prevents back-nav to original.
- Navigation params for EventDetailScreen must use `{ eventId: string }`.

### React Query
- `staleTime: 2min` — cached data shows instantly on return; no re-fetch within window.
- `useFocusEffect + invalidateQueries` only in DashboardScreen for live stats.
- Mutation invalidation is comprehensive — every mutation invalidates all related query keys.

### Forgot Password / Deep Link Reset
1. User taps "שכחתי סיסמה?" → enters email → `resetPasswordForEmail(email, { redirectTo: 'eventmanager://reset-password' })`.
2. Supabase email → user taps → OS opens app via `eventmanager://` scheme.
3. `App.js` `Linking` listener catches URL → `parseHashParams` extracts tokens.
4. `supabase.auth.setSession(...)` → `passwordResetPending = true` → `ResetPasswordScreen`.
5. `supabase.auth.updateUser({ password })` → sign out → `LoginScreen`.
6. **Supabase redirect URL required**: `eventmanager://reset-password` in Auth → URL Configuration.
7. **EAS build required**: custom schemes not registered in Expo Go.

### Date Parsing
All `formatDate`/`parseDate` functions: guard null → append `'T00:00:00'` when `dateStr.length === 10` → guard NaN.

### Pay Amount Revert (EventDetail)
`TextInput` uses `defaultValue` (uncontrolled). When `updatePay` gets 0 or negative, increments `payKeys[assignmentId]` → key change forces React to remount TextInput → resets to original DB value without reload.

### RTL Architecture
`const rtl = I18nManager.isRTL` at module level in each screen (frozen to `true` after bootstrap). In RTL mode: `flex-start = RIGHT`, `flex-end = LEFT`. `marginEnd`/`marginStart` used instead of `marginLeft`/`marginRight`.

---

## 7. What Is Currently Working

| Feature | Status |
|---|---|
| Login with email/password | ✅ |
| Stay logged in after app restart | ✅ |
| Role-based routing (owner vs worker) | ✅ |
| Sign out | ✅ |
| Forgot password — inline email form in Hebrew | ✅ |
| Password reset deep link (EAS build only) | ✅ |
| Full Hebrew UI / RTL layout | ✅ |
| iOS Save Password popup suppressed | ✅ |
| **Light / dark theme — full app** | ✅ |
| **System theme detection on first launch** | ✅ |
| **Theme preference persisted across restarts** | ✅ |
| **Theme toggle on LoginScreen (top-right corner)** | ✅ |
| **Theme toggle in Settings (Appearance row)** | ✅ |
| **Custom themed tab bars (owner + worker)** | ✅ |
| React Query caching — instant data on navigation return | ✅ |
| Background refresh indicator (`isFetching`) | ✅ |
| View staff list with search (name + phone) | ✅ |
| Tap-to-call worker from StaffList | ✅ |
| Add worker (creates auth + profile, session restored) | ✅ |
| Edit worker name/phone | ✅ |
| Worker history stats (events, earned, paid, owed) | ✅ |
| Worker event history list | ✅ |
| Delete worker (auth + profile via RPC) | ✅ |
| Per-field inline validation on all forms | ✅ |
| Phone number format validation (9–10 digits) | ✅ |
| View events list with filter tabs | ✅ |
| Search events by title + venue | ✅ |
| "היום! 🎉" badge + today-first sorting | ✅ |
| Create new event (title, date, time picker, venue, notes) | ✅ |
| Back button on AddEvent (RTL-aware) | ✅ |
| Edit existing event | ✅ |
| Native time picker in EditEvent | ✅ |
| View event detail with full content | ✅ |
| Assign worker to event with pay amount | ✅ |
| Edit pay amount inline (reverts if 0 or negative) | ✅ |
| Remove worker from event | ✅ |
| Toggle event status (upcoming ↔ done) | ✅ |
| Mark individual worker as paid from EventDetail | ✅ |
| Bulk "mark all paid" for events with 2+ unpaid workers | ✅ |
| Duplicate event from EventDetail | ✅ |
| Delete event | ✅ |
| Owner Dashboard with stats + today/this-week events | ✅ |
| Dashboard live stats on every tab focus | ✅ |
| Owner payments overview grouped by worker | ✅ |
| Mark / unmark worker payment as paid | ✅ |
| Settings screen — profile, appearance toggle, language, sign-out | ✅ |
| Arabic language option shows "בקרוב" (non-tappable) | ✅ |
| Success toast after every save action | ✅ |
| Offline banner on 6 screens | ✅ |
| Worker: filter shifts by all / upcoming / done | ✅ |
| Worker: view full payment history | ✅ |
| Worker: profile screen with email + phone | ✅ |

---

## 8. Bugs Fixed (Full History)

| # | Bug | Fix |
|---|---|---|
| 1 | RLS circular recursion — owner policy queried `public.users` to check role | Rewrote policies to read role from JWT `app_metadata` |
| 2 | `AddWorkerScreen` used `Alert.alert` for errors | Replaced with inline error banners + success toast |
| 3 | `I18nManager.forceRTL` placed between import statements | Moved to `src/lib/rtl.js` as first import in App.js |
| 4 | RTL did not apply on first launch | `wasAlreadyRTL` check + `Updates.reloadAsync()` |
| 5 | Date input in AddEventScreen was free text | Replaced with native `DateTimePicker` |
| 6 | `WorkerPaymentsScreen` crashed — `formatDate` called with null | Added null + NaN guards; `T00:00:00` fix |
| 7 | ShiftsScreen loaded forever — invalid Supabase query on joined columns | Replaced with client-side filter/sort |
| 8 | Worker shifts showed empty — RLS on `event_workers`/`events` missing | Ran `supabase_worker_rls.sql` |
| 9 | ProfileScreen showed `'—'` for email — `profile.email` doesn't exist | Changed to `session?.user?.email` |
| 10 | iOS date parsing: bare `YYYY-MM-DD` treated as UTC midnight | All formatDate functions append `'T00:00:00'` |
| 11 | Status toggle appeared same for both states | Redesigned: upcoming = grey outline, done = solid green |
| 12 | Opening event from Dashboard did nothing — wrong nav param | Fixed to pass `{ eventId: event.id }` |
| 13 | Worker shifts FlatList collapsed to 0 height | Added `style={{ flex: 1 }}` to FlatList |
| 14 | Worker shifts empty — stale closure in `useCallback` captured `profile = null` | Added `profile?.id` to deps array |
| 15 | iOS Save Password popup on every login | `textContentType="oneTimeCode"` + `autoComplete="off"` |
| 16 | Form screens misaligned — padding on ScrollView `style` ignored on iOS | Moved to `contentContainerStyle` |
| 17 | `rtl = false` in all screens — captured before `forceRTL` ran | Created `src/lib/rtl.js` as first App.js import |
| 18 | `Updates.reloadAsync()` crashing in Expo Go | Wrapped in `.catch(() => {})` |
| 19 | `flexDirection: 'row-reverse'` double-reversed RTL headers | Reverted to `row` |
| 20 | `alignSelf: 'flex-end'` pushed content to physical LEFT in RTL | Changed to `alignSelf: 'flex-start'` |
| 21 | `alignItems: 'flex-end'` on Dashboard ScrollView pushed content LEFT | Removed |
| 22 | Debug `console.log` statements leaking worker IDs in ShiftsScreen | Removed all three log lines |
| 23 | Arabic language option did nothing when tapped | Replaced with non-tappable "בקרוב" Text |
| 24 | Time field in AddEvent was free text | Replaced with native `DateTimePicker` mode="time" |
| 25 | No validation on required form fields | Per-field `fieldErrors` state; red border + "שדה חובה" |
| 26 | Phone field accepted any string | Validates 9–10 digits; "מספר טלפון לא תקין" inline |
| 27 | Pay amount could be set to 0 or negative silently | `updatePay` checks `pay <= 0`; remounts TextInput via `payKeys` |
| 28 | EditWorkerScreen save showed Alert | Replaced with success toast + auto-navigate after 800ms |
| 29 | No success feedback after any save action | `Toast.js` + `useToast()` across all screens |
| 30 | AddEventScreen had no cancel without scrolling | Added RTL-aware back arrow in top row |
| 31 | No visual distinction for today's events | Orange badge, card border, today-first sort |
| 32 | StaffList phone search broken | Split `qDigits`; phone uses digits-only comparison |
| 33 | `@react-native-community/netinfo` missing — OfflineBanner crashed | Ran `npx expo install @react-native-community/netinfo` |
| 34 | Worker history all zeros — `.order('created_at')` on table with no such column | Removed order clause; sort by event date in JS |
| 35 | Worker history returned 0 rows — `worker_id` not in select list caused RLS block | Added `worker_id` to `.select()` |
| 36 | EditEventScreen time field still free text after AddEvent upgrade | Replaced with native `DateTimePicker mode="time"` + `parseTimeString()` |
| 37 | WorkerPaymentsScreen stale closure | Replaced `useFocusEffect` with React Query `useQuery` |
| 38 | Dead files `OwnerHome.js` and `WorkerHome.js` | Deleted both |
| 39 | Password reset link opened `localhost:3000` | Added `redirectTo` + `app.json` scheme + deep-link handler + `ResetPasswordScreen` |
| 40 | **LoginScreen hardcoded colors — no theme support** | Rewrote with full design system tokens + theme toggle button |
| 41 | **ThemeProvider defaulted to light regardless of device setting** | `useState` initializer now reads `useColorScheme()` |
| 42 | **Stray `import './../../lib/rtl'` in DashboardScreen** | Removed immediately — rtl.js is already first import in App.js |
| 43 | **ShiftsScreen only showed upcoming shifts (no history)** | Rewrote to fetch all event_workers, filter client-side by status; added filter pills |

---

## 9. Known Remaining Issues

| # | Issue | Severity | File |
|---|---|---|---|
| 1 | **Password reset deep link not testable in Expo Go** — `eventmanager://` not registered by OS in Expo Go | Medium | `ResetPasswordScreen.js`, `App.js` |
| 2 | **Pay amount edit uses `onEndEditing`** — may not fire reliably on Android | Low | `EventDetailScreen.js` |
| 3 | **Worker creation fragile multi-step flow** — network drop between `signUp` and `setSession` leaves orphaned auth account | Low | `AddWorkerScreen.js` |
| 4 | **No pagination** on events or staff lists | Low | `EventsListScreen.js`, `StaffListScreen.js` |
| 5 | **Dashboard only queries `upcoming` events** — events marked done mid-week disappear from "this week" section | Low | `DashboardScreen.js` |
| 6 | **`EditEventScreen` not converted to design system** — still uses hardcoded colors from Phase 9 | Low | `EditEventScreen.js` |
| 7 | **`ResetPasswordScreen` not converted to design system** — rarely reached, but would show hardcoded colors | Low | `ResetPasswordScreen.js` |

---

## 10. Product Review Status

Items from `PRODUCT_REVIEW.md` and their current state:

| Item | Status |
|---|---|
| Remove debug logs in ShiftsScreen | ✅ Fixed (Bug #22) |
| Fix or remove Arabic language switcher | ✅ Fixed — replaced with "בקרוב" non-tappable text (Bug #23) |
| Delete dead files `OwnerHome.js`, `WorkerHome.js` | ✅ Fixed (Bug #38) |
| Payment toggle in EventDetail | ✅ Done |
| Phone tap-to-call | ✅ Done |
| Back button in AddEvent | ✅ Done (Bug #30) |
| Time picker replacement | ✅ Done (AddEvent Bug #24, EditEvent Bug #36) |
| Success toast after every save | ✅ Done |
| "היום" badge in EventsList | ✅ Done |
| Per-field input validation | ✅ Done |
| Bulk pay marking | ✅ Done |
| Worker history in EditWorker | ✅ Done |
| Event duplication | ✅ Done |
| Search in StaffList and EventsList | ✅ Done |
| Dark mode | ✅ Done — full Warm Minimal design system (Phase 12) |
| Worker shifts history (all, not just upcoming) | ✅ Done (Bug #43) |
| App icon and splash screen | ⏳ Not done — next priority before EAS build |
| Push notifications | ⏳ Not done — Phase 2 / after EAS |
| Worker attendance / confirmation | ⏳ Not done |
| Worker specialty / role field | ⏳ Not done |
| Expense tracking | ⏳ Not done |
| Export report (PDF/CSV) | ⏳ Not done |
| Swipe-to-delete on lists | ⏳ Not done |
| Dashboard "this week" includes done events | ⏳ Not done (Known issue #5) |
| Pay amount edit modal / Android reliability | ⏳ Not done (Known issue #2) |

---

## 11. What Is Next

### Immediate — Before EAS Build
1. **App icon** — replace default Expo icon with branded EventManager icon. Edit `app.json` `icon` field. Format: 1024×1024 PNG, no transparency. Also `android.adaptiveIcon`.
2. **Splash screen** — `app.json` `splash.image`, `splash.backgroundColor` (match `c.background` light, `#0F1117` dark — or pick one). Expo splash is static; if dark mode default is needed, set `backgroundColor: "#F8F6F3"`.
3. **`EditEventScreen` design system conversion** — apply theme tokens to the one remaining unconverted screen.
4. **Test on real device** — full clean restart, both light and dark, verify RTL layout throughout.

### EAS Build
5. **`eas.json`** — create with `development`, `preview`, `production` profiles.
6. **`app.json`** — finalize bundle ID (`com.eventmanager.app` or client-specific), display name, version 1.0.0.
7. **Supabase redirect URL** — add `eventmanager://reset-password` to Authentication → URL Configuration.
8. **`eas build --platform ios --profile preview`** — TestFlight IPA for client testing.

### High-Value Product Additions (Post-Handoff)
- **Push notifications** — `expo-notifications` + Supabase Edge Function; notify worker on assignment, reminder day before event.
- **Worker invitation flow** — replace fragile `signUp` session-juggling with Supabase email invite (Magic Link). Needed for Stage 2 anyway.
- **`EditEventScreen` fully themed** — apply design system (low effort, good completeness).
- **`ResetPasswordScreen` themed** — cosmetic, low priority.
- **Offline-first data** — React Query `cacheTime` already helps; explicit "no connection" state on empty lists.
- **Pagination** — `EventsListScreen` and `StaffListScreen` for large datasets.

### Stage 2 — Multi-Tenant SaaS
See `BUSINESS_PLAN.md` for full plan. Core changes: `business_id` on all tables, RLS scoped to tenant, self-service signup, worker email invitation, Stripe/Icount billing.

---

## 12. Environment & Credentials Reference

| Item | Value |
|---|---|
| Supabase URL | `https://inefvqnklgdtmddoglcf.supabase.co` |
| Supabase SQL Editor | https://supabase.com/dashboard/project/inefvqnklgdtmddoglcf/sql/new |
| Supabase Auth Users | https://supabase.com/dashboard/project/inefvqnklgdtmddoglcf/auth/users |
| Supabase Table Editor | https://supabase.com/dashboard/project/inefvqnklgdtmddoglcf/editor |
| **Supabase Redirect URLs** | **Authentication → URL Configuration → add `eventmanager://reset-password`** |
| Node version | v24.16.0 |
| npm version | 11.16.0 |
| Expo Go on iPhone | v54.0.2 |

**To run the app:**
```bash
cd C:\Projects\EventManager\EventManagerApp
npx expo start
```
Scan QR with Expo Go on iPhone. After any RTL-related code change, **fully close and reopen Expo Go** (not just Reload JS) for the native RTL flip.

**SQL files in `C:\Projects\EventManager\`:**
- `supabase_schema.sql` — original schema; **DO NOT re-run** (circular RLS bug)
- `supabase_rls_fix.sql` — corrected RLS policies using `app_metadata`
- `supabase_worker_rls.sql` — worker policies for `event_workers` + `events`; re-run if worker data stops loading

**Owner account setup (one-time, manual):**
1. Create user in Supabase Auth dashboard.
2. Insert row in `public.users` with `role = 'owner'`.
3. Set `app_metadata`: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"owner"}'::jsonb WHERE id = '<uuid>';`
4. Sign out and back in for fresh JWT.
