# 成长实验室 Growth Lab - Architecture

This document captures the system architecture, data flows, and operational notes for Growth Lab.

---

## 1. System Overview

Growth Lab is a fully client‑side, offline‑first classroom management tool. It runs entirely in the browser and stores data locally in `localStorage`. There is no backend and no external API.

Key properties:
- **Offline by default**: All data is stored locally.
- **Single‑page application**: React + Vite + TypeScript.
- **State management**: React Context + `useReducer`.
- **Persistence**: `localStorage` read/write on state changes.

---

## 2. High‑Level Architecture

```
UI (React Components)
   ↓ dispatch actions
State Layer (AppProvider + reducer)
   ↓ persist
Storage (localStorage)
```

### Core Layers
1. **UI layer**
   - Feature components in `src/features/*`
   - Shared components in `src/shared/components/*`

2. **State layer**
   - `AppProvider` defines global state, actions, and persistence.
   - `appReducer` is the single source of truth for state changes.

3. **Persistence layer**
   - `src/shared/utils/storage.ts` handles load/save from `localStorage`.
   - Storage key intentionally stable to preserve user data across updates.

---

## 3. Data Model (Key Entities)

- **Class**: owns groups, students, history, attendance.
- **Group**: belongs to a class, has score & color.
- **Student**: belongs to class + group, has score.
- **History**: event log for score changes and actions.
- **Gamification**: XP, levels, streaks, badges.
- **Attendance**: daily records with exemptions.

All data is stored in a single serialized state tree.

---

## 4. State & Persistence Flow

1. App boots.
2. `loadFromStorage()` hydrates state.
3. User actions dispatch reducer actions.
4. Reducer updates state.
5. `saveToStorage()` persists new state.

This ensures deterministic updates and predictable debugging.

---

## 5. Feature Modules (by folder)

- `src/features/classes`: class creation & selection
- `src/features/students`: student CRUD & selection
- `src/features/groups`: grouping & scoring
- `src/features/score`: score items + batch scoring
- `src/features/rewards`: reward store
- `src/features/gamification`: XP, levels, badges
- `src/features/attendance`: attendance tracking
- `src/features/dashboard`: leaderboard & analytics
- `src/features/history`: history viewer
- `src/features/onboarding`: setup wizard

---

## 6. Key User Flows

1. **Create class** → triggers onboarding wizard
2. **Create groups** → group color + ordering
3. **Add students** → assign group + score
4. **Score actions** → updates student/group score + history
5. **Attendance** → updates streaks + history
6. **Rewards redemption** → updates score + history

---

## 7. Configuration & Deployment

- Build tool: Vite
- Deploy: GitHub Pages via Actions (`.github/workflows/deploy.yml`)
- Static output: `dist/`

---

## 8. Risks / Non‑Goals

- No backend sync → data is per‑device.
- Clearing browser storage will delete data.
- Concurrency not handled (single user, single device).

---

## 9. Future‑Ready Notes

If a backend is introduced later, suggested changes:
- Replace localStorage with API + caching layer
- Add auth + multi‑tenant data model
- Introduce server‑side audit logs

---

## 10. Tech Stack Summary

- React 19
- TypeScript
- Tailwind CSS
- Vite
- localStorage

