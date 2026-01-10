# Tasks: Micro Villas Investment Platform

**Input**: Design documents from `/specs/001-micro-villas-investment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT explicitly requested in the specification, so this task list focuses on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Preparation

**Purpose**: Project initialization, cleanup, and infrastructure setup

- [X] T001 Create backup branch for pre-Babylon.js removal state with `git checkout -b backup/pre-babylon-removal && git push origin backup/pre-babylon-removal`
- [X] T002 [P] Remove 3D Babylon.js components directory at src/components/viewer/
- [X] T003 [P] Remove ViewToggle component at src/components/ui/ViewToggle.tsx
- [X] T004 [P] Uninstall Babylon.js dependencies (@babylonjs/core, @babylonjs/gui, @babylonjs/loaders, react-babylonjs)
- [X] T005 Update ViewMode type to '2d' only and remove Camera3DState interface in src/models/types.ts
- [X] T006 Remove camera3d state and actions from src/store/slices/viewerSlice.ts
- [X] T007 Remove Viewer3D imports, conditional rendering, and Tab key handler from src/App.tsx
- [X] T008 [P] Verify TypeScript compilation and run production build to confirm 30-50% bundle size reduction
- [X] T009 [P] Create investment components directory structure at src/components/investment/
- [X] T010 [P] Create data directory structure at src/data/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model, types, and static data that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 [P] Add DominicanProvince union type with all 31 provinces to src/models/types.ts
- [X] T012 [P] Add Currency ('USD' | 'DOP') and DisplayUnit ('meters' | 'feet') types to src/models/types.ts
- [X] T013 [P] Add ImageReference interface to src/models/types.ts
- [X] T014 [P] Add LandParcel interface to src/models/types.ts
- [X] T015 [P] Add SubdivisionScenario and SocialClubLayout interfaces to src/models/types.ts
- [X] T016 [P] Add MicroVillaLot and StorageType types to src/models/types.ts
- [X] T017 [P] Add Amenity and AmenityCategory types to src/models/types.ts
- [X] T018 [P] Add FinancialAnalysis, OtherCost, and PricingScenario interfaces to src/models/types.ts
- [X] T019 [P] Add InvestmentProject interface extending existing Project type to src/models/types.ts
- [X] T020 [P] Create DOMINICAN_PROVINCES constant array in src/data/provinces.ts
- [X] T021 [P] Create PROVINCE_LANDMARKS data with airports, beaches, and attractions in src/data/provinces.ts
- [X] T022 [P] Create AMENITIES_CATALOG with all 35 amenities across 5 categories in src/data/amenities.ts, including estimated USD default costs based on Dominican Republic market research (costs are editable by users per FR-032)
- [X] T023 [P] Add validation functions (validateLandParcel, validateMicroVillaLot, validateSubdivisionScenario) to src/models/types.ts, including validation that all lot common area percentages sum to 100% within 0.01% tolerance (FR-015)
- [X] T024 [P] Add calculation helpers (calculateCommonAreaPercentages, getAmenityCost) to src/models/types.ts
- [X] T025 Create LandSlice with landParcel state and actions (updateLandParcel, addLandImage, removeLandImage) in src/store/slices/landSlice.ts
- [X] T026 Create SubdivisionSlice with subdivisionScenarios state and actions in src/store/slices/subdivisionSlice.ts
- [X] T027 Create SocialClubSlice with amenity selection state and actions in src/store/slices/socialClubSlice.ts
- [X] T028 Create FinancialSlice with financial analysis state and actions in src/store/slices/financialSlice.ts
- [X] T029 Integrate all 4 new slices into useFloorplanStore in src/store/index.ts
- [X] T030 Update IndexedDB storage schema in src/lib/storage.ts to support InvestmentProject persistence, implement unified auto-save middleware subscribing to all store changes (debounced 500ms) to avoid per-feature save implementations
- [X] T030a [P] Implement app startup data restoration from IndexedDB in App.tsx or main.tsx with useEffect, loading spinner, and error handling (FR-023)
- [X] T030b [P] Add "Clear Project" functionality with confirmation dialog to reset all state and clear IndexedDB, available in header/sidebar (FR-025)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Land Investment Setup (Priority: P1) 🎯 MVP

**Goal**: Enable developers to configure land parcel parameters (dimensions, location, cost, urbanization status, landmarks) and persist the data

**Independent Test**: Enter land dimensions (50m × 30m), select province (La Altagracia), enter acquisition cost ($150,000 USD), mark as urbanized, add landmarks (Bavaro Beach, PUJ Airport), save project, reload application, verify all data persists correctly

### Implementation for User Story 1

- [X] T031 [P] [US1] Create LandConfigPanel component with dimensions input (length/width or total area) in src/components/investment/LandConfigPanel.tsx
- [X] T032 [P] [US1] Add unit conversion controls (sqm ↔ sqft) with automatic conversion logic to LandConfigPanel
- [X] T033 [P] [US1] Add province dropdown populated from DOMINICAN_PROVINCES to LandConfigPanel
- [X] T034 [P] [US1] Add acquisition cost input with currency selector (DOP/USD) to LandConfigPanel
- [X] T035 [P] [US1] Add urbanization status checkbox to LandConfigPanel
- [X] T036 [P] [US1] Add landmarks input with add/remove functionality to LandConfigPanel
- [X] T037 [US1] Verify auto-save functionality works for land parcel changes (uses unified auto-save middleware from T030)
- [X] T037a [P] [US1] Add visual auto-save indicator (toast notification or header badge) displaying "Saved" message with timestamp and fade-out animation (FR-024)
- [X] T038 [US1] Add input validation for land dimensions (0.001-50,000m) with error messages
- [X] T039 [US1] Add validation for acquisition cost (must be > 0) with error messages
- [X] T040 [US1] Integrate LandConfigPanel into App.tsx sidebar

**Checkpoint**: User Story 1 complete - land configuration works independently and persists data

---

## Phase 4: User Story 2 - Automatic Subdivision Calculation (Priority: P1)

**Goal**: Automatically generate 21 subdivision scenarios (10-30% social club) showing all possible lot configurations, allow scenario selection, and display 2D schematic diagrams

**Independent Test**: Configure land parcel (50m × 30m = 1500 sqm), verify system generates scenarios in under 2 seconds, view scenarios ranging from 10-30% social club percentage, select 20% scenario (default), view 2D schematic showing centralized social club and surrounding Micro Villa lots with dimensions labeled, verify all lots are ≥90 sqm

### Implementation for User Story 2

- [X] T041 [P] [US2] Implement calculateSocialClubDimensions function with centered positioning logic in src/lib/subdivision.ts
- [X] T042 [P] [US2] Implement subdivideQuadrant function for grid-based lot generation in src/lib/subdivision.ts
- [X] T043 [US2] Implement calculateGridSubdivision function combining social club calculation and quadrant subdivision in src/lib/subdivision.ts
- [X] T044 [US2] Implement calculateAllScenarios function generating 21 scenarios (10-30% in 1% increments) in src/lib/subdivision.ts
- [X] T045 [US2] Add scenario filtering logic to remove scenarios with lots <90 sqm in src/lib/subdivision.ts
- [X] T046 [US2] Add memoization cache for subdivision scenarios based on land dimensions in src/lib/subdivision.ts
- [X] T047 [US2] Implement common area percentage calculation for each lot in src/lib/subdivision.ts
- [X] T048 [US2] Measure subdivision calculation performance for 21 scenarios; if >2 seconds, optimize using strategies: (1) early exit for non-viable scenarios, (2) reduce redundant calculations, (3) optimize loop structures (SC-002 requirement: <2 seconds) in src/lib/subdivision.ts
- [X] T049 [P] [US2] Create SubdivisionViewer component with Konva Stage/Layer in src/components/investment/SubdivisionViewer.tsx
- [X] T050 [P] [US2] Add land parcel boundary rendering (Rect) to SubdivisionViewer
- [X] T051 [P] [US2] Add social club rectangle rendering (centered, orange fill) to SubdivisionViewer
- [X] T052 [P] [US2] Add Micro Villa lots rendering (grid of blue rectangles with borders) to SubdivisionViewer
- [X] T053 [P] [US2] Add dimension labels (Konva Text) to SubdivisionViewer: lot dimensions in meters (e.g., "10.5m × 12.3m"), lot numbers (e.g., "Lot 1"), social club label ("Social Club"), use 12-14pt readable font, position labels centered within each rectangle, handle overlapping labels with smart positioning (FR-020)
- [X] T054 [P] [US2] Create ScenarioList component showing all 21 scenarios with key metrics in src/components/investment/ScenarioList.tsx
- [X] T055 [US2] Add scenario selection handler updating selectedScenarioId in store to ScenarioList
- [X] T056 [US2] Highlight default scenario (20% social club) and currently selected scenario in ScenarioList
- [X] T057 [US2] Add manual social club percentage adjustment slider (10-30%) to ScenarioList
- [X] T058 [US2] Connect land parcel changes to automatic subdivision regeneration in subdivisionSlice
- [X] T059 [US2] Integrate SubdivisionViewer and ScenarioList into App.tsx main canvas area

**Checkpoint**: User Story 2 complete - subdivision calculation and 2D visualization work independently

---

## Phase 5: User Story 3 - Social Club Amenities Design (Priority: P2)

**Goal**: Enable developers to design the social club by selecting amenities from a comprehensive catalog organized by category (aquatic, dining, recreation, furniture, utilities)

**Independent Test**: Open amenities catalog, view 35 amenities across 5 categories, select pool (small), BBQ station, lounge chairs (set of 6), pool umbrellas (set of 4), bathrooms, landscaping, verify selected amenities display with costs, change storage type from dedicated to patio, verify selection persists

### Implementation for User Story 3

- [X] T060 [P] [US3] Create SocialClubDesigner component with category-organized layout in src/components/investment/SocialClubDesigner.tsx
- [X] T061 [P] [US3] Add amenities catalog rendering grouped by category (aquatic, dining, recreation, furniture, utilities) to SocialClubDesigner
- [X] T062 [P] [US3] Add checkbox selection for each amenity with toggleAmenity action to SocialClubDesigner
- [X] T063 [P] [US3] Display default cost in USD for each amenity to SocialClubDesigner
- [X] T064 [P] [US3] Add custom cost override input fields appearing when amenity is selected to SocialClubDesigner
- [X] T065 [P] [US3] Add storage type selector (dedicated vs patio) with radio buttons to SocialClubDesigner
- [X] T066 [P] [US3] Add selected amenities summary panel showing all chosen amenities with descriptions to SocialClubDesigner
- [X] T067 [US3] Calculate and display total amenities cost (sum of default or custom costs) in SocialClubDesigner
- [X] T068 [US3] Add clear all selections button to SocialClubDesigner
- [X] T069 [US3] Persist social club configuration (selected amenities, custom costs, storage type) to IndexedDB
- [X] T070 [US3] Integrate SocialClubDesigner into App.tsx sidebar

**Checkpoint**: User Story 3 complete - social club design works independently

---

## Phase 6: User Story 4 - Financial Analysis & Pricing (Priority: P2)

**Goal**: Provide comprehensive financial analysis showing total project costs, per-sqm pricing, and multiple profit margin scenarios to determine investment viability

**Independent Test**: Enter land cost ($150,000), amenities cost ($80,000 from selected amenities), legal costs ($10,000), other costs (Infrastructure: $30,000, Marketing: $5,000), view calculated total project cost ($275,000), cost per sqm ($183.33), base cost per lot ($25,000 for 11 lots), view pricing scenarios for 15%, 20%, 25%, 30% profit margins showing lot sale prices, total revenue, and profit, verify calculations update in real-time (<1 second) when costs change

### Implementation for User Story 4

- [X] T071 [P] [US4] Implement calculateFinancialAnalysis function with all financial formulas in src/lib/financial.ts
- [X] T072 [P] [US4] Add totalProjectCost calculation (land + amenities + legal + other) in src/lib/financial.ts
- [X] T073 [P] [US4] Add costPerSqm calculation (total cost / total land area) in src/lib/financial.ts
- [X] T074 [P] [US4] Add baseCostPerLot calculation ((total - social club) / lot count) in src/lib/financial.ts
- [X] T075 [P] [US4] Add pricing scenario generation for multiple profit margins in src/lib/financial.ts
- [X] T076 [P] [US4] Add ROI calculation for each pricing scenario in src/lib/financial.ts
- [X] T077 [P] [US4] Add maintenance contribution calculation based on common area ownership in src/lib/financial.ts: owner contribution = total monthly maintenance cost (user input) × owner's common area percentage (FR-043)
- [ ] T077a [P] [US4] Add total monthly maintenance cost input field to FinancialAnalysis component with currency support (DOP/USD)
- [X] T078 [P] [US4] Add currency conversion support (DOP ↔ USD with user-provided exchange rate) in src/lib/financial.ts
- [X] T079 [P] [US4] Add precision rounding to 2 decimal places for all financial values in src/lib/financial.ts
- [X] T080 [P] [US4] Create FinancialAnalysis component with cost inputs section in src/components/investment/FinancialAnalysis.tsx
- [X] T080a [P] [US4] Add exchange rate input field (DOP to USD conversion rate) to FinancialAnalysis header with validation (must be > 0)
- [X] T080b [P] [US4] Add currency display toggle (USD/DOP) affecting all financial displays throughout the application (FR-044)
- [X] T081 [P] [US4] Add land cost display (read from land parcel) to FinancialAnalysis
- [X] T082 [P] [US4] Add amenities cost display (auto-calculated from selected amenities) to FinancialAnalysis
- [X] T083 [P] [US4] Add legal costs input field to FinancialAnalysis
- [X] T084 [P] [US4] Add other costs section with add/remove/edit for custom cost categories to FinancialAnalysis
- [X] T085 [P] [US4] Create PricingScenarios component displaying pricing table in src/components/investment/PricingScenarios.tsx
- [X] T086 [P] [US4] Add profit margin selector (15%, 20%, 25%, 30%, 40%) with custom input to PricingScenarios
- [X] T087 [P] [US4] Display calculated metrics table (lot sale price, total revenue, profit, ROI per scenario) in PricingScenarios
- [X] T088 [US4] Implement real-time recalculation on cost changes with <1 second performance requirement
- [X] T089 [US4] Add debouncing (300ms - balance between responsiveness and preventing excessive calculations during typing) to prevent excessive recalculations during rapid input in cost fields
- [X] T090 [US4] Implement automatic recalculation when subdivision scenario changes: preserve all entered financial data (land cost, amenity costs, legal costs, other costs per FR-045) and recalculate all derived values (per-sqm costs, per-lot pricing, profit scenarios per FR-046)
- [X] T091 [US4] Verify auto-save functionality works for financial data changes (uses unified auto-save middleware from T030)
- [X] T092 [US4] Integrate FinancialAnalysis and PricingScenarios into App.tsx sidebar

**Checkpoint**: User Story 4 complete - financial analysis works independently with real-time updates

---

## Phase 7: User Story 6 - Image Management (Priority: P3)

**Goal**: Enable developers to attach and preview images for the land parcel and individual Micro Villa lots

**Independent Test**: Upload 2 images to land parcel, upload 1 image to specific lot (Lot 5), view image thumbnails in land panel and lot details, click thumbnail to open full-size preview, export project, verify images are included, delete image from lot, verify removal persists

### Implementation for User Story 6

- [X] T093 [P] [US6] Create ImageUpload component with file input accepting JPEG/PNG/WebP in src/components/investment/ImageUpload.tsx
- [X] T094 [P] [US6] Add image file validation (format check, 10MB size limit per FR-056) with compression/rejection logic for large files to ImageUpload
- [X] T095 [P] [US6] Implement blob storage (not file paths) in IndexedDB with original filename and metadata (FR-052)
- [X] T096 [P] [US6] Add image thumbnail rendering from stored blob data using object URLs in ImageUpload
- [X] T097 [P] [US6] Create ImagePreview modal component for full-size image display in src/components/investment/ImagePreview.tsx
- [X] T098 [P] [US6] Add click handler to open full-size preview when thumbnail is clicked to ImageUpload
- [X] T099 [P] [US6] Add remove image functionality with confirmation dialog to ImageUpload
- [X] T100 [US6] Integrate ImageUpload into LandConfigPanel for land parcel images
- [X] T101 [US6] Add image upload capability to lot details in SubdivisionViewer for lot-specific images
- [X] T102 [US6] Persist image blobs with metadata (filename, size, type) associated with land parcel and lots to IndexedDB (FR-057)

**Checkpoint**: User Story 6 complete - image management works independently

---

## Phase 8: User Story 5 - AI-Ready Design Descriptions (Priority: P3)

**Goal**: Generate detailed textual descriptions of the Micro Villas project suitable for multi-modal AI systems to generate visual concepts and marketing materials

**Independent Test**: Configure complete project (land: 1500 sqm in La Altagracia, 11 lots at 20% social club, amenities: pool, BBQ, lounge, costs entered), click "Generate AI Description", verify description contains: location details, land dimensions, lot configuration (11 lots, ~109 sqm each), centralized social club details, complete amenities list, common area ownership structure, storage arrangements, click "Copy to Clipboard", verify text is copied successfully

### Implementation for User Story 5

- [X] T103 [P] [US5] Implement generateAIDescription function creating structured text from project data in src/lib/generateAIDescription.ts
- [X] T104 [P] [US5] Add location section (province, landmarks, nearby attractions) to AI description
- [X] T105 [P] [US5] Add land dimensions section (total area, dimensions in meters) to AI description
- [X] T106 [P] [US5] Add subdivision configuration section (lot count, lot dimensions, social club percentage) to AI description
- [X] T107 [P] [US5] Add social club details section (size, position, complete amenities list with descriptions) to AI description
- [X] T108 [P] [US5] Add common area ownership section (percentage calculation explanation) to AI description
- [X] T109 [P] [US5] Add storage arrangement section (dedicated vs patio storage) to AI description
- [X] T110 [P] [US5] Format description with clear sections and specific measurements for AI consumption in src/lib/generateAIDescription.ts
- [X] T111 [P] [US5] Create AIDescriptionPanel component displaying generated description in src/components/investment/AIDescriptionPanel.tsx
- [X] T112 [P] [US5] Add "Generate Description" button triggering description generation to AIDescriptionPanel
- [X] T113 [P] [US5] Add "Copy to Clipboard" button with success feedback to AIDescriptionPanel
- [X] T114 [US5] Add performance requirement: generate description in <3 seconds (SC-008)
- [X] T115 [US5] Store generated description in project state (aiDescription field) for future reference
- [X] T116 [US5] Integrate AIDescriptionPanel into App.tsx sidebar or as modal dialog

**Checkpoint**: User Story 5 complete - AI description generation works independently

---

## Phase 9: User Story 7 - Project Export to Disk (Priority: P2)

**Goal**: Save complete project data (configuration, financials, images) to a disk directory for backup, sharing, or version control

**Independent Test**: Click "Export Project", select target directory via File System Access API picker, confirm export, verify directory structure created: {projectName}/project.json + assets/land-parcel/ + assets/lots/, verify all images copied to export directory, verify project.json contains all configuration data, verify export completes in <10 seconds (SC-006)

### Implementation for User Story 7

- [X] T117 [P] [US7] Install file-system-access polyfill and jszip/file-saver dependencies for fallback
- [X] T118 [P] [US7] Create FileSystemAccessError class with error types in src/lib/fileSystemErrors.ts
- [X] T119 [P] [US7] Implement showDirectoryPicker wrapper with error handling in src/lib/fileSystemAccess.ts
- [X] T120 [P] [US7] Implement createProjectDirectory function in src/lib/export.ts
- [X] T121 [P] [US7] Implement writeProjectJSON function serializing InvestmentProject to JSON in src/lib/export.ts
- [X] T122 [P] [US7] Implement createAssetsDirectory function with land-parcel/ and lots/ subdirectories in src/lib/export.ts
- [X] T123 [P] [US7] Implement extractBlobsToFiles function extracting image blobs from IndexedDB and writing as files to export assets/ subdirectories with original filenames in src/lib/export.ts
- [X] T124 [P] [US7] Add file naming conventions (sanitize project name, ISO timestamps, format: {projectName}_{ISO-date}.json) in src/lib/export.ts
- [X] T125 [P] [US7] Add export validation (check directory writability before proceeding per FR-062) in src/lib/export.ts
- [X] T126 [P] [US7] Implement exportProject main function coordinating all export steps in src/lib/export.ts
- [X] T127 [P] [US7] Add success/failure feedback with detailed error messages in src/lib/export.ts
- [X] T128 [P] [US7] Implement ZIP fallback using jszip for browsers without File System Access API, mirroring directory structure: project.json + assets/land-parcel/ + assets/lots/ in src/lib/zipExport.ts
- [X] T129 [P] [US7] Add browser detection to automatically use ZIP fallback on Firefox/Safari in src/lib/export.ts
- [X] T130 [P] [US7] Create ExportImport component with "Export Project" button in src/components/investment/ExportImport.tsx
- [X] T131 [US7] Add export progress indicator and success/error toasts to ExportImport
- [X] T132 [US7] Store last export path and date in project metadata
- [X] T133 [US7] Add performance requirement: export completes in <10 seconds (SC-006)
- [X] T134 [US7] Integrate ExportImport into App.tsx header or sidebar

**Checkpoint**: User Story 7 complete - project export works independently on all browsers

---

## Phase 10: User Story 8 - Project Import from Disk (Priority: P2)

**Goal**: Load a previously exported project from a disk directory to continue work, share with team members, or review past projects

**Independent Test**: Click "Import Project", select directory containing exported project via picker, verify loading progress indicator appears, verify all configuration loads (land, subdivision, amenities, financials), verify all images load with thumbnails displayed, verify project state fully restored, test corrupted JSON scenario: modify project.json to have invalid field, attempt import, verify detailed error message displays with option for partial recovery, accept partial recovery, verify valid fields loaded and invalid fields skipped with warning list

### Implementation for User Story 8

- [X] T135 [P] [US8] Implement readProjectJSON function with JSON parsing and validation in src/lib/import.ts
- [X] T136 [P] [US8] Add JSON schema validation for project.json version 1.0.0 in src/lib/import.ts
- [X] T137 [P] [US8] Implement detectCorruptedFields function identifying invalid/missing fields in src/lib/import.ts
- [X] T138 [P] [US8] Implement partialRecovery function loading valid fields and skipping invalid ones in src/lib/import.ts
- [X] T139 [P] [US8] Implement loadImagesFromDirectory function reading from assets/ subdirectories in src/lib/import.ts
- [X] T140 [P] [US8] Add missing image handling with placeholder indicators (per FR-073) in src/lib/import.ts
- [X] T141 [P] [US8] Implement importAssets function reading image files from assets/ subdirectories, converting to blobs, and storing in IndexedDB with metadata in src/lib/import.ts
- [X] T142 [P] [US8] Implement restoreProjectState function updating all Zustand store slices in src/lib/import.ts
- [X] T143 [P] [US8] Implement importProject main function coordinating all import steps in src/lib/import.ts
- [X] T144 [P] [US8] Add detailed error messages listing invalid/corrupted fields (per FR-070) in src/lib/import.ts
- [X] T145 [P] [US8] Add partial recovery UI dialog with field-level warnings (per FR-071/FR-072) in src/lib/import.ts
- [X] T146 [P] [US8] Implement ZIP import for fallback browsers in src/lib/zipImport.ts
- [X] T147 [P] [US8] Add "Import Project" button to ExportImport component
- [X] T148 [US8] Add import progress indicator and status messages to ExportImport
- [X] T149 [US8] Add validation for directory structure (project.json + assets/ must exist per FR-065)
- [ ] T150 [US8] Test 100% data fidelity: export project, import project, verify all data matches (SC-007)
- [ ] T151 [US8] Test corrupted JSON recovery flow with various corruption scenarios

**Checkpoint**: User Story 8 complete - project import works independently with error handling and recovery

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T152 [P] Add loading states and spinners to all async operations (subdivision generation, export, import)
- [ ] T153 [P] Add error boundary components to catch and display React errors gracefully
- [ ] T154 [P] Implement toast notification system for user feedback (auto-save, export success, errors)
- [ ] T155 [P] Add keyboard shortcuts documentation (remove Tab view toggle, document new shortcuts)
- [ ] T156 [P] Add responsive layout adjustments for different screen sizes
- [ ] T157 [P] Optimize Konva rendering performance (memoize shapes, use virtualization if needed)
- [ ] T158 [P] Add undo/redo capability using existing Zundo middleware for investment operations
- [ ] T159 [P] Add "New Project" wizard guiding users through initial setup (optional UX enhancement)
- [ ] T161 [P] Create comprehensive README updates documenting new investment features
- [ ] T162 [P] Update CHANGELOG.md with feature 001 release notes
- [ ] T163 [P] Add inline help tooltips explaining complex terms (common area percentage, ROI, etc.)
- [ ] T164 [P] Verify all calculations maintain 2 decimal place accuracy (SC-011)
- [ ] T164a [P] Validate unit conversion accuracy: test sqm ↔ sqft conversions (1 sqm = 10.7639 sqft) maintain precision, verify all measurements display consistently in selected unit throughout application
- [ ] T165 [P] Performance audit: verify subdivision generation <2 seconds (SC-002)
- [ ] T166 [P] Performance audit: verify financial updates <1 second (SC-005)
- [ ] T167 [P] Performance audit: verify AI description generation <3 seconds (SC-008)
- [ ] T168 [P] Test with large land parcels (10,000-50,000 sqm) per SC-010
- [ ] T169 [P] Browser compatibility testing (Chrome, Edge, Firefox, Safari)
- [ ] T170 [P] Accessibility audit (keyboard navigation, ARIA labels, screen reader support)
- [ ] T171 Run complete user journey test per quickstart.md validation checklist
- [ ] T172 Create demo project data for screenshots and marketing materials
- [ ] T173 Generate production build and verify bundle size reduction (30-50%)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phases 3-10)**: All depend on Foundational (Phase 2) completion
  - User stories can proceed in parallel if staffed appropriately
  - Or sequentially in priority order: P1 stories (US1, US2) → P2 stories (US3, US4, US7, US8) → P3 stories (US5, US6)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - can start immediately after Foundational
- **User Story 2 (P1)**: Depends on User Story 1 (needs land parcel data) - but independently testable
- **User Story 3 (P2)**: No dependencies on other stories - independently testable
- **User Story 4 (P2)**: Depends on User Stories 1, 2, 3 (needs land cost, lot count, amenities cost) - but independently testable with mock data
- **User Story 5 (P3)**: Depends on User Stories 1, 2, 3 (needs complete project data for description)
- **User Story 6 (P3)**: Depends on User Story 1 (needs land parcel) and User Story 2 (needs lots)
- **User Story 7 (P2)**: Depends on all data-generating stories (1-6) for complete export
- **User Story 8 (P2)**: Depends on User Story 7 (needs export format defined) - but can develop in parallel

### Within Each User Story

- Tasks marked [P] within a story can run in parallel
- Models/types before services/utilities
- Services/utilities before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup phase**: T002, T003, T004, T008, T009, T010 can run in parallel
- **Foundational phase**: T011-T024 (type/data definitions) can run in parallel; T025-T028 (slices) can run in parallel after types complete
- **User Stories**: US1 and US3 can start in parallel; US2 starts after US1; US4-US8 can proceed after prerequisites met
- **Within stories**: All tasks marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all type definitions together (T011-T024):
Task: "Add DominicanProvince union type with all 31 provinces to src/models/types.ts"
Task: "Add Currency and DisplayUnit types to src/models/types.ts"
Task: "Add ImageReference interface to src/models/types.ts"
Task: "Create DOMINICAN_PROVINCES constant array in src/data/provinces.ts"
Task: "Create AMENITIES_CATALOG with all 35 amenities in src/data/amenities.ts"
# ... and so on

# After types complete, launch all slice creations together (T025-T028):
Task: "Create LandSlice in src/store/slices/landSlice.ts"
Task: "Create SubdivisionSlice in src/store/slices/subdivisionSlice.ts"
Task: "Create SocialClubSlice in src/store/slices/socialClubSlice.ts"
Task: "Create FinancialSlice in src/store/slices/financialSlice.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup & Preparation (Babylon.js removal)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Land configuration)
4. Complete Phase 4: User Story 2 (Subdivision calculation & visualization)
5. **STOP and VALIDATE**: Test US1+US2 independently
6. Deploy/demo MVP (land configuration + subdivision scenarios)

**MVP Delivers**: Core investment analysis capability - developers can input land and see all possible subdivision options

### Incremental Delivery

1. **Foundation** → Setup + Foundational complete
2. **MVP (P1)** → Add US1 + US2 → Test independently → Deploy/Demo
3. **Enhanced Analysis (P2a)** → Add US3 (amenities) + US4 (financial) → Test → Deploy/Demo
4. **Data Portability (P2b)** → Add US7 (export) + US8 (import) → Test → Deploy/Demo
5. **Polish (P3)** → Add US5 (AI descriptions) + US6 (images) → Test → Deploy/Demo
6. **Final Polish** → Phase 11 improvements → Final validation → Production release

Each delivery adds value without breaking previous functionality.

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

- **Developer A**: User Story 1 → User Story 6 → User Story 5
- **Developer B**: User Story 2 → User Story 3 → Help with US7/US8
- **Developer C**: User Story 4 → User Story 7 → User Story 8

Stories integrate at natural checkpoints; all independently testable.

---

## Success Metrics Validation

At completion, verify all success criteria from spec.md:

- [ ] **SC-001**: Land configuration completes in <5 minutes (validate with manual walkthrough)
- [ ] **SC-002**: 21 subdivision scenarios generate in <2 seconds (performance test in T165)
- [ ] **SC-003**: Amenities catalog has 20+ options (we have 35 - verify in T022)
- [ ] **SC-004**: Financial analysis calculates automatically (integration test)
- [ ] **SC-005**: Financial updates occur in <1 second (performance test in T166)
- [ ] **SC-006**: Project export completes in <10 seconds (performance test in T133)
- [ ] **SC-007**: Import achieves 100% data fidelity (validation test in T150)
- [ ] **SC-008**: AI description generates in <3 seconds (performance test in T167)
- [ ] **SC-009**: 90% of users complete full setup in <20 minutes (POST-LAUNCH: requires user testing with 10+ participants)
- [ ] **SC-010**: System handles 500-50,000 sqm parcels without degradation (test in T168)
- [ ] **SC-011**: All calculations accurate to 2 decimal places (validate in T164)

---

## Notes

- **[P] marker**: Tasks with this marker operate on different files or have no dependencies, can run concurrently
- **[Story] label**: Maps each task to its user story for traceability and independent testing
- **File paths**: All tasks include exact file paths for implementation clarity
- **Validation checkpoints**: Each user story phase ends with a checkpoint to validate independent functionality
- **Performance requirements**: Embedded in relevant tasks (SC-002, SC-005, SC-006, SC-008)
- **Constitution compliance**: All tasks align with measurement accuracy, performance requirements, and architectural principles
- **3D removal**: Phase 1 removes Babylon.js per spec requirement (intentional deviation from original architecture)
- **No backend**: All functionality is client-side (IndexedDB + File System Access API)
- **Tests optional**: No tests included per spec (testing framework not requested)
- **MVP scope**: User Stories 1+2 represent minimum viable product (land input + subdivision scenarios)

**Total Tasks**: 173 tasks across 11 phases, organized by 8 user stories for independent implementation and incremental delivery.
