# Implementation Plan: Micro Villas Investment Platform

**Branch**: `001-micro-villas-investment` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-micro-villas-investment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Transform the existing floor plan design tool into a comprehensive investment and budgeting platform for Micro Villas projects in Dominican Republic. This feature enables developers to: (1) configure land parcels with acquisition costs, (2) automatically calculate subdivision scenarios with centralized social club areas (10-30% of land), (3) design social club amenities, (4) perform complete financial analysis with multiple profit margin scenarios, (5) export/import projects to disk, and (6) generate AI-ready project descriptions for marketing.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)
**Primary Dependencies**: React 19.2, Zustand 5.0.9 (state management), Konva.js/react-konva (2D rendering), Babylon.js 8.43 (3D rendering - to be removed), idb-keyval 6.2.2 (IndexedDB storage)
**Storage**: Browser IndexedDB (via idb-keyval) for local project persistence, File System Access API for export/import to disk
**Testing**: Manual validation and integration testing for Feature 001; Vitest unit testing framework to be established in future iterations per constitution
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Single-page web application (SPA)
**Performance Goals**: Real-time calculations (<1 second for financial analysis updates), subdivision generation within 2 seconds, UI interactions <100ms response
**Constraints**: Client-side only (no backend), all data processing in browser, maintain <100ms UI responsiveness per constitution, support 21 subdivision scenarios without performance degradation
**Scale/Scope**: Single-user desktop/web tool, projects up to 50,000 sqm land parcels, 8 priority levels (P1-P3) across 8 user stories, ~20 new components for investment features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Measurement Accuracy First ✅ PASS

**Assessment**: This feature maintains measurement accuracy as a core requirement. All land dimensions, subdivision calculations, and lot sizing use precise metric measurements (square meters). Financial calculations derive from accurate area measurements.

**Evidence from spec**:
- FR-001/FR-002: Land dimensions in sqm/sqft with automatic conversion
- FR-018: Minimum lot size of 90 sqm enforced
- FR-037: Cost per square meter calculations
- SC-011: All calculations maintain accuracy to 2 decimal places

**Action**: Continue to ensure subdivision algorithms preserve sub-centimeter precision internally.

### Principle II: Single Source of Truth for Visual Representation ✅ PASS

**Assessment**: Constitution updated (v1.1.0, 2026-01-09) to reflect 2D-only architecture. Principle II now focuses on maintaining consistency across all visual representations (2D canvas, exports, etc.) rather than 2D-3D synchronization.

**Evidence from spec**:
- FR-020: Display subdivision scenarios as 2D top-down schematic diagrams (no 3D visualization)
- Out of Scope: "3D visualization or rendering of subdivisions (existing 3D code should be removed)"
- Clarification Q1: "2D top-down schematic diagram with labeled rectangles (retain existing visualization approach)"

**Action**: This feature will REMOVE the existing 3D Babylon.js rendering system for subdivisions. The Area-centric architecture remains but only with 2D visualization. The Babylon.js dependency will be phased out for investment features.

**Constitution Status**: Principle II amended to remove 3D requirements and document this architectural change. No deviation tracking required.

### Principle III: Performance Over Fidelity ✅ PASS

**Assessment**: Performance requirements align with constitution mandates.

**Evidence from spec**:
- SC-002: Generate 21 subdivision scenarios within 2 seconds
- SC-005: Financial calculations update in real-time (under 1 second)
- SC-008: AI description generation under 3 seconds
- Performance Goals: UI interactions <100ms response (constitution requirement)

**Action**: Ensure subdivision calculation algorithms are optimized for real-time generation.

### Principle IV: Area-Centric Architecture ✅ PASS WITH EXTENSION

**Assessment**: This feature extends the Area concept to represent Micro Villa lots and social club areas. The architecture remains area-centric.

**Evidence from spec**:
- Key Entities: "Micro Villa Lot" as subdivided areas with dimensions, ownership percentages
- Key Entities: "Social Club" as centralized area with dimensions and position
- FR-015: Each Micro Villa's proportional common area percentage calculated

**Action**: Extend the existing `Area` type to support new investment-specific properties (lot number, common area percentage, ownership data).

### Principle V: Import Flexibility with Explicit Dimensions ✅ PASS

**Assessment**: Image management requires explicit association with lots/land parcels, though dimensions are derived from land configuration rather than image content.

**Evidence from spec**:
- FR-050-057: Image management with file paths (no automatic scaling)
- FR-052: Store only local file paths (not image data)
- Images are documentation/context, not measurement sources

**Action**: Ensure image import dialogs clearly indicate images are for reference only.

### Overall Constitution Compliance: PASS

**Summary**:
- All 5 principles fully supported after constitution v1.1.0 amendment (2026-01-09)
- Principle II updated to reflect 2D-only architecture
- No violations or deviations requiring complexity tracking
- Testing strategy: Manual validation for Feature 001; automated testing framework (Vitest) deferred to future iterations

---

## Constitution Re-Evaluation (Post Phase 1 Design)

**Date**: 2026-01-09
**Phase**: After data model, contracts, and quickstart generation

### Updated Assessment

**Principle I: Measurement Accuracy First** ✅ **CONFIRMED PASS**

- Data model defines all dimensions in meters with validation
- Subdivision algorithm uses 0.1m precision (10cm)
- Financial calculations to 2 decimal places (FR requirement + constitution)
- Validation functions enforce min/max constraints

**Principle II: Single Source of Truth for Visual Representation** ✅ **CONFIRMED PASS**

- Constitution amended (v1.1.0) to reflect 2D-only architecture
- 3D Babylon.js removal plan documented in `research.md`
- Architecture now 2D-only with Konva.js maintaining single source of truth
- Quickstart guide provides complete removal steps

**Principle III: Performance Over Fidelity** ✅ **CONFIRMED PASS**

- Subdivision algorithm designed for <2 seconds (21 scenarios)
- Financial calculations optimized for <1 second real-time updates
- Memoization cache strategy documented in `research.md`
- UI responsiveness maintained at <100ms per constitution

**Principle IV: Area-Centric Architecture** ✅ **CONFIRMED PASS WITH EXTENSION**

- `MicroVillaLot` extends Area concept
- `SubdivisionScenario` contains array of lots (Area-like entities)
- Conversion function `microVillaLotToArea()` documented in `data-model.md`
- Architecture remains centered on spatial regions

**Principle V: Import Flexibility with Explicit Dimensions** ✅ **CONFIRMED PASS**

- Image import stores file paths only (not embedded)
- Land dimensions explicitly input by user
- Lot dimensions calculated from explicit land configuration
- No automatic scaling or dimension guessing

### Testing Framework Status

**Action Taken**: Research completed, Vitest setup documented in `research.md` section 3
**Next Step**: Implementation during Phase 2 (as per quickstart guide Day 1)

### Final Compliance Status

**Grade**: PASS

All principles pass after constitution v1.1.0 amendment (2026-01-09) updated Principle II to reflect 2D-only architecture. No deviations or complexity tracking needed. Ready to proceed to Phase 2 (task generation).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Current Structure** (existing floorplan tool):

```text
src/
├── models/
│   └── types.ts                    # Core data types (Area, Asset, Project, Lot)
├── components/
│   ├── canvas/                     # 2D Konva rendering components
│   ├── viewer/                     # 3D Babylon.js components (TO BE REMOVED)
│   ├── dialogs/                    # Modal dialogs
│   ├── panels/                     # Side panel components
│   └── ui/                         # Shared UI components
├── store/
│   ├── index.ts                    # Zustand store setup with Zundo middleware
│   ├── selectors.ts                # Reusable selectors
│   └── slices/                     # State slices (areas, assets, project, viewer)
├── lib/
│   ├── coordinates.ts              # Coordinate conversion utilities
│   ├── geometry.ts                 # Geometric calculations
│   ├── storage.ts                  # IndexedDB persistence (idb-keyval)
│   └── generateAIDescription.ts    # AI description generation
└── main.tsx                        # React entry point
```

**New Structure** (additions for investment features):

```text
src/
├── models/
│   └── types.ts                    # EXTEND: Add MicroVilla, SubdivisionScenario, SocialClub, FinancialAnalysis types
├── components/
│   ├── investment/                 # NEW: Investment-specific components
│   │   ├── LandConfigPanel.tsx     # Land parcel configuration (FR-001 to FR-007)
│   │   ├── SubdivisionViewer.tsx   # 2D subdivision scenarios display (FR-020)
│   │   ├── ScenarioList.tsx        # List of 21 subdivision scenarios
│   │   ├── SocialClubDesigner.tsx  # Amenities catalog and selection (FR-026 to FR-032)
│   │   ├── FinancialAnalysis.tsx   # Cost inputs and calculations (FR-033 to FR-046)
│   │   ├── PricingScenarios.tsx    # Profit margin scenarios display
│   │   └── ExportImport.tsx        # Project export/import controls (FR-058 to FR-073)
│   └── viewer/                     # MODIFY: Remove 3D components for subdivisions
├── store/
│   └── slices/
│       ├── landSlice.ts            # NEW: Land parcel state
│       ├── subdivisionSlice.ts     # NEW: Subdivision scenarios state
│       ├── socialClubSlice.ts      # NEW: Social club design state
│       └── financialSlice.ts       # NEW: Financial analysis state
├── lib/
│   ├── subdivision.ts              # NEW: Subdivision calculation algorithms
│   ├── financial.ts                # NEW: Financial calculations (cost/sqm, profit margins)
│   ├── export.ts                   # NEW: Project export to disk (File System Access API)
│   └── import.ts                   # NEW: Project import from disk
└── data/
    ├── provinces.ts                # NEW: Dominican Republic provinces list
    └── amenities.ts                # NEW: Amenities catalog with default costs
```

**Structure Decision**: Single-page web application (Option 1) with feature-based organization. Investment features organized under `src/components/investment/` and new state slices in `src/store/slices/`. Subdivision and financial logic isolated in dedicated utility modules (`src/lib/subdivision.ts`, `src/lib/financial.ts`). 3D viewer components will be removed as per spec requirements.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations requiring justification. Constitution check passed with intentional deviation (removal of 3D features) which aligns with spec requirements.
