# GlycoFriend — Claude Code Implementation Instructions

## Project Overview

GlycoFriend is a diabetes management app that helps patients track their blood glucose levels, log meals, receive culturally-relevant dietary suggestions, and automatically send formatted PDF reports to their physician and community health worker (CHW).

This web app is an **internal demo only** — built in React + Node to validate the concept with a co-founder and a senior mobile developer before migrating to Flutter. The backend API should be designed mobile-first from day one so the Flutter handoff is clean.

**This is Phase 1 of a three-phase product.** Every architectural decision should be made with Phase 2 (provider layer: physician dashboard, CHW alert system, clinic subscriptions) and Phase 3 (ecosystem layer: pharmacy referral network, insurer integration, IoT wearable data ingestion) in mind. Build Phase 1 cleanly — do not over-engineer for Phase 2/3 — but never make a decision that would force a rewrite later.

**Stack:** React (Vite), Node.js (Express), PostgreSQL, Prisma ORM, SendGrid (email), PDF generation (puppeteer or pdfkit)

---

## Core Product Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth | Phone number + OTP via Africa's Talking | More realistic for Rwandan users |
| Glucose unit | mg/dL | Standard on most Rwandan glucometers |
| Logging type | Fasting, Pre-meal, Post-meal | Clinically meaningful distinction |
| Meal logging | Predefined Rwandan food list (multi-select) + optional text | Low friction, rule-engine compatible |
| Color thresholds | Standard clinical, stratified by diabetes type | Credible for physicians |
| Diet suggestions | Rule-based (JSON config) | Fast to iterate, non-engineers can edit |
| Physician report | PDF auto-generated + emailed | Fits doctor workflow, no new platform |
| Notifications | **Deferred — mobile app only** | Web demo does not need this |
| Physician dashboard | **Deferred — Phase 2** | PDF email is sufficient for Phase 1 |
| CHW email alert | Included in Phase 1 (optional field) | Low-friction entry point for care escalation loop |

---

## Color Threshold Logic

Thresholds vary by reading type. Apply these across all diabetes types unless noted:

### Fasting / Pre-meal (mg/dL)
| Color | Range |
|---|---|
| 🟢 Green | < 100 |
| 🟡 Yellow | 100–125 |
| 🔴 Red | ≥ 126 |

### Post-meal (2hr after eating) (mg/dL)
| Color | Range |
|---|---|
| 🟢 Green | < 140 |
| 🟡 Yellow | 140–199 |
| 🔴 Red | ≥ 200 |

**Weekly badge:** Calculated from the average of ALL readings that week. Apply fasting thresholds to the weekly average. Display as a single colored badge on the dashboard.

---

## Database Schema (PostgreSQL via Prisma)

```prisma
model User {
  id                  String    @id @default(uuid())
  phone               String    @unique
  name                String
  diabetesType        String    // "type1", "type2", "gestational", "other"
  medications         String[]  // free array of medication names

  // Physician report settings
  physicianEmail      String?
  reportFrequency     String?   // "weekly", "biweekly", "monthly"
  lastReportSentAt    DateTime? // prevents double-sends on restart

  // CHW alert settings (Phase 1 — optional, set by patient)
  chwEmail            String?
  lastCHWAlertSentAt  DateTime? // tracks last CHW alert dispatch

  createdAt           DateTime  @default(now())

  glucoseLogs         GlucoseLog[]
  weeklySummaries     WeeklySummary[]
}

model GlucoseLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  readingMgdl Float
  logType     String   // "fasting", "pre_meal", "post_meal"
  color       String   // "green", "yellow", "red" — computed at write time
  loggedAt    DateTime @default(now())

  mealLog     MealLog?
}

model MealLog {
  id           String     @id @default(uuid())
  glucoseLogId String     @unique
  glucoseLog   GlucoseLog @relation(fields: [glucoseLogId], references: [id])
  foods        String[]   // array of food IDs from predefined list
  notes        String?    // optional free text
  loggedAt     DateTime   @default(now())
}

model WeeklySummary {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  weekStart      DateTime // Monday 00:00:00 of that week
  averageReading Float
  colorBadge     String   // "green", "yellow", "red"
  totalReadings  Int
  suggestions    String[] // triggered rule IDs
  generatedAt    DateTime @default(now())
}

model FoodOption {
  id            String @id @default(uuid())
  nameEn        String
  nameRw        String
  category      String // "starch", "protein", "vegetable", "fruit", "dairy", "other"
  glycemicIndex String // "low", "medium", "high" — simplified for rule engine
}

model OtpSession {
  id        String   @id @default(uuid())
  phone     String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

## Folder Structure

```
glycofriend/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # OTP send + verify
│   │   │   ├── users.js         # profile, settings
│   │   │   ├── logs.js          # glucose + meal logging
│   │   │   ├── dashboard.js     # weekly summary, trends
│   │   │   └── reports.js       # PDF generation + email dispatch
│   │   ├── services/
│   │   │   ├── otp.js           # Africa's Talking integration
│   │   │   ├── colorEngine.js   # threshold logic
│   │   │   ├── ruleEngine.js    # diet suggestion rules
│   │   │   ├── pdfService.js    # PDF generation
│   │   │   ├── emailService.js  # SendGrid integration
│   │   │   └── scheduler.js    # cron job for auto reports
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT verification
│   │   ├── rules/
│   │   │   └── suggestions.json # rule-based diet suggestions (editable)
│   │   ├── data/
│   │   │   └── foods.json       # Rwandan food list seed data
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Auth/            # phone entry + OTP verify screens
    │   │   ├── Onboarding/      # profile setup, physician email, report frequency
    │   │   ├── Log/             # daily logging screen (core screen)
    │   │   ├── Dashboard/       # weekly badge, trend chart, recent logs
    │   │   └── Settings/        # profile, physician settings
    │   ├── components/
    │   │   ├── ColorBadge/      # red/yellow/green badge component
    │   │   ├── TrendChart/      # recharts line graph
    │   │   ├── FoodSelector/    # multi-select Rwandan food grid
    │   │   └── SuggestionCard/  # diet suggestion display
    │   ├── api/                 # axios instance + API calls
    │   └── main.jsx
    └── package.json
```

---

## API Endpoints

### Auth
```
POST /api/auth/send-otp       { phone }
POST /api/auth/verify-otp     { phone, code }  → { token, isNewUser }
```

### Users
```
GET  /api/users/me            → user profile
PUT  /api/users/me            { name, diabetesType, medications, physicianEmail, reportFrequency, chwEmail }
```

### Logging
```
POST /api/logs                { readingMgdl, logType, foods[], notes }  → log + color + suggestions
GET  /api/logs                ?limit=20&offset=0  → recent logs
```

### Dashboard
```
GET  /api/dashboard/summary   → current week badge, 4-week history, trend data
```

### Reports
```
POST /api/reports/send           → manually trigger PDF send to physician email
POST /api/reports/send-chw       → manually trigger CHW alert PDF to CHW email
GET  /api/reports/preview        → returns PDF buffer for in-browser preview
GET  /api/reports/preview-chw    → returns CHW alert PDF buffer for preview
```

### Reference Data
```
GET  /api/foods               → full list of FoodOptions (en + rw)
```

---

## Rule Engine — `suggestions.json`

The rule engine reads this file at runtime. Each rule has conditions and a suggestion in English and Kinyarwanda. **Non-engineers should be able to add rules here without touching code.**

```json
{
  "rules": [
    {
      "id": "high_post_starch",
      "conditions": {
        "logType": "post_meal",
        "readingColor": "red",
        "foodCategories": ["starch"]
      },
      "suggestion": {
        "en": "Your reading after this meal is high. Try reducing your starch portion (ugali, rice, or sweet potato) and adding more beans or lentils — same cost, slower glucose release.",
        "rw": "Agaciro k'amaraso yawe nyuma y'ifunguro ni hejuru. Gerageza kugabanya igice cy'ibikomoka ku bijumba (ugali, umuceri, cyangwa ibijumba) no kongera ibishyimbo cyangwa amashaza — igiciro kimwe, amaraso azamuka buhoro."
      }
    },
    {
      "id": "consistent_red_week",
      "conditions": {
        "weeklyColor": "red",
        "consecutiveRedWeeks": 2
      },
      "suggestion": {
        "en": "You've had two difficult weeks in a row. Consider reaching out to your doctor — your medication or meal plan may need adjustment.",
        "rw": "Ufite ibyumweru bibiri bigoye ikurikirana. Tekereza kuvugana na muganga wawe — imiti yawe cyangwa gahunda y'indyo bishobora gukenera guhindurwa."
      }
    },
    {
      "id": "good_week",
      "conditions": {
        "weeklyColor": "green"
      },
      "suggestion": {
        "en": "Great week! Your readings are well-controlled. Keep up your current routine.",
        "rw": "Icyumweru cyiza! Agaciro k'amaraso yawe ni cyiza. Komeza imyitwarire yawe isanzwe."
      }
    }
  ]
}
```

The `ruleEngine.js` service evaluates applicable rules after each log entry and after weekly summary generation.

---

## Rwandan Food List — `foods.json` (seed data)

Build this list with at minimum these items at launch. Add glycemic index category for rule matching.

```json
[
  { "id": "f001", "nameEn": "Ugali (maize porridge)", "nameRw": "Ubugali", "category": "starch", "glycemicIndex": "high" },
  { "id": "f002", "nameEn": "Rice", "nameRw": "Umuceri", "category": "starch", "glycemicIndex": "high" },
  { "id": "f003", "nameEn": "Sweet potato", "nameRw": "Ibijumba", "category": "starch", "glycemicIndex": "medium" },
  { "id": "f004", "nameEn": "Irish potato", "nameRw": "Pomme de terre", "category": "starch", "glycemicIndex": "high" },
  { "id": "f005", "nameEn": "Matoke (green banana)", "nameRw": "Ibitoke", "category": "starch", "glycemicIndex": "medium" },
  { "id": "f006", "nameEn": "Beans", "nameRw": "Ibishyimbo", "category": "protein", "glycemicIndex": "low" },
  { "id": "f007", "nameEn": "Lentils", "nameRw": "Amashaza", "category": "protein", "glycemicIndex": "low" },
  { "id": "f008", "nameEn": "Isombe (cassava leaves)", "nameRw": "Isombe", "category": "vegetable", "glycemicIndex": "low" },
  { "id": "f009", "nameEn": "Cassava", "nameRw": "Imyumbati", "category": "starch", "glycemicIndex": "high" },
  { "id": "f010", "nameEn": "Sorghum porridge", "nameRw": "Ikigage", "category": "starch", "glycemicIndex": "medium" },
  { "id": "f011", "nameEn": "Eggs", "nameRw": "Amagi", "category": "protein", "glycemicIndex": "low" },
  { "id": "f012", "nameEn": "Chicken", "nameRw": "Inkoko", "category": "protein", "glycemicIndex": "low" },
  { "id": "f013", "nameEn": "Fish", "nameRw": "Ifi", "category": "protein", "glycemicIndex": "low" },
  { "id": "f014", "nameEn": "Avocado", "nameRw": "Avoka", "category": "fruit", "glycemicIndex": "low" },
  { "id": "f015", "nameEn": "Banana", "nameRw": "Igitoki", "category": "fruit", "glycemicIndex": "medium" },
  { "id": "f016", "nameEn": "Milk", "nameRw": "Amata", "category": "dairy", "glycemicIndex": "low" },
  { "id": "f017", "nameEn": "Spinach / amaranth greens", "nameRw": "Imbwija", "category": "vegetable", "glycemicIndex": "low" },
  { "id": "f018", "nameEn": "Pumpkin", "nameRw": "Inzuza", "category": "vegetable", "glycemicIndex": "low" },
  { "id": "f019", "nameEn": "Groundnuts / peanuts", "nameRw": "Amacunda", "category": "protein", "glycemicIndex": "low" },
  { "id": "f020", "nameEn": "Soda / soft drink", "nameRw": "Isoda", "category": "other", "glycemicIndex": "high" }
]
```

---

## PDF Report Structure

Generate using `pdfkit` or `puppeteer`. The report should be clean, one page where possible, and scannable in under 30 seconds.

**Sections (top to bottom):**
1. **Header** — GlycoFriend logo (text-based for now), "Glucose Report", generated date
2. **Patient info** — Name, Diabetes Type, Report Period
3. **Weekly badge strip** — Last 4 weeks shown as colored circles with dates (🟢🟡🔴)
4. **Summary stats** — Average fasting reading | Average post-meal reading | Total logs this period
5. **Trend chart** — Simple line graph of daily averages over the report period
6. **Top foods logged** — Most frequently logged foods this period
7. **Active suggestions** — Any rule-triggered suggestions from this period
8. **Footer** — "Generated by GlycoFriend • Not a substitute for medical advice"

**Email subject line (physician):**  
`GlycoFriend Report — [Patient Name] — [Period]`

---

## CHW Alert PDF Structure

A separate, shorter PDF sent to the CHW email when a trigger condition is met. CHWs are not reading clinical trends — they are deciding whether to do a home visit. Keep it to one page, action-oriented.

**Trigger conditions (evaluated weekly by scheduler):**
- Patient has had 2 or more consecutive red weeks
- Patient has not logged any reading in 5+ days (engagement gap)
- Patient's average this week is ≥ 200 mg/dL (critically uncontrolled)

**Sections:**
1. **Header** — "GlycoFriend CHW Alert", generated date
2. **Patient info** — Name, phone number, diabetes type
3. **Alert reason** — Plain language: e.g. "This patient has had 2 red weeks in a row"
4. **Last 4 weeks badge strip** — 🟢🟡🔴 with dates
5. **Last logged reading** — Date + value
6. **Logging consistency** — "Logged X out of 14 expected readings this period"
7. **Suggested action** — "Consider a home visit or phone check-in"
8. **Footer** — "Sent by GlycoFriend on behalf of [Patient Name] • Confidential"

**Email subject line (CHW):**  
`GlycoFriend Alert — [Patient Name] needs follow-up`

**Important:** The CHW PDF contains the patient's phone number so the CHW can reach out directly. Do not include full glucose log history — CHWs do not need that level of detail in Phase 1.

---

## Core Logging Screen UX (most important screen)

The logging flow must complete in **under 3 taps** for the basic case.

```
Screen: Log Reading

1. [ Fasting ]  [ Pre-meal ]  [ Post-meal ]   ← tab selector, default: Fasting

2. [     8  4  _  ]  mg/dL                    ← large number input, numeric keyboard

3. What did you eat? (optional)               ← only show if Pre-meal or Post-meal selected
   [ Beans ] [ Rice ] [ Ugali ] [ Eggs ]      ← food grid, multi-select, 4 per row
   [ Isombe ] [ Matoke ] [ Fish ] [ Avoka ]
   [ + Other... ]                             ← expands text area

4. [ Save Reading ]                           ← primary CTA button

→ After save: show color result + any triggered suggestion
   e.g. "🟡 Yellow — 162 mg/dL" + suggestion card
```

---

## Weekly Dashboard UX

```
Screen: Dashboard

[ Week of Jun 2–8 ]          ← current week header

     🔴                      ← large weekly badge, centered
  This week: Red
  Avg: 198 mg/dL

[ Last 4 weeks ]
  🟢 May 19   🟡 May 26   🟢 Jun 2   🔴 Jun 9

[ Trend ]                    ← recharts LineChart, 14-day view
  (line graph of daily averages)

[ Recent Logs ]
  Today 8:14am  Fasting  84 mg/dL  🟢
  Yesterday 1:02pm  Post-meal  201 mg/dL  🔴
  ...

[ 💊 Log a Reading ]         ← floating action button
```

---

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=
AFRICAS_TALKING_API_KEY=
AFRICAS_TALKING_USERNAME=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=reports@glycofriend.rw
PORT=4000

# Frontend
VITE_API_BASE_URL=http://localhost:4000
```

---

## Implementation Order

Build in this sequence to always have a working demo at each step:

1. **Database + Prisma setup** — schema, migrations, seed foods + OTP table
2. **Auth flow** — send OTP → verify → JWT issued (use Africa's Talking sandbox for dev)
3. **User profile** — GET/PUT /api/users/me, onboarding flow in frontend
4. **Logging endpoint + color engine** — POST /api/logs with color computation
5. **Logging screen (frontend)** — the core screen, food selector, post-save feedback
6. **Dashboard endpoint + frontend** — weekly summary, badge, trend chart
7. **Rule engine** — load suggestions.json, evaluate rules on each log
8. **PDF generation** — report layout, pdfkit or puppeteer
9. **Email dispatch** — SendGrid integration, physician email from user profile
10. **Report scheduler** — cron job: physician PDF on reportFrequency, CHW alert on trigger conditions
11. **Settings screen** — physician email, CHW email, report frequency, profile edit
12. **Polish** — MUAC color consistency, Kinyarwanda labels, mobile-responsive layout

---

## Scalability Notes — Designing for Phase 2 and 3

These are constraints to follow in Phase 1 that will make Phase 2/3 significantly easier to build.

**Notification dispatch must be abstracted.** The scheduler should not have hardcoded logic for "send to physician" and "send to CHW." Instead, build a generic `dispatchAlert(userId, alertType, recipientRole)` function that looks up the right recipient and template based on role. When Phase 2 adds clinic dashboards or in-app physician alerts, you add a new recipient role — you do not rewrite the scheduler.

**Alert types should be config-driven.** Define alert triggers in a `alerts.json` config file alongside `suggestions.json`, not hardcoded in `scheduler.js`. Each alert has: a trigger condition, a recipient role (physician, chw, patient), a PDF template, and a cooldown period (e.g. don't send CHW alert more than once per week). This makes it easy to add new alert types in Phase 2 without touching core scheduler logic.

**The data model must be IoT-ready.** The `GlucoseLog` model currently assumes manual entry. Add a `source` field now: `"manual"` for Phase 1, `"cgm"` or `"wearable"` for Phase 3. This costs nothing to add now and prevents a migration later when wearable integration arrives.

**API versioning from day one.** Prefix all routes with `/api/v1/`. The Flutter mobile app and eventually third-party integrations (pharmacy, insurer) will consume this API. Versioning means you can evolve the API without breaking existing clients.

**Multi-recipient report architecture.** The `WeeklySummary` model already captures the data needed for both physician and CHW reports. Do not create separate summary tables for each recipient — generate different PDF templates from the same underlying summary data. In Phase 2, a physician dashboard simply reads from `WeeklySummary` directly.

**Patient consent for data sharing.** Add a `consentSharedWithPhysician` and `consentSharedWithCHW` boolean to the User model now. Even if both default to `true` in Phase 1, having the field means you can build a proper consent UI in Phase 2 without a schema migration. This is also important for Rwanda data privacy compliance as the product scales.

---

## Design Notes

- **Color palette:** Use the MUAC-inspired palette strictly — `#2ECC71` (green), `#F1C40F` (yellow), `#E74C3C` (red). These are recognizable to Rwandan health workers.
- **Typography:** Clean, large readable fonts. Many diabetic patients are older — default font size should be generous (16px minimum body text).
- **Language:** All UI labels should have both English and Kinyarwanda strings from the start. Build a simple `i18n` object, even if you only implement EN for the demo.
- **Mobile-responsive:** The web demo should look good on a phone screen since that's how you'll demo it.
- **No notifications:** Do not implement push or SMS notifications in the web demo. This is a mobile app feature.
- **No physician dashboard:** Physician interaction is 100% via PDF email in Phase 1.

---

## What This Demo Needs to Prove

At the end of the demo, your co-founder and the mobile dev should be able to:
1. Sign up with a phone number and complete onboarding
2. Log a glucose reading with a meal and see the color result
3. See the weekly dashboard with badge and trend
4. Trigger a diet suggestion based on a high post-meal reading
5. Manually send a PDF report to a test email and receive it

That's the demo. Everything else is polish.
