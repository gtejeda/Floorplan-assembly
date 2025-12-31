# Implementation Plan: Core Architecture Setup

**Branch**: `001-core-architecture-setup` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-architecture-setup/spec.md`

## Summary

Build a web-based floorplan assembly application with a 2D editor (Konva.js) and 3D viewer (Babylon.js) sharing unified state (Zustand). Users create lot boundaries, add named areas with real-world dimensions, and navigate the 3D scene with game-like controls (WASD + mouse). Focus on measurement accuracy (millimeter precision) and responsive interaction (<100ms).

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**:
- React 18+ (UI framework)
- Konva.js 9+ / react-konva (2D canvas)
- Babylon.js 6+ / react-babylonjs (3D viewer)
- Zustand 4+ (state management)
- Zundo (undo/redo middleware)
- idb-keyval (IndexedDB wrapper)

**Storage**: IndexedDB (local persistence), JSON export/import
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Modern desktop browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Single frontend web application
**Performance Goals**: 30+ FPS (3D), <100ms interaction response
**Constraints**: <200ms view switch, 100+ areas without lag
**Scale/Scope**: Single-user local application, lots up to 1000m × 1000m

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| I. Measurement Accuracy First | ✅ PASS | Millimeter internal storage, meter display, explicit conversion functions |
| II. 2D-3D Data Consistency | ✅ PASS | Single Zustand store for both views, no separate state |
| III. Performance Over Fidelity | ✅ PASS | Konva layers, Babylon thin instances, 30+ FPS target |
| IV. Area-Centric Architecture | ✅ PASS | Area as core entity, all operations derive from Area collection |
| V. Import Flexibility with Explicit Dimensions | ✅ PASS | Import dialog requires dimension input before placement |

**Post-Design Re-Check** (Phase 1 complete):
- Data model uses millimeters internally ✅
- Store is single source of truth for both views ✅
- Performance optimizations documented in research.md ✅
- Area entity is central to data model ✅
- Asset import requires explicit dimensions ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-core-architecture-setup/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Developer guide
├── contracts/           # API contracts
│   ├── store-api.md     # Zustand store contract
│   └── component-api.md # React component contract
├── checklists/          # Validation checklists
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── canvas/              # 2D Konva components
│   │   ├── Canvas2D.tsx     # Main 2D stage
│   │   ├── Grid.tsx         # Grid overlay layer
│   │   ├── AreaRect.tsx     # Area rectangle shape
│   │   └── AreaLabel.tsx    # Area dimension label
│   ├── viewer/              # 3D Babylon components
│   │   ├── Viewer3D.tsx     # Main 3D scene
│   │   ├── Ground.tsx       # Ground plane
│   │   ├── AreaBox.tsx      # 3D area box
│   │   └── CameraController.tsx
│   ├── panels/              # Sidebar panels
│   │   ├── LotPanel.tsx     # Lot dimension editor
│   │   ├── AreaList.tsx     # Area list view
│   │   └── AreaProperties.tsx
│   ├── dialogs/             # Modal dialogs
│   │   ├── AreaCreateDialog.tsx
│   │   └── AssetImportDialog.tsx
│   └── ui/                  # Shared UI components
│       ├── Toolbar.tsx
│       ├── ViewToggle.tsx
│       ├── StatusBar.tsx
│       └── Tooltip.tsx
├── store/
│   ├── slices/
│   │   ├── projectSlice.ts  # Project/lot state
│   │   ├── areasSlice.ts    # Area CRUD
│   │   ├── assetsSlice.ts   # Asset management
│   │   └── viewerSlice.ts   # UI/view state
│   └── index.ts             # Combined store
├── models/
│   └── types.ts             # TypeScript interfaces
├── lib/
│   ├── coordinates.ts       # Unit conversion
│   ├── geometry.ts          # Overlap detection
│   ├── storage.ts           # IndexedDB helpers
│   └── uuid.ts              # ID generation
├── App.tsx
└── main.tsx

tests/
├── unit/
│   ├── store/
│   ├── lib/
│   └── components/
├── integration/
└── e2e/
```

**Structure Decision**: Single frontend application. No backend for MVP. State persisted to IndexedDB with JSON export for sharing.

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale |
|----------|-----------|
| Two rendering libraries (Konva + Babylon) | 2D and 3D have fundamentally different interaction models; unified library would sacrifice quality in both |
| Zustand over Context | Performance requirement (<100ms) necessitates selective subscriptions; Context causes full re-renders |
| Millimeter internal storage | Preserves precision through all operations; display converts to meters |

## Phase Summary

### Phase 0: Research (Complete)

See [research.md](./research.md) for:
- Konva.js selection and optimization strategy
- Babylon.js camera configuration and performance tuning
- Zustand store architecture with middleware

### Phase 1: Design (Complete)

Generated artifacts:
- [data-model.md](./data-model.md) - Entity definitions
- [contracts/store-api.md](./contracts/store-api.md) - Zustand API
- [contracts/component-api.md](./contracts/component-api.md) - React components
- [quickstart.md](./quickstart.md) - Developer guide

### Phase 2: Tasks (Next)

Run `/speckit.tasks` to generate implementation tasks based on:
- User stories from spec.md (P1-P5 priority)
- Entities from data-model.md
- API from contracts/

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Framework | React 18+ | Component-based UI |
| Build Tool | Vite | Fast dev server, optimized builds |
| Language | TypeScript (strict) | Type safety |
| 2D Canvas | Konva.js + react-konva | Shape manipulation, transforms |
| 3D Viewer | Babylon.js + react-babylonjs | WebGL rendering, game controls |
| State | Zustand | Shared state, subscriptions |
| Undo/Redo | Zundo | History middleware |
| Persistence | IndexedDB (idb-keyval) | Local storage |
| Styling | Tailwind CSS | Utility-first CSS |
| Testing | Vitest + Playwright | Unit + E2E tests |

---

## Key Implementation Notes

### Coordinate System

```
Internal (storage): Millimeters (integers)
Display (UI): Meters (3 decimal places)
2D Canvas: Pixels (50px = 1m default)
3D Scene: Meters (1 unit = 1m)
```

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| 2D render (100 areas) | 23+ FPS | Konva layer optimization, caching |
| 3D render (100 areas) | 30+ FPS | Thin instances, frozen meshes |
| Interaction response | <100ms | Selective Zustand subscriptions |
| View switch | <1s | Shared state, no data sync needed |

### File Formats

- **Internal**: JSON in IndexedDB
- **Export**: `.floorplan` (JSON with schema version)
- **Assets**: PNG, JPG, SVG (2D), GLTF/GLB (3D)
