# Tasks: Core Architecture Setup

**Input**: Design documents from `/specs/001-core-architecture-setup/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/store-api.md, contracts/component-api.md

**Tests**: Not explicitly requested in spec - tests are NOT included in this task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Tech stack: React 18+, TypeScript, Vite, Konva.js, Babylon.js, Zustand, Tailwind CSS

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Vite project with React and TypeScript template in repository root
- [X] T002 Install core dependencies: react, react-dom, typescript, zustand, zundo, idb-keyval, uuid
- [X] T003 [P] Install 2D canvas dependencies: konva, react-konva
- [X] T004 [P] Install 3D viewer dependencies: @babylonjs/core, @babylonjs/gui, react-babylonjs
- [X] T005 [P] Install styling dependencies: tailwindcss, postcss, autoprefixer
- [X] T006 Configure TypeScript strict mode in tsconfig.json
- [X] T007 Configure Tailwind CSS in tailwind.config.js and src/index.css
- [X] T008 [P] Configure path aliases (@components, @store, @models, @lib) in vite.config.ts and tsconfig.json
- [X] T009 Create folder structure per plan.md in src/ directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Create TypeScript interfaces for Project, Lot, Area, Asset, ViewerState in src/models/types.ts
- [X] T011 Create AreaType, AssetType, Tool, ViewMode type definitions in src/models/types.ts
- [X] T012 [P] Implement UUID generation utility in src/lib/uuid.ts
- [X] T013 [P] Implement coordinate conversion functions (metersToPixels, pixelsToMeters, metersToMm, mmToMeters) in src/lib/coordinates.ts
- [X] T014 [P] Implement geometry utilities (calculateArea, calculateOverlap, boundsIntersect) in src/lib/geometry.ts
- [X] T015 Create Zustand store structure with slices pattern in src/store/index.ts
- [X] T016 Implement projectSlice with createProject, loadProject actions in src/store/slices/projectSlice.ts
- [X] T017 [P] Implement viewerSlice with activeView, selection, tool state in src/store/slices/viewerSlice.ts
- [X] T018 Configure Zundo temporal middleware for undo/redo in src/store/index.ts
- [X] T019 Create App.tsx shell with Header, Main, Sidebar, StatusBar layout structure
- [X] T020 [P] Create Toolbar component shell in src/components/ui/Toolbar.tsx
- [X] T021 [P] Create ViewToggle component in src/components/ui/ViewToggle.tsx
- [X] T022 [P] Create StatusBar component shell in src/components/ui/StatusBar.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create Base Floorplan (Priority: P1) 🎯 MVP

**Goal**: Users can create a floorplan by specifying lot dimensions and see a 2D canvas with grid overlay

**Independent Test**: Launch app, enter lot dimensions (50m x 30m), see canvas with grid and dimension labels, hover shows coordinates, zoom works

### Implementation for User Story 1

- [X] T023 [US1] Implement LotPanel component with width/height inputs in src/components/panels/LotPanel.tsx
- [X] T024 [US1] Add updateLot action to projectSlice in src/store/slices/projectSlice.ts
- [X] T025 [US1] Create Canvas2D component shell with Konva Stage in src/components/canvas/Canvas2D.tsx
- [X] T026 [US1] Implement Grid component with dynamic grid lines based on lot dimensions in src/components/canvas/Grid.tsx
- [X] T027 [US1] Add zoom handling (wheel event) to Canvas2D with scale state in src/components/canvas/Canvas2D.tsx
- [X] T028 [US1] Add pan handling (drag on empty canvas) to Canvas2D in src/components/canvas/Canvas2D.tsx
- [X] T029 [US1] Implement Coordinates component showing X,Y meters on hover in src/components/ui/Coordinates.tsx
- [X] T030 [US1] Connect Canvas2D to store subscriptions (lot, zoom, pan, showGrid) in src/components/canvas/Canvas2D.tsx
- [X] T031 [US1] Add dimension labels to Grid component that scale with zoom in src/components/canvas/Grid.tsx
- [X] T032 [US1] Add setZoom, setPan, resetView actions to viewerSlice in src/store/slices/viewerSlice.ts
- [X] T033 [US1] Wire up keyboard shortcut G for toggle grid in src/App.tsx
- [X] T034 [US1] Add initial project creation on app launch if no project exists in src/App.tsx

**Checkpoint**: User Story 1 complete - can create lot, see grid, zoom/pan, view coordinates

---

## Phase 4: User Story 2 - Add and Manage Areas (Priority: P2)

**Goal**: Users can add named areas with dimensions, drag/resize them, see overlap detection and area summary

**Independent Test**: Create lot, add 3-5 areas of different types, drag to reposition, resize via handles, verify overlap indication and area summary

### Implementation for User Story 2

- [X] T035 [US2] Implement areasSlice with addArea, updateArea, deleteArea, duplicateArea actions in src/store/slices/areasSlice.ts
- [X] T036 [US2] Add area selectors (usedArea, remainingArea, areasByType, overlappingAreas) to store in src/store/selectors.ts
- [X] T037 [US2] Create AreaRect component rendering Konva.Rect with drag support in src/components/canvas/AreaRect.tsx
- [X] T038 [US2] Add Transformer integration for resize handles in AreaRect in src/components/canvas/AreaRect.tsx
- [X] T039 [US2] Create AreaLabel component showing name, dimensions, area in src/components/canvas/AreaLabel.tsx
- [X] T040 [US2] Implement AreaCreateDialog modal with name, type, dimensions fields in src/components/dialogs/AreaCreateDialog.tsx
- [X] T041 [US2] Create AreaList component showing all areas with selection in src/components/panels/AreaList.tsx
- [X] T042 [US2] Create AreaProperties component for editing selected area in src/components/panels/AreaProperties.tsx
- [X] T042a [US2] Add elevation (height) input field to AreaProperties panel in src/components/panels/AreaProperties.tsx
- [X] T043 [US2] Implement select, addToSelection, clearSelection actions in viewerSlice in src/store/slices/viewerSlice.ts
- [X] T044 [US2] Add click-to-select behavior on AreaRect in src/components/canvas/AreaRect.tsx
- [X] T045 [US2] Implement overlap detection visualization (highlight overlapping areas) in src/components/canvas/Canvas2D.tsx
- [X] T046 [US2] Create AreaSummary component showing total/used/remaining area in src/components/ui/AreaSummary.tsx
- [X] T047 [US2] Add ColorPicker component for area color selection in src/components/ui/ColorPicker.tsx
- [X] T048 [US2] Wire up keyboard shortcuts: Delete (delete area), Ctrl+D (duplicate), Escape (deselect) in src/App.tsx
- [X] T049 [US2] Add area tool mode to Toolbar for creating new areas in src/components/ui/Toolbar.tsx
- [X] T050 [US2] Implement canvas click handler to open AreaCreateDialog at click position in src/components/canvas/Canvas2D.tsx

**Checkpoint**: User Story 2 complete - full area management with drag, resize, overlap detection

---

## Phase 5: User Story 3 - View in 3D with Game-Like Navigation (Priority: P3)

**Goal**: Users can switch to 3D view and navigate using WASD + mouse with tooltips on hover

**Independent Test**: Create lot with 3-4 areas, switch to 3D, navigate with WASD, orbit with mouse, zoom with scroll, hover shows tooltip

### Implementation for User Story 3

- [X] T051 [US3] Create Viewer3D component shell with Babylon Engine/Scene in src/components/viewer/Viewer3D.tsx
- [X] T052 [US3] Implement Ground component rendering lot as ground plane in src/components/viewer/Ground.tsx
- [X] T053 [US3] Configure FreeCamera with WASD controls in Viewer3D in src/components/viewer/Viewer3D.tsx
- [X] T054 [US3] Add mouse look/orbit controls to camera in src/components/viewer/Viewer3D.tsx
- [X] T055 [US3] Add scroll wheel zoom control to camera in src/components/viewer/Viewer3D.tsx
- [X] T056 [US3] Create AreaBox component rendering area as extruded box in src/components/viewer/AreaBox.tsx
- [X] T057 [US3] Connect Viewer3D to store subscriptions (lot, areas, selectedIds) in src/components/viewer/Viewer3D.tsx
- [X] T058 [US3] Implement ActionManager hover detection on AreaBox meshes in src/components/viewer/AreaBox.tsx
- [X] T059 [US3] Create Tooltip component for 3D hover display in src/components/ui/Tooltip.tsx
- [X] T060 [US3] Add selection highlight (emissive color change) to AreaBox in src/components/viewer/AreaBox.tsx
- [X] T061 [US3] Implement setActiveView action and view switching in App.tsx in src/App.tsx
- [X] T062 [US3] Add Tab keyboard shortcut to toggle between 2D/3D views in src/App.tsx
- [X] T063 [US3] Add camera state (position, target) to viewerSlice in src/store/slices/viewerSlice.ts
- [X] T064 [US3] Implement ambient and directional lighting in Viewer3D in src/components/viewer/Viewer3D.tsx

**Checkpoint**: User Story 3 complete - full 3D visualization with game-like navigation

---

## Phase 6: User Story 4 - Import and Position Assets (Priority: P4)

**Goal**: Users can import 2D/3D assets with explicit dimensions and position them in the floorplan

**Independent Test**: Import PNG image, specify 8m x 6m dimensions, place on canvas, verify scale in 2D and 3D views

### Implementation for User Story 4

- [X] T065 [US4] Implement assetsSlice with addAsset, updateAsset, deleteAsset actions in src/store/slices/assetsSlice.ts
- [X] T066 [US4] Create AssetImportDialog modal with file input, dimensions, preview in src/components/dialogs/AssetImportDialog.tsx
- [X] T067 [US4] Implement file reading and blob storage for imported assets in src/lib/storage.ts
- [X] T068 [US4] Create Asset2D component rendering Konva.Image with transform in src/components/canvas/Asset2D.tsx
- [X] T069 [US4] Add drag and resize support to Asset2D component in src/components/canvas/Asset2D.tsx
- [X] T070 [US4] Create Asset3D component rendering textured plane in Babylon in src/components/viewer/Asset3D.tsx
- [X] T071 [US4] Implement GLTF/GLB model loading in Asset3D for 3D models in src/components/viewer/Asset3D.tsx
- [X] T072 [US4] Create AssetLibrary panel listing imported assets in src/components/panels/AssetLibrary.tsx
- [X] T073 [US4] Add import button to Toolbar opening file picker in src/components/ui/Toolbar.tsx
- [X] T074 [US4] Wire up keyboard shortcut I for import in src/App.tsx
- [X] T075 [US4] Connect Asset2D and Asset3D to store subscriptions in respective files

**Checkpoint**: User Story 4 complete - can import and position 2D/3D assets with explicit dimensions

---

## Phase 7: User Story 5 - Save and Load Projects (Priority: P5)

**Goal**: Users can save projects locally, load them later, and export/import for sharing

**Independent Test**: Create complete floorplan, save, close app, reopen, load project, verify all data intact, export JSON file

### Implementation for User Story 5

- [X] T076 [US5] Implement IndexedDB storage helpers (saveToIDB, loadFromIDB, listProjects) in src/lib/storage.ts
- [X] T077 [US5] Add saveProject action with IndexedDB persistence in src/store/slices/projectSlice.ts
- [X] T078 [US5] Add exportProject action generating JSON string in src/store/slices/projectSlice.ts
- [X] T079 [US5] Add importProject action parsing JSON and loading project in src/store/slices/projectSlice.ts
- [X] T080 [US5] Implement auto-save with debounce (500ms) on state changes in src/store/index.ts
- [X] T081 [US5] Create ProjectListDialog showing saved projects with load/delete in src/components/dialogs/ProjectListDialog.tsx
- [X] T082 [US5] Create NewProjectDialog for creating new projects in src/components/dialogs/NewProjectDialog.tsx
- [X] T083 [US5] Add Save, Load, Export buttons to Toolbar in src/components/ui/Toolbar.tsx
- [X] T084 [US5] Implement JSON file download for export in src/lib/storage.ts
- [X] T085 [US5] Implement JSON file import via file picker in src/components/dialogs/ProjectListDialog.tsx
- [X] T086 [US5] Wire up keyboard shortcuts: Ctrl+S (save), Ctrl+E (export) in src/App.tsx
- [X] T087 [US5] Add hydration on app startup loading last project from IndexedDB in src/App.tsx
- [X] T088 [US5] Create ProjectName component showing/editing project name in header in src/components/ui/ProjectName.tsx

**Checkpoint**: User Story 5 complete - full persistence with save, load, export, import

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T089 [P] Add undo/redo buttons to Toolbar with canUndo/canRedo state in src/components/ui/Toolbar.tsx
- [X] T090 Wire up Ctrl+Z (undo), Ctrl+Shift+Z (redo) keyboard shortcuts in src/App.tsx
- [X] T091 [P] Implement keyboard shortcuts help modal in src/components/dialogs/KeyboardShortcutsDialog.tsx
- [X] T092 Add Konva layer optimization (caching, listening disabled on grid) in src/components/canvas/Canvas2D.tsx
- [X] T093 Add Babylon performance optimization (freezeActiveMeshes) in src/components/viewer/Viewer3D.tsx
- [X] T094 [P] Add loading spinner component for async operations in src/components/ui/Spinner.tsx
- [X] T095 [P] Add toast notification system for save/load feedback in src/components/ui/Toast.tsx
- [X] T096 Add error boundary for graceful error handling in src/components/ErrorBoundary.tsx
- [X] T097 [P] Add responsive sidebar collapse for smaller screens in src/components/ui/Sidebar.tsx
- [X] T098 Run quickstart.md validation - verify all documented features work
- [X] T099 [P] Create performance benchmark test validating 30+ FPS with 100 areas in 3D view in tests/e2e/performance.spec.ts
- [X] T100 [P] Create interaction latency test validating <100ms response for drag/resize in tests/e2e/performance.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T009) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T010-T022)
- **User Story 2 (Phase 4)**: Depends on Foundational; can start after US1 but independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational; can start after US1 but independently testable
- **User Story 4 (Phase 6)**: Depends on Foundational; can start after US1 but independently testable
- **User Story 5 (Phase 7)**: Depends on Foundational; can start after US1 but independently testable
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core foundation - other stories build on this
- **User Story 2 (P2)**: Needs US1 (canvas exists) but independently testable
- **User Story 3 (P3)**: Needs US1 + US2 areas to visualize, independently testable
- **User Story 4 (P4)**: Needs US1 canvas, US3 viewer for 3D assets
- **User Story 5 (P5)**: Works with any combination of US1-4

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T003, T004, T005 can run in parallel (different dependencies)
T008 can run with any other setup task
```

**Phase 2 (Foundational)**:
```
T012, T013, T014 can run in parallel (different utility files)
T017 can run parallel with T016 (different slice files)
T020, T021, T022 can run in parallel (different UI components)
```

**Phase 3 (US1)**:
```
No parallel within US1 - sequential dependencies on canvas setup
```

**Phase 4 (US2)**:
```
T037, T039 can run in parallel (different canvas components)
T041, T042 can run in parallel (different panel components)
```

**Phase 5 (US3)**:
```
T052, T056 can run in parallel after T051 (different 3D components)
```

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch utility functions in parallel:
Task T012: "Implement UUID generation utility in src/lib/uuid.ts"
Task T013: "Implement coordinate conversion functions in src/lib/coordinates.ts"
Task T014: "Implement geometry utilities in src/lib/geometry.ts"

# Launch UI component shells in parallel:
Task T020: "Create Toolbar component shell in src/components/ui/Toolbar.tsx"
Task T021: "Create ViewToggle component in src/components/ui/ViewToggle.tsx"
Task T022: "Create StatusBar component shell in src/components/ui/StatusBar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T022)
3. Complete Phase 3: User Story 1 (T023-T034)
4. **STOP and VALIDATE**: Test creating lot, grid display, zoom/pan, coordinates
5. Deploy/demo if ready - basic canvas with lot creation

### Incremental Delivery

1. Setup + Foundational → Base app shell ready
2. Add User Story 1 → **MVP: Create lot with grid and zoom**
3. Add User Story 2 → **Add areas with drag/resize/overlap**
4. Add User Story 3 → **3D visualization with game controls**
5. Add User Story 4 → **Asset import capability**
6. Add User Story 5 → **Persistence and sharing**
7. Polish phase → **Production-ready quality**

### Recommended Sequence for Solo Developer

```
Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → Polish
```

Total estimated tasks: 101

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tests not included as not explicitly requested - add via separate task generation if needed
