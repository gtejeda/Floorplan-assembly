# Research: Core Architecture Setup

**Feature**: 001-core-architecture-setup
**Date**: 2025-12-30

## Technology Decisions

### 1. 2D Canvas Library: Konva.js

**Decision**: Use Konva.js with react-konva for the 2D floorplan editor

**Rationale**:
- Native support for drag/resize operations with `Transformer` component
- Built-in event handling for hover, click, drag with coordinate conversion
- React integration via `react-konva` for declarative component-based development
- Adequate performance for 100+ shapes with proper optimization (23 FPS benchmark)
- Strong documentation and community examples for similar use cases

**Alternatives Considered**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| Pixi.js | 3x faster (60 FPS), WebGL | Lower-level API, more manual work | Rejected - overkill for 100 shapes |
| Fabric.js | Rich object model | Slowest (9 FPS), poor scaling | Rejected - performance |
| Paper.js | Vector graphics, curves | Less interactive features | Rejected - not suited for shape manipulation |

**Key Implementation Notes**:
- Use 2-3 layers: static grid, interactive shapes, labels
- Enable shape caching for groups with `cache()` method
- Disable listening on non-interactive layers: `layer.listening(false)`
- Convert coordinates: `const meters = pixels / PIXELS_PER_METER`
- Store all dimensions in meters internally, convert to pixels for rendering

---

### 2. 3D Visualization Library: Babylon.js

**Decision**: Use Babylon.js with react-babylonjs for 3D viewer

**Rationale**:
- Built-in FreeCamera with WASD movement (no custom implementation needed)
- ActionManager for efficient hover detection on 100+ objects
- Better game-like experience (user's stated preference) vs Three.js
- Excellent performance optimization tools (thin instances, SceneOptimizer)
- Mature React wrapper with hooks support

**Alternatives Considered**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| Three.js | Flexible, huge ecosystem | Manual camera controls needed | Alternative for future |
| React Three Fiber | Declarative Three.js | Less game-focused, fewer built-ins | Rejected - user prefers game-like |

**Camera Configuration**:
```
FreeCamera for WASD navigation:
- keysUp: W (87)
- keysDown: S (83)
- keysLeft: A (65)
- keysRight: D (68)
- Mouse look via attachControl()

ArcRotateCamera for inspection mode (optional toggle):
- Mouse wheel zoom
- CTRL+drag panning
- Orbit controls
```

**Performance Strategy**:
1. Use `MeshBuilder.CreateBox()` for areas (simple geometry)
2. Enable thin instances if 100+ identical areas
3. Call `scene.freezeActiveMeshes()` for static content
4. Use ActionManager for hover (batched optimization)
5. Target: 30+ FPS guaranteed with proper setup

---

### 3. State Management: Zustand

**Decision**: Use Zustand with persist (IndexedDB) and temporal (undo/redo) middleware

**Rationale**:
- Minimal boilerplate (no providers, no context)
- Excellent performance with selective subscriptions
- Built-in persist middleware for IndexedDB storage
- Zundo middleware for undo/redo (<700 bytes)
- Works seamlessly with both Konva and Babylon.js

**Alternatives Considered**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| Redux Toolkit | Mature, devtools | More boilerplate, heavier | Rejected - overkill |
| Jotai | Atomic updates | Different mental model | Alternative option |
| Context API | Built-in | Performance issues with frequent updates | Rejected |

**Store Architecture**:
```
floorplanStore/
├── slices/
│   ├── projectSlice.ts    // Lot dimensions, metadata
│   ├── areasSlice.ts      // Area entities (CRUD operations)
│   ├── assetsSlice.ts     // Imported assets
│   └── viewerSlice.ts     // Selection, camera state, active view
└── index.ts               // Combined store with middleware
```

**Middleware Stack**:
```typescript
create(
  temporal(                    // Undo/redo with 50-state limit
    persist(                   // IndexedDB persistence
      immer((set, get) => ({   // Immutable updates
        ...projectSlice,
        ...areasSlice,
        ...assetsSlice,
        ...viewerSlice,
      })),
      { name: 'floorplan', storage: idbStorage }
    ),
    { limit: 50 }
  )
)
```

---

### 4. Build System & Framework

**Decision**: React 18+ with Vite

**Rationale**:
- Vite provides fastest dev server startup and HMR
- Native TypeScript support without extra config
- Smaller bundle size vs Create React App
- No SSR needed for this desktop-focused app

**Project Type**: Single frontend application (no backend for MVP)

---

### 5. Coordinate System Design

**Decision**: Unified meter-based coordinate system with pixel conversion

**Implementation**:
```
Internal storage: Millimeters (integers for precision)
Display: Meters with 2 decimal places
Canvas: Pixels via scale factor

PIXELS_PER_METER = 50 (configurable based on zoom)

Conversion functions:
- metersToPixels(m) => m * PIXELS_PER_METER
- pixelsToMeters(px) => px / PIXELS_PER_METER
- metersToMm(m) => Math.round(m * 1000)
- mmToMeters(mm) => mm / 1000
```

**2D Canvas Origin**: Top-left (0,0), Y increases downward
**3D Scene Origin**: Center of lot, Y is vertical (up)

**Synchronization**:
- Single store holds all positions in meters
- 2D renderer converts to canvas pixels
- 3D renderer uses meters directly (1 unit = 1 meter)

---

### 6. File Format for Projects

**Decision**: JSON with schema versioning

**Structure**:
```json
{
  "version": "1.0.0",
  "project": {
    "name": "My Floorplan",
    "created": "2025-12-30T00:00:00Z",
    "modified": "2025-12-30T00:00:00Z"
  },
  "lot": {
    "width": 50.0,
    "height": 30.0
  },
  "areas": [...],
  "assets": [...]
}
```

**Storage**:
- IndexedDB for auto-save (persist middleware)
- JSON export/import for sharing
- File extension: `.floorplan` (custom) or `.json`

---

## Resolved Clarifications

| Question | Resolution |
|----------|------------|
| 2D library choice | Konva.js - best balance of features/performance |
| 3D library choice | Babylon.js - game-like experience, built-in controls |
| State management | Zustand with persist + temporal middleware |
| Coordinate precision | Millimeters internal, meters display |
| Camera controls | FreeCamera (WASD) + optional ArcRotateCamera toggle |

---

## Performance Benchmarks (Expected)

| Metric | Target | Technology Enabler |
|--------|--------|-------------------|
| 2D render with 100 areas | 23+ FPS | Konva layer optimization |
| 3D render with 100 areas | 30+ FPS | Babylon.js thin instances |
| Drag/resize response | <50ms | Zustand selective subscriptions |
| View switch (2D↔3D) | <1s | Shared store, no data sync |
| Project load time | <500ms | IndexedDB async hydration |

---

## References

- [Konva.js Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)
- [Babylon.js Scene Optimization](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene)
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [react-babylonjs GitHub](https://github.com/brianzinn/react-babylonjs)
- [Zundo Undo/Redo](https://github.com/charkour/zundo)
