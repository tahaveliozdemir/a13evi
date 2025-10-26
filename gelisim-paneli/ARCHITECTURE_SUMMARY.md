# Gelişim Paneli - Quick Architecture Reference

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         GELIŞIM PANELI                          │
│              Child Development Tracking System                   │
└─────────────────────────────────────────────────────────────────┘

                              FIREBASE
                          (Authentication &
                           Firestore DB)
                                  ▲
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                ┌─────────┐  ┌──────────┐  ┌──────────┐
                │Services │  │Services  │  │Services  │
                │Firebase │  │Children  │  │Settings  │
                └────┬────┘  └────┬─────┘  └────┬─────┘
                     │             │             │
                     └─────────────┼─────────────┘
                                   │
                         ┌─────────▼──────────┐
                         │   CONTEXT LAYER   │
                         ├───────────────────┤
                         │ - AuthContext     │ (Login/Roles)
                         │ - EvalContext     │ (Scoring/Data)
                         │ - ToastContext    │ (Notifications)
                         └──────────┬────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
         ┌────▼─────┐         ┌─────▼──────┐        ┌────▼─────┐
         │  PAGES   │         │ COMPONENTS │        │  UTILS   │
         ├──────────┤         ├────────────┤        ├──────────┤
         │- Login   │         │- Cards     │        │- Calc    │
         │- Dash    │         │- Modals    │        │- Export  │
         │- Eval    │         │- Controls  │        │- Migrate │
         │- Stats   │         │- UI Lib    │        └──────────┘
         │- Settings│         └────────────┘
         └──────────┘
```

---

## Data Flow Architecture

```
USER INTERACTION
    │
    ▼
┌─────────────────┐
│ React Component │ (Page or Modal)
└────────┬────────┘
         │
         ▼
   ┌──────────────┐
   │ Event Handler│
   └────────┬─────┘
            │
    ┌───────▼────────┐
    │  Context Hook  │  useAuth() / useEvaluation() / useToast()
    └───────┬────────┘
            │
    ┌───────▼────────────────┐
    │ Context Action Method  │  updateScore() / saveAll() / etc.
    └───────┬────────────────┘
            │
    ┌───────▼────────────────────┐
    │ Service Layer (Firebase)   │  getChildren() / saveChildren()
    └───────┬────────────────────┘
            │
    ┌───────▼────────────┐
    │ Firestore Database │
    └────────────────────┘
```

---

## Component Hierarchy

```
App
├─ ProtectedRoute/AdminRoute
│   ├─ LoginPage
│   │   └─ DarkModeToggle
│   │
│   ├─ DashboardPage
│   │   ├─ DarkModeToggle
│   │   ├─ DateSelectorModal
│   │   └─ EvaluatorSelectorModal
│   │
│   ├─ EvaluationPage
│   │   ├─ ChildCardV2 (x N)
│   │   │   ├─ Badge
│   │   │   ├─ ProgressBar
│   │   │   └─ (Score buttons, Toggles)
│   │   ├─ DescriptionModal
│   │   ├─ AddChildModal
│   │   └─ DeleteChildModal
│   │
│   ├─ SettingsPage
│   │   ├─ InputModal
│   │   └─ ConfirmationModal
│   │
│   └─ StatsPage
│       ├─ Recharts (LineChart, BarChart, PieChart)
│       └─ Export buttons
│
└─ ToastContainer
   └─ Toast (x N)
```

---

## State Management Strategy

```
LEVEL 1: Firebase (Source of Truth)
┌────────────────────────────────────┐
│  Firestore Collections:            │
│  - score_tracker_data/main_data    │ (Children & Scores)
│  - settings/app_config             │ (Settings)
└────────────────────────────────────┘
                ▲
                │
LEVEL 2: React Context (Global State)
┌────────────────────────────────────┐
│  AuthContext:                      │
│  - user, loading, isAdmin          │
│  - signIn(), signOut()             │
├────────────────────────────────────┤
│  EvaluationContext:                │
│  - children, settings              │
│  - selectedDate, selectedEvaluator │
│  - unsavedChanges                  │
│  - updateScore(), saveAll(), etc.  │
├────────────────────────────────────┤
│  ToastContext:                     │
│  - toasts[], showToast()           │
└────────────────────────────────────┘
                ▲
                │
LEVEL 3: LocalStorage (Cache)
┌────────────────────────────────────┐
│  unsaved_{date} keys               │ (Temporary changes)
│  darkMode                          │ (Theme preference)
└────────────────────────────────────┘
                ▲
                │
LEVEL 4: Component State (UI only)
┌────────────────────────────────────┐
│  Modal open/close states           │
│  Form inputs (not committed yet)   │
│  Local UI toggles                  │
└────────────────────────────────────┘
```

---

## Authentication & Authorization Flow

```
┌─ User Visits App ─┐
│                   │
│  Firebase Auth    │
│  Listener Active  │
│                   │
└─────────┬─────────┘
          │
          ▼
    ┌──────────────┐
    │ User Logged? │
    └──┬───────┬───┘
       │       │
      YES     NO
       │       │
       │       └───► Auto Sign-In Anonymously
       │             (Staff Role = Anonymous)
       │
       ▼
    ┌───────────────────┐
    │ Parse User Type   │
    └┬──────────────────┤
     │ isAnonymous?     │
     │                  │
    YES                NO
     │                  │
     ▼                  ▼
  STAFF               ADMIN
 (Limited)        (Full Access)
```

---

## Scoring System Logic

```
0-1-2 SCORING SYSTEM
┌──────────────────────┐
│  Score Values:       │
│  0 = Yetersiz (Bad)  │
│  1 = Orta (Middle)   │
│  2 = Başarılı (Good) │
└──────────────────────┘

CALCULATION PIPELINE:

Raw Scores → Cancel Rule → Veto Rule → Final Average
             (Remove some)  (Check zeros)
             
Example:
Scores: [2, 2, 0, 1, 0, 2]

1. Apply Cancel Rule
   if (2 twos cancel 1 zero):
   [2, 2, X, 1, X, 2] → [2, 2, 1, 2] = 1.75

2. Apply Veto Rule
   if (3+ zeros → award blocked):
   Remaining zeros: 0 → OK, return 1.75

3. Check Threshold
   if (1.75 >= 1.5): SUCCESSFUL
   
4. Calculate Period Stats
   Evaluate progress over 6/12 days
```

---

## API Endpoints & Database Schema

```
FIRESTORE DOCUMENT STRUCTURE:

score_tracker_data/main_data_document
{
  children: [
    {
      id: "uuid",
      name: "Ahmet",
      createdAt: "2025-01-15T10:30:00Z",
      archived: false,
      scores: [
        {
          date: "2025-01-15",
          evaluator: "Ayşe",
          s1: 2,
          s2: 1,
          s3: 2,
          s4: 0,
          descriptions: {
            0: "Çok iyi",
            2: "Eksik"
          }
        }
      ]
    }
  ]
}

settings/app_config
{
  categories: ["Kişisel", "Ortak Alan", "Eğitim", "Tutum"],
  threshold: 1.5,
  scoreSystem: { min: 0, max: 2 },
  vetoRule: { enabled: false, zeroCount: 3 },
  cancelRule: {
    enabled: false,
    highScore: 2, highCount: 2,
    lowScore: 0, lowCount: 1
  },
  periods: [
    { days: 6, name: "6 Günlük Kazanım" }
  ]
}
```

---

## Key Features Summary

| Feature | Owner | Type | Location |
|---------|-------|------|----------|
| Authentication | AuthContext | State Mgmt | contexts/AuthContext.tsx |
| Child Management | Services | Data Layer | services/childrenService.ts |
| Scoring | EvaluationContext | State Mgmt | contexts/EvaluationContext.tsx |
| Calculations | Utils | Helper | utils/calculations.ts |
| Export (Excel/PDF) | Utils | Helper | utils/export.ts |
| Auto-Migration | Utils | Helper | utils/migration.ts |
| Dark Mode | Hook | State Mgmt | hooks/useDarkMode.ts |
| Notifications | ToastContext | State Mgmt | contexts/ToastContext.tsx |
| Evaluation UI | ChildCardV2 | Component | components/ChildCardV2.tsx |
| Charts & Stats | StatsPage | Page | pages/StatsPage.tsx |
| Settings Config | SettingsPage | Page | pages/SettingsPage.tsx |

---

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| App Startup | <1s | Lazy-loaded pages |
| Load Children | ~500ms | Firebase network |
| Save Scores | ~1s | Batch validation + Firebase |
| Export Excel | ~2s | Client-side generation |
| Calculate Stats | <100ms | Memoized (useMemo) |
| Toast Display | 4s | Auto-dismiss |

---

## Error Handling Strategy

```
LEVEL 1: Component Errors
        └─ ErrorBoundary (catches render errors)
           └─ Fallback UI + Console log

LEVEL 2: User Input Errors
        └─ Validation in Context
           └─ Toast notification

LEVEL 3: Firebase Errors
        └─ Try-catch in Services
           └─ Toast error message
           └─ Fallback state

LEVEL 4: Uncaught Exceptions
        └─ Global error handlers
           └─ Console logging
```

---

## Deployment Checklist

- [ ] Environment variables set (.env)
- [ ] TypeScript compilation (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Vite bundling successful
- [ ] Firebase config valid
- [ ] Security rules deployed
- [ ] Database indexes created
- [ ] Static assets optimized
- [ ] PWA manifest configured
- [ ] Deploy to Firebase Hosting

---

## Quick Reference: Adding a New Feature

### Example: New Category Type

1. **Update Types** (`src/types/index.ts`)
   - Add field to `AppSettings`

2. **Update Services** (`src/services/settingsService.ts`)
   - Handle in `defaultSettings`
   - Add migration logic if needed

3. **Update Context** (`src/contexts/EvaluationContext.tsx`)
   - Add state field
   - Create action method if needed

4. **Update Components**
   - Pages that need the feature
   - Modals for input
   - Cards for display

5. **Update Utilities**
   - Calculations if needed
   - Export functions if needed

6. **Test & Deploy**
   - Manual testing
   - Check Firebase rules
   - Deploy to production

---

## Key Technical Decisions

1. **No WebSocket:** Uses regular get/setDoc for cost control
2. **LocalStorage Cache:** Resilience against network failures
3. **Anonymous Auth:** Low-friction staff access
4. **Soft Deletes:** Preserve audit trail with archived flag
5. **Context API:** Lightweight state management, no Redux
6. **Lazy Loading:** Pages loaded on-demand for performance
7. **Turkish First:** UI primarily in Turkish, configurable
8. **0-1-2 System:** Simplified from 1-5, easier to calculate

---

## Resources & Links

- **React Docs:** https://react.dev
- **Firebase Docs:** https://firebase.google.com/docs
- **Tailwind CSS:** https://tailwindcss.com
- **Vite Guide:** https://vitejs.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs

