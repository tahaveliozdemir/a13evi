# Gelişim Paneli - Application Architecture Overview

## Project Summary
**Gelişim Paneli** is a child development tracking system (Turkish: "Çocuk Gelişim Takip Sistemi") built with React, TypeScript, and Firebase. It allows administrators and staff to evaluate children across multiple categories using a configurable 0-1-2 scoring system with advanced evaluation rules.

**Technology Stack:**
- Frontend: React 19.1.1, TypeScript 5.9.3
- Routing: React Router DOM 7.9.4
- State Management: React Context API
- UI: Tailwind CSS 4.1.16
- Backend: Firebase (Firestore, Authentication)
- Charts: Recharts 3.3.0
- Export: ExcelJS 4.4.0, jsPDF 3.0.3
- Build Tool: Vite 7.1.7
- PWA Support: vite-plugin-pwa 1.1.0

**Total Codebase:** ~4,461 lines of TypeScript/TSX code

---

## 1. APPLICATION ROUTES & PAGES

### Route Structure
The application uses React Router DOM with protected routes based on authentication status and admin privileges.

```
/                    → LoginPage (Public)
/dashboard           → DashboardPage (Protected)
/evaluation          → EvaluationPage (Protected)
/stats               → StatsPage (Admin Only)
/settings            → SettingsPage (Admin Only)
*                    → Redirects to /
```

### Pages Overview

#### **1. LoginPage** (`src/pages/LoginPage.tsx`)
- **Purpose:** Authentication entry point
- **Features:**
  - Two login paths:
    - Staff Login: Anonymous sign-in (immediate access)
    - Admin Login: Email/password authentication
  - Animated gradient background with blob animations
  - Dark mode toggle
  - Auto-redirect if already logged in
- **State:** Email, password, error messages, loading state
- **Uses:** AuthContext (signIn), DarkModeToggle

#### **2. DashboardPage** (`src/pages/DashboardPage.tsx`)
- **Purpose:** Main hub after login showing analytics and navigation
- **Features:**
  - Statistics cards:
    - Total children count
    - Total evaluations count
    - General average score
    - Success rate (above threshold)
  - Quick action buttons:
    - Start evaluation
    - View statistics (admin only)
    - Access settings (admin only)
  - Recent evaluations (last 7 days)
  - Top performers ranking
  - System status indicators
- **State:** Date selection, evaluator selection, modal states
- **Modals:** DateSelectorModal, EvaluatorSelectorModal
- **Uses:** useAuth, useEvaluation, useToast

#### **3. EvaluationPage** (`src/pages/EvaluationPage.tsx`)
- **Purpose:** Main evaluation interface for scoring children
- **Features:**
  - Child list with search and sort (A-Z, Z-A)
  - Archive/unarchive toggle filter
  - Individual child cards (ChildCardV2) with:
    - Score selection for each category
    - Absent status toggle
    - Quick-fill all categories
    - Copy last evaluation
    - Description per category
  - Admin actions:
    - Add new child
    - Delete child
    - Archive child
  - Floating save button (sticky when unsaved changes exist)
  - Unsaved changes validation
  - LocalStorage auto-save of changes
- **State:** Search term, sort order, archived filter, modals
- **Modals:** DescriptionModal, AddChildModal, DeleteChildModal
- **Uses:** useEvaluation, useAuth, useToast

#### **4. SettingsPage** (`src/pages/SettingsPage.tsx`)
- **Purpose:** Admin-only configuration of scoring system
- **Features:**
  - Tab-based interface:
    - **Categories Tab:** Add, edit, delete, reorder evaluation categories
    - **Rules Tab:** Configure veto and cancel rules
    - **Periods Tab:** Define achievement periods (days)
  - Visual configuration with modals for input
  - Threshold configuration (0.0-2.0)
  - Score system bounds (min/max)
  - Veto Rule: Prevent awards if X zeros occur
  - Cancel Rule: Allow high scores to cancel low scores
  - Save all changes to Firebase
- **State:** Settings object, loading, saving, modal states
- **Admin Only:** Yes
- **Uses:** useToast, settingsService

#### **5. StatsPage** (`src/pages/StatsPage.tsx`)
- **Purpose:** Comprehensive analytics and reporting
- **Features:**
  - Dynamic filters:
    - Child selection (individual or all)
    - Date range (all, 7 days, 30 days, 90 days)
    - Performance filter (all, above threshold, below threshold)
    - Archived children toggle
  - Interactive charts using Recharts:
    - Line charts (trend analysis)
    - Bar charts (comparative analysis)
    - Pie charts (distribution)
  - Export functions:
    - Export to Excel (summary or detailed)
    - Export to PDF (summary or detailed)
  - Detailed statistics table
- **Admin Only:** Yes
- **Uses:** useEvaluation, useAuth, useToast, export utilities

---

## 2. CONTEXT PROVIDERS & STATE MANAGEMENT

All contexts are wrapped in `main.tsx` in this order:
```
ToastProvider → AuthProvider → EvaluationProvider → App
```

### **AuthContext** (`src/contexts/AuthContext.tsx`)

**Purpose:** Manage user authentication and authorization

**Type:**
```typescript
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Features:**
- Firebase authentication with email/password
- Anonymous auto-sign-in for staff
- Auto-detects admin status (non-anonymous = admin)
- Persistent login across sessions
- Global loading state during auth checks

**Hook:** `useAuth()`

**Key Logic:**
- Listens to Firebase `onAuthStateChanged`
- Auto-signs in anonymously if no user logged in
- Staff role = anonymous user
- Admin role = email-authenticated user

---

### **EvaluationContext** (`src/contexts/EvaluationContext.tsx`)

**Purpose:** Manage evaluation data, scoring, and persistence

**Type:**
```typescript
interface EvaluationContextType {
  // State
  selectedDate: string | null;
  selectedEvaluator: string | null;
  children: Child[];
  settings: AppSettings | null;
  unsavedChanges: UnsavedChanges;
  loading: boolean;
  saving: boolean;

  // Actions
  setEvaluationInfo: (date: string, evaluator: string) => void;
  updateScore: (childId: string, categoryIndex: number, score: number) => void;
  toggleAbsent: (childId: string) => void;
  updateDescription: (childId: string, categoryIndex: number, description: string) => void;
  quickFillChild: (childId: string, score: number) => void;
  copyLastEvaluation: (childId: string) => void;
  saveAll: (isAdmin: boolean) => Promise<{ success: boolean; error?: string }>;
  refreshChildren: () => Promise<void>;
  hasUnsavedChanges: () => boolean;
}
```

**Features:**
- Loads children and settings from Firebase on mount
- Auto-migration from old 1-5 system to new 0-1-2 system
- LocalStorage persistence for unsaved changes
- Score entry validation (all categories or none)
- Dual persistence: LocalStorage (temporary) + Firebase (permanent)
- Permission checks (staff cannot edit existing records)
- Unsaved changes tracking

**Hook:** `useEvaluation()`

**Key Logic:**
- Automatic data migration with user confirmation
- Optimistic updates to LocalStorage
- Batch validation before Firebase save
- Handles scoring state for multiple children simultaneously
- Supports toggle scoring (click same score again to deselect)

---

### **ToastContext** (`src/contexts/ToastContext.tsx`)

**Purpose:** Global notification system

**Type:**
```typescript
interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
}
```

**Features:**
- Toast notifications with 4 types: success, error, warning, info
- Auto-dismiss after 4 seconds
- UUID-based toast identification
- Stacked display via ToastContainer

**Hook:** `useToast()`

---

## 3. COMPONENTS & THEIR PURPOSES

Total Components: 18 (13 main + 5 UI utilities)

### Page Components
- **Pages:** LoginPage, DashboardPage, EvaluationPage, SettingsPage, StatsPage (described above)

### Modal Components

#### **ChildCardV2** (`src/components/ChildCardV2.tsx`) - 16KB
- **Purpose:** Individual child evaluation card (new V2 version)
- **Features:**
  - Expandable/collapsible interface
  - Score selection buttons (0, 1, 2) per category
  - Absent status toggle
  - Progress bar showing completion
  - Last evaluation date and trend indicator
  - Description popup for each category
  - Admin-only quick actions menu:
    - Quick fill all categories
    - Copy last evaluation
    - Archive/unarchive
    - Delete child
  - Status badges: Empty, In Progress, Completed, Absent
  - Color-coded scores with dynamic styling
- **Props:** Child data, settings, unsaved changes, callbacks
- **Uses:** calculateChildStats, Badge, ProgressBar components

#### **AddChildModal** (`src/components/AddChildModal.tsx`)
- **Purpose:** Add a new child to the system
- **Features:**
  - Name input validation
  - Check for duplicate names
  - Confirmation before adding
- **Props:** isOpen, onClose, onAdd callback, existing children list

#### **DeleteChildModal** (`src/components/DeleteChildModal.tsx`)
- **Purpose:** Confirm permanent child deletion
- **Features:**
  - Shows child name being deleted
  - Warning about permanent deletion
- **Props:** isOpen, onClose, onConfirm, child name

#### **DateSelectorModal** (`src/components/DateSelectorModal.tsx`)
- **Purpose:** Select evaluation date
- **Features:**
  - Date picker interface
  - Pre-filled with today's date
  - Navigation between months
- **Props:** isOpen, onClose, onSelect callback

#### **EvaluatorSelectorModal** (`src/components/EvaluatorSelectorModal.tsx`)
- **Purpose:** Enter evaluator name
- **Features:**
  - Text input for evaluator name
  - Validates non-empty input
  - Back button to change date
- **Props:** isOpen, onClose, onBack, onSubmit

#### **DescriptionModal** (`src/components/DescriptionModal.tsx`)
- **Purpose:** Edit category descriptions
- **Features:**
  - Rich text input for observations
  - Shows category name in title
  - Save/cancel actions
- **Props:** isOpen, onClose, onSave, title, initial value

#### **InputModal** (`src/components/InputModal.tsx`)
- **Purpose:** Generic text input modal
- **Features:**
  - Configurable title and placeholder
  - Save/cancel buttons
- **Props:** isOpen, onClose, onSave, title, placeholder, initial value

#### **ConfirmationModal** (`src/components/ConfirmationModal.tsx`)
- **Purpose:** Generic confirmation dialog
- **Features:**
  - Custom title and message
  - Confirm/cancel buttons
  - Optional warning styling
- **Props:** isOpen, onClose, onConfirm, title, message, type

### Utility Components

#### **ChildCard** (`src/components/ChildCard.tsx`) - 6KB
- **Note:** Old version, replaced by ChildCardV2
- **Kept for:** Backward compatibility

#### **DarkModeToggle** (`src/components/DarkModeToggle.tsx`)
- **Purpose:** Toggle dark/light theme
- **Features:**
  - Moon/Sun icons
  - Persists preference in localStorage
  - Updates document classList
- **Uses:** useDarkMode hook

#### **ToastContainer** (`src/components/ToastContainer.tsx`)
- **Purpose:** Display all toast notifications
- **Features:**
  - Fixed position container
  - Toast stacking
  - Type-specific styling
  - Close buttons
- **Uses:** useToast context

#### **LoadingSpinner** (`src/components/LoadingSpinner.tsx`)
- **Purpose:** Loading state indicator
- **Features:**
  - Animated spinner
  - Optional full-screen mode
  - Custom message display
- **Props:** message, fullScreen

#### **ErrorBoundary** (`src/components/ErrorBoundary.tsx`)
- **Purpose:** Catch and display React errors
- **Features:**
  - Error fallback UI
  - Logs errors to console
  - Has/get error methods for debugging
- **Wraps:** Entire App in main.tsx

### UI Component Library (`src/components/ui/`)

#### **Badge** (`src/components/ui/Badge.tsx`)
- **Purpose:** Status/label indicators
- **Variants:** success, warning, error, info, default
- **Props:** label, variant

#### **ProgressBar** (`src/components/ui/ProgressBar.tsx`)
- **Purpose:** Visual progress indication
- **Features:**
  - Shows completion percentage
  - Color-coded based on progress
  - Text label
- **Props:** current, total, label

---

## 4. SERVICES (Data Access Layer)

### **Firebase Service** (`src/services/firebase.ts`)

**Purpose:** Firebase SDK initialization and configuration

**Exports:**
```typescript
export const app;      // Firebase app instance
export const auth;     // Firebase Authentication
export const db;       // Firestore database
```

**Features:**
- Loads config from environment variables (VITE_FIREBASE_*)
- Validates required configuration
- Throws error if config missing
- Single source of truth for Firebase services

---

### **Children Service** (`src/services/childrenService.ts`)

**Purpose:** CRUD operations for children and evaluations

**Key Functions:**

```typescript
// Fetch all children
getChildren(): Promise<Child[]>

// Save children (overwrites/merges)
saveChildren(children: Child[]): Promise<void>

// Add new child
addChild(name: string): Promise<Child>

// Update specific child fields
updateChild(childId: string, updates: Partial<Child>): Promise<void>

// Archive child (soft delete)
archiveChild(childId: string): Promise<void>

// Unarchive child
unarchiveChild(childId: string): Promise<void>

// Permanently delete child
deleteChild(childId: string): Promise<void>
```

**Storage Location:** `score_tracker_data/main_data_document` in Firestore

**Features:**
- No WebSocket (uses regular get/setDoc)
- Atomic saves for consistency
- UUID generation for new children
- Soft-delete with archived flag
- Timestamp support (createdAt)

---

### **Settings Service** (`src/services/settingsService.ts`)

**Purpose:** Configuration management for the scoring system

**Key Functions:**

```typescript
// Fetch current settings (with defaults)
getSettings(): Promise<AppSettings>

// Save settings
saveSettings(settings: AppSettings): Promise<void>

// Update specific settings fields
updateSettings(updates: Partial<AppSettings>): Promise<void>
```

**Storage Location:** `settings/app_config` in Firestore

**Default Settings:**
```
- Categories: 4 (Kişisel Görevler, Ortak Alan, Eğitim, Genel Tutum)
- Threshold: 1.5 (for 0-2 system)
- Score System: 0-2 range
- Veto Rule: Disabled (3 zeros = no award)
- Cancel Rule: Disabled (2 twos cancel 1 zero)
- Periods: 6-day and 12-day achievement periods
```

**Features:**
- Automatic default creation if settings don't exist
- Backward compatibility merging
- No WebSocket (regular get/setDoc)

---

## 5. UTILITIES (Helper Functions)

### **Calculations Utility** (`src/utils/calculations.ts`)

**Key Functions:**

#### 1. **calculateAverageWithRules()**
```typescript
calculateAverageWithRules(
  scores: number[],
  settings: AppSettings
): { average, remainingZeros, totalScores, vetoApplied }
```
- Applies cancel rule first (high scores cancel low scores)
- Applies veto rule (too many zeros = zero average)
- Returns detailed result object

#### 2. **calculateChildStats()**
```typescript
calculateChildStats(child: Child, settings: AppSettings): ChildStats
```
- Calculates overall average across all evaluations
- Calculates period-based statistics
- Returns comprehensive stats including:
  - Overall average
  - Remaining zeros after cancellation
  - Period achievements
  - Veto application status

#### 3. **getAverageColor()**
```typescript
getAverageColor(avg: number | null, settings?: AppSettings): string
```
- Returns Tailwind color class based on average
- Three tiers: Excellent (≥threshold), Good, Poor
- Used for visual indicators

#### 4. **formatDate()**
```typescript
formatDate(dateStr: string): string
```
- Converts ISO date string to Turkish locale
- Format: "1 Ocak 2025"

**Deprecated (kept for compatibility):**
- `calculateNeutralAverage()` - Old system
- `calculateNormalAverage()` - Old system

---

### **Export Utility** (`src/utils/export.ts`)

**Key Functions:**

#### 1. **exportToExcel()**
- Creates summary Excel workbook
- One row per child
- Columns: Name, Total Evaluations, Average, Status, Period Achievements
- Styled header with dark background
- Color-coded status cells (green/yellow)

#### 2. **exportDetailedExcel()**
- Detailed per-child Excel file
- Rows: Each evaluation entry
- Columns: Date, Evaluator, Score1, Score2, Score3, Score4

#### 3. **exportToPDF()**
- Summary PDF report
- Includes children list with statistics
- Professional layout

#### 4. **exportDetailedPDF()**
- Per-child detailed PDF
- Lists all evaluations chronologically
- Shows trends and observations

**Features:**
- Client-side generation (no server needed)
- Uses ExcelJS and jsPDF libraries
- Automatic filename with timestamp
- Turkish localization

---

### **Migration Utility** (`src/utils/migration.ts`)

**Purpose:** Automatic data migration from 1-5 to 0-1-2 scoring system

**Migration Mapping:**
```
Old 1-5 System  →  New 0-1-2 System
1-2             →  0 (Yetersiz)
3               →  1 (Orta)
4-5             →  2 (Başarılı)
```

**Key Functions:**

#### 1. **migrateScore()**
- Converts single score from 1-5 to 0-2

#### 2. **migrateScoreEntry()**
- Migrates all s1, s2, s3, s4 fields in an entry

#### 3. **migrateChild()**
- Migrates all score entries for a child

#### 4. **migrateChildren()**
- Migrates entire children array

#### 5. **migrateSettings()**
- Converts settings structure
- Preserves categories
- Sets new defaults for 0-2 system
- Converts old veto/cancel rules

#### 6. **needsMigration()**
- Checks if data uses old system
- Returns `!settings.scoreSystem`

#### 7. **isOldSystemScore()**
- Identifies old 1-5 scores (score >= 3)

**Features:**
- Automatic detection on app load
- One-time migration with user confirmation
- Detailed console logging
- Preserves all data integrity
- Fallback for incomplete migrations

---

## 6. TYPES & INTERFACES

**File:** `src/types/index.ts`

### **ScoreEntry**
```typescript
interface ScoreEntry {
  date: string;              // ISO format date
  evaluator: string;         // Evaluator name
  s1?: number;              // Score 1 (category 1)
  s2?: number;              // Score 2 (category 2)
  s3?: number;              // Score 3 (category 3)
  s4?: number;              // Score 4 (category 4)
  descriptions?: {           // Optional notes per category
    [categoryIndex: number]: string;
  };
}
```

### **Child**
```typescript
interface Child {
  id: string;                // UUID
  name: string;              // Child's name
  scores: ScoreEntry[];      // Array of evaluations
  archived?: boolean;        // Soft-delete flag
  createdAt?: string;        // ISO timestamp
}
```

### **Period**
```typescript
interface Period {
  days: number;              // Number of days
  name: string;              // Display name (e.g., "6 Günlük Kazanım")
}
```

### **VetoRule**
```typescript
interface VetoRule {
  enabled: boolean;
  zeroCount: number;         // If X zeros → award vetoed
}
```

### **CancelRule**
```typescript
interface CancelRule {
  enabled: boolean;
  highScore: number;         // Usually 2 (successful)
  highCount: number;         // Number of high scores needed
  lowScore: number;          // Usually 0 (failing)
  lowCount: number;          // Number of low scores to cancel
}
```

### **AppSettings**
```typescript
interface AppSettings {
  categories: string[];      // Category names
  threshold: number;         // Achievement threshold (0-2)
  scoreSystem: {
    min: number;            // Minimum score (0)
    max: number;            // Maximum score (2)
  };
  vetoRule: VetoRule;
  cancelRule: CancelRule;
  periods: Period[];
  
  // Backward compatibility
  calcType?: 'neutral' | 'normal';
  vetoFives?: number;
  vetoOnes?: number;
  cancelThreshold?: number;
}
```

### **ChildStats**
```typescript
interface ChildStats {
  average: number | null;           // Overall average
  remainingZeros: number;           // After cancellation
  totalScores: number;              // Count of score entries
  vetoApplied: boolean;             // Whether veto triggered
  periods: Array<{                  // Per-period stats
    average: number;
    remainingZeros: number;
    achieved: boolean;              // Met threshold?
    daysCount: number;              // Evaluations in period
    vetoApplied: boolean;
  } | null>;
  
  // Backward compatibility
  normalAvg?: number | null;
  neutralAvg?: {
    average: number;
    remainingOnes: number;
    totalScores: number;
  } | null;
}
```

### **UserRole**
```typescript
interface UserRole {
  uid: string;
  email: string | null;
  role: 'admin' | 'staff' | 'viewer';
  displayName?: string;
}
```

### **AuthUser**
```typescript
interface AuthUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  role?: 'admin' | 'staff' | 'viewer';
}
```

### **UnsavedChanges**
```typescript
interface UnsavedChanges {
  [childId: string]: {
    scores: { [categoryIndex: number]: number };    // Unsaved scores
    descriptions: { [categoryIndex: number]: string };  // Unsaved notes
    absent: boolean;                                 // Absent flag
  };
}
```

---

## 7. CUSTOM HOOKS

### **useDarkMode** (`src/hooks/useDarkMode.ts`)

**Purpose:** Dark/light theme management

**Returns:**
```typescript
{
  isDark: boolean;
  toggle: () => void;
}
```

**Features:**
- Reads saved preference from localStorage
- Updates document.documentElement classList
- Persists preference
- Graceful error handling (defaults to light)

**Usage:** Used in DarkModeToggle and throughout app

---

## 8. KEY ARCHITECTURAL PATTERNS

### Data Flow
```
Firebase (Firestore) 
    ↓
Services (childrenService, settingsService)
    ↓
Contexts (EvaluationContext, AuthContext)
    ↓
Pages (DashboardPage, EvaluationPage, etc.)
    ↓
Components (ChildCardV2, Modals, etc.)
```

### State Management Strategy
1. **Firebase (Source of Truth)** - Persistent data storage
2. **React Context** - Global application state
3. **LocalStorage** - Temporary unsaved changes (for resilience)
4. **Component State** - Local UI state (modals, dropdowns, etc.)

### Authentication Flow
```
User visits app
    ↓
Firebase listener triggered
    ↓
Is there a user? 
    ├─ Yes → Parse auth role (admin vs staff)
    └─ No → Auto sign-in anonymously
    ↓
Set loading to false (render UI)
```

### Evaluation Workflow
```
Select Date → Select Evaluator → View Child Cards
    ↓
Score each child (A-Z per category OR quick fill)
    ↓
Add descriptions (optional)
    ↓
LocalStorage auto-saves changes
    ↓
Click "Save All" button
    ↓
Validation (all categories or absent)
    ↓
Permission check (staff cannot edit existing)
    ↓
Firebase save
    ↓
Clear LocalStorage
    ↓
Update local context
```

### Error Handling
1. **ErrorBoundary** - Catches React component errors
2. **Try-catch blocks** - Firebase operation errors
3. **Validation** - Incomplete scoring validation
4. **Toast notifications** - User feedback for errors

---

## 9. PERFORMANCE OPTIMIZATIONS

1. **Code Splitting** - Lazy-loaded pages with React.lazy
2. **Memoization** - useMemo for expensive calculations in StatsPage
3. **LocalStorage Caching** - Unsaved changes don't require Firebase
4. **No Real-time Updates** - Uses get/setDoc instead of listeners (reduce reads)
5. **PWA Support** - vite-plugin-pwa for offline capability

---

## 10. SECURITY CONSIDERATIONS

1. **Firebase Security Rules** - Configured in firebase.json
2. **Role-Based Access** - Admin vs Staff restrictions in UI
3. **Anonymous Auth** - Safeguard with Firestore rules
4. **Staff Permissions** - Cannot edit existing records (enforced in saveAll)
5. **No Sensitive Data** - No passwords stored in Firestore

---

## 11. DEPLOYMENT

**Build Command:** `npm run build`
- TypeScript compilation with tsc
- Vite bundling
- Output: `/dist` folder

**Firebase Hosting:**
- Configured in firebase.json
- Automatic deployment support

**Environment Variables:**
Required variables in `.env`:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

---

## 12. FILE STRUCTURE

```
gelisim-paneli/
├── src/
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Entry point with context providers
│   ├── index.css                # Global styles
│   ├── App.css                  # App styles
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EvaluationPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── StatsPage.tsx
│   ├── components/
│   │   ├── ChildCardV2.tsx      # Main evaluation card
│   │   ├── ChildCard.tsx        # Legacy version
│   │   ├── *Modal.tsx           # 7 modal components
│   │   ├── DarkModeToggle.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ToastContainer.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       └── ProgressBar.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── EvaluationContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── childrenService.ts
│   │   └── settingsService.ts
│   ├── utils/
│   │   ├── calculations.ts      # Scoring logic
│   │   ├── export.ts            # Excel/PDF export
│   │   └── migration.ts         # Data migration
│   ├── hooks/
│   │   └── useDarkMode.ts
│   └── types/
│       └── index.ts             # All TypeScript interfaces
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

---

## 13. RECENT CHANGES (from git history)

1. **Modernize UI with enhanced styling and mobile responsiveness** - Latest commit
2. **Fix ESLint and TypeScript errors** - Type safety improvements
3. **Integrate automatic data migration from 1-5 to 0-1-2 system** - Major feature
4. **Add comprehensive Settings UI for 0-1-2 scoring system** - Settings overhaul
5. **Fix TypeScript errors and update UI components for 0-1-2 system** - System migration

---

## 14. FUTURE SCALABILITY

Potential improvements:
1. **Database:** Multi-child batching, pagination for large datasets
2. **Caching:** Add Redux or Zustand for complex state
3. **Real-time:** Implement Firestore listeners for collaborative features
4. **Analytics:** Enhanced data visualization with more chart types
5. **API:** GraphQL layer for optimized queries
6. **Testing:** Add Jest, React Testing Library, E2E tests
7. **Documentation:** Storybook for component documentation
8. **Accessibility:** WCAG compliance improvements
9. **Internationalization:** Multi-language support
10. **Mobile:** React Native app for iOS/Android

