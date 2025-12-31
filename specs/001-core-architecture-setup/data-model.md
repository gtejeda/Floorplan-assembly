# Data Model: Floorplan Assembly

**Feature**: 001-core-architecture-setup
**Date**: 2025-12-30

## Overview

All measurements stored internally in **millimeters** (integers) for precision.
Display and API use **meters** (floats with 3 decimal places max).

## Core Entities

### Project

The root container for a complete floorplan.

```typescript
interface Project {
  id: string;                    // UUID v4
  name: string;                  // User-defined project name
  version: string;               // Schema version (semver)
  created: string;               // ISO 8601 timestamp
  modified: string;              // ISO 8601 timestamp
  lot: Lot;                      // Base property dimensions
  areas: Area[];                 // Collection of defined zones
  assets: Asset[];               // Collection of imported assets
}
```

**Validation Rules**:
- `name`: Required, 1-100 characters
- `version`: Must match semver pattern
- `created`: Immutable after initial save
- `modified`: Auto-updated on any change

---

### Lot

The base property boundary defining the working canvas.

```typescript
interface Lot {
  width: number;                 // Width in meters (0.001 - 10000)
  height: number;                // Height/depth in meters (0.001 - 10000)
  gridSize: number;              // Grid spacing in meters (default: 1.0)
  unit: 'meters' | 'feet';       // Display unit (internal always meters)
}
```

**Validation Rules**:
- `width`: Must be > 0, max 10,000 meters
- `height`: Must be > 0, max 10,000 meters
- `gridSize`: Must be > 0, typical values: 0.5, 1.0, 5.0, 10.0

**Derived Properties**:
- `totalArea`: width × height (square meters)
- `aspectRatio`: width / height

---

### Area

A defined zone within the lot representing a functional space.

```typescript
interface Area {
  id: string;                    // UUID v4
  name: string;                  // User-defined label
  type: AreaType;                // Category for styling/grouping

  // Position (meters from lot origin, top-left)
  x: number;                     // X position (0 to lot.width)
  y: number;                     // Y position (0 to lot.height)

  // Dimensions (meters)
  width: number;                 // Width (> 0)
  height: number;                // Height/depth (> 0)
  elevation: number;             // 3D height/stories (> 0, default: 3.0)

  // Appearance
  color: string;                 // Hex color code (#RRGGBB)
  opacity: number;               // 0.0 - 1.0 (default: 0.7)

  // Metadata
  locked: boolean;               // Prevent editing
  visible: boolean;              // Show/hide in views
  zIndex: number;                // Stacking order in 2D
}

type AreaType =
  | 'house'
  | 'pool'
  | 'court'
  | 'lounge'
  | 'garden'
  | 'parking'
  | 'custom';
```

**Validation Rules**:
- `name`: Required, 1-50 characters
- `x`: Must be >= 0
- `y`: Must be >= 0
- `width`: Must be > 0
- `height`: Must be > 0
- `elevation`: Must be > 0, max 100 meters
- `color`: Valid hex color
- `opacity`: 0.0 to 1.0

**Derived Properties**:
- `area`: width × height (square meters)
- `volume`: width × height × elevation (cubic meters)
- `centerX`: x + width / 2
- `centerY`: y + height / 2
- `bounds`: { minX: x, minY: y, maxX: x + width, maxY: y + height }

**State Transitions**:
```
[Created] → [Placed] → [Selected] → [Editing] → [Placed]
                ↓           ↓
            [Locked]    [Deleted]
```

---

### Asset

An imported visual element (2D image or 3D model).

```typescript
interface Asset {
  id: string;                    // UUID v4
  name: string;                  // User-defined or filename
  type: AssetType;               // 2D or 3D

  // Source
  sourceUrl: string;             // Data URL or blob reference
  originalFilename: string;      // Original file name
  mimeType: string;              // MIME type (image/png, model/gltf+json)

  // Position (meters from lot origin)
  x: number;
  y: number;

  // Real-world dimensions (user-specified at import)
  width: number;                 // Width in meters
  height: number;                // Height/depth in meters
  depth: number;                 // 3D depth (for 3D models only)

  // Transform
  rotation: number;              // Rotation in degrees (0-360)
  scale: number;                 // Uniform scale factor (default: 1.0)

  // Metadata
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

type AssetType = 'image' | 'model';
```

**Validation Rules**:
- `width`: Must be > 0 (user MUST specify at import)
- `height`: Must be > 0 (user MUST specify at import)
- `sourceUrl`: Valid data URL or blob reference
- `mimeType`: One of: image/png, image/jpeg, image/svg+xml, model/gltf+json, model/gltf-binary

**Supported File Formats**:
- Images: PNG, JPG, SVG
- 3D Models: GLTF, GLB

---

### ViewerState

Runtime state for the viewer (not persisted in project file).

```typescript
interface ViewerState {
  activeView: '2d' | '3d';

  // Selection
  selectedIds: string[];         // IDs of selected areas/assets
  hoveredId: string | null;      // ID of hovered element

  // 2D Canvas State
  canvas2d: {
    zoom: number;                // Scale factor (0.1 - 10.0)
    panX: number;                // Pan offset X (pixels)
    panY: number;                // Pan offset Y (pixels)
  };

  // 3D Camera State
  camera3d: {
    position: Vector3;           // Camera position
    target: Vector3;             // Look-at target
    fov: number;                 // Field of view (degrees)
  };

  // UI State
  activeTool: Tool;
  showGrid: boolean;
  showLabels: boolean;
  showTooltips: boolean;
}

type Tool = 'select' | 'pan' | 'area' | 'import';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}
```

---

## Relationships

```
Project (1) ──────┬────── (1) Lot
                  │
                  ├────── (*) Area
                  │
                  └────── (*) Asset

Area (*)  ←─ overlaps ─→ (*) Area   [computed at runtime]
```

---

## Internal Storage Format

### IndexedDB Schema

```typescript
// Database: floorplan-assembly
// Object Stores:

interface ProjectStore {
  key: string;                   // project.id
  value: Project;
}

interface AssetBlobStore {
  key: string;                   // asset.id
  value: Blob;                   // Raw file data
}
```

---

## Export Format (JSON)

```json
{
  "version": "1.0.0",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Beach House Layout",
    "created": "2025-12-30T10:00:00Z",
    "modified": "2025-12-30T15:30:00Z"
  },
  "lot": {
    "width": 50.0,
    "height": 30.0,
    "gridSize": 1.0,
    "unit": "meters"
  },
  "areas": [
    {
      "id": "area-001",
      "name": "Main House",
      "type": "house",
      "x": 10.0,
      "y": 5.0,
      "width": 15.0,
      "height": 12.0,
      "elevation": 6.0,
      "color": "#4A90D9",
      "opacity": 0.7,
      "locked": false,
      "visible": true,
      "zIndex": 1
    },
    {
      "id": "area-002",
      "name": "Pool",
      "type": "pool",
      "x": 30.0,
      "y": 10.0,
      "width": 10.0,
      "height": 5.0,
      "elevation": 1.5,
      "color": "#00BFFF",
      "opacity": 0.8,
      "locked": false,
      "visible": true,
      "zIndex": 2
    }
  ],
  "assets": []
}
```

---

## Type Definitions Summary

```typescript
// src/models/types.ts

export interface Project { ... }
export interface Lot { ... }
export interface Area { ... }
export interface Asset { ... }
export interface ViewerState { ... }

export type AreaType = 'house' | 'pool' | 'court' | 'lounge' | 'garden' | 'parking' | 'custom';
export type AssetType = 'image' | 'model';
export type Tool = 'select' | 'pan' | 'area' | 'import';
export type ViewMode = '2d' | '3d';
```
