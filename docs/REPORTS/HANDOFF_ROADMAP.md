# 📋 VENUZ Project: Handoff & Functionality Roadmap
**Date:** January 22, 2026
**Current Production URL:** `https://venuz-pwa-final.vercel.app`
**Status:** 🎨 UI/UX Complete | 🛡️ Security Active | 📱 PWA Ready | 🧠 Logic/Data Incomplete

---

## 🛑 Critical Reality Check
While the application **looks** stunning and installs as a PWA, it is currently a "shell". The following functional gaps exist:
1.  **Ghost Town:** Only ~5 mock/test items exist in the database.
2.  **Dead Clicks:** Most buttons (Likes, Share, Bookings, Filter categories) are UI-only and do not trigger backend actions.
3.  **Read-Only:** Users cannot yet upload content, edit profiles, or truly interact.

---

## 🚀 Achievements (The "Front-End" Phase)
*   **Infrastructure:**
    *   Production deployment secured on Vercel (bypassing team permission blocks).
    *   `next-pwa` integrated: Installable on iOS/Android with offline fallback.
*   **Security:**
    *   Middleware with CSP, HSTS, and Frame Guard (Anti-clickjacking).
    *   Safe from XSS and basic injection attacks.
*   **Interface:**
    *   Premium "Glassmorphism" Design System.
    *   Responsive layouts (Mobile First).

---

## 🗺️ The Roadmap: Phase 2 - "Functionality & Data"
*This is the action plan for the next AI/Developer (Claude).*

### 1. Database Wiring & Seeding (Priority: High)
*   **Problem:** The app feels empty.
*   **Action:**
    *   Create a "Seeding Script" to populate Supabase with 50-100 realistic fake profiles/content items.
    *   Ensure all categories (Startups, Escorts, Clubs) have data.
    *   **Tech:** Supabase SQL Editor or a Node.js admin script.

### 2. Interactive Logic (The "Wiring")
*   **Problem:** Buttons don't do anything.
*   **Action:**
    *   **Filters:** Make the category icons on the top actually query Supabase (currently they might just change URL state without refetching).
    *   **Likes/Hearts:** Wire the heart icon to `insert/delete` from a `likes` table.
    *   **Search:** Connect the search bar to a Supabase text search query.

### 3. User & Content Management
*   **Problem:** No way to add new content.
*   **Action:**
    *   **Profile Page:** Build the "Edit Profile" form.
    *   **Upload Flow:** Create a flow for users to upload photos/videos to Supabase Storage.
    *   **Auth Gates:** Ensure only logged-in users can Like/Book.

### 4. Backend Security Policies (RLS)
*   **Problem:** Data might be exposed if not restricted.
*   **Action:**
    *   Review `policies` in Supabase.
    *   Ensure users can ONLY edit their own data.

---

## 📂 File System Context
*   **PWA Config:** `next.config.js`, `manifest.json`, `app/offline/page.tsx` (DONE).
*   **Components:** Look in `components/InfiniteFeed.tsx` for the main data loop.
*   **Styles:** Tailwind + `globals.css` (Glassmorphism).

## 💡 Instruction for Claude
> "Claude, the car is built and painted Ferrari Red, but it has no engine oil and the gas tank is empty. We need to **fill the database** with data and **wire up the buttons** to Supabase. Focus on `InfiniteFeed.tsx` logic and creating a `seed.ts` script for data."
