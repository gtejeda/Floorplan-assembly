/**
 * Core type definitions for Floorplan Assembly application
 * All measurements stored internally in meters (display) and millimeters (storage)
 */

// ==================== Enums and Type Unions ====================

export type AreaType =
  | 'house'
  | 'pool'
  | 'court'
  | 'lounge'
  | 'garden'
  | 'parking'
  | 'door'
  | 'window'
  | 'void'
  | 'column'
  | 'stairs'
  | 'wall'
  | 'custom';

export type AssetType = 'image' | 'model' | 'video';

export type Tool = 'select' | 'pan' | 'area' | 'import';

export type ViewMode = '2d' | '3d';

export type DisplayUnit = 'meters' | 'feet';

// ==================== Vector Types ====================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ==================== Core Entities ====================

/**
 * Project - The root container for a complete floorplan
 */
export interface Project {
  id: string;
  name: string;
  version: string;
  created: string;
  modified: string;
  lot: Lot;
  areas: Area[];
  assets: Asset[];
}

/**
 * Lot - The base property boundary defining the working canvas
 */
export interface Lot {
  width: number;      // Width in meters (0.001 - 10000)
  height: number;     // Height/depth in meters (0.001 - 10000)
  gridSize: number;   // Grid spacing in meters (default: 1.0)
  unit: DisplayUnit;  // Display unit (internal always meters)
  description: string; // Project description for AI rendering (style, environment, lighting)
}

/**
 * Area - A defined zone within the lot representing a functional space
 */
export interface Area {
  id: string;
  name: string;
  type: AreaType;

  // Position (meters from lot origin, top-left)
  x: number;
  y: number;

  // Dimensions (meters)
  width: number;
  height: number;
  elevation: number;  // 3D height of the box (> 0, default: 3.0)
  baseHeight: number; // Height from ground to bottom of area (for windows, elevated platforms)
  rotation: number;   // Rotation in degrees (0, 90, 180, 270) for attaching to different walls

  // Appearance
  color: string;      // Hex color code (#RRGGBB)
  opacity: number;    // 0.0 - 1.0 (default: 0.7)

  // Metadata
  description: string; // User description for AI rendering (materials, style, details)
  locked: boolean;
  visible: boolean;
  zIndex: number;

  // Assets attached to this area (reference images, 3D models, videos)
  assets: Asset[];
}

/**
 * Asset - An imported visual element (2D image or 3D model)
 */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;

  // Source
  sourceUrl: string;
  originalFilename: string;
  mimeType: string;

  // Position (meters from lot origin)
  x: number;
  y: number;

  // Real-world dimensions (user-specified at import)
  width: number;
  height: number;
  depth: number;      // 3D depth (for 3D models only)

  // Transform
  rotation: number;   // Rotation in degrees (0-360)
  scale: number;      // Uniform scale factor (default: 1.0)

  // Metadata
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

// ==================== Viewer State ====================

export interface Canvas2DState {
  zoom: number;       // Scale factor (0.1 - 10.0)
  panX: number;       // Pan offset X (pixels)
  panY: number;       // Pan offset Y (pixels)
}

export interface Camera3DState {
  position: Vector3;
  target: Vector3;
  fov: number;        // Field of view (degrees)
}

/**
 * ViewerState - Runtime state for the viewer (not persisted in project file)
 */
export interface ViewerState {
  activeView: ViewMode;
  selectedIds: string[];
  hoveredId: string | null;
  activeTool: Tool;
  showGrid: boolean;
  showLabels: boolean;
  showTooltips: boolean;
  canvas2d: Canvas2DState;
  camera3d: Camera3DState;
}

// ==================== Default Values ====================

export const DEFAULT_LOT: Lot = {
  width: 50,
  height: 30,
  gridSize: 1.0,
  unit: 'meters',
  description: '',
};

export const DEFAULT_AREA_COLORS: Record<AreaType, string> = {
  house: '#4A90D9',
  pool: '#00BCD4',
  court: '#8BC34A',
  lounge: '#FF9800',
  garden: '#4CAF50',
  parking: '#9E9E9E',
  door: '#8B4513',     // Brown for doors
  window: '#87CEEB',   // Light blue for glass
  void: '#2C2C2C',     // Dark gray for voids/openings
  column: '#708090',   // Slate gray for structural columns
  stairs: '#A0522D',   // Sienna for stairs
  wall: '#D3D3D3',     // Light gray for walls
  custom: '#E91E63',
};

// Special rendering properties for certain area types
export const AREA_TYPE_PROPERTIES: Record<AreaType, {
  isTransparent?: boolean;  // Render with high transparency (windows)
  isWireframe?: boolean;    // Render as wireframe only (voids)
  defaultOpacity?: number;  // Override default opacity
  defaultElevation?: number; // Override default elevation (height of box)
  defaultBaseHeight?: number; // Override default base height (height from ground)
  defaultWidth?: number;    // Override default width (meters)
  defaultHeight?: number;   // Override default height/depth (meters)
  allowZeroWidth?: boolean; // Allow width to be 0 (for thin elements)
  allowZeroHeight?: boolean; // Allow height to be 0 (for thin elements)
}> = {
  house: {},
  pool: { defaultElevation: -1.5 },
  court: { defaultElevation: 0 },
  lounge: {},
  garden: { defaultElevation: 0.1 },
  parking: { defaultElevation: 0 },
  door: {
    defaultElevation: 2.1,
    defaultBaseHeight: 0,     // Doors start at ground level
    defaultOpacity: 0.9,
    defaultWidth: 0.9,
    defaultHeight: 0.1,
    allowZeroWidth: true,
    allowZeroHeight: true,
  },
  window: {
    isTransparent: true,
    defaultOpacity: 0.3,
    defaultElevation: 1.2,    // Window height ~1.2m
    defaultBaseHeight: 1.0,   // Windows start 1m from ground
    defaultWidth: 1.2,
    defaultHeight: 0.1,
    allowZeroWidth: true,
    allowZeroHeight: true,
  },
  void: { isWireframe: true, defaultOpacity: 0.2 },
  column: { defaultOpacity: 1.0, defaultWidth: 0.3, defaultHeight: 0.3 },
  stairs: { defaultOpacity: 0.85, defaultWidth: 1.0, defaultHeight: 3.0 },
  wall: { defaultOpacity: 0.95, defaultWidth: 0.2, defaultHeight: 5.0, allowZeroWidth: true },
  custom: {},
};

export const DEFAULT_CANVAS_2D_STATE: Canvas2DState = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
};

export const DEFAULT_CAMERA_3D_STATE: Camera3DState = {
  position: { x: 0, y: 50, z: -50 },
  target: { x: 0, y: 0, z: 0 },
  fov: 45,
};

export const DEFAULT_VIEWER_STATE: ViewerState = {
  activeView: '2d',
  selectedIds: [],
  hoveredId: null,
  activeTool: 'select',
  showGrid: true,
  showLabels: true,
  showTooltips: true,
  canvas2d: DEFAULT_CANVAS_2D_STATE,
  camera3d: DEFAULT_CAMERA_3D_STATE,
};

// ==================== Factory Functions ====================

export function createDefaultArea(
  partial: Partial<Area> & Pick<Area, 'name' | 'type' | 'x' | 'y' | 'width' | 'height'>
): Omit<Area, 'id'> {
  return {
    name: partial.name,
    type: partial.type,
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    elevation: partial.elevation ?? 3.0,
    baseHeight: partial.baseHeight ?? 0,
    rotation: partial.rotation ?? 0,
    color: partial.color ?? DEFAULT_AREA_COLORS[partial.type],
    opacity: partial.opacity ?? 0.7,
    description: partial.description ?? '',
    locked: partial.locked ?? false,
    visible: partial.visible ?? true,
    zIndex: partial.zIndex ?? 0,
    assets: partial.assets ?? [],
  };
}

export function createDefaultAsset(
  partial: Partial<Asset> & Pick<Asset, 'name' | 'type' | 'sourceUrl' | 'originalFilename' | 'mimeType' | 'width' | 'height'>
): Omit<Asset, 'id'> {
  return {
    name: partial.name,
    type: partial.type,
    sourceUrl: partial.sourceUrl,
    originalFilename: partial.originalFilename,
    mimeType: partial.mimeType,
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    width: partial.width,
    height: partial.height,
    depth: partial.depth ?? 0,
    rotation: partial.rotation ?? 0,
    scale: partial.scale ?? 1.0,
    locked: partial.locked ?? false,
    visible: partial.visible ?? true,
    zIndex: partial.zIndex ?? 0,
  };
}
