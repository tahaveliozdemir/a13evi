# Gelişim Paneli - Architecture Documentation Index

This directory contains comprehensive documentation of the Gelişim Paneli application architecture. Use this guide to navigate the documentation.

## Documentation Files

### 1. ARCHITECTURE.md (950 lines, 27KB)
**Comprehensive technical reference** - Start here for detailed understanding

Contains:
- **1. Application Routes & Pages** - All 5 pages and their features
- **2. Context Providers** - AuthContext, EvaluationContext, ToastContext
- **3. Components & Purposes** - All 18 components with detailed descriptions
- **4. Services (Data Layer)** - Firebase, Children, Settings services
- **5. Utilities** - Calculations, Export, Migration logic
- **6. Types & Interfaces** - Complete TypeScript definitions
- **7. Custom Hooks** - useDarkMode hook
- **8. Architectural Patterns** - Data flow, state management, workflows
- **9-14. Additional Sections** - Performance, security, deployment, file structure

**Best for:** Deep understanding of how everything connects

---

### 2. ARCHITECTURE_SUMMARY.md (404 lines, 14KB)
**Quick visual reference** - For fast lookups and big picture understanding

Contains:
- System overview diagram
- Data flow architecture
- Component hierarchy tree
- State management levels (4-tier)
- Authentication flow diagram
- Scoring system logic
- Database schema examples
- Feature ownership matrix
- Performance characteristics
- Error handling strategy
- Deployment checklist
- Quick reference for adding new features
- Key technical decisions

**Best for:** Quick orientation, diagrams, finding code locations

---

## Quick Navigation Guide

### I want to understand...

**How the app authenticates users:**
- See: ARCHITECTURE.md → Section 2 (AuthContext)
- See: ARCHITECTURE_SUMMARY.md → Authentication Flow diagram

**How scoring works:**
- See: ARCHITECTURE.md → Section 5 (Calculations Utility)
- See: ARCHITECTURE_SUMMARY.md → Scoring System Logic

**Where a specific feature is implemented:**
- See: ARCHITECTURE_SUMMARY.md → Key Features Summary table
- See: ARCHITECTURE.md → Section 4 (Services) or Section 5 (Utilities)

**The complete data flow:**
- See: ARCHITECTURE_SUMMARY.md → Data Flow Architecture
- See: ARCHITECTURE_SUMMARY.md → State Management Strategy

**How to add a new feature:**
- See: ARCHITECTURE_SUMMARY.md → Quick Reference: Adding a New Feature
- See: ARCHITECTURE.md → Section 3 (Components)

**Component hierarchy:**
- See: ARCHITECTURE_SUMMARY.md → Component Hierarchy tree
- See: ARCHITECTURE.md → Section 3 (Components & Their Purposes)

**Database structure:**
- See: ARCHITECTURE_SUMMARY.md → API Endpoints & Database Schema
- See: ARCHITECTURE.md → Section 6 (Types & Interfaces)

**Performance info:**
- See: ARCHITECTURE_SUMMARY.md → Performance Characteristics
- See: ARCHITECTURE.md → Section 9 (Performance Optimizations)

---

## File Structure Reference

```
gelisim-paneli/src/
├── pages/                      # 5 main pages
│   ├── LoginPage.tsx          # Authentication
│   ├── DashboardPage.tsx      # Main hub
│   ├── EvaluationPage.tsx     # Scoring interface
│   ├── SettingsPage.tsx       # Admin configuration
│   └── StatsPage.tsx          # Analytics & reporting
│
├── contexts/                   # Global state (3)
│   ├── AuthContext.tsx        # Authentication state
│   ├── EvaluationContext.tsx  # Scoring state
│   └── ToastContext.tsx       # Notifications
│
├── components/                 # UI components (18)
│   ├── ChildCardV2.tsx        # Main evaluation card (NEW)
│   ├── ChildCard.tsx          # Old version (legacy)
│   ├── *Modal.tsx             # 7 modal dialogs
│   ├── DarkModeToggle.tsx     # Theme toggle
│   ├── ErrorBoundary.tsx      # Error catching
│   ├── LoadingSpinner.tsx     # Loading indicator
│   ├── ToastContainer.tsx     # Notification display
│   └── ui/                    # UI library (2)
│       ├── Badge.tsx
│       └── ProgressBar.tsx
│
├── services/                   # Data access (3)
│   ├── firebase.ts            # Firebase SDK setup
│   ├── childrenService.ts     # Child CRUD
│   └── settingsService.ts     # Settings CRUD
│
├── utils/                      # Helper functions (3)
│   ├── calculations.ts        # Scoring logic
│   ├── export.ts              # Excel/PDF export
│   └── migration.ts           # Data migration (1-5 to 0-1-2)
│
├── hooks/                      # Custom React hooks (1)
│   └── useDarkMode.ts         # Dark mode management
│
├── types/                      # TypeScript definitions (1)
│   └── index.ts               # All interfaces
│
└── App.tsx & main.tsx         # Entry points
```

---

## Technology Stack at a Glance

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.1.1 | UI rendering |
| **Language** | TypeScript | 5.9.3 | Type safety |
| **Routing** | React Router DOM | 7.9.4 | Page navigation |
| **State** | Context API | Built-in | Global state |
| **Styling** | Tailwind CSS | 4.1.16 | Utility-first CSS |
| **UI Charts** | Recharts | 3.3.0 | Data visualization |
| **Database** | Firebase/Firestore | 12.4.0 | Cloud database |
| **Auth** | Firebase Auth | 12.4.0 | Authentication |
| **Export** | ExcelJS | 4.4.0 | Excel files |
| **Export** | jsPDF | 3.0.3 | PDF files |
| **Build** | Vite | 7.1.7 | Fast bundling |
| **PWA** | vite-plugin-pwa | 1.1.0 | Offline support |

---

## Key Concepts

### 1. Scoring System (0-1-2)
- **0** = Yetersiz (Insufficient)
- **1** = Orta (Middle/Average)
- **2** = Başarılı (Successful)

Evolved from old 1-5 system with automatic migration.

### 2. Roles
- **Admin:** Email/password login, full access (settings, stats, manage children)
- **Staff:** Anonymous login, can only add evaluations, cannot edit existing

### 3. Data Persistence
- **Source of Truth:** Firestore (Firebase)
- **Cache Layer:** React Context
- **Temporary Storage:** LocalStorage (unsaved changes)
- **UI State:** Component state (modals, forms)

### 4. Evaluation Workflow
1. Select date and evaluator name
2. View list of children
3. Score each child per category
4. Add optional descriptions
5. Changes auto-save to LocalStorage
6. Click "Save All" to commit to Firebase
7. Validate completeness before saving

### 5. Calculation Rules
- **Cancel Rule:** High scores can cancel low scores
- **Veto Rule:** Too many zeros (3+) block awards entirely
- **Period Averaging:** Calculate stats over specific day ranges (6-day, 12-day)
- **Threshold:** Target average (default 1.5 out of 0-2)

---

## Code Statistics

- **Total TypeScript/TSX Lines:** ~4,461
- **Components:** 18 total
- **Pages:** 5
- **Contexts:** 3
- **Services:** 3
- **Utils:** 3
- **Hooks:** 1
- **Type Definitions:** 1 file with 11 interfaces

---

## Recent Git History

1. Modernize UI with enhanced styling and mobile responsiveness
2. Fix ESLint and TypeScript errors across the codebase
3. Integrate automatic data migration from 1-5 to 0-1-2 system
4. Add comprehensive Settings UI for 0-1-2 scoring system
5. Fix TypeScript errors and update UI components for 0-1-2 system

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build           # TypeScript + Vite build

# Code quality
npm run lint            # Run ESLint

# Preview
npm run preview         # Preview production build
```

---

## Firebase Firestore Structure

**Collections:**
- `score_tracker_data/main_data_document` → Children array
- `settings/app_config` → Settings document

**Security:** Role-based access via Firebase Authentication

---

## Important Files by Function

### Authentication
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/pages/LoginPage.tsx` - Login UI

### Evaluation (Scoring)
- `src/contexts/EvaluationContext.tsx` - Scoring state
- `src/pages/EvaluationPage.tsx` - Evaluation UI
- `src/components/ChildCardV2.tsx` - Score entry component
- `src/utils/calculations.ts` - Scoring logic

### Configuration
- `src/pages/SettingsPage.tsx` - Settings UI
- `src/services/settingsService.ts` - Settings CRUD
- `src/types/index.ts` - Settings interface

### Reporting
- `src/pages/StatsPage.tsx` - Analytics dashboard
- `src/utils/export.ts` - Excel/PDF export
- `src/utils/calculations.ts` - Stats calculation

### Data Migration
- `src/utils/migration.ts` - 1-5 to 0-1-2 migration
- Runs automatically on first load if needed

---

## Extension Points

### Easy to Add
- New categories/evaluation criteria
- New evaluation periods (6-day, 12-day, etc.)
- Export formats
- Additional charts/visualizations
- More role types

### Moderate Effort
- New calculation rules
- Additional authentication methods
- Bulk operations
- User preferences

### Complex Changes
- Database schema changes
- Real-time synchronization
- Mobile app
- Advanced analytics engine

---

## Support Resources

- **React Documentation:** https://react.dev
- **Firebase Documentation:** https://firebase.google.com/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Vite Guide:** https://vitejs.dev/guide/

---

## Contact & Notes

**Project:** Gelişim Paneli (Child Development Tracking System)
**Language:** Turkish-first UI
**Version:** Based on 0-1-2 scoring system
**Status:** Production-ready with PWA support

**Next Steps for New Developers:**
1. Read ARCHITECTURE_SUMMARY.md for overview
2. Review ARCHITECTURE.md for deep understanding
3. Explore the actual code files listed in the navigation above
4. Start with understanding how the evaluation page works (EvaluationPage.tsx)
5. Then explore the context layer (EvaluationContext.tsx)

---

Last Updated: October 26, 2025
Documentation Version: 1.0
Architecture Documentation Package: Complete

