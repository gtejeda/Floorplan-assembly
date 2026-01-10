# Quickstart Guide: Micro Villas Investment Platform

**Branch**: `001-micro-villas-investment`
**Date**: 2026-01-09
**Purpose**: Developer onboarding and implementation guide

---

## Overview

This guide walks developers through implementing the Micro Villas Investment Platform feature. This feature transforms the existing floor plan design tool into an investment and budgeting platform for vacation property projects in Dominican Republic.

**Timeline Estimate**: 10-15 development days (based on 8 user stories, P1-P3 priorities)

---

## Prerequisites

### Knowledge Requirements

- **TypeScript 5.9+** with strict mode
- **React 19.2** with hooks
- **Zustand state management** (existing pattern in codebase)
- **Konva.js** for 2D canvas rendering (existing)
- **Vite build system**
- **File System Access API** (for export/import)

### Development Environment

```bash
# Node.js version
node --version  # Should be 18.x or 20.x

# Clone and checkout branch
git checkout 001-micro-villas-investment

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests (after Vitest setup)
npm test
```

---

## Architecture Overview

### Current State (Floorplan Tool)

```
src/
├── models/types.ts          # Area, Asset, Project, Lot
├── components/
│   ├── canvas/              # 2D Konva rendering
│   ├── viewer/              # 3D Babylon (TO BE REMOVED)
│   ├── dialogs/             # Modals
│   ├── panels/              # Side panels
│   └── ui/                  # Shared UI
├── store/
│   └── slices/              # areasSlice, assetsSlice, projectSlice, viewerSlice
└── lib/                     # Utilities (geometry, storage, etc.)
```

### New Structure (Investment Platform)

```
src/
├── models/types.ts          # EXTEND with investment types
├── components/
│   ├── investment/          # NEW: Investment-specific components
│   └── viewer/              # DELETE: Remove 3D components
├── store/slices/
│   ├── landSlice.ts         # NEW
│   ├── subdivisionSlice.ts  # NEW
│   ├── socialClubSlice.ts   # NEW
│   └── financialSlice.ts    # NEW
├── lib/
│   ├── subdivision.ts       # NEW: Subdivision algorithms
│   ├── financial.ts         # NEW: Financial calculations
│   ├── export.ts            # NEW: File System Access API
│   └── import.ts            # NEW
└── data/
    ├── provinces.ts         # NEW: DR provinces
    └── amenities.ts         # NEW: Amenities catalog
```

---

## Implementation Phases

### Phase 0: Preparation (Day 1)

#### 0.1 Remove Babylon.js 3D Components

**Why**: Spec explicitly requires removing 3D visualization (see `research.md`)

```bash
# Backup first
git checkout -b backup/pre-babylon-removal
git push origin backup/pre-babylon-removal
git checkout 001-micro-villas-investment

# Remove 3D viewer components
rm -rf src/components/viewer/

# Remove ViewToggle component
rm src/components/ui/ViewToggle.tsx

# Uninstall dependencies
npm uninstall @babylonjs/core @babylonjs/gui @babylonjs/loaders react-babylonjs
```

**Files to Update**:
1. `src/models/types.ts`
   - Change `ViewMode = '2d' | '3d'` → `ViewMode = '2d'`
   - Remove `Camera3DState` interface

2. `src/store/slices/viewerSlice.ts`
   - Remove `camera3d` state
   - Remove `setCameraPosition`, `setCameraTarget` actions

3. `src/App.tsx`
   - Remove `<Viewer3D>` import and rendering
   - Remove `<ViewToggle>` from header
   - Remove Tab key handler for view switching
   - Always render `<Canvas2D>` (no conditional)

**Validation**:
```bash
npm run build  # Should succeed with no Babylon imports
# Bundle size should be 30-50% smaller
```

#### 0.2 Setup Vitest Testing (Optional but Recommended)

See `research.md` section 3 for complete setup instructions.

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

Create `src/tests/setup.ts` and update `vite.config.ts` per research doc.

---

### Phase 1: Data Layer (Days 2-3)

#### 1.1 Extend Type Definitions

**File**: `src/models/types.ts`

Add investment types from `data-model.md`:
- `LandParcel`
- `SubdivisionScenario`
- `MicroVillaLot`
- `SocialClubLayout`
- `Amenity`
- `FinancialAnalysis`
- `InvestmentProject`

```typescript
// Example: Add to types.ts
export interface LandParcel {
  width: number;
  height: number;
  totalArea: number;
  province: DominicanProvince;
  // ... see data-model.md for complete definition
}

export type DominicanProvince = 'Azua' | 'Baoruco' | /* ... 31 provinces */;
```

#### 1.2 Create Data Files

**File**: `src/data/provinces.ts`
```typescript
export const DOMINICAN_PROVINCES = [
  'Azua', 'Baoruco', /* ... all 31 provinces */
] as const;

export const PROVINCE_LANDMARKS: ProvinceLandmark[] = [
  // See research.md section 5.5 for complete data
];
```

**File**: `src/data/amenities.ts`
```typescript
export const AMENITIES_CATALOG: Amenity[] = [
  {
    id: 'pool-small',
    name: 'Small Swimming Pool',
    category: 'aquatic',
    description: 'Basic pool with filter/pump (20-30 sqm)',
    defaultCostUSD: 14500,
    unit: 'unit',
  },
  // ... 35 total amenities (see research.md section 5.2)
];
```

#### 1.3 Create Zustand Store Slices

**File**: `src/store/slices/landSlice.ts`
```typescript
import { StateCreator } from 'zustand';
import type { LandParcel } from '@models/types';

export interface LandSlice {
  landParcel: LandParcel | null;

  // Actions
  updateLandParcel: (updates: Partial<LandParcel>) => void;
  addLandImage: (image: ImageReference) => void;
  removeLandImage: (imageId: string) => void;
}

export const createLandSlice: StateCreator<LandSlice> = (set) => ({
  landParcel: null,

  updateLandParcel: (updates) => set((state) => ({
    landParcel: state.landParcel
      ? { ...state.landParcel, ...updates }
      : null,
  })),

  // ... implement other actions
});
```

Repeat for:
- `subdivisionSlice.ts` (manages SubdivisionScenario[])
- `socialClubSlice.ts` (manages amenity selection)
- `financialSlice.ts` (manages FinancialAnalysis)

**File**: `src/store/index.ts` (update existing)
```typescript
import { createLandSlice, LandSlice } from './slices/landSlice';
import { createSubdivisionSlice, SubdivisionSlice } from './slices/subdivisionSlice';
// ... import other slices

type FloorplanStore =
  & ProjectSlice
  & AreasSlice
  & AssetsSlice
  & ViewerSlice
  & LandSlice           // NEW
  & SubdivisionSlice    // NEW
  & SocialClubSlice     // NEW
  & FinancialSlice;     // NEW

export const useFloorplanStore = create<FloorplanStore>()(
  temporal(
    (...args) => ({
      ...createProjectSlice(...args),
      ...createAreasSlice(...args),
      ...createAssetsSlice(...args),
      ...createViewerSlice(...args),
      ...createLandSlice(...args),         // NEW
      ...createSubdivisionSlice(...args),  // NEW
      ...createSocialClubSlice(...args),   // NEW
      ...createFinancialSlice(...args),    // NEW
    }),
    { /* temporal options */ }
  )
);
```

---

### Phase 2: Core Algorithms (Days 4-5)

#### 2.1 Subdivision Algorithm

**File**: `src/lib/subdivision.ts`

Implement the Grid-Based Subdivision algorithm from `research.md` section 2:

```typescript
/**
 * Calculate all 21 subdivision scenarios (10-30%)
 * Must complete in <2 seconds per spec SC-002
 */
export function calculateAllScenarios(
  land: LandParcel
): SubdivisionScenario[] {
  const scenarios: SubdivisionScenario[] = [];

  for (let percentage = 10; percentage <= 30; percentage++) {
    const scenario = calculateGridSubdivision(land, percentage);
    if (scenario) {
      scenarios.push(scenario);
    }
  }

  return scenarios;
}

function calculateGridSubdivision(
  land: LandParcel,
  socialClubPercentage: number
): SubdivisionScenario | null {
  // 1. Calculate social club dimensions (centered)
  // 2. Define 4 quadrants (north, south, east, west)
  // 3. Subdivide each quadrant into lots
  // 4. Filter lots < 90 sqm
  // 5. Calculate common area percentages
  // See research.md section 2 for complete algorithm
}
```

**Test**:
```typescript
// src/lib/__tests__/subdivision.test.ts
describe('calculateAllScenarios', () => {
  it('generates 21 scenarios for typical land', () => {
    const land = { width: 50, height: 30, totalArea: 1500 };
    const scenarios = calculateAllScenarios(land);

    expect(scenarios.length).toBeLessThanOrEqual(21);
    expect(scenarios.every(s => s.socialClubPercentage >= 10)).toBe(true);
    expect(scenarios.every(s => s.socialClubPercentage <= 30)).toBe(true);
  });

  it('filters scenarios with lots < 90 sqm', () => {
    const scenarios = calculateAllScenarios({ width: 50, height: 30 });

    scenarios.forEach(scenario => {
      scenario.lots.forEach(lot => {
        expect(lot.area).toBeGreaterThanOrEqual(90);
      });
    });
  });
});
```

#### 2.2 Financial Calculator

**File**: `src/lib/financial.ts`

```typescript
/**
 * Calculate complete financial analysis
 * Per spec FR-036 to FR-046
 */
export function calculateFinancialAnalysis(
  landCost: number,
  amenitiesCost: number,
  legalCosts: number,
  otherCosts: OtherCost[],
  totalLots: number,
  targetProfitMargins: number[]
): FinancialAnalysis {
  const totalProjectCost =
    landCost + amenitiesCost + legalCosts +
    otherCosts.reduce((sum, c) => sum + c.amount, 0);

  const baseCostPerLot = (totalProjectCost - amenitiesCost) / totalLots;

  const pricingScenarios = targetProfitMargins.map(margin => {
    const lotSalePrice = baseCostPerLot * (1 + margin / 100);
    const totalRevenue = lotSalePrice * totalLots;
    const totalProfit = totalRevenue - totalProjectCost;

    return {
      profitMarginPercentage: margin,
      lotSalePrice,
      totalRevenue,
      totalProfit,
      profitPerLot: totalProfit / totalLots,
      returnOnInvestment: (totalProfit / totalProjectCost) * 100,
    };
  });

  return {
    landCost,
    amenitiesCost,
    legalCosts,
    otherCosts,
    totalProjectCost,
    costPerSqm: totalProjectCost / (/* total land area */),
    baseCostPerLot,
    pricingScenarios,
    // ... rest of FinancialAnalysis
  };
}
```

**Hook into Zustand**: Trigger recalculation when any cost input changes.

---

### Phase 3: UI Components (Days 6-10)

#### 3.1 Land Configuration Panel

**File**: `src/components/investment/LandConfigPanel.tsx`

**Implements**: User Story 1 (FR-001 to FR-007)

```tsx
export function LandConfigPanel() {
  const landParcel = useFloorplanStore(state => state.landParcel);
  const updateLandParcel = useFloorplanStore(state => state.updateLandParcel);

  return (
    <div className="panel">
      <h2>Land Configuration</h2>

      {/* Dimensions input */}
      <div className="input-group">
        <label>Width (meters)</label>
        <input
          type="number"
          value={landParcel?.width || ''}
          onChange={(e) => updateLandParcel({ width: Number(e.target.value) })}
          min={0.001}
          max={50000}
          step={0.1}
        />
      </div>

      {/* Province selection */}
      <div className="input-group">
        <label>Province</label>
        <select
          value={landParcel?.province || ''}
          onChange={(e) => updateLandParcel({ province: e.target.value as DominicanProvince })}
        >
          {DOMINICAN_PROVINCES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Acquisition cost */}
      {/* Urbanization status */}
      {/* Landmarks */}
      {/* Images */}
    </div>
  );
}
```

#### 3.2 Subdivision Viewer

**File**: `src/components/investment/SubdivisionViewer.tsx`

**Implements**: User Story 2 (FR-008 to FR-020)

Uses existing Konva.js 2D canvas to display:
- Land parcel boundary
- Social club (centered rectangle)
- Micro Villa lots (grid of rectangles)
- Labels with dimensions

```tsx
import { Stage, Layer, Rect, Text } from 'react-konva';

export function SubdivisionViewer() {
  const selectedScenario = useFloorplanStore(state =>
    state.subdivisionScenarios.find(s => s.id === state.selectedScenarioId)
  );

  if (!selectedScenario) return <div>No scenario selected</div>;

  return (
    <Stage width={800} height={600}>
      <Layer>
        {/* Social club */}
        <Rect
          x={selectedScenario.socialClub.x * SCALE}
          y={selectedScenario.socialClub.y * SCALE}
          width={selectedScenario.socialClub.width * SCALE}
          height={selectedScenario.socialClub.height * SCALE}
          fill="#FF9800"
          opacity={0.7}
        />

        {/* Micro Villa lots */}
        {selectedScenario.lots.map(lot => (
          <Rect
            key={lot.id}
            x={lot.x * SCALE}
            y={lot.y * SCALE}
            width={lot.width * SCALE}
            height={lot.height * SCALE}
            fill="#4A90D9"
            opacity={0.7}
            stroke="#333"
            strokeWidth={1}
          />
        ))}

        {/* Labels */}
        {selectedScenario.lots.map(lot => (
          <Text
            key={`label-${lot.id}`}
            x={lot.x * SCALE + 5}
            y={lot.y * SCALE + 5}
            text={`Lot ${lot.lotNumber}\n${lot.area.toFixed(1)} sqm`}
            fontSize={12}
          />
        ))}
      </Layer>
    </Stage>
  );
}
```

#### 3.3 Social Club Designer

**File**: `src/components/investment/SocialClubDesigner.tsx`

**Implements**: User Story 3 (FR-026 to FR-032)

```tsx
export function SocialClubDesigner() {
  const selectedAmenities = useFloorplanStore(state => state.socialClub.selectedAmenities);
  const toggleAmenity = useFloorplanStore(state => state.toggleAmenity);

  const categorized = useMemo(() => {
    return AMENITIES_CATALOG.reduce((acc, amenity) => {
      if (!acc[amenity.category]) acc[amenity.category] = [];
      acc[amenity.category].push(amenity);
      return acc;
    }, {} as Record<AmenityCategory, Amenity[]>);
  }, []);

  return (
    <div className="amenities-catalog">
      {Object.entries(categorized).map(([category, amenities]) => (
        <div key={category} className="category-section">
          <h3>{category.toUpperCase()}</h3>

          {amenities.map(amenity => (
            <label key={amenity.id} className="amenity-item">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity.id)}
                onChange={() => toggleAmenity(amenity.id)}
              />
              <span>{amenity.name}</span>
              <span className="cost">${amenity.defaultCostUSD.toLocaleString()}</span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
```

#### 3.4 Financial Analysis Component

**File**: `src/components/investment/FinancialAnalysis.tsx`

**Implements**: User Story 4 (FR-033 to FR-046)

Display calculated financial metrics with pricing scenario tables.

#### 3.5 Export/Import Component

**File**: `src/components/investment/ExportImport.tsx`

**Implements**: User Stories 7-8 (FR-058 to FR-073)

---

### Phase 4: Export/Import (Days 11-12)

#### 4.1 File System Access Implementation

**File**: `src/lib/export.ts`

See `research.md` section 1 for complete implementation with error handling.

```typescript
export async function exportProject(project: InvestmentProject): Promise<void> {
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      id: 'micro-villas-export',
      startIn: 'downloads',
    });

    // Create project folder
    const projectDirHandle = await dirHandle.getDirectoryHandle(
      sanitizeFilename(project.name),
      { create: true }
    );

    // Write project.json
    await writeProjectJSON(projectDirHandle, project);

    // Create assets/ folder
    // Copy images from IndexedDB to export directory
    // ...
  } catch (error) {
    handleFileSystemError(error);
  }
}
```

**File**: `src/lib/import.ts`

```typescript
export async function importProject(): Promise<InvestmentProject> {
  const dirHandle = await window.showDirectoryPicker({ mode: 'read' });

  // Read project.json
  const projectData = await readProjectJSON(dirHandle);

  // Load images to IndexedDB
  await importAssets(dirHandle, projectData);

  return projectData;
}
```

#### 4.2 Fallback: ZIP Export

Install dependencies:
```bash
npm install jszip file-saver
npm install -D @types/file-saver
```

**File**: `src/lib/zipExport.ts`

See `research.md` section 1 for ZIP fallback implementation.

---

### Phase 5: Integration & Testing (Days 13-15)

#### 5.1 Update App.tsx

Integrate new investment panels into main UI:

```tsx
// src/App.tsx
import { LandConfigPanel } from '@components/investment/LandConfigPanel';
import { SubdivisionViewer } from '@components/investment/SubdivisionViewer';
import { SocialClubDesigner } from '@components/investment/SocialClubDesigner';
import { FinancialAnalysis } from '@components/investment/FinancialAnalysis';

export function App() {
  return (
    <div className="app">
      <Sidebar>
        <LandConfigPanel />
        <SocialClubDesigner />
        <FinancialAnalysis />
      </Sidebar>

      <main>
        <SubdivisionViewer />
      </main>
    </div>
  );
}
```

#### 5.2 Comprehensive Testing

**Unit Tests**:
- `subdivision.test.ts` - Algorithm correctness
- `financial.test.ts` - Calculation accuracy
- Store slice tests

**Integration Tests**:
- Land input → Subdivision generation
- Amenity selection → Financial recalculation
- Export → Import → Data fidelity

**Manual QA Checklist**:
- [ ] All 8 user stories completed
- [ ] Success criteria met (SC-001 to SC-011)
- [ ] Performance: 21 scenarios < 2 seconds
- [ ] Export/import works on Chrome, Edge
- [ ] ZIP fallback works on Firefox, Safari
- [ ] No console errors
- [ ] Bundle size reduced (3D removed)

---

## Development Tips

### Common Patterns

**Zustand Action Pattern**:
```typescript
// Always update state immutably
updateSomething: (updates) => set((state) => ({
  something: { ...state.something, ...updates }
}))
```

**Konva Rendering**:
```typescript
// Convert meters to pixels
const SCALE = 10;  // 10 pixels per meter
<Rect x={area.x * SCALE} y={area.y * SCALE} />
```

**File System Error Handling**:
```typescript
try {
  await exportProject(project);
} catch (error) {
  if (error.code === 'USER_CANCELLED') return;
  showErrorToast(error.message);
}
```

### Performance Optimization

- **Memoize subdivision scenarios**: Cache by land dimensions
- **Debounce recalculations**: Wait 300ms after cost input changes
- **Lazy load components**: Use `React.lazy()` for heavy components
- **Web Workers**: Consider for subdivision calculation if >2 seconds

### Debugging

```typescript
// Enable Zustand devtools
import { devtools } from 'zustand/middleware';

export const useFloorplanStore = create<FloorplanStore>()(
  devtools(
    temporal(/* ... */),
    { name: 'FloorplanStore' }
  )
);
```

---

## Testing Checklist

### User Story Validation

- [ ] **US1**: Land configuration saves correctly
- [ ] **US2**: 21 subdivision scenarios generated within 2 seconds
- [ ] **US3**: Amenities selectable with costs displayed
- [ ] **US4**: Financial analysis updates in real-time
- [ ] **US5**: AI description generates with all details
- [ ] **US6**: Images attach to land parcel and lots
- [ ] **US7**: Export creates valid directory structure
- [ ] **US8**: Import restores 100% project data

### Success Criteria Validation

- [ ] **SC-002**: Subdivision generation < 2 seconds
- [ ] **SC-005**: Financial updates < 1 second
- [ ] **SC-006**: Export < 10 seconds
- [ ] **SC-009**: Full project setup < 20 minutes
- [ ] **SC-011**: All calculations to 2 decimal places

---

## Deployment

### Build Production Bundle

```bash
npm run build
```

Expected bundle size reduction: **30-50%** (Babylon.js removed)

### Environment Variables

No environment variables needed (client-side only).

### Browser Compatibility

- **Chrome 86+**: Full support (File System Access API)
- **Edge 86+**: Full support
- **Firefox 131+**: Partial (ZIP fallback)
- **Safari 17+**: ZIP fallback only

---

## Troubleshooting

### Issue: Subdivision calculation slow

**Solution**: Implement memoization cache

```typescript
const cache = new Map<string, SubdivisionScenario[]>();
const key = `${land.width}x${land.height}`;
if (cache.has(key)) return cache.get(key)!;
```

### Issue: Export fails on Firefox

**Solution**: Check if File System Access API available, use ZIP fallback

```typescript
if (!('showDirectoryPicker' in window)) {
  return exportProjectAsZip(project);
}
```

### Issue: Images not loading after import

**Solution**: Verify image paths, check IndexedDB storage

```typescript
// Debug: List all IndexedDB keys
import { keys } from 'idb-keyval';
const allKeys = await keys();
console.log('IndexedDB keys:', allKeys);
```

---

## Next Steps After Implementation

1. **User Testing**: Conduct usability tests with real estate developers
2. **Performance Profiling**: Use Chrome DevTools to optimize hotspots
3. **Documentation**: Update README with new features
4. **Marketing Materials**: Generate screenshots for product page

---

## Resources

- **Feature Spec**: `specs/001-micro-villas-investment/spec.md`
- **Research**: `specs/001-micro-villas-investment/research.md`
- **Data Model**: `specs/001-micro-villas-investment/data-model.md`
- **Plan**: `specs/001-micro-villas-investment/plan.md`
- **Codebase**: `D:\potontos\Floorplan-assembly\`

---

**Ready to Start?** Begin with Phase 0 (Babylon.js removal) and proceed sequentially through the phases.

**Questions?** Review the research document for technical details on each component.
