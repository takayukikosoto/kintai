# 🧭 KINTAI Project TODO Plan
Version: 2025-10-06  
Author: Kosoto

---

## 🎯 Overall Goal
Two-hour prototype → Production-ready minimal KINTAI attendance system with secure auth, accurate payroll, export, and admin workflow.

---

## 🧩 1. Security & Firestore Rules
**Goal:** Restrict access and prevent data leaks

### Tasks
- [x] Add `isSignedIn`, `isOwner(uid)`, and `isAdmin()` helper functions  
- [x] Apply per-collection rules:
  - `users`: read/write = owner or admin  
  - `rates`: read = signed in / write = admin  
  - `timesheets`: read/write = owner or admin
- [x] Enforce `FieldValue.serverTimestamp()` for all time writes  
- [x] Verify `Custom Claims` are set via Admin SDK (not from client)  
- [x] Enable Firestore Index: `(userId, clockIn desc)`
- [x] Add data validation functions (`isValidTimesheet()`)  

---

## 🧮 2. Payroll Calculation Unification
**Goal:** Single source of truth for all pay logic

### Tasks
- [x] Create `lib/pay.ts` with central `calcPay()` function  
- [x] Handle:
  - [x] Round to 15 minutes  
  - [x] Overtime 25%  
  - [x] Late-night 25% (22:00-5:00)
  - [x] Holiday 35% (weekends)
- [x] Use the same function both client & Cloud Functions
- [x] Configurable via `PayrollConfig` interface  

---

## 💾 3. CSV Export / Reporting
**Goal:** Enable human-readable & accounting-ready outputs

### Tasks
- [x] Add `ExportCSV()` in AdminTimesheetView
- [x] Fields: userId, date, start, end, hours, amount  
- [x] Monthly user filter (date range picker)
- [x] Button on admin dashboard
- [x] UTF-8 BOM for Excel compatibility  

---

## 🔐 4. Authentication Improvements
**Goal:** Prepare for multi-role and external user access

### Tasks
- [x] Add Google Auth sign-in  
- [x] Create admin claim via Admin SDK script (`setAdmin.js`)
- [ ] Add demo/test account  
- [x] Redirect unauthenticated users (login page)  

## 🧭 5. UI/UX & Frontend Polishing
**Goal:** Smooth interaction and readability

### Tasks
- [x] Add loading spinners & toast messages  
- [ ] Highlight today's attendance  
- [x] Add validation (inline validation for forms)
- [x] Ensure mobile responsive layout (CSS media queries)  

---

## ⚙️ 6. Webhook & External Integration
**Goal:** Secure connection to external systems
### Tasks
- [ ] Add HMAC signature verification for incoming webhooks  
- [ ] Retry logic (3x with exponential backoff)  
- [ ] Logging webhook events to Firestore  
- [ ] Optional: Slack or Teams notification  

---

## 📊 7. Monitoring & CI/CD
**Goal:** Detect errors & automate deploys

### Tasks
- [ ] Integrate Sentry for client error tracking  
- [x] Add GitHub Actions for deploy (hosting + firestore)  
- [ ] Use Firebase Preview Channels for test deployments
- [x] Add workflow file (`.github/workflows/deploy.yml`)  

---

## 🧱 8. Mid-term Extensions
**Goal:** Reach production-grade operation

### Tasks
- [ ] Approval flow (draft → approved → locked)  
- [ ] Shift vs actual comparison view  
- [ ] Location/IC tag integration  
- [ ] 3-axis aggregation: user / site / month  

---

## 📜 9. Housekeeping
**Goal:** Maintainability & collaboration readiness

### Tasks
- [ ] Add `LICENSE`, `.env.example` comments  
- [ ] Add screenshots to README  
- [ ] Fix Prettier / ESLint config  
- [ ] Split commits per feature  

---

## ✅ 10. Launch Plan
**Goal:** Minimum viable, secure, operational

### Order of Execution
1. Firestore security rules  
2. Payroll unification  
3. CSV export  
4. Auth & roles  
5. UI polish  
6. Webhook  
7. Monitoring  
8. Extensions

---

## 🕐 Estimated Timeline
| Phase | Duration | Main Goal |
|-------|-----------|------------|
| 1 | 0.5 day | Rules + calc unify |
| 2 | 0.5 day | CSV + export UI |
| 3 | 1 day | Auth / roles / HMAC |
| 4 | 1 day | UI / CI / Docs |
| **Total** | **~3 days** | Stable MVP |

---

**End of file**
