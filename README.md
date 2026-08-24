# App Wallet — Developer Command Center

App Wallet is a personal project management dashboard built with **Expo (React Native + TypeScript)** for iOS, Android, and Web, backed by **Supabase (PostgreSQL + Auth + Edge Functions)**.

---

## Features
- **Unified Developer Dashboard**: Track projects, status (`Idea`, `Active`, `Paused`, `Completed`, `Archived`), and priorities across your software ecosystem.
- **Multi-Repository Support**: Associate multiple GitHub repositories (frontend, backend, mobile, AI) with a single App Wallet project.
- **Explainable Health System**: Rule-based project health indicators (`Healthy`, `Needs Attention`, `Critical`) with human-readable diagnostic reasons.
- **External Integration Hub**: Secure server-side synchronization with GitHub API and Vercel API via Supabase Edge Functions.
- **Clean Vercel/Linear Aesthetic**: Built with custom design tokens supporting native Dark and Light modes.

---

## Tech Stack
- **Frontend**: Expo SDK 57, React Native, Expo Router v4, TypeScript
- **Backend / Data**: Supabase, PostgreSQL, Supabase Auth, Row Level Security (RLS)
- **Edge Architecture**: Supabase Edge Functions (Deno / TypeScript)
- **External Integrations**: GitHub REST/GraphQL API, Vercel REST API

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm / npx
- Expo Go / Simulator (iOS/Android) or Web Browser

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm run start
   ```

3. Run on specific platform:
   - **iOS**: `npm run ios`
   - **Android**: `npm run android`
   - **Web**: `npm run web`

---

## Verification Commands

- **TypeScript Typecheck**:
  ```bash
  npx tsc --noEmit
  ```

- **ESLint Code Quality**:
  ```bash
  npm run lint
  ```

- **Web Bundle Export**:
  ```bash
  npx expo export --platform web
  ```
