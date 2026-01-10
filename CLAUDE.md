# Floorplan Assembly Development Guidelines

Auto-generated from feature plans. Last updated: 2026-01-09

## Active Technologies

**Language**: TypeScript 5.9.3 (strict mode enabled)

**Frontend Framework**: React 19.2

**State Management**: Zustand 5.0.9 with Zundo 2.3.0 (undo/redo middleware)

**Rendering**:
- 2D: Konva.js 10.0.12 with react-konva 19.2.1
- 3D: Babylon.js 8.43.0 (scheduled for removal in feature 001)

**Storage**:
- Browser IndexedDB via idb-keyval 6.2.2 (local persistence)
- File System Access API (export/import to disk)

**Build System**: Vite 7.2.4

**Styling**: Tailwind CSS 4.1.18

**Testing**: Vitest (to be established per constitution)

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

**Project Type**: Single-page web application (SPA)

## Project Structure

```text
src/
├── models/
│   └── types.ts                    # Core data types + investment extensions
├── components/
│   ├── canvas/                     # 2D Konva rendering
│   ├── viewer/                     # 3D Babylon.js (TO BE REMOVED in feature 001)
│   ├── dialogs/                    # Modal dialogs
│   ├── panels/                     # Side panel components
│   ├── ui/                         # Shared UI components
│   └── investment/                 # NEW in feature 001
│       ├── LandConfigPanel.tsx
│       ├── SubdivisionViewer.tsx
│       ├── SocialClubDesigner.tsx
│       ├── FinancialAnalysis.tsx
│       └── ExportImport.tsx
├── store/
│   ├── index.ts                    # Zustand store setup
│   ├── selectors.ts                # Reusable selectors
│   └── slices/
│       ├── areasSlice.ts
│       ├── assetsSlice.ts
│       ├── projectSlice.ts
│       ├── viewerSlice.ts
│       ├── landSlice.ts            # NEW in feature 001
│       ├── subdivisionSlice.ts     # NEW in feature 001
│       ├── socialClubSlice.ts      # NEW in feature 001
│       └── financialSlice.ts       # NEW in feature 001
├── lib/
│   ├── coordinates.ts              # Coordinate utilities
│   ├── geometry.ts                 # Geometric calculations
│   ├── storage.ts                  # IndexedDB persistence
│   ├── generateAIDescription.ts
│   ├── subdivision.ts              # NEW in feature 001
│   ├── financial.ts                # NEW in feature 001
│   ├── export.ts                   # NEW in feature 001
│   └── import.ts                   # NEW in feature 001
├── data/                           # NEW in feature 001
│   ├── provinces.ts                # Dominican Republic provinces
│   └── amenities.ts                # Social club amenities catalog
└── main.tsx
```

## Commands

**Development**:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

**Testing** (after Vitest setup):
```bash
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report
```

**Linting**:
```bash
npm run lint         # Run ESLint
```

## Code Style

**TypeScript Strict Mode**: All code must compile with strict mode enabled
- No `any` types in core models
- Explicit return types on exported functions
- Null checks required

**React Patterns**:
- Functional components with hooks
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed as props

**Zustand State Management**:
```typescript
// Slice pattern
export const createMySlice: StateCreator<MySlice> = (set, get) => ({
  data: null,
  updateData: (updates) => set((state) => ({
    data: { ...state.data, ...updates }
  })),
});

// Usage in components
const data = useFloorplanStore(state => state.data);
const updateData = useFloorplanStore(state => state.updateData);
```

**Konva.js Rendering**:
```typescript
// Convert meters to pixels
const SCALE = 10;  // 10 pixels per meter
<Rect x={area.x * SCALE} y={area.y * SCALE} />
```

**File Naming**:
- Components: PascalCase (e.g., `LandConfigPanel.tsx`)
- Utilities: camelCase (e.g., `subdivision.ts`)
- Types: PascalCase (e.g., `types.ts` exports `LandParcel`)

**Measurement Precision**:
- Store dimensions in meters internally
- Round to 0.1m (10cm) precision for practical dimensions
- Financial calculations to 2 decimal places

## Architecture Principles

**From Project Constitution** (`.specify/memory/constitution.md`):

1. **Measurement Accuracy First**: All measurements stored in meters with sub-centimeter precision
2. **2D-3D Data Consistency**: Single source of truth (NOTE: 3D being removed in feature 001)
3. **Performance Over Fidelity**: UI interactions <100ms, calculations <2 seconds
4. **Area-Centric Architecture**: Core primitive is the `Area` entity
5. **Import Flexibility with Explicit Dimensions**: All imports require explicit measurement specification

## Recent Changes

### Feature 001: Micro Villas Investment Platform (2026-01-09)

**Status**: Planning complete, implementation pending

**What it adds**:
- Land parcel configuration for Dominican Republic properties
- Automatic subdivision calculation (21 scenarios with 10-30% social club)
- Social club amenities catalog (35 items across 5 categories)
- Complete financial analysis with multiple profit margin scenarios
- Project export/import to disk (File System Access API + ZIP fallback)
- AI-ready project descriptions for marketing

**Key Changes**:
- Remove Babylon.js 3D visualization (2D only)
- Add 4 new Zustand slices (land, subdivision, socialClub, financial)
- Extend type system with investment entities
- New subdivision algorithm (grid-based with centralized social club)
- Financial calculator for ROI analysis

**Technical Additions**:
- Dominican Republic provinces data (31 provinces)
- Amenities catalog with USD pricing
- File System Access API integration
- Subdivision algorithm (must complete 21 scenarios in <2 seconds)

**Impact**:
- Bundle size reduction: 30-50% (Babylon.js removal)
- Architecture shift: Floorplan tool → Investment platform
- Constitution deviation: Intentional removal of 3D features

---

<!-- MANUAL ADDITIONS START -->
<!-- Add any project-specific notes, conventions, or context here -->
<!-- This section is preserved across automatic updates -->
<!-- MANUAL ADDITIONS END -->
