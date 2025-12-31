/**
 * Coordinate conversion utilities
 *
 * Internal storage: Millimeters (integers for precision)
 * Display: Meters with 3 decimal places
 * Canvas: Pixels via scale factor
 * 3D Scene: Meters (1 unit = 1 meter)
 */

/**
 * Default pixels per meter for canvas rendering
 * Can be adjusted based on zoom level
 */
export const PIXELS_PER_METER = 50;

/**
 * Convert meters to pixels for 2D canvas rendering
 */
export function metersToPixels(meters: number, pixelsPerMeter = PIXELS_PER_METER): number {
  return meters * pixelsPerMeter;
}

/**
 * Convert pixels to meters from 2D canvas coordinates
 */
export function pixelsToMeters(pixels: number, pixelsPerMeter = PIXELS_PER_METER): number {
  return pixels / pixelsPerMeter;
}

/**
 * Convert meters to millimeters for internal storage
 */
export function metersToMm(meters: number): number {
  return Math.round(meters * 1000);
}

/**
 * Convert millimeters to meters for display
 */
export function mmToMeters(mm: number): number {
  return mm / 1000;
}

/**
 * Format meters for display with specified decimal places
 */
export function formatMeters(meters: number, decimals = 2): string {
  return `${meters.toFixed(decimals)}m`;
}

/**
 * Format square meters for display
 */
export function formatSquareMeters(sqMeters: number, decimals = 2): string {
  return `${sqMeters.toFixed(decimals)} m²`;
}

/**
 * Convert canvas coordinates to world coordinates (meters)
 */
export function canvasToWorld(
  canvasX: number,
  canvasY: number,
  zoom: number,
  panX: number,
  panY: number,
  pixelsPerMeter = PIXELS_PER_METER
): { x: number; y: number } {
  const adjustedX = (canvasX - panX) / zoom;
  const adjustedY = (canvasY - panY) / zoom;
  return {
    x: pixelsToMeters(adjustedX, pixelsPerMeter),
    y: pixelsToMeters(adjustedY, pixelsPerMeter),
  };
}

/**
 * Convert world coordinates (meters) to canvas coordinates
 */
export function worldToCanvas(
  worldX: number,
  worldY: number,
  zoom: number,
  panX: number,
  panY: number,
  pixelsPerMeter = PIXELS_PER_METER
): { x: number; y: number } {
  const canvasX = metersToPixels(worldX, pixelsPerMeter) * zoom + panX;
  const canvasY = metersToPixels(worldY, pixelsPerMeter) * zoom + panY;
  return { x: canvasX, y: canvasY };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ==================== Unit Conversion ====================

/**
 * Conversion factor: 1 meter = 3.28084 feet
 */
export const METERS_TO_FEET = 3.28084;
export const FEET_TO_METERS = 1 / METERS_TO_FEET;

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * METERS_TO_FEET;
}

/**
 * Convert feet to meters
 */
export function feetToMeters(feet: number): number {
  return feet * FEET_TO_METERS;
}

/**
 * Convert a value from meters to the specified display unit
 */
export function metersToDisplayUnit(meters: number, unit: 'meters' | 'feet'): number {
  return unit === 'feet' ? metersToFeet(meters) : meters;
}

/**
 * Convert a value from the specified display unit to meters
 */
export function displayUnitToMeters(value: number, unit: 'meters' | 'feet'): number {
  return unit === 'feet' ? feetToMeters(value) : value;
}

/**
 * Format a length value for display with the appropriate unit suffix
 */
export function formatLength(meters: number, unit: 'meters' | 'feet', decimals = 2): string {
  if (unit === 'feet') {
    return `${metersToFeet(meters).toFixed(decimals)} ft`;
  }
  return `${meters.toFixed(decimals)} m`;
}

/**
 * Format a square area value for display with the appropriate unit suffix
 */
export function formatArea(sqMeters: number, unit: 'meters' | 'feet', decimals = 2): string {
  if (unit === 'feet') {
    // Square feet = square meters * (feet/meter)^2
    const sqFeet = sqMeters * METERS_TO_FEET * METERS_TO_FEET;
    return `${sqFeet.toFixed(decimals)} ft²`;
  }
  return `${sqMeters.toFixed(decimals)} m²`;
}

/**
 * Get the unit abbreviation
 */
export function getUnitAbbreviation(unit: 'meters' | 'feet'): string {
  return unit === 'feet' ? 'ft' : 'm';
}

/**
 * Get the full unit name
 */
export function getUnitName(unit: 'meters' | 'feet'): string {
  return unit === 'feet' ? 'Feet' : 'Meters';
}
