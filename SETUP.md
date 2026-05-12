# Expense Tracker — Setup Guide

## Stack
- **React Native** (Expo SDK 51) — iOS, Android, Web
- **Supabase** — Auth + PostgreSQL database
- **TypeScript** — Full type safety

---

## Step 1 — Install Dependencies

Open a terminal in this folder and run:

```bash
npm install
```

If you don't have Expo CLI:
```bash
npm install -g expo-cli
```

---

## Step 2 — Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and give it a name (e.g., "Expense Tracker")
3. Wait for the project to finish provisioning (~1–2 min)
4. Go to **SQL Editor** → **New Query**
5. Copy the entire contents of `supabase/schema.sql` and paste it in, then click **Run**
6. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public** key

---

## Step 3 — Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## Step 4 — Run the App

```bash
# Start the Expo dev server
npm start

# Or run directly on platform:
npm run ios       # iOS simulator (Mac only)
npm run android   # Android emulator
npm run web       # Browser
```

When it starts, scan the QR code with the **Expo Go** app on your phone.

---

## Step 5 — Create Your Account

1. Open the app
2. Tap **Create one** on the login screen
3. Enter your email and password
4. Check your email for a confirmation link (Supabase sends this)
5. After confirming, sign in

---

## Project Structure

```
src/
├── contexts/        AuthContext — manages login state
├── hooks/           useExpenses — all expense CRUD + monthly data
├── navigation/      App navigation (tabs + auth flow)
├── screens/
│   ├── auth/        Login & Signup
│   ├── DashboardScreen.tsx
│   ├── ExpensesScreen.tsx    ← main screen, Personal/Business tabs
│   ├── AddExpenseScreen.tsx  ← add/edit expense form
│   ├── WeeklyScreen.tsx      ← weekly savings breakdown
│   └── SettingsScreen.tsx
├── components/      Reusable UI components
├── services/        Supabase client + DB helpers
├── theme/           Colors, typography, spacing
├── types/           TypeScript types
└── utils/           Date helpers, currency formatting
```

---

## Key Features

| Feature | Where |
|---|---|
| Add/edit recurring expenses | AddExpenseScreen (tap + button) |
| Mark bills as paid/unpaid | ExpensesScreen — tap the ✓ circle |
| Personal vs Business split | ExpensesScreen — tabs at top |
| Monthly overview with progress | DashboardScreen |
| Weekly savings breakdown | WeeklyScreen (bar chart tab) |
| Navigate between months | MonthSelector on each screen |

---

## Publishing to App Store / Play Store

When you're ready to publish:

1. **iOS**: Run `eas build --platform ios` (requires Apple Developer account — $99/yr)
2. **Android**: Run `eas build --platform android` (requires Google Play account — $25 one-time)
3. Install EAS CLI: `npm install -g eas-cli` and `eas login`

See [Expo's publishing guide](https://docs.expo.dev/distribution/introduction/) for full instructions.

---

## Continuing Development with Claude Code in VS Code

Open this folder in VS Code. With Claude Code installed:
- Press `Ctrl+Shift+P` → "Claude Code: Open Chat"
- Or use the Claude panel in the sidebar

Suggested next features to ask Claude to build:
- Budget limits per category with alerts
- Export expenses to CSV/PDF
- Charts & analytics view
- Push notifications for upcoming due dates
- Currency selector
- Dark mode support
