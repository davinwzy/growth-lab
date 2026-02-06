# CLAUDE.md

This file provides guidance for AI assistants working with the Growth Lab codebase.

## Project Overview

Growth Lab is a gamified classroom management tool for teachers. It tracks student progress, manages classes/groups, and uses game mechanics (XP, levels, badges, streaks) to engage students. It is a fully client-side React application deployed to GitHub Pages, with optional Supabase cloud sync.

**Live site:** https://davinwzy.github.io/growth-lab/

## Quick Reference Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173/growth-lab/)
npm run build        # TypeScript type-check + Vite production build
npm run lint         # Run ESLint
npm run test         # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode
npm run preview      # Preview production build locally
```

**Build = `tsc -b && vite build`** — TypeScript errors must be fixed before the build succeeds.

## Tech Stack

- **React 19** with TypeScript 5.9 (strict mode)
- **Vite 7** for dev server and bundling
- **Tailwind CSS 4** for styling
- **Vitest** for unit tests
- **ESLint** for linting (flat config)
- **Supabase** for optional cloud auth/sync
- **i18next** for internationalization (Chinese/English)

## Project Structure

```
src/
├── app/                  # App entry, global state (AppProvider + useReducer)
│   ├── App.tsx           # Root component
│   ├── AppProvider.tsx   # Global state management (central reducer)
│   └── __tests__/        # Reducer tests
├── features/             # Feature modules (UI components per domain)
│   ├── attendance/       # Attendance tracking & calendar
│   ├── auth/             # Supabase Google OAuth
│   ├── classes/          # Class creation/selection
│   ├── dashboard/        # Leaderboards & analytics
│   ├── gamification/     # XP, levels, badges, celebrations
│   ├── groups/           # Group management & scoring
│   ├── history/          # Event log viewer
│   ├── onboarding/       # Setup wizard
│   ├── rewards/          # Reward store & redemption
│   ├── score/            # Score items & batch operations
│   ├── settings/         # User preferences
│   └── students/         # Student CRUD
├── services/             # Business logic (pure functions, well-tested)
│   ├── gamificationEngine.ts
│   ├── attendance.ts
│   ├── attendanceStreaks.ts
│   ├── scoreStreaks.ts
│   ├── groupSettlement.ts
│   ├── groupRewards.ts
│   ├── gamificationSnapshots.ts
│   └── streakUtils.ts
├── shared/               # Cross-cutting concerns
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions (domain model)
│   └── utils/            # Utility functions (storage, CSV, dates, etc.)
├── lib/                  # External library setup (Supabase client)
├── styles/               # Global CSS & theming
└── main.tsx              # React DOM mount point
```

## Architecture & Key Patterns

### State Management

Global state uses React Context + `useReducer` in `src/app/AppProvider.tsx`. All state mutations go through a centralized reducer dispatching typed actions. Access state via the `useApp()` hook.

**State is auto-persisted** to localStorage (key: `class-management-system`) on every change. Authenticated users optionally sync to Supabase (debounced at 1500ms).

### Data Storage

- **Primary:** localStorage (offline-first, no server required)
- **Secondary:** Supabase PostgreSQL via `user_data` table (optional, for cross-device sync)
- Storage utilities live in `src/shared/utils/storage.ts`

### Feature Module Convention

Each feature in `src/features/` contains its own components. Features import from `@/shared/` for common utilities and types, and dispatch actions to the global reducer for state changes.

### Service Layer

Business logic lives in `src/services/` as pure, testable functions. Services handle gamification calculations (XP, levels, badges), attendance tracking, streak logic, and group reward distribution. These are consumed by features and the reducer.

### Type System

All domain types are defined in `src/shared/types/index.ts`. Core entities: `Class`, `Group`, `Student`, `ScoreItem`, `Reward`, `HistoryRecord`. Gamification types: `StudentGamification`, `BadgeDefinition`, `GamificationEvent`, `LevelDefinition`.

## Code Conventions

### Import Paths

- Use the `@/` path alias for imports from `src/` (e.g., `import { Student } from '@/shared/types'`)
- **ESLint forbids deep relative imports** (more than 1 level up). Use `@/` instead of `../../`

### TypeScript

- Strict mode is enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target: ES2022, JSX: react-jsx
- Fix all type errors before committing — `npm run build` runs `tsc -b` first

### Styling

- Use Tailwind CSS utility classes directly in JSX
- Global styles in `src/styles/`

### Testing

- Tests live in `__tests__/` directories adjacent to the code they test
- Test file pattern: `*.test.ts` or `*.test.tsx`
- Test environment: Node (not jsdom)
- Focus testing on service layer logic (gamification, attendance, streaks)

### Internationalization

- All user-facing strings should use i18next translation keys
- Translations support Chinese (zh-CN) and English (en)
- Use `react-i18next` hooks in components

## CI/CD

GitHub Actions (`.github/workflows/deploy.yml`) runs on push to `main`:
1. Install deps with `npm ci`
2. Build with `npm run build` (injects Supabase env vars from secrets)
3. Deploy `dist/` to GitHub Pages

## Environment Variables

Required for Supabase cloud features (optional for local-only development):
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

These are set as GitHub Actions secrets for CI. No `.env` file is committed to the repo.

## Common Tasks for AI Assistants

- **Adding a new feature:** Create a directory under `src/features/`, add components there, define any new types in `src/shared/types/index.ts`, add reducer actions in `AppProvider.tsx`
- **Adding business logic:** Add pure functions in `src/services/` with tests in `src/services/__tests__/`
- **Modifying state:** Update the reducer in `src/app/AppProvider.tsx` and ensure localStorage persistence is maintained
- **Adding UI components:** Reusable components go in `src/shared/components/`, feature-specific ones in the feature directory
- **Before submitting:** Run `npm run lint`, `npm run test`, and `npm run build` to verify no regressions
