import type { Area, Bounds } from '@models/types';

/**
 * Geometry utilities for area calculations and overlap detection
 */

/**
 * Calculate area in square meters
 */
export function calculateArea(width: number, height: number): number {
  return width * height;
}

/**
 * Calculate volume in cubic meters
 */
export function calculateVolume(width: number, height: number, depth: number): number {
  return width * height * depth;
}

/**
 * Get the bounding box of an area
 */
export function getBounds(area: Pick<Area, 'x' | 'y' | 'width' | 'height'>): Bounds {
  return {
    minX: area.x,
    minY: area.y,
    maxX: area.x + area.width,
    maxY: area.y + area.height,
  };
}

/**
 * Check if two bounding boxes intersect (AABB collision)
 */
export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.maxX <= b.minX ||
    a.minX >= b.maxX ||
    a.maxY <= b.minY ||
    a.minY >= b.maxY
  );
}

/**
 * Calculate the overlap area between two bounding boxes
 * Returns 0 if no overlap
 */
export function calculateOverlap(a: Bounds, b: Bounds): number {
  if (!boundsIntersect(a, b)) {
    return 0;
  }

  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);

  return overlapX * overlapY;
}

/**
 * Check if an area is completely within a lot boundary
 */
export function isWithinLot(
  area: Pick<Area, 'x' | 'y' | 'width' | 'height'>,
  lotWidth: number,
  lotHeight: number
): boolean {
  return (
    area.x >= 0 &&
    area.y >= 0 &&
    area.x + area.width <= lotWidth &&
    area.y + area.height <= lotHeight
  );
}

/**
 * Find all overlapping area pairs in a list
 * Returns array of [areaId1, areaId2, overlapAmount] tuples
 */
export function findOverlappingAreas(areas: Area[]): Array<[string, string, number]> {
  const overlaps: Array<[string, string, number]> = [];

  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      const boundsA = getBounds(areas[i]);
      const boundsB = getBounds(areas[j]);
      const overlap = calculateOverlap(boundsA, boundsB);

      if (overlap > 0) {
        overlaps.push([areas[i].id, areas[j].id, overlap]);
      }
    }
  }

  return overlaps;
}

/**
 * Calculate total used area from a list of areas
 * Note: Does not account for overlaps
 */
export function calculateTotalArea(areas: Area[]): number {
  return areas.reduce((sum, area) => sum + calculateArea(area.width, area.height), 0);
}

/**
 * Check if a point is inside an area
 */
export function isPointInArea(
  pointX: number,
  pointY: number,
  area: Pick<Area, 'x' | 'y' | 'width' | 'height'>
): boolean {
  return (
    pointX >= area.x &&
    pointX <= area.x + area.width &&
    pointY >= area.y &&
    pointY <= area.y + area.height
  );
}

/**
 * Get center point of an area
 */
export function getAreaCenter(area: Pick<Area, 'x' | 'y' | 'width' | 'height'>): { x: number; y: number } {
  return {
    x: area.x + area.width / 2,
    y: area.y + area.height / 2,
  };
}

/**
 * Constrain an area position to stay within lot boundaries
 */
export function constrainToLot(
  x: number,
  y: number,
  width: number,
  height: number,
  lotWidth: number,
  lotHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, lotWidth - width)),
    y: Math.max(0, Math.min(y, lotHeight - height)),
  };
}

/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
