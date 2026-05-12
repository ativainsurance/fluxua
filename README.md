# Expense Tracker

A mobile-first bill tracking app that helps you stay on top of recurring commitments, split expenses by personal vs. business, and visualize your weekly cash flow.

## Stack

- **React Native** with **Expo SDK 51**
- **Supabase** (Postgres + Auth + Row Level Security)
- **TypeScript**
- **React Navigation** (bottom tabs + native stack)

## Key Features

- **Recurring expenses** — monthly, weekly, quarterly, semiannual, yearly, or one-time
- **Personal / Business split** — track and report each category separately
- **Monthly + weekly flow views** — see what's due this week and how coverage maps across the month
- **Bill tracking** — mark as paid with actual amount, record late fees, apply credits, or mark as waived
- **Autopay tracking** — flag bills on autopay with card or ACH and last-4 digits
- **Custom categories** — extend the built-in category list with your own
- **Per-month overrides** — exclude or remove a bill from a specific month without deleting it

## Quick Start

See [SETUP.md](SETUP.md) for environment setup, Supabase schema instructions, and how to run the app locally.

## Web Deployment

This app is deployable to the web via **Vercel**. Run `npx expo export --platform web` to produce a `dist/` folder, then connect the repo to Vercel and point it at that output directory.
