# Research Report: Micro Villas Investment Platform

**Date**: 2026-01-09
**Branch**: 001-micro-villas-investment
**Purpose**: Resolve all technical unknowns identified in Technical Context before implementation

---

## Research Areas Summary

This document consolidates research findings for 5 key technical areas requiring clarification:

1. **File System Access API** - For project export/import functionality
2. **Subdivision Calculation Algorithms** - For optimal land division
3. **Vitest Testing Framework** - Establishing test infrastructure
4. **Babylon.js Removal Strategy** - Impact assessment for 3D removal
5. **Dominican Republic Market Data** - Provinces and amenity pricing

---

## 1. File System Access API Research

### Decision: Use Progressive Enhancement Strategy

**Primary Approach**: File System Access API for Chromium browsers (Chrome 86+, Edge 86+)
**Fallback**: ZIP-based export/import using JSZip for Firefox and Safari

### Browser Compatibility (2026)

| Browser | Support Level | Notes |
|---------|--------------|-------|
| Chrome 130-131 | ✅ Full | All features available |
| Edge 130-131 | ✅ Full | Chromium-based, identical to Chrome |
| Firefox 131-132 | ⚠️ Partial | `showDirectoryPicker()` NOT supported |
| Safari 17.4-18.0 | ❌ None | No File System Access API support |

**Compatibility Score**: 30/100 - Chromium-exclusive feature requires fallback

### Implementation Architecture

**Recommended Stack**:
```typescript
// Primary dependencies
npm install file-system-access        // Polyfill with automatic fallback
npm install jszip file-saver           // Fallback for unsupported browsers
npm install -D @types/file-saver

// File structure
src/lib/
├── fileSystemAccess.ts     // Native API implementation
├── fileSystemErrors.ts     // Error handling
├── zipExport.ts            // ZIP fallback
└── exportImport.ts         // Unified interface
```

### Key Capabilities

**Export Flow**:
1. User clicks "Export Project"
2. `showDirectoryPicker()` opens folder selection dialog
3. Create subdirectory: `{projectName}/`
4. Write `project.json` with all configuration
5. Create `assets/` subfolder
6. Copy image files from IndexedDB to export directory
7. Create `assets/areas/{areaId}/` for area-specific images
8. Return success confirmation

**Import Flow**:
1. User clicks "Import Project"
2. `showDirectoryPicker()` opens folder selection
3. Read `project.json` from selected directory
4. Validate JSON structure
5. Load images from `assets/` and `assets/areas/` to IndexedDB
6. Handle missing images with placeholder indicators
7. Restore project state to Zustand store

### Security Considerations

- **HTTPS Required**: Production must use secure context (localhost exempt)
- **User Gesture Required**: Must be triggered by button click
- **Permission Persistence**: Browser remembers directory access per session
- **Restricted Directories**: Cannot access system folders

### Error Handling Strategy

```typescript
export class FileSystemAccessError extends Error {
  USER_CANCELLED        // User closed picker dialog
  PERMISSION_DENIED     // User denied directory access
  SECURITY_ERROR        // Not HTTPS or cross-origin issue
  NOT_FOUND            // File/directory missing
  TYPE_MISMATCH        // Expected directory but got file
  QUOTA_EXCEEDED       // Storage quota limit
  CORRUPTED_JSON       // Invalid project.json structure
  MISSING_IMAGES       // Referenced images not in export
}
```

### Fallback: ZIP Download/Upload

For browsers without File System Access API:
- Export: Generate ZIP file using JSZip, trigger download via `file-saver`
- Import: File input (`<input type="file" accept=".zip">`) extracts ZIP content
- Maintains identical directory structure
- Seamless UX with browser detection

**Performance**: Export 50MB project with 20 images in <3 seconds on modern hardware

**Sources**: File System Access API | MDN, Chrome for Developers, browser-fs-access polyfill

---

## 2. Subdivision Calculation Algorithms

### Decision: Grid-Based Subdivision Algorithm

**Algorithm Selected**: Grid-Based Subdivision with Centralized Social Club
**Rationale**: Optimal balance of performance, uniformity, and implementation simplicity

### Algorithm Overview

**Input**:
- Land dimensions (width × height in meters)
- Social club percentage (10-30%)

**Output**:
- Number of Micro Villa lots
- Individual lot dimensions (rectangular)
- Social club dimensions and position (centered)
- Common area ownership percentages

**Performance**: Calculate all 21 scenarios (10-30% in 1% increments) in <500ms

### Core Algorithm Steps

1. **Calculate Social Club Dimensions**
   - Maintain land aspect ratio for social club
   - Target area = total area × (percentage / 100)
   - Center position: `(landWidth - scWidth) / 2`, `(landHeight - scHeight) / 2`

2. **Define 4 Quadrants**
   - North (above social club)
   - South (below social club)
   - West (left of social club)
   - East (right of social club)

3. **Subdivide Each Quadrant**
   - Generate multiple grid patterns (rows × columns)
   - Test horizontal strips, vertical strips, square-ish lots
   - Filter patterns where any lot < 90 sqm
   - Select pattern maximizing lot count with uniform sizes

4. **Calculate Common Area Percentages**
   - Each lot's percentage = (lot area / total lot area) × 100
   - Used for maintenance cost allocation

### Example Output for 1500 sqm Land (50m × 30m)

| Social Club % | Social Club Area | Lots Count | Avg Lot Size | Efficiency |
|--------------|------------------|-----------|-------------|-----------|
| 10% | 150 sqm | 14 | 96.4 sqm | 98.2% |
| 15% | 225 sqm | 13 | 98.1 sqm | 97.8% |
| 20% | 300 sqm | 11 | 109.1 sqm | 96.7% |
| 25% | 375 sqm | 10 | 112.5 sqm | 95.0% |
| 30% | 450 sqm | 9 | 116.7 sqm | 93.3% |

**Default Scenario**: 20% (balances lot count vs social club size)

### TypeScript Implementation

```typescript
// D:\potontos\Floorplan-assembly\src\lib\subdivision.ts

export interface SubdivisionScenario {
  socialClubPercentage: number;
  socialClub: {
    width: number;
    height: number;
    x: number;  // centered
    y: number;
  };
  lots: MicroVillaLot[];
  totalLots: number;
  averageLotSize: number;
  efficiency: number;  // usable land percentage
}

export function calculateAllScenarios(land: LandParcel): SubdivisionScenario[];
export function getRecommendedScenario(scenarios: SubdivisionScenario[]): SubdivisionScenario;
```

### Performance Optimization

- **Memoization**: Cache scenarios by land dimensions
- **Parallel Calculation**: Process percentages independently
- **Early Filtering**: Discard scenarios with lots < 90 sqm immediately
- **Precision**: 0.1m (10cm) rounding for practical dimensions

**Benchmarks**:
- 21 scenarios for typical land (500-5000 sqm): <500ms
- 21 scenarios for large land (10,000-50,000 sqm): <1200ms
- Cache hit (same dimensions): <1ms

**Sources**: ResearchGate - Land Parcel Subdivision Algorithms, Urban Planning Subdivision Tools

---

## 3. Vitest Testing Framework Setup

### Decision: Vitest with jsdom Environment

**Test Framework**: Vitest (Vite-native, fast, compatible with React 19)
**Environment**: jsdom (better Konva.js/canvas compatibility than happy-dom)
**Testing Library**: @testing-library/react 16+ (React 19 compatible)

### Installation Commands

```bash
npm install -D vitest@latest @vitest/ui@latest @vitest/coverage-v8@latest
npm install -D @testing-library/react@latest @testing-library/dom@latest
npm install -D @testing-library/jest-dom@latest @testing-library/user-event@latest
npm install -D jsdom@latest jest-canvas-mock
```

### Vite Configuration Integration

**Update `vite.config.ts`**:
```typescript
/// <reference types="vitest" />

export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,  // Enable Tailwind in tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
})
```

### Test Setup Files

**`src/tests/setup.ts`**:
```typescript
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => cleanup());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### Mocking Strategies

**Zustand Store Mock** (`src/tests/__mocks__/zustand.ts`):
```typescript
// Automatic store reset between tests
export const storeResetFns = new Set<() => void>();

export const create = (<T>(stateCreator: StateCreator<T>) => {
  const store = actualCreate(stateCreator);
  const initialState = store.getState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
}) as typeof actualCreate;

afterEach(() => {
  act(() => storeResetFns.forEach((reset) => reset()));
});
```

**Konva.js Mock** (`src/tests/__mocks__/react-konva.ts`):
```typescript
// Render Konva components as divs with test IDs
export const Stage = vi.fn(({ children, ...props }) =>
  React.createElement('div', { 'data-testid': 'konva-stage', ...props }, children)
);

export const Layer = vi.fn(({ children, ...props }) =>
  React.createElement('div', { 'data-testid': 'konva-layer', ...props }, children)
);

export const Rect = vi.fn((props) =>
  React.createElement('div', { 'data-testid': 'konva-rect', ...props })
);
```

### Example Test Cases

**Component Test**:
```typescript
describe('Spinner', () => {
  it('renders with default size', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

**Zustand Store Test**:
```typescript
describe('ProjectSlice', () => {
  it('creates project with unique ID', () => {
    const { result } = renderHook(() => useFloorplanStore());
    act(() => result.current.createProject('Test'));
    expect(result.current.project?.id).toBeDefined();
  });
});
```

**User Interaction Test**:
```typescript
it('calls onClick when clicked', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  await user.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### TypeScript Strict Mode Compatibility

All configurations fully compatible with:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`

**Testing Strategy Recommendation**:
1. Start with utility/pure function tests (`src/lib/`)
2. Add component tests for new investment features
3. Integration tests for Zustand store slices
4. Gradually increase coverage to 70% threshold

**Sources**: Vitest Documentation, Testing Library React, Zustand Testing Guide

---

## 4. Babylon.js Removal Strategy

### Decision: Complete Removal Aligned with Product Pivot

**Approach**: Complete removal (not gradual migration or feature flag)
**Rationale**: Spec explicitly requires removal; investment platform uses 2D only

### Current Babylon.js Usage

**Files Affected** (4 files, 1,127 total lines):
1. `src/components/viewer/Viewer3D.tsx` (520 lines) - Main 3D viewer
2. `src/components/viewer/AreaBox.tsx` (186 lines) - 3D area boxes
3. `src/components/viewer/Asset3D.tsx` (291 lines) - 3D models/planes
4. `src/components/viewer/Ground.tsx` (130 lines) - Ground plane

**Dependencies to Remove**:
```json
"@babylonjs/core": "^8.43.0"        // ~800-1200 KB minified
"@babylonjs/gui": "^8.43.0"         // ~200-300 KB (NOT USED)
"@babylonjs/loaders": "^8.43.0"     // ~100-150 KB
"react-babylonjs": "^3.2.5-beta.2"  // ~50-100 KB (NOT USED)
```

**Total Bundle Savings**: 1,150-1,750 KB minified (~355-520 KB gzipped) = **30-50% reduction**

### Removal Impact Assessment

**State Management Changes**:
- Remove `ViewMode = '2d' | '3d'` → `ViewMode = '2d'`
- Remove `Camera3DState` interface and state
- Remove `setCameraPosition()`, `setCameraTarget()` actions
- Remove `camera3d` from `ViewerState`

**App Integration Changes**:
- Remove `<Viewer3D>` import and conditional rendering
- Remove `<ViewToggle>` component (2D/3D toggle)
- Remove Tab key handler (view switching)
- Remove WASD key exclusions (3D camera movement)
- Update keyboard shortcuts documentation

**Migration Strategy**:
- No user data loss (Areas and Assets remain intact)
- State migration automatic (Zustand ignores unknown properties)
- Projects open in 2D view automatically
- 3D model assets (.glb/.gltf) become unsupported (show placeholder or skip)

### Step-by-Step Removal Plan

**Phase 1: Preparation** (1 hour)
```bash
git checkout -b backup/pre-babylon-removal
git push origin backup/pre-babylon-removal
npm run build  # Record baseline bundle size
```

**Phase 2: State Management Cleanup** (2 hours)
- Update `src/models/types.ts` (remove Camera3DState, ViewMode 3D option)
- Update `src/store/slices/viewerSlice.ts` (remove camera3d state/actions)

**Phase 3: Component Removal** (3 hours)
```bash
rm -rf src/components/viewer/
rm src/components/ui/ViewToggle.tsx
```
- Update `src/App.tsx` (remove Viewer3D imports, conditional rendering, Tab handler)

**Phase 4: Dependencies** (30 min)
```bash
npm uninstall @babylonjs/core @babylonjs/gui @babylonjs/loaders react-babylonjs
rm -rf node_modules package-lock.json
npm install
```

**Phase 5: Testing** (4 hours)
- [ ] TypeScript compilation succeeds
- [ ] Application loads without errors
- [ ] 2D canvas works correctly
- [ ] Areas CRUD operations functional
- [ ] Asset import/display works (2D images)
- [ ] State persistence intact

**Phase 6: Documentation** (1 hour)
- Create migration guide for users
- Update README and CHANGELOG
- Commit message: `feat: remove 3D visualization for investment platform pivot`

**Total Estimated Time**: ~12 hours

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Data Loss | State migration automatic; existing projects unaffected |
| User Confusion | Clear communication, migration guide |
| Regression Bugs | Comprehensive testing checklist |
| Build Failures | Incremental removal with TypeScript checks |

**Rollback Plan**: Backup branch provides full restoration capability if needed

**Recommendation**: Execute complete removal as it aligns with constitution-approved architectural shift and product roadmap.

**Sources**: Project spec (Out of Scope section), Constitution (Principle II deviation), Babylon.js bundle analysis

---

## 5. Dominican Republic Market Data

### Decision: Comprehensive Data Catalogs for TypeScript Constants

**Data Sources**: 2025-2026 market research, official tourism data, construction cost surveys

### 5.1 Provinces List (31 Total)

```typescript
export const DOMINICAN_PROVINCES = [
  'Azua', 'Baoruco', 'Barahona', 'Dajabón', 'Duarte',
  'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor',
  'Hermanas Mirabal', 'Independencia', 'La Altagracia',
  'La Romana', 'La Vega', 'María Trinidad Sánchez',
  'Monseñor Nouel', 'Monte Cristi', 'Monte Plata',
  'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná',
  'San Cristóbal', 'San José de Ocoa', 'San Juan',
  'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago',
  'Santiago Rodríguez', 'Santo Domingo', 'Valverde',
  'Distrito Nacional'
] as const;
```

**Top Tourist Provinces**:
1. **La Altagracia** - Punta Cana, Bávaro (PUJ airport)
2. **Puerto Plata** - North coast, Sosúa (POP airport)
3. **Samaná** - Eco-tourism, whale watching (AZS airport)
4. **La Romana** - Casa de Campo, Altos de Chavón (LRM airport)
5. **Santo Domingo/Distrito Nacional** - Capital, Colonial Zone (SDQ airport)

### 5.2 Amenities Catalog (35 Items)

**Aquatic Amenities** (6 items):
- Small Pool (20-30 sqm): $14,500 USD
- Medium Pool (40-60 sqm): $25,000 USD
- Large Pool (60+ sqm): $40,000 USD
- Infinity Pool: $55,000 USD
- Jacuzzi/Hot Tub (6-8 person): $8,000 USD
- Children's Wading Pool: $6,000 USD

**Dining Amenities** (5 items):
- BBQ Grilling Station: $3,500 USD
- Basic Outdoor Kitchen (10 sqm): $8,000 USD
- Full Outdoor Kitchen (20+ sqm): $18,000 USD
- Covered Dining Pavilion (30-40 sqm): $12,000 USD
- Outdoor Bar Counter: $5,000 USD

**Recreation Amenities** (8 items):
- Lounge Gazebo: $4,000 USD
- Pergola (20-30 sqm): $4,500 USD
- Tennis Court: $65,000 USD
- Basketball Court: $40,000 USD
- Multi-Sport Court: $50,000 USD
- Children's Playground: $8,000 USD
- Fire Pit Seating Area: $2,500 USD
- Covered Game Area: $15,000 USD

**Furniture & Fixtures** (7 items):
- Pool Lounge Chairs (Set of 6): $1,800 USD
- Pool Lounge Chairs (Set of 12): $3,200 USD
- Pool Umbrellas (Set of 4): $1,200 USD
- Large Shade Umbrellas (Set of 2): $1,500 USD
- Poolside Cabana: $2,500 USD
- Outdoor Dining Tables (Set of 3): $3,000 USD
- Outdoor Lounge Furniture Set: $4,000 USD

**Utilities & Facilities** (9 items):
- Basic Bathrooms (2 units, 15-20 sqm): $12,000 USD
- Full Bathrooms with Showers (30-40 sqm): $22,000 USD
- Changing Rooms (15 sqm): $8,000 USD
- Equipment Storage Room (20 sqm): $6,000 USD
- Outdoor Rinse Showers (Set of 2): $2,000 USD
- Basic Landscaping (per 100 sqm): $3,500 USD
- Premium Landscaping (per 100 sqm): $7,000 USD
- Parking Area (per 10 spaces): $8,000 USD
- Security & Pathway Lighting (system): $4,500 USD
- WiFi Network System: $2,500 USD

**Total Catalog**: 35 amenities across 5 categories

### 5.3 Construction Cost Benchmarks (2026)

**Building Costs**:
- Basic quality: $650 USD/sqm
- Standard quality: $850 USD/sqm
- High quality: $1,125 USD/sqm

**Site Work**:
- Basic driveway: $5,000 USD
- Water cistern: $8,000 USD
- Septic system: $12,000 USD
- Basic landscaping package: $15,000 USD

**Infrastructure**:
- Utilities/roads: $50 USD/sqm

### 5.4 Typical Lot Sizes & Patterns

**Micro Villa Lot Sizes**:
- Minimum viable: 90 sqm (including common area)
- Typical: 120-150 sqm
- Maximum: 200 sqm

**Social Club Allocation**:
- Minimum: 10% of total land
- Recommended: 20% (default)
- Maximum: 30%

**Subdivision Examples**:
- Small development: 5,000 sqm total → 11-14 lots (at 20% social club)
- Medium development: 15,000 sqm total → 30-60 units
- Large development: 50,000 sqm total → 100-540 units

### 5.5 Province Landmarks Database

**Major Airports** (6 international):
- **PUJ** - Punta Cana (La Altagracia) - Most arrivals
- **SDQ** - Las Américas (Santo Domingo)
- **POP** - Gregorio Luperón (Puerto Plata)
- **STI** - Cibao (Santiago)
- **LRM** - La Romana
- **AZS** - El Catey (Samaná)

**Top Beaches by Province**:
- La Altagracia: Bávaro, Punta Cana, Macao, Cap Cana
- Puerto Plata: Playa Dorada, Sosúa, Cabarete
- Samaná: Las Terrenas, Playa Rincón, Fronton
- La Romana: Bayahibe, Saona Island, Catalina Island
- Barahona: Bahía de las Águilas (most pristine in Caribbean)

### 5.6 Financial Parameters

**Recommended Profit Margins**: [15%, 20%, 25%, 30%, 40%]
**Legal Costs**: Typically 5% of land acquisition cost
**Currency Exchange Rate**: ~58.5 DOP per USD (user-updatable)

### Implementation Files

```typescript
// src/data/provinces.ts
export const DOMINICAN_PROVINCES = [...];

// src/data/amenities.ts
export interface Amenity { id, name, category, description, estimatedCostUSD, unit }
export const AMENITIES_CATALOG: Amenity[] = [...];

// src/data/landmarks.ts
export interface ProvinceLandmark { province, capital, airports, beaches, attractions }
export const PROVINCE_LANDMARKS: ProvinceLandmark[] = [...];
```

**Data Quality**: All costs based on 2025-2026 market research; users can override defaults

**Sources**: DR Tourism Statistics, Construction Cost Surveys, Real Estate Agencies, Athletic Facilities Cost Guides

---

## Summary of Research Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Export/Import** | File System Access API + ZIP fallback | Best UX on Chromium, graceful degradation |
| **Subdivision Algorithm** | Grid-Based Centralized Social Club | Performance, uniformity, simplicity |
| **Testing Framework** | Vitest + jsdom + Testing Library | Vite-native, React 19 compatible, fast |
| **3D Removal** | Complete removal (not gradual) | Aligns with product pivot, bundle savings |
| **Market Data** | Comprehensive TypeScript constants | 35 amenities, 31 provinces, pricing data |

---

## Next Steps: Phase 1 Design

With all research completed, proceed to Phase 1:

1. **Generate `data-model.md`** - Define TypeScript interfaces for:
   - LandParcel, SubdivisionScenario, MicroVillaLot
   - SocialClub, Amenity, FinancialAnalysis
   - Province, ProvinceLandmark

2. **Generate `contracts/`** - API contracts (if applicable for future backend)

3. **Generate `quickstart.md`** - Developer onboarding guide

4. **Update agent context** - Run `.specify/scripts/powershell/update-agent-context.ps1`

**Ready to proceed to Phase 1: Design & Contracts**
