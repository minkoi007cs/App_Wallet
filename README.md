# 🚀 App Wallet — Personal Project Management Dashboard

> **App Wallet** is a production-quality, multi-tenant personal project management dashboard built with **React Native / Expo Router v4** and **Supabase Backend as a Service**.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Expo Router v4](https://img.shields.io/badge/Expo_Router-v4.0-6366F1?style=for-the-badge&logo=expo)](https://docs.expo.dev/router/introduction/)
[![Supabase Postgres](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 📱 Feature Overview

App Wallet answers the fundamental developer question: **"What am I working on, what is its status, and what should I work on next?"**

### Key Capabilities
- 📊 **Dashboard & Portfolio Analytics**: Global project statistics, average progress bar, status breakdown, top tech stack frequency rankings, and target date approach forecasts.
- 📁 **Project Management (CRUD)**: Complete lifecycle tracking (`Idea`, `Active`, `Paused`, `Completed`, `Archived`), priority levels (`Low`, `Medium`, `High`, `Critical`), start & target dates, health diagnostics, and tags.
- 📋 **Kanban Task Board & Subtasks**: Drag/column filter tabs (`To Do`, `In Progress`, `Review`, `Done`), expandable task cards, and interactive subtask checkboxes.
- 🚩 **Vertical Milestone Timeline**: Progress tracking, status badges (`Planned`, `In Progress`, `Completed`, `Missed`), target dates, and overdue warnings.
- ✍️ **Markdown Development Journal**: Engineering journal with Markdown-lite renderer (`##`, `-`, `**bold**`), collapsible entry cards, and modal editor.
- 🐙 **GitHub Integration & OAuth**: Deno Edge Function (`github-oauth`) for secret-isolated OAuth token exchange, repository discovery, role assignment (`Frontend`, `Backend`, `Mobile`, `AI`, `Other`), and real-time commit/PR webhooks (`github-webhook`).
- 🔺 **Vercel Integration**: Deno Edge Function (`vercel-sync`) proxy for project linking, live build status monitoring (`READY`, `BUILDING`, `ERROR`), and production URL linking.
- 🩺 **Project Health Engine**: Automated rule system evaluating inactivity (>14 days), overdue task priorities, missing repo links, and Vercel build failures to generate health states (`Healthy`, `Needs Attention`, `Critical`).
- 🤖 **AI Assistant & Prompt Generator**: Smart "What should I work on next?" recommendation engine and context-aware AI Coding Agent Prompt Generator for **Google Antigravity**, **Cursor AI**, **Windsurf Cascade**, and **Claude Code**.
- 🔔 **Notification Center & Preferences**: In-app notifications feed with unread bell counter badges, automated health alert triggers, and category toggle switches.
- 🔒 **Multi-Tenant Security Audit & Data Backup**: 13 database indexes, strict Row Level Security (RLS) enforcement, 100% client-side secret isolation, user profile settings, and full JSON data backup export.

---

## 🏛️ System Architecture

```text
[ Expo Router v4 Client App ] ── (HTTPS / REST / Realtime) ──> [ Supabase Cloud ]
(Web on Vercel / iOS / Android)                                (PostgreSQL DB + Auth)
            │                                                            │
            └───────> [ Deno Edge Functions ] <──────────────────────────┘
                      ├─ github-oauth  (Secret OAuth Exchange)
                      ├─ github-webhook (Commit / PR Ingestion)
                      └─ vercel-sync   (Deployment Monitoring)
```

---

## 🚀 Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/minkoi007cs/App_Wallet.git
cd App_Wallet
npm install
```

### 2. Environment Variables Setup
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://ymunwzjmemxifjxsiugz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

### 3. Run Locally
```bash
# Start Web Development Server
npm run web

# Start Expo Go Mobile Bundle
npm run start
```

### 4. Build for Vercel Web Deployment
```bash
npm run build
```

---

## 📜 Development & Verification Commands

```bash
# Run TypeScript Static Type Check
npx tsc --noEmit

# Run ESLint Code Analysis
npm run lint

# Export Production Web Bundle
npx expo export --platform web
```

---

## 📄 License
MIT © [minkoi007cs](https://github.com/minkoi007cs)
