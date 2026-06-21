# EventManager — Business Plan
**Date:** June 10, 2026
**Author:** Amr

---

## 1. What the Product Is and Who It's For

EventManager is a mobile app (iOS & Android) for independent event producers to manage the operational side of their business: creating events, assigning crew, and tracking who has been paid.

The core users are **small-to-medium event production businesses** in Israel — wedding coordinators, corporate event producers, nightclub promoters, and venue operators who run 10–100 events per year with a rotating crew of 5–30 workers. These owners currently manage everything through WhatsApp groups, paper notes, and mental accounting. They have no dedicated tool.

The app has two roles:
- **Owner / Producer** — creates events, assigns workers with pay rates, marks payments done.
- **Worker / Crew** — logs in and sees only their own shifts and payment status.

The app is built Hebrew-first with full RTL layout. The language is deliberate: this is not a generic global product retrofitted for Hebrew, it is a product designed from the ground up for how Israeli event businesses operate.

---

## 2. The Multi-Tenant SaaS Vision

The current build serves one owner with one Supabase project. The long-term vision is a **multi-tenant SaaS platform** where each event production business is a self-contained tenant:

- Each business (tenant) has its own owner account, its own workers, its own events, and its own data.
- Tenants are fully isolated — one business cannot see another's staff or events.
- A producer signs up, enters their business name, and starts using the app the same day. No manual setup by the developer required.
- Billing is handled per-tenant on a monthly subscription.

The product is built for **event producers** as the customer, not for the workers. Workers are free end-users who the owner invites. The owner is the one who pays.

This model scales horizontally: every new event producer who signs up is a new recurring revenue unit with zero marginal infrastructure cost.

---

## 3. Pricing Ideas

### Model: Monthly Subscription per Business

Pricing is per owner account (one business = one subscription). Workers are included free — charging per worker would penalize the busiest customers and create friction at onboarding.

**Suggested tiers:**

| Tier | Price | What's Included |
|---|---|---|
| **Basic** | ₪49/month | 1 owner, up to 10 workers, up to 20 events/month |
| **Pro** | ₪99/month | 1 owner, unlimited workers, unlimited events, push notifications |
| **Business** | ₪199/month | Up to 3 owner seats, reports export, priority support |

**Notes on pricing:**
- ₪49/month is roughly the cost of one coffee per week — low enough that a working producer doesn't think twice about it.
- The jump to Pro is justified by unlimited events and push notifications, both of which active producers will want.
- Annual billing option (e.g., 2 months free) should be offered from day one to improve cash flow.
- A **14-day free trial** with no credit card required is standard SaaS practice and removes signup friction.

**Validation approach:** Start by charging the first 3–5 clients manually (bank transfer or Bit) before building a billing system. This proves willingness to pay before investing in Stripe or Icount integration.

---

## 4. Stage 1 — Current Client Handoff

Stage 1 is the handoff of the existing app to the first client (the owner it was built for). This is not a SaaS launch — it is a single-tenant deployment for a specific person.

**What handoff looks like:**

1. **Fix remaining issues before handoff** (documented in PROGRESS.md):
   - Replace free-text time field in EditEventScreen with native time picker.
   - Fix WorkerPaymentsScreen stale closure bug.
   - Delete dead files (`OwnerHome.js`, `WorkerHome.js`).
   - Test on real device after clean restart.

2. **Build for production** — EAS build to create an IPA for TestFlight (iOS). This removes the dependency on Expo Go and gives the client a properly installed app with an icon.

3. **Write a handoff document** covering:
   - How to log in and add workers.
   - What to do if a worker forgets their password.
   - How to reach the developer if something breaks.
   - Known limitations (no Arabic yet, no offline mode).

4. **Set up the Supabase project for production**:
   - Enable email rate limiting.
   - Set up a backup schedule.
   - Ensure the `delete_worker_account` RPC is documented.

5. **Agree on a support arrangement** — the client will have questions. Either charge a small monthly retainer (₪200–500/month) for bug fixes and support, or agree on a fixed number of support hours.

**What Stage 1 is not:** It is not a scalable product. The Supabase project is hardcoded in the app. Adding a second client would require duplicating the entire backend. That is what Stage 2 solves.

---

## 5. Stage 2 — Multi-Tenant Rebuild

Stage 2 is the architectural rebuild required to serve multiple businesses from a single backend.

**Core technical changes required:**

### Database — Add Tenant Isolation

Every table needs a `business_id` column that scopes all data to a tenant:

```sql
-- New table
businesses (id, name, owner_user_id, plan, created_at)

-- All existing tables get:
ALTER TABLE events ADD COLUMN business_id uuid REFERENCES businesses(id);
ALTER TABLE users ADD COLUMN business_id uuid REFERENCES businesses(id);
-- etc.
```

Row Level Security policies are rewritten so that every query is automatically scoped to `auth.jwt() → business_id`. No tenant can ever read another's data, even if there is a bug in the application layer.

### Authentication — Self-Service Signup

Currently, the owner account is created manually via SQL. In Stage 2:
- An owner visits a web signup page (or an in-app onboarding screen).
- They enter their business name, email, and password.
- A `businesses` row is created, their user is created, and their `app_metadata` is set to `{role: "owner", business_id: "..."}` — all automatically via a Supabase Edge Function.

### Worker Invitation — Replace `signUp` Flow

The current worker creation flow (save owner session → signUp as worker → restore owner session) is fragile and does not scale. In Stage 2, workers are invited by email:
- Owner enters worker email and name.
- Supabase sends an invite email (magic link).
- Worker sets their own password.
- No session juggling required on the owner's device.

### Billing Integration

Before launch, integrate a billing provider:
- **Stripe** (global standard, good Node SDK) or **Icount** (Israeli invoicing compliance).
- A webhook from Stripe triggers a Supabase Edge Function that activates or deactivates a tenant's `plan` field.
- The app checks `plan` on login and restricts features above the tier limit.

### App Changes

- The Supabase URL and anon key stay the same (one project, not per-client).
- The app's login screen gets a "Sign up" path for new businesses.
- The Settings screen shows the current plan and a "Upgrade" button.
- `business_id` is read from the JWT claims on every API call — no code changes needed per screen if RLS is correct.

### Infrastructure

- One Supabase project (Pro plan, ~$25/month) handles all tenants.
- EAS builds produce a single app binary for all customers — no per-client builds.
- A simple landing page (Hebrew) with signup CTA and pricing is required.

**Estimated Stage 2 scope:** 4–6 weeks of focused development for someone who knows the existing codebase.

---

## 6. Competitor Research Questions

Before investing in Stage 2, the following questions should be answered:

**Are there existing apps targeting Israeli event producers?**

Specific things to investigate:
- Search the Israeli App Store for: "ניהול אירועים", "ניהול צוות אירועים", "תשלומי עובדים אירועים"
- Search Google IL for: "אפליקציה לניהול צוות אירועים", "תוכנה לניהול עובדים אירועים ישראל"
- Ask in Israeli event producer Facebook groups / WhatsApp groups whether there is a tool they use or wish existed
- Check whether global tools like **Deputy**, **When I Work**, **Homebase**, or **7shifts** have Hebrew localization and Israeli market presence

**Specific questions to answer:**
1. Do Israeli event producers use any scheduling or crew management software today, or are they 100% on WhatsApp + spreadsheets?
2. Is the payment tracking problem (who do I owe, per worker) solved by any existing tool in Hebrew?
3. Do existing tools support RTL layouts natively, or are they English-only retrofits?
4. What is the price point Israeli producers are used to paying for business tools (if any)?
5. Are there Israeli-built SaaS products in adjacent spaces (catering management, venue booking) that have already proven willingness to pay?

**Hypothesis to validate:** The gap is not that no tools exist globally — Deputy and similar products exist — but that none are Hebrew-first, built for the specific Israeli event crew model (cash/Bit payments, WhatsApp culture, small crews), and priced for a one-person operation rather than a restaurant chain.

---

## 7. What Makes This Product Different

**Hebrew-first, not Hebrew-translated.** Every date format, every label, every layout direction was built for Hebrew from the start. Global tools add RTL as an afterthought; this product was designed RTL-first. For an Israeli operator, the difference is immediately apparent.

**Built for the payment problem, not the scheduling problem.** Most crew management tools (Deputy, When I Work) are built for scheduling — shift planning, clock-in/out, timesheets. Israeli event producers don't need timesheets. They need to know, after each event, who they owe and how much. The payments module is the core of this product, not an add-on.

**Worker access without worker management overhead.** Workers get a read-only view of their own shifts and payments. They don't need to be onboarded, trained, or managed in the app — they just log in and see their information. This removes a key objection from owners: "my crew isn't tech-savvy enough."

**Designed for events, not for restaurants or retail.** Competing tools in the crew management space are designed for businesses with fixed locations, set weekly schedules, and hourly wages. Event production has none of these — events are one-off, at different venues, with variable crew and variable pay. The data model (Events → Assignments → Pay per assignment) matches how event production actually works.

**3-tap rule.** The core actions — mark an event done, mark a worker paid, assign someone to an event — all complete in 3 taps or fewer. The owner uses this app on the floor of a live event, not at a desk. Speed and simplicity are not nice-to-haves; they are the product.

**WhatsApp-compatible.** The app does not try to replace WhatsApp for communication. It solves the operational and financial record-keeping problem that WhatsApp cannot solve. This is a complement to how Israeli business already works, not a replacement for it.

---

## Summary — What to Do Next

| Step | When |
|---|---|
| Fix remaining bugs + EAS build for Stage 1 handoff | Now |
| Agree Stage 1 support/retainer arrangement with first client | Now |
| Interview 5–10 other Israeli event producers about their workflow | Next 2–4 weeks |
| Research competitor landscape (App Store + Google searches) | Next 2–4 weeks |
| Validate pricing willingness to pay with 2–3 prospective clients | Before Stage 2 build |
| Design multi-tenant schema + worker invitation flow | After validation |
| Build Stage 2 MVP with Stripe billing | 4–6 weeks after validation |
| Launch landing page + waitlist | Alongside Stage 2 build |
