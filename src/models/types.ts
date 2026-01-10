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

export type ViewMode = '2d';

export type DisplayUnit = 'meters' | 'feet';

export type Currency = 'USD' | 'DOP';

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

export type StorageType = 'dedicated' | 'patio';

export type AmenityCategory =
  | 'aquatic'      // Pools, jacuzzis, water features
  | 'dining'       // BBQ, outdoor kitchens, pavilions
  | 'recreation'   // Sports courts, playgrounds, game areas
  | 'furniture'    // Chairs, tables, umbrellas, cabanas
  | 'utilities';   // Bathrooms, storage, landscaping, parking

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

// ==================== Investment Entities ====================

/**
 * Image reference stored as blob data in IndexedDB
 * Per spec FR-052: Store blobs (not file paths) for portability
 */
export interface ImageReference {
  id: string;
  originalFilename: string;
  blobData: Blob | null;      // Actual image data
  mimeType: string;            // 'image/jpeg', 'image/png', 'image/webp'
  sizeBytes: number;           // File size for validation
  uploadedAt: string;          // ISO date string
}

/**
 * Land Parcel - Main investment property
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
  totalMonthlyMaintenance: number;      // User input: total monthly maintenance cost
  monthlyMaintenancePerOwner: number;   // Based on common area % (FR-043)

  // Currency
  currency: Currency;         // 'USD' | 'DOP'
  exchangeRate: number;       // DOP per USD (user-updatable, default ~58.5)

  // Timestamps
  calculatedAt: string;       // ISO date string
  lastUpdatedAt: string;
}

/**
 * Investment Project - Complete Micro Villas investment package
 * Extends the existing Project interface with investment-specific data
 */
export interface InvestmentProject extends Project {
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

// ==================== Viewer State ====================

export interface Canvas2DState {
  zoom: number;       // Scale factor (0.1 - 10.0)
  panX: number;       // Pan offset X (pixels)
  panY: number;       // Pan offset Y (pixels)
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

export const DEFAULT_VIEWER_STATE: ViewerState = {
  activeView: '2d',
  selectedIds: [],
  hoveredId: null,
  activeTool: 'select',
  showGrid: true,
  showLabels: true,
  showTooltips: true,
  canvas2d: DEFAULT_CANVAS_2D_STATE,
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

// ==================== Investment Validation ====================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

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

/**
 * Validate Micro Villa lot meets minimum requirements
 * Per spec FR-018: Minimum 90 sqm
 */
export function validateMicroVillaLot(lot: MicroVillaLot): boolean {
  return lot.area >= 90;  // sqm
}

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

  // Check that all lot common area percentages sum to 100% within 0.01% tolerance (FR-015)
  const totalCommonAreaPercentage = scenario.lots.reduce((sum, lot) => sum + lot.commonAreaPercentage, 0);
  const percentageSumValid = Math.abs(totalCommonAreaPercentage - 100) < 0.01;

  return allLotsValid && validPercentage && hasLots && percentageSumValid;
}

// ==================== Investment Calculations ====================

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

/**
 * Helper to get actual cost (custom or default)
 */
export function getAmenityCost(amenity: Amenity): number {
  return amenity.customCost ?? amenity.defaultCostUSD;
}
