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
- [ ] Add `isSignedIn`, `isOwner(uid)`, and `isAdmin()` helper functions  
- [ ] Apply per-collection rules:
  - `users`: read/write = owner or admin  
  - `rates`: read = signed in / write = admin  
  - `timesheets`: read/write = owner or admin
- [ ] Enforce `FieldValue.serverTimestamp()` for all time writes  
- [ ] Verify `Custom Claims` are set via Admin SDK (not from client)  
- [ ] Enable Firestore Index: `(userId, clockIn desc)`  

---

## 🧮 2. Payroll Calculation Unification
**Goal:** Single source of truth for all pay logic

### Tasks
- [ ] Create `lib/pay.ts` with central `calcPay()` function  
- [ ] Handle:
  - [ ] Round to 15 minutes  
  - [ ] Overtime 25%  
  - [ ] Late-night 25%  
  - [ ] Holiday 35%  
- [ ] Use the same function both client & Cloud Functions  

---

## 💾 3. CSV Export / Reporting
**Goal:** Enable human-readable & accounting-ready outputs

### Tasks
- [ ] Add `ExportCSV()` in `lib/export.ts`
- [ ] Fields: userId, date, start, end, hours, amount  
- [ ] Monthly user filter
- [ ] Optional: add total line per user
- [ ] Button on admin dashboard  

---

## 🔐 4. Authentication Improvements
**Goal:** Prepare for multi-role and external user access

### Tasks
- [ ] Add Google Auth sign-in  
- [ ] Create admin claim via Functions  
- [ ] Add demo/test account  
- [ ] Redirect unauthenticated users  

---

## 🧭 5. UI/UX & Frontend Polishing
**Goal:** Smooth interaction and readability

### Tasks
- [ ] Add loading spinners & toast messages  
- [ ] Highlight today’s attendance  
- [ ] Add validation (zod or react-hook-form)  
- [ ] Ensure mobile responsive layout  

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
- [ ] Add GitHub Actions for deploy (hosting + firestore)  
- [ ] Use Firebase Preview Channels for test deployments  

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
