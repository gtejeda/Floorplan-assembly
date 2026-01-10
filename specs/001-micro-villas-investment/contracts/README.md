# API Contracts

**Project**: Micro Villas Investment Platform
**Architecture**: Client-side only (no backend API)

---

## Overview

This feature is a **client-side application** with no backend API. All data processing, calculations, and storage occur in the browser using:

- **State Management**: Zustand (in-memory)
- **Persistence**: IndexedDB via idb-keyval (local browser storage)
- **Export/Import**: File System Access API or ZIP files (direct to disk)

---

## No API Contracts Required

Since there are no HTTP endpoints, REST APIs, GraphQL schemas, or backend services, traditional API contracts (OpenAPI, GraphQL schema) are not applicable.

---

## Internal Contracts (TypeScript Interfaces)

Instead of external API contracts, this project uses **TypeScript interfaces** as the contract between:

1. **Components ↔ Zustand Store**
2. **Utility Functions ↔ Data Models**
3. **Export/Import ↔ File System**

All contracts are defined in:
- **`src/models/types.ts`** - Core data types (existing)
- **Investment types** (new, to be added):
  - `LandParcel`
  - `SubdivisionScenario`
  - `MicroVillaLot`
  - `SocialClub`
  - `Amenity`
  - `FinancialAnalysis`
  - `InvestmentProject`

See `../data-model.md` for complete type definitions.

---

## Data Flow Contracts

### 1. Subdivision Calculation Contract

**Input Contract**:
```typescript
interface SubdivisionInput {
  land: { width: number; height: number };
  socialClubPercentage: number;  // 10-30
}
```

**Output Contract**:
```typescript
interface SubdivisionOutput {
  socialClub: { width: number; height: number; x: number; y: number };
  lots: MicroVillaLot[];
  totalLots: number;
  averageLotSize: number;
  efficiency: number;
}
```

**Implementation**: `src/lib/subdivision.ts`

---

### 2. Financial Calculation Contract

**Input Contract**:
```typescript
interface FinancialInput {
  landCost: number;
  amenitiesCost: number;
  legalCosts: number;
  otherCosts: OtherCost[];
  totalLots: number;
  targetProfitMargins: number[];
}
```

**Output Contract**:
```typescript
interface FinancialOutput {
  totalProjectCost: number;
  costPerSqm: number;
  baseCostPerLot: number;
  pricingScenarios: PricingScenario[];
}
```

**Implementation**: `src/lib/financial.ts`

---

### 3. Export Contract (File System)

**Input Contract**:
```typescript
interface ExportInput {
  project: InvestmentProject;
  targetDirectory: FileSystemDirectoryHandle;
}
```

**Output Contract** (File Structure):
```
{projectName}/
├── project.json              // Complete project data
└── assets/
    ├── land-parcel/
    │   ├── image1.jpg
    │   └── image2.png
    └── lots/
        ├── lot-1/
        │   └── image1.jpg
        └── lot-2/
            └── image1.jpg
```

**JSON Schema** (project.json):
```json
{
  "version": "1.0.0",
  "project": {
    "id": "string",
    "name": "string",
    "created": "ISO8601",
    "modified": "ISO8601"
  },
  "landParcel": { /* LandParcel */ },
  "subdivisionScenarios": [ /* SubdivisionScenario[] */ ],
  "selectedScenarioId": "string | null",
  "socialClub": { /* SocialClubConfig */ },
  "financialAnalysis": { /* FinancialAnalysis */ }
}
```

**Implementation**: `src/lib/export.ts`

---

### 4. Import Contract (File System)

**Input Contract**:
```typescript
interface ImportInput {
  sourceDirectory: FileSystemDirectoryHandle;
}
```

**Output Contract**:
```typescript
interface ImportOutput {
  project: InvestmentProject;
  warnings: string[];  // e.g., missing images
}
```

**Validation Rules**:
- `project.json` must exist
- JSON must match schema version 1.0.0
- All required fields must be present
- Missing images generate warnings (not errors)

**Implementation**: `src/lib/import.ts`

---

## Event Contracts (Zustand Actions)

### Land Slice Events

```typescript
interface LandSliceActions {
  // Update land parcel configuration
  updateLandParcel(updates: Partial<LandParcel>): void;

  // Add/remove images
  addLandImage(image: ImageReference): void;
  removeLandImage(imageId: string): void;
}
```

### Subdivision Slice Events

```typescript
interface SubdivisionSliceActions {
  // Generate all 21 scenarios
  generateScenarios(land: LandParcel): void;

  // Select active scenario
  selectScenario(scenarioId: string): void;

  // Manual adjustment
  adjustSocialClubPercentage(percentage: number): void;
}
```

### Social Club Slice Events

```typescript
interface SocialClubSliceActions {
  // Amenity selection
  toggleAmenity(amenityId: string): void;
  setCustomAmenityCost(amenityId: string, cost: number): void;
  clearCustomAmenityCost(amenityId: string): void;

  // Storage configuration
  setStorageType(type: StorageType): void;
}
```

### Financial Slice Events

```typescript
interface FinancialSliceActions {
  // Cost inputs
  setLandCost(cost: number, currency: Currency): void;
  addOtherCost(cost: OtherCost): void;
  removeOtherCost(costId: string): void;
  updateOtherCost(costId: string, updates: Partial<OtherCost>): void;

  // Profit margins
  setTargetProfitMargins(margins: number[]): void;

  // Recalculate (triggered automatically on data changes)
  recalculate(): void;
}
```

---

## Storage Contracts (IndexedDB)

### Key-Value Schema

Using `idb-keyval` library:

```typescript
// Project list (all saved projects)
Key: 'micro-villas-projects'
Value: { id: string; name: string; modified: string }[]

// Active project data
Key: 'micro-villas-project:{projectId}'
Value: InvestmentProject

// Asset blobs (images)
Key: 'asset-blob:{projectId}:{assetId}'
Value: Blob
```

---

## Validation Contracts

### Input Validation Rules

All user inputs validated before state updates:

```typescript
// Land dimensions
width: number (0.001 - 50,000)
height: number (0.001 - 50,000)

// Social club percentage
socialClubPercentage: number (10 - 30, integers only)

// Costs
acquisitionCost: number (> 0)
amenityCost: number (≥ 0)

// Profit margins
profitMargin: number (> 0, typically 5-100)
```

**Validation Functions**: `src/lib/validation.ts` (to be created)

---

## Summary

This client-side application uses:

- **TypeScript interfaces** as contracts (not REST/GraphQL)
- **Zustand actions** for event contracts
- **File System Access API** for export/import contracts
- **IndexedDB** for storage contracts
- **Validation functions** for data integrity

All contracts are type-safe, compile-time verified, and documented in `data-model.md`.

**No external API contracts needed** - everything runs in the browser.
