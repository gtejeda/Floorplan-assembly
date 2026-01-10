# Data Model: Micro Villas Investment Platform

**Date**: 2026-01-09
**Branch**: 001-micro-villas-investment
**Input**: Feature spec entity definitions + research findings

---

## Overview

This document defines the TypeScript data model for the Micro Villas Investment Platform. All entities extend or integrate with the existing floorplan architecture (Area-centric model) while adding investment-specific properties.

---

## Core Investment Entities

### 1. LandParcel

Represents the main investment property being subdivided into Micro Villa lots.

```typescript
/**
 * Land Parcel - Main investment property
 * Extends the existing Lot interface with investment-specific properties
 */
export interface LandParcel {
  // Dimensions (meters)
  width: number;          // 0.001 - 50,000 (supports up to 50,000 sqm per spec SC-010)
  height: number;         // 0.001 - 50,000
  totalArea: number;      // Calculated: width × height (sqm)

  // Location (Dominican Republic specific)
  province: DominicanProvince;  // One of 31 provinces
  landmarks: string[];           // Nearby attractions (beaches, airports, etc.)

  // Acquisition details
  acquisitionCost: number;       // Cost in selected currency
  acquisitionCurrency: Currency; // 'USD' | 'DOP'
  acquisitionDate?: string;      // ISO date string

  // Urbanization status
  isUrbanized: boolean;  // true = utilities available, false = raw land

  // Display preferences
  unit: DisplayUnit;  // 'meters' | 'feet' for user display

  // Images
  images: ImageReference[];  // Reference images for the land parcel
}

/**
 * Image reference stored as file path (not blob)
 * Per spec FR-052: Store only local file paths in browser storage
 */
export interface ImageReference {
  id: string;
  originalFilename: string;
  localPath: string;      // File path on user's disk
  mimeType: string;       // 'image/jpeg', 'image/png', 'image/webp'
  uploadedAt: string;     // ISO date string
}

/**
 * Dominican Republic provinces (31 total)
 */
export type DominicanProvince =
  | 'Azua' | 'Baoruco' | 'Barahona' | 'Dajabón' | 'Duarte'
  | 'El Seibo' | 'Elías Piña' | 'Espaillat' | 'Hato Mayor'
  | 'Hermanas Mirabal' | 'Independencia' | 'La Altagracia'
  | 'La Romana' | 'La Vega' | 'María Trinidad Sánchez'
  | 'Monseñor Nouel' | 'Monte Cristi' | 'Monte Plata'
  | 'Pedernales' | 'Peravia' | 'Puerto Plata' | 'Samaná'
  | 'San Cristóbal' | 'San José de Ocoa' | 'San Juan'
  | 'San Pedro de Macorís' | 'Sánchez Ramírez' | 'Santiago'
  | 'Santiago Rodríguez' | 'Santo Domingo' | 'Valverde'
  | 'Distrito Nacional';

export type Currency = 'USD' | 'DOP';
export type DisplayUnit = 'meters' | 'feet';
```

---

### 2. SubdivisionScenario

Represents one possible way to divide the land with a specific social club percentage.

```typescript
/**
 * Subdivision Scenario - One configuration showing how land can be divided
 * Per spec FR-008: Generate 21 scenarios (10-30% in 1% increments)
 */
export interface SubdivisionScenario {
  id: string;  // Unique identifier

  // Social club configuration
  socialClubPercentage: number;  // 10-30 (1% increments)
  socialClub: SocialClubLayout;

  // Micro Villa lots
  lots: MicroVillaLot[];
  totalLots: number;  // Calculated: lots.length

  // Metrics
  averageLotSize: number;  // sqm (calculated)
  efficiency: number;      // Percentage of usable land (0-100)

  // Status
  isSelected: boolean;  // true if this is the active scenario
  isViable: boolean;    // false if any lot < 90 sqm (per FR-018, FR-019)

  // Timestamps
  createdAt: string;  // ISO date string
}

/**
 * Social Club Layout - Centralized amenities area
 * Per spec FR-013: Must be positioned in the center
 */
export interface SocialClubLayout {
  // Dimensions (meters)
  width: number;
  height: number;
  area: number;  // Calculated: width × height

  // Position (centered on land parcel)
  x: number;  // Offset from left edge
  y: number;  // Offset from top edge

  // Design
  selectedAmenities: string[];  // Array of amenity IDs
  storageType: StorageType;     // 'dedicated' | 'patio'

  // Calculated costs
  totalCost: number;  // Sum of all selected amenity costs
}

export type StorageType = 'dedicated' | 'patio';
// 'dedicated' = storage area in social club (FR-028)
// 'patio' = individual patio storage per Micro Villa
```

---

### 3. MicroVillaLot

Represents an individual subdivided lot that will be sold to an investor.

```typescript
/**
 * Micro Villa Lot - Individual investment unit
 * Per spec: Minimum 90 sqm including common area percentage (FR-018)
 */
export interface MicroVillaLot {
  id: string;
  lotNumber: number;  // Sequential number for identification

  // Dimensions (meters)
  x: number;      // Position on land parcel
  y: number;
  width: number;
  height: number;
  area: number;   // Calculated: width × height (sqm)

  // Ownership
  commonAreaPercentage: number;  // 0-100 (proportional to lot size)

  // Images
  images: ImageReference[];  // Lot-specific images (per FR-051)

  // Derived from subdivision quadrant
  quadrant: 'north' | 'south' | 'east' | 'west';

  // Metadata
  isValid: boolean;  // false if area < 90 sqm
  color?: string;    // Optional display color
}
```

---

### 4. Amenity

Represents a social club feature that can be selected and costed.

```typescript
/**
 * Amenity - Social club feature with cost
 * Per spec FR-026: Comprehensive catalog of amenities
 */
export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  description: string;

  // Costs
  defaultCostUSD: number;  // Recommended default from research (FR-031)
  customCost?: number;     // User-overridden cost (FR-032)
  unit: string;            // 'unit', 'set', 'per 100 sqm', etc.

  // Metadata
  imageUrl?: string;  // Optional reference image
  spaceRequirement?: number;  // Optional sqm requirement
}

export type AmenityCategory =
  | 'aquatic'      // Pools, jacuzzis, water features
  | 'dining'       // BBQ, outdoor kitchens, pavilions
  | 'recreation'   // Sports courts, playgrounds, game areas
  | 'furniture'    // Chairs, tables, umbrellas, cabanas
  | 'utilities';   // Bathrooms, storage, landscaping, parking

/**
 * Helper to get actual cost (custom or default)
 */
export function getAmenityCost(amenity: Amenity): number {
  return amenity.customCost ?? amenity.defaultCostUSD;
}
```

---

### 5. FinancialAnalysis

Comprehensive cost breakdown and pricing scenarios for the investment.

```typescript
/**
 * Financial Analysis - Complete investment calculation
 * Per spec FR-033 to FR-046
 */
export interface FinancialAnalysis {
  // Input costs
  landCost: number;           // Land acquisition cost (FR-033)
  amenitiesCost: number;      // Sum of selected amenity costs
  legalCosts: number;         // Notary, permits, registrations (FR-034)
  otherCosts: OtherCost[];    // Infrastructure, utilities, etc. (FR-035)

  // Calculated totals
  totalProjectCost: number;   // Sum of all above (FR-036)
  costPerSqm: number;         // Total cost / total land area (FR-037)
  baseCostPerLot: number;     // (Total - social club) / lot count (FR-038)

  // Pricing scenarios
  pricingScenarios: PricingScenario[];  // Multiple profit margins

  // Maintenance
  monthlyMaintenancePerOwner: number;  // Based on common area % (FR-043)

  // Currency
  currency: Currency;         // 'USD' | 'DOP'
  exchangeRate?: number;      // DOP per USD (if displaying both)

  // Timestamps
  calculatedAt: string;       // ISO date string
  lastUpdatedAt: string;
}

/**
 * Other project costs with custom labels
 * Per spec FR-035: Allow custom cost categories
 */
export interface OtherCost {
  id: string;
  label: string;      // e.g., "Infrastructure", "Marketing", "Legal fees"
  amount: number;
  category?: string;  // Optional grouping
}

/**
 * Pricing Scenario - One profit margin calculation
 * Per spec FR-039 to FR-042
 */
export interface PricingScenario {
  profitMarginPercentage: number;  // 15, 20, 25, 30, 40, etc.

  // Calculated values
  lotSalePrice: number;       // Base cost × (1 + margin %) (FR-040)
  totalRevenue: number;       // Lot price × total lots (FR-041)
  totalProfit: number;        // Revenue - total project cost (FR-042)
  profitPerLot: number;       // Profit / lot count

  // ROI
  returnOnInvestment: number; // (Profit / total cost) × 100
}
```

---

### 6. InvestmentProject

The root container for the complete investment analysis (extends existing Project).

```typescript
/**
 * Investment Project - Complete Micro Villas investment package
 * Extends the existing Project interface with investment-specific data
 */
export interface InvestmentProject {
  // Base project metadata (from existing Project type)
  id: string;
  name: string;
  version: string;      // e.g., "1.0.0"
  created: string;      // ISO date string
  modified: string;     // ISO date string

  // Investment-specific data
  landParcel: LandParcel;

  // Subdivision data
  subdivisionScenarios: SubdivisionScenario[];  // All 21 scenarios
  selectedScenarioId: string | null;            // ID of active scenario

  // Social club design
  socialClub: {
    selectedAmenities: string[];  // Array of Amenity IDs
    storageType: StorageType;
    customAmenityCosts: Record<string, number>;  // Amenity ID → custom cost
  };

  // Financial data
  financialAnalysis: FinancialAnalysis;
  targetProfitMargins: number[];  // e.g., [15, 20, 25, 30] (user-defined)

  // AI description (for rendering)
  aiDescription?: string;  // Generated description (FR-047, FR-048)

  // Export/import metadata
  exportPath?: string;     // Last export directory path
  lastExportDate?: string; // ISO date string
}
```

---

## Supporting Types

### Province Landmark Data

```typescript
/**
 * Province Landmark - Tourist attraction data for provinces
 * Used for displaying context and nearby attractions
 */
export interface ProvinceLandmark {
  province: DominicanProvince;
  capital?: string;
  airports: Airport[];
  beaches: string[];
  attractions: string[];
  description: string;
}

export interface Airport {
  name: string;
  code: string;  // IATA code (e.g., 'PUJ', 'SDQ')
}
```

---

## Validation Rules

### LandParcel Validation

```typescript
/**
 * Validate land parcel dimensions
 */
export function validateLandParcel(land: LandParcel): ValidationResult {
  const errors: string[] = [];

  // Dimension constraints (spec SC-010)
  if (land.width < 0.001 || land.width > 50000) {
    errors.push('Width must be between 0.001m and 50,000m');
  }
  if (land.height < 0.001 || land.height > 50000) {
    errors.push('Height must be between 0.001m and 50,000m');
  }

  // Total area minimum (must support at least 1 lot + social club)
  if (land.totalArea < 100) {  // Minimum: 90 sqm lot + 10 sqm social club
    errors.push('Total area too small for viable subdivision');
  }

  // Acquisition cost
  if (land.acquisitionCost <= 0) {
    errors.push('Acquisition cost must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

### MicroVillaLot Validation

```typescript
/**
 * Validate Micro Villa lot meets minimum requirements
 * Per spec FR-018: Minimum 90 sqm
 */
export function validateMicroVillaLot(lot: MicroVillaLot): boolean {
  return lot.area >= 90;  // sqm
}
```

### SubdivisionScenario Validation

```typescript
/**
 * Validate subdivision scenario is viable
 * Per spec FR-019: Filter out scenarios with lots < 90 sqm
 */
export function validateSubdivisionScenario(
  scenario: SubdivisionScenario
): boolean {
  // Check all lots meet minimum size
  const allLotsValid = scenario.lots.every(lot => lot.area >= 90);

  // Check social club percentage in range
  const validPercentage =
    scenario.socialClubPercentage >= 10 &&
    scenario.socialClubPercentage <= 30;

  // Check at least 1 lot exists
  const hasLots = scenario.lots.length > 0;

  return allLotsValid && validPercentage && hasLots;
}
```

---

## Calculated Properties

### Common Area Percentage Calculation

```typescript
/**
 * Calculate common area ownership percentage for each lot
 * Per spec FR-015: Proportional to lot size relative to total
 */
export function calculateCommonAreaPercentages(
  lots: MicroVillaLot[]
): void {
  const totalLotArea = lots.reduce((sum, lot) => sum + lot.area, 0);

  lots.forEach(lot => {
    lot.commonAreaPercentage = (lot.area / totalLotArea) * 100;
  });
}
```

### Financial Calculations

```typescript
/**
 * Calculate complete financial analysis
 * Per spec FR-036 to FR-042
 */
export function calculateFinancialAnalysis(
  project: InvestmentProject
): FinancialAnalysis {
  const scenario = getSelectedScenario(project);
  if (!scenario) {
    throw new Error('No subdivision scenario selected');
  }

  // Total project cost (FR-036)
  const totalProjectCost =
    project.landParcel.acquisitionCost +
    project.financialAnalysis.amenitiesCost +
    project.financialAnalysis.legalCosts +
    project.financialAnalysis.otherCosts.reduce((sum, c) => sum + c.amount, 0);

  // Cost per sqm (FR-037)
  const costPerSqm = totalProjectCost / project.landParcel.totalArea;

  // Base cost per lot (FR-038)
  const baseCostPerLot =
    (totalProjectCost - scenario.socialClub.totalCost) / scenario.totalLots;

  // Generate pricing scenarios (FR-039 to FR-042)
  const pricingScenarios = project.targetProfitMargins.map(margin => {
    const lotSalePrice = baseCostPerLot * (1 + margin / 100);
    const totalRevenue = lotSalePrice * scenario.totalLots;
    const totalProfit = totalRevenue - totalProjectCost;
    const profitPerLot = totalProfit / scenario.totalLots;
    const returnOnInvestment = (totalProfit / totalProjectCost) * 100;

    return {
      profitMarginPercentage: margin,
      lotSalePrice,
      totalRevenue,
      totalProfit,
      profitPerLot,
      returnOnInvestment,
    };
  });

  return {
    landCost: project.landParcel.acquisitionCost,
    amenitiesCost: project.financialAnalysis.amenitiesCost,
    legalCosts: project.financialAnalysis.legalCosts,
    otherCosts: project.financialAnalysis.otherCosts,
    totalProjectCost,
    costPerSqm,
    baseCostPerLot,
    pricingScenarios,
    monthlyMaintenancePerOwner: 0,  // TODO: Calculate based on requirements
    currency: project.financialAnalysis.currency,
    exchangeRate: project.financialAnalysis.exchangeRate,
    calculatedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

function getSelectedScenario(
  project: InvestmentProject
): SubdivisionScenario | null {
  return (
    project.subdivisionScenarios.find(
      s => s.id === project.selectedScenarioId
    ) || null
  );
}
```

---

## Integration with Existing Model

### Relationship to Existing `Area` Type

The `MicroVillaLot` can optionally be represented as an `Area` in the 2D canvas for visualization:

```typescript
/**
 * Convert MicroVillaLot to Area for 2D rendering
 */
export function microVillaLotToArea(lot: MicroVillaLot): Area {
  return {
    id: lot.id,
    name: `Lot ${lot.lotNumber}`,
    type: 'custom',  // or introduce new 'lot' type

    // Position and dimensions
    x: lot.x,
    y: lot.y,
    width: lot.width,
    height: lot.height,

    // Visual properties
    color: lot.color || '#4A90D9',
    opacity: 0.7,
    elevation: 0,  // Flat lots
    baseHeight: 0,
    rotation: 0,

    // Metadata
    description: `Common area: ${lot.commonAreaPercentage.toFixed(2)}%`,
    locked: false,
    visible: true,
    zIndex: 0,

    // Assets (images)
    assets: lot.images.map(img => imageReferenceToAsset(img)),
  };
}

function imageReferenceToAsset(img: ImageReference): Asset {
  // Convert ImageReference to Asset type
  // Implementation details in asset management
}
```

---

## Default Values

```typescript
/**
 * Default values for new investment projects
 */
export const DEFAULT_LAND_PARCEL: Partial<LandParcel> = {
  width: 50,
  height: 30,
  totalArea: 1500,
  province: 'La Altagracia',  // Punta Cana region (most popular)
  landmarks: [],
  isUrbanized: false,
  unit: 'meters',
  images: [],
  acquisitionCurrency: 'USD',
};

export const DEFAULT_SOCIAL_CLUB_PERCENTAGE = 20;  // Per spec FR-009

export const DEFAULT_TARGET_PROFIT_MARGINS = [15, 20, 25, 30];  // Per spec FR-039

export const DEFAULT_STORAGE_TYPE: StorageType = 'dedicated';
```

---

## State Management Implications

### Zustand Store Slices

Based on this data model, the following store slices should be created:

1. **landSlice** - Manages `LandParcel` state
2. **subdivisionSlice** - Manages `SubdivisionScenario[]` and selection
3. **socialClubSlice** - Manages amenity selection and costs
4. **financialSlice** - Manages `FinancialAnalysis` and calculations

Each slice will follow the existing Zustand + Zundo (undo/redo) pattern.

---

## Summary

This data model provides:

- **8 core entities**: LandParcel, SubdivisionScenario, MicroVillaLot, SocialClubLayout, Amenity, FinancialAnalysis, InvestmentProject, ProvinceLandmark
- **Validation functions** for all constraints from the spec
- **Calculation functions** for derived values (common area %, financial metrics)
- **Integration points** with existing Area/Asset architecture
- **Type safety** with TypeScript strict mode compliance

All entities map directly to functional requirements (FR-001 through FR-073) and support the 8 user stories defined in the feature specification.

**Next Step**: Generate API contracts (if applicable) and quickstart guide.
