# Store API Contract

**Feature**: 001-core-architecture-setup
**Date**: 2025-12-30

## Overview

This document defines the Zustand store API for the Floorplan Assembly application.
The store serves as the single source of truth for both 2D (Konva) and 3D (Babylon.js) views.

---

## Store Structure

```typescript
interface FloorplanStore {
  // === PROJECT STATE ===
  project: Project | null;

  // === VIEWER STATE ===
  activeView: '2d' | '3d';
  selectedIds: string[];
  hoveredId: string | null;
  activeTool: Tool;

  // === CANVAS STATE ===
  canvas2d: Canvas2DState;
  camera3d: Camera3DState;

  // === UI STATE ===
  showGrid: boolean;
  showLabels: boolean;

  // === ACTIONS ===
  // Project
  createProject: (name: string, lot: Lot) => void;
  loadProject: (project: Project) => void;
  saveProject: () => Promise<void>;
  exportProject: () => string;
  importProject: (json: string) => void;

  // Lot
  updateLot: (lot: Partial<Lot>) => void;

  // Areas
  addArea: (area: Omit<Area, 'id'>) => string;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (id: string) => void;
  duplicateArea: (id: string) => string;

  // Assets
  addAsset: (asset: Omit<Asset, 'id'>, file: File) => Promise<string>;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Selection
  select: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // View
  setActiveView: (view: '2d' | '3d') => void;
  setActiveTool: (tool: Tool) => void;
  setHoveredId: (id: string | null) => void;

  // Canvas 2D
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;

  // Camera 3D
  setCameraPosition: (position: Vector3) => void;
  setCameraTarget: (target: Vector3) => void;

  // UI
  toggleGrid: () => void;
  toggleLabels: () => void;

  // History (from temporal middleware)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

---

## Action Contracts

### Project Actions

#### `createProject(name, lot)`

Creates a new empty project with the specified lot dimensions.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Project name (1-100 chars) |
| lot | Lot | Yes | Lot dimensions |

**Returns**: `void`

**Side Effects**:
- Clears existing project state
- Initializes empty areas and assets arrays
- Sets `created` and `modified` timestamps
- Resets viewer state to defaults

**Example**:
```typescript
store.createProject('Beach House', {
  width: 50,
  height: 30,
  gridSize: 1.0,
  unit: 'meters'
});
```

---

#### `loadProject(project)`

Loads a complete project from persisted or imported data.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| project | Project | Yes | Complete project object |

**Returns**: `void`

**Validation**:
- Validates schema version compatibility
- Validates all area and asset IDs are unique
- Validates lot dimensions are positive

---

#### `saveProject()`

Persists current project to IndexedDB.

**Returns**: `Promise<void>`

**Side Effects**:
- Updates `modified` timestamp
- Writes to IndexedDB asynchronously

---

#### `exportProject()`

Exports current project as JSON string.

**Returns**: `string` - Serialized project JSON

---

### Area Actions

#### `addArea(area)`

Adds a new area to the project.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| area | Omit<Area, 'id'> | Yes | Area without ID |

**Returns**: `string` - Generated UUID for the new area

**Defaults Applied**:
```typescript
{
  color: '#4A90D9',
  opacity: 0.7,
  elevation: 3.0,
  locked: false,
  visible: true,
  zIndex: nextAvailableZIndex()
}
```

**Example**:
```typescript
const id = store.addArea({
  name: 'Pool',
  type: 'pool',
  x: 10,
  y: 5,
  width: 10,
  height: 5
});
```

---

#### `updateArea(id, updates)`

Updates an existing area's properties.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Area UUID |
| updates | Partial<Area> | Yes | Properties to update |

**Returns**: `void`

**Validation**:
- Ignores update if area is locked (unless unlocking)
- Validates dimensions > 0
- Validates position >= 0

**Example**:
```typescript
store.updateArea('area-001', {
  x: 15,
  y: 10,
  width: 12
});
```

---

#### `deleteArea(id)`

Removes an area from the project.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Area UUID |

**Returns**: `void`

**Side Effects**:
- Removes from `selectedIds` if selected
- Clears `hoveredId` if hovered

---

### Selection Actions

#### `select(ids)`

Replaces current selection with new IDs.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| ids | string[] | Yes | Array of area/asset IDs |

**Example**:
```typescript
store.select(['area-001', 'area-002']);
```

---

#### `addToSelection(id)`

Adds an item to current selection (multi-select).

**Example**:
```typescript
// Shift+click behavior
store.addToSelection('area-003');
```

---

### View Actions

#### `setActiveView(view)`

Switches between 2D and 3D views.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| view | '2d' \| '3d' | Yes | Target view mode |

**Side Effects**:
- Triggers view transition animation
- Preserves selection across views

---

#### `setZoom(zoom)`

Sets 2D canvas zoom level.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| zoom | number | Yes | Scale factor (0.1 - 10.0) |

**Validation**:
- Clamps to min/max range
- Applies zoom relative to canvas center

---

## Selectors (Derived State)

```typescript
// Computed values (memoized)
const selectors = {
  // Get total used area in square meters
  usedArea: (state) =>
    state.project?.areas.reduce((sum, a) => sum + a.width * a.height, 0) ?? 0,

  // Get remaining lot area
  remainingArea: (state) => {
    const lot = state.project?.lot;
    if (!lot) return 0;
    return lot.width * lot.height - selectors.usedArea(state);
  },

  // Get area breakdown by type
  areasByType: (state) =>
    Object.groupBy(state.project?.areas ?? [], a => a.type),

  // Get selected areas
  selectedAreas: (state) =>
    state.project?.areas.filter(a => state.selectedIds.includes(a.id)) ?? [],

  // Check for overlapping areas
  overlappingAreas: (state) => {
    // Returns pairs of overlapping area IDs with overlap amount
    // Implementation uses AABB intersection
  },

  // Get area by ID
  areaById: (id: string) => (state) =>
    state.project?.areas.find(a => a.id === id),
};
```

---

## Events / Subscriptions

```typescript
// Subscribe to specific state changes
const unsubscribe = useFloorplanStore.subscribe(
  (state) => state.project?.areas,
  (areas) => {
    // Called when areas change
    console.log('Areas updated:', areas);
  }
);

// Subscribe to selection changes
const unsubscribe = useFloorplanStore.subscribe(
  (state) => state.selectedIds,
  (selectedIds) => {
    // Update selection highlights in renderers
  }
);
```

---

## Persistence Contract

### IndexedDB Storage

**Database**: `floorplan-assembly`
**Version**: 1

**Object Stores**:

| Store | Key | Value |
|-------|-----|-------|
| projects | project.id | Project (full object) |
| assets | asset.id | Blob (raw file data) |

### Auto-Save Behavior

- Debounced save on any state change (500ms delay)
- Immediate save on `saveProject()` call
- Recovery on app reload via hydration

---

## History (Undo/Redo)

Temporal middleware configuration:

```typescript
{
  limit: 50,                    // Max history states
  equality: (a, b) => false,    // Always track changes
  partialize: (state) => ({
    // Only track these for undo/redo
    project: state.project,
    selectedIds: state.selectedIds,
  }),
}
```

**Tracked Actions**:
- Area CRUD operations
- Asset CRUD operations
- Lot dimension changes
- Selection changes

**Not Tracked**:
- View mode changes
- Zoom/pan changes
- Hover state
- Camera position
