# Gym SaaS – Billing flow (how it works)

This doc explains how your **billing backend** works and how it fits with **Razorpay** and the **frontend**.

---

## 1. Big picture

- **Who pays:** The **gym owner** (the logged-in user) pays for the **SaaS subscription** (Growth, Elite, etc.).
- **What they get:** Access to the app (manage gyms, members, etc.). You can later restrict features by plan using `HasActiveSubscription`.
- **Payment provider:** **Razorpay** (India, INR). Subscriptions are created in Razorpay; your backend tracks status via **webhooks**.

---

## 2. Backend pieces

| Piece | Purpose |
|-------|--------|
| **SaaSPlan** | Plans in your DB (name, monthly/yearly, price in INR, `razorpay_plan_id`). You must create the plan in Razorpay first, then add a row here with that `razorpay_plan_id`. |
| **OwnerSubscription** | One per owner: which plan they’re on, status (created → active → cancelled/expired), Razorpay subscription id, current period dates. |
| **PaymentEvent** | Log of every webhook event (payment, activated, cancelled, etc.) for that subscription. |
| **CreateSubscriptionCheckout** | Your API that creates a Razorpay subscription and returns data so the frontend can open Razorpay’s payment UI. |
| **RazorpayWebhookView** | Receives events from Razorpay (payment success, subscription activated/cancelled, etc.) and updates `OwnerSubscription` and logs `PaymentEvent`. |
| **HasActiveSubscription** | Permission class: allow access only if the user has an active subscription (and optionally trial). You can use this later to lock dashboard/members behind paid plans. |

---

## 3. End-to-end flow (subscription + first payment)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │ Your Django │     │  Razorpay   │     │   Razorpay   │
│  (Pricing)  │     │   Backend   │     │   Checkout  │     │   Webhook    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  1. User clicks    │                   │                   │
       │  "Upgrade" on a    │                   │                   │
       │  plan              │                   │                   │
       │                   │                   │                   │
       │  2. POST           │                   │                   │
       │  /api/billing/     │                   │                   │
       │  checkout/         │                   │                   │
       │  { plan_id: 3 }   │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │  3. Create         │                   │
       │                   │  subscription      │                   │
       │                   │  (Razorpay API)    │                   │
       │                   ├──────────────────►│                   │
       │                   │                   │                   │
       │                   │  4. Returns        │                   │
       │                   │  subscription_id   │                   │
       │                   │◄──────────────────┤                   │
       │                   │                   │                   │
       │  5. Response:     │                   │                   │
       │  { razorpay_key,   │                   │                   │
       │    subscription_id }                   │                   │
       │◄──────────────────┤                   │                   │
       │                   │                   │                   │
       │  6. Open Razorpay  │                   │                   │
       │  Checkout (their  │                   │                   │
       │  script / popup)   │                   │                   │
       ├───────────────────────────────────────►│                   │
       │                   │                   │                   │
       │                   │                   │  7. User pays      │
       │                   │                   │  (card/UPI, etc.) │
       │                   │                   │                   │
       │                   │                   │  8. Razorpay      │
       │                   │                   │  sends webhook    │
       │                   │                   │  (e.g.            │
       │                   │                   │  subscription.    │
       │                   │                   │  activated)       │
       │                   │                   ├──────────────────►│
       │                   │  9. Your backend  │                   │
       │                   │  updates          │                   │
       │                   │  OwnerSubscription │                   │
       │                   │  (status=active,   │                   │
       │                   │  current_start/end)                    │
       │                   │  + log PaymentEvent                    │
       │                   │◄──────────────────────────────────────┤
       │                   │                   │                   │
       │  10. (Optional)   │                   │                   │
       │  Frontend polls   │                   │                   │
       │  GET subscription │                   │                   │
       │  or user refreshes│                   │                   │
       │◄──────────────────┤                   │                   │
```

- **Steps 1–5:** Frontend calls your checkout API; backend creates a Razorpay subscription and returns `razorpay_key` and `subscription_id`.
- **Step 6:** Frontend uses Razorpay’s Checkout (script/popup) so the user can pay.
- **Steps 7–9:** Razorpay charges the user and sends a webhook to your server; your `RazorpayWebhookView` updates `OwnerSubscription` and logs the event.
- **Step 10:** Frontend can show “Active” by calling an endpoint that returns the current subscription (you’d add that if not already there).

---

## 4. Your API in detail

### Create checkout (what you have)

- **URL:** `POST /api/billing/checkout/`
- **Body:** `{ "plan_id": <id of SaaSPlan> }`
- **Auth:** Required (logged-in user).
- **What it does:**
  1. Loads `SaaSPlan` by `id`, ensures it’s active.
  2. Gets or creates `OwnerSubscription` for `request.user`, sets plan and status `CREATED`.
  3. Calls Razorpay to create a subscription with that plan’s `razorpay_plan_id` (e.g. 120 cycles for monthly, 10 for yearly).
  4. Saves `razorpay_subscription_id` on `OwnerSubscription`.
  5. Returns:
     - `razorpay_key` – Razorpay key id (for frontend script).
     - `subscription_id` – Razorpay subscription id (for Checkout).
     - `status` – from Razorpay.

The **frontend** must then open Razorpay Checkout with this `subscription_id` and `razorpay_key` so the user can pay. After payment, **Razorpay** will call your webhook; you don’t “complete” the subscription from the frontend.

### Webhook (what you have)

- **URL:** `POST /api/billing/webhook/razorpay/`
- **Auth:** None (Razorpay calls it). Security = signature verification using `RAZORPAY_WEBHOOK_SECRET`.
- **What it does:**
  - Verifies `X-Razorpay-Signature` with the raw body.
  - Finds `OwnerSubscription` by `razorpay_subscription_id` from the payload.
  - Creates a `PaymentEvent` for every event (for audit).
  - Updates subscription status and period:
    - `subscription.activated`, `subscription.charged`, `subscription.resumed` → status **ACTIVE**, and sets `current_start` / `current_end` from Razorpay.
    - `subscription.halted`, `subscription.paused` → **HALTED**.
    - `subscription.cancelled` → **CANCELLED**.
    - `subscription.completed` → **EXPIRED**.

So: **Razorpay is the source of truth for payments; your DB is updated only via webhooks.**

---

## 5. What you need in Razorpay dashboard

1. **Plans**
   - Create subscription plans in Razorpay (Dashboard → Subscriptions → Plans) with the interval (monthly/yearly) and amount in **paise** (e.g. ₹999 = 99900 paise).
   - Copy each plan’s **Plan ID** (e.g. `plan_xxxx`).
   - In your Django admin (or DB), create a `SaaSPlan` with the same name/interval/amount and paste that Plan ID into `razorpay_plan_id`.

2. **Webhook**
   - In Razorpay Dashboard → Webhooks, add a webhook URL:  
     `https://your-domain.com/api/billing/webhook/razorpay/`
   - Select events like: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.halted`, `subscription.paused`, `subscription.resumed`.
   - Copy the **Webhook Secret** and set `RAZORPAY_WEBHOOK_SECRET` in your env (you already have this in `.env`).

3. **Keys**
   - You already use `TEST_API_KEY_ID` and `TEST_KEY_SECRET` for test mode. For production, use live keys and the same env variable names (or separate ones) and keep the webhook URL and secret for live mode.

---

## 6. What’s not done yet (frontend + optional APIs)

- **Pricing page:** Right now it’s static (hardcoded plans, buttons don’t call the backend). To wire billing:
  1. Add an API that **lists active SaaSPlans** (e.g. `GET /api/billing/plans/`).
  2. On “Upgrade”, call `POST /api/billing/checkout/` with the chosen `plan_id`.
  3. Use the returned `razorpay_key` and `subscription_id` to open **Razorpay Checkout** (Razorpay’s script or popup). After success, redirect to a “Thank you” or dashboard page.
- **Subscription status:** Add something like `GET /api/billing/subscription/` that returns the current user’s `OwnerSubscription` (plan name, status, current period end). Use it to show “Your plan” or “Renew by …” and, if you want, to gate features with `HasActiveSubscription`.

---

## 7. Quick reference

| Env variable | Purpose |
|--------------|--------|
| `TEST_API_KEY_ID` | Razorpay key id (test mode). |
| `TEST_KEY_SECRET` | Razorpay key secret (test mode). |
| `RAZORPAY_WEBHOOK_SECRET` | Used to verify webhook requests. |

| DB model | Purpose |
|----------|--------|
| **SaaSPlan** | Plan metadata + `razorpay_plan_id`. |
| **OwnerSubscription** | One per user; links to plan, stores Razorpay subscription id, status, period. |
| **PaymentEvent** | One row per webhook event (audit trail). |

| API | Purpose |
|-----|--------|
| `POST /api/billing/checkout/` | Create Razorpay subscription; return key + subscription_id for frontend Checkout. |
| `POST /api/billing/webhook/razorpay/` | Receive Razorpay events; update subscription and log events. |

Once you add a **list plans** endpoint and **subscription status** endpoint, you can hook the Pricing page and any “Your plan” UI to this flow.
