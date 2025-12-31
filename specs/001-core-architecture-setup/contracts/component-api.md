# Component API Contract

**Feature**: 001-core-architecture-setup
**Date**: 2025-12-30

## Overview

This document defines the React component contracts for the Floorplan Assembly application.

---

## Component Hierarchy

```
<App>
├── <Header>
│   ├── <ProjectName />
│   ├── <Toolbar />
│   └── <ViewToggle />
├── <Main>
│   ├── <Canvas2D />          // Konva stage
│   └── <Viewer3D />          // Babylon scene
├── <Sidebar>
│   ├── <LotPanel />
│   ├── <AreaList />
│   ├── <AreaProperties />
│   └── <AssetLibrary />
└── <StatusBar>
    ├── <Coordinates />
    └── <AreaSummary />
```

---

## Core Components

### Canvas2D

2D floorplan editor using Konva.js

```typescript
interface Canvas2DProps {
  // No props - reads from store
}

// Internal state managed by component
// - Konva Stage ref
// - Layer refs (grid, areas, labels)
// - Transformer ref

// Store subscriptions
// - project.lot (for canvas size)
// - project.areas (for rendering)
// - selectedIds (for transformer)
// - canvas2d (zoom, pan)
// - showGrid, showLabels
```

**Responsibilities**:
- Render grid overlay based on lot dimensions
- Render areas as rectangles with labels
- Handle drag/drop for repositioning
- Handle resize via Transformer
- Emit coordinate updates on hover
- Support zoom (wheel) and pan (drag)

**Events Emitted**:
```typescript
// Via store actions
onAreaDrag(id: string, x: number, y: number): void
onAreaResize(id: string, width: number, height: number): void
onAreaSelect(id: string, additive: boolean): void
onCanvasClick(): void  // deselect
onCoordinateHover(x: number, y: number): void
```

---

### Viewer3D

3D floorplan viewer using Babylon.js

```typescript
interface Viewer3DProps {
  // No props - reads from store
}

// Internal state
// - Babylon Engine ref
// - Scene ref
// - Camera ref (FreeCamera)
// - Ground mesh ref

// Store subscriptions
// - project.lot (for ground plane)
// - project.areas (for 3D boxes)
// - selectedIds (for highlight)
// - hoveredId (for tooltip)
```

**Responsibilities**:
- Render ground plane matching lot dimensions
- Render areas as extruded boxes
- Handle WASD keyboard navigation
- Handle mouse look/orbit
- Handle scroll wheel zoom
- Show tooltips on hover
- Highlight selected areas

**Camera Controls**:
```typescript
// FreeCamera configuration
{
  keysUp: [87],      // W
  keysDown: [83],    // S
  keysLeft: [65],    // A
  keysRight: [68],   // D
  speed: 0.5,        // Movement speed
  angularSpeed: 0.005  // Look sensitivity
}
```

---

### Toolbar

Main action toolbar

```typescript
interface ToolbarProps {
  // No props - reads from store
}
```

**Buttons**:
| Button | Action | Keyboard |
|--------|--------|----------|
| Select | setActiveTool('select') | V |
| Pan | setActiveTool('pan') | H |
| Add Area | setActiveTool('area') | A |
| Import | openImportDialog() | I |
| Undo | undo() | Ctrl+Z |
| Redo | redo() | Ctrl+Shift+Z |
| Save | saveProject() | Ctrl+S |
| Export | exportProject() | Ctrl+E |

---

### ViewToggle

Switch between 2D and 3D views

```typescript
interface ViewToggleProps {
  // No props - reads from store
}
```

**UI**:
```
[2D] [3D]   ← Toggle buttons
```

**Behavior**:
- Calls `setActiveView()`
- Animates transition between views
- Preserves selection across views

---

### LotPanel

Edit lot dimensions

```typescript
interface LotPanelProps {
  // No props - reads from store
}
```

**Fields**:
| Field | Type | Validation |
|-------|------|------------|
| Width | number input | > 0, <= 10000 |
| Height | number input | > 0, <= 10000 |
| Grid Size | select | 0.5, 1.0, 5.0, 10.0 |

**Actions**:
- `updateLot()` on field change (debounced)

---

### AreaList

List of all areas with selection

```typescript
interface AreaListProps {
  // No props - reads from store
}
```

**Features**:
- List all areas with name, type icon, area (m²)
- Click to select (single)
- Shift+click to add to selection
- Drag to reorder (z-index)
- Right-click context menu
- Visibility toggle per area
- Lock toggle per area

**Context Menu**:
```
- Duplicate
- Delete
- Lock/Unlock
- Bring to Front
- Send to Back
```

---

### AreaProperties

Edit selected area properties

```typescript
interface AreaPropertiesProps {
  // No props - reads from store (selectedAreas)
}
```

**Fields** (when single selection):
| Field | Type | Notes |
|-------|------|-------|
| Name | text input | 1-50 chars |
| Type | select | AreaType enum |
| X | number | meters |
| Y | number | meters |
| Width | number | meters |
| Height | number | meters |
| Elevation | number | meters (3D height) |
| Color | color picker | hex |
| Opacity | slider | 0-100% |

**Multi-selection**:
- Show common fields only (type, color, opacity)
- Apply changes to all selected

---

### AreaCreateDialog

Modal for creating new areas

```typescript
interface AreaCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}
```

**Fields**:
| Field | Default | Required |
|-------|---------|----------|
| Name | "New Area" | Yes |
| Type | "custom" | Yes |
| Width | 10 | Yes |
| Height | 10 | Yes |
| Elevation | 3 | Yes |

**Actions**:
- Create → `addArea()` + close
- Cancel → close

---

### AssetImportDialog

Modal for importing assets

```typescript
interface AssetImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
}
```

**Fields**:
| Field | Description | Required |
|-------|-------------|----------|
| Name | Asset name | Yes |
| Width | Real-world width (m) | Yes |
| Height | Real-world height (m) | Yes |
| Preview | File preview | Display only |

**Validation**:
- Width and Height MUST be > 0
- MUST be specified before import (no auto-scale)

---

### Coordinates

Status bar coordinate display

```typescript
interface CoordinatesProps {
  // No props - reads from store
}
```

**Display**:
```
X: 12.35m  Y: 8.72m
```

Updates on mouse move over canvas (throttled 60fps).

---

### AreaSummary

Status bar area statistics

```typescript
interface AreaSummaryProps {
  // No props - reads from store (selectors)
}
```

**Display**:
```
Total: 1500 m²  |  Used: 850 m² (57%)  |  Remaining: 650 m²
```

---

## Shared Components

### Tooltip

Hover tooltip for areas

```typescript
interface TooltipProps {
  content: React.ReactNode;
  position: { x: number; y: number };
  visible: boolean;
}
```

**Used In**: Canvas2D, Viewer3D

**Content Example**:
```
Pool Area
10m × 5m = 50 m²
Height: 1.5m
```

---

### ColorPicker

Color selection component

```typescript
interface ColorPickerProps {
  value: string;           // Hex color
  onChange: (color: string) => void;
  presets?: string[];      // Preset colors
}
```

**Presets by Area Type**:
```typescript
{
  house: ['#4A90D9', '#5C6BC0', '#7E57C2'],
  pool: ['#00BCD4', '#00ACC1', '#0097A7'],
  court: ['#8BC34A', '#7CB342', '#689F38'],
  lounge: ['#FF9800', '#FB8C00', '#F57C00'],
  garden: ['#4CAF50', '#43A047', '#388E3C'],
  parking: ['#9E9E9E', '#757575', '#616161'],
  custom: ['#E91E63', '#9C27B0', '#673AB7'],
}
```

---

## Keyboard Shortcuts

Global shortcuts (always active):

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save |
| Ctrl+E | Export |
| Delete/Backspace | Delete selected |
| Escape | Deselect all |
| Ctrl+A | Select all |
| Ctrl+D | Duplicate selected |

View-specific shortcuts:

| Shortcut | 2D Action | 3D Action |
|----------|-----------|-----------|
| V | Select tool | - |
| H | Pan tool | - |
| A | Add area tool | - |
| G | Toggle grid | Toggle grid |
| L | Toggle labels | - |
| Tab | Switch to 3D | Switch to 2D |
| WASD | - | Camera movement |

---

## Component-Store Interaction Pattern

```typescript
// Example: AreaProperties component

function AreaProperties() {
  // Subscribe to selected areas
  const selectedAreas = useFloorplanStore(
    useShallow(state =>
      state.selectedIds
        .map(id => state.project?.areas.find(a => a.id === id))
        .filter(Boolean)
    )
  );

  // Get action
  const updateArea = useFloorplanStore(state => state.updateArea);

  // Single selection
  if (selectedAreas.length === 1) {
    const area = selectedAreas[0];
    return (
      <Panel>
        <TextInput
          label="Name"
          value={area.name}
          onChange={(name) => updateArea(area.id, { name })}
        />
        {/* ... other fields */}
      </Panel>
    );
  }

  // Multi selection
  if (selectedAreas.length > 1) {
    return <MultiSelectPanel areas={selectedAreas} />;
  }

  // No selection
  return <EmptyState message="Select an area to edit properties" />;
}
```
