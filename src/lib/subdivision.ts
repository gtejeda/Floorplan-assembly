/**
 * Subdivision calculation algorithms for Micro Villas Investment Platform
 *
 * Per spec requirements:
 * - FR-008: Generate 21 scenarios (10-30% social club in 1% increments)
 * - FR-013: Social club must be centrally positioned
 * - FR-014: Grid-based quadrant subdivision (north, south, east, west)
 * - FR-015: Common area percentage must sum to 100% (±0.01%)
 * - FR-018: All lots must be ≥90 sqm
 * - SC-002: Generate all 21 scenarios in <2 seconds
 */

import type {
  LandParcel,
  SubdivisionScenario,
  SocialClubLayout,
  MicroVillaLot,
} from '../models/types';

// ==================== Constants ====================

const MIN_LOT_SIZE_SQM = 90; // Per FR-018
const MIN_SOCIAL_CLUB_PERCENTAGE = 10; // Per FR-008
const MAX_SOCIAL_CLUB_PERCENTAGE = 30; // Per FR-008
const SOCIAL_CLUB_PERCENTAGE_INCREMENT = 1; // Per FR-008
const COMMON_AREA_TOLERANCE = 0.01; // Per FR-015 (0.01%)

// ==================== Memoization Cache ====================

const scenarioCache = new Map<string, SubdivisionScenario[]>();

function getCacheKey(land: LandParcel): string {
  return `${land.width.toFixed(3)}_${land.height.toFixed(3)}`;
}

function getCachedScenarios(land: LandParcel): SubdivisionScenario[] | null {
  const key = getCacheKey(land);
  return scenarioCache.get(key) || null;
}

function setCachedScenarios(land: LandParcel, scenarios: SubdivisionScenario[]): void {
  const key = getCacheKey(land);
  scenarioCache.set(key, scenarios);
}

/**
 * Clear the memoization cache
 * Call this when land dimensions change
 */
export function clearSubdivisionCache(): void {
  scenarioCache.clear();
}

// ==================== Core Calculation Functions ====================

/**
 * T041: Calculate social club dimensions and centered position
 *
 * Per FR-013: Social club must be positioned in the center of the land parcel
 *
 * @param landWidth Total land parcel width in meters
 * @param landHeight Total land parcel height in meters
 * @param socialClubPercentage Percentage of land allocated to social club (10-30)
 * @returns Social club layout with dimensions and centered position
 */
export function calculateSocialClubDimensions(
  landWidth: number,
  landHeight: number,
  socialClubPercentage: number
): SocialClubLayout {
  const totalLandArea = landWidth * landHeight;
  const socialClubArea = (totalLandArea * socialClubPercentage) / 100;

  // Calculate dimensions maintaining aspect ratio similar to land
  // This creates a more natural layout
  const aspectRatio = landWidth / landHeight;
  const socialClubHeight = Math.sqrt(socialClubArea / aspectRatio);
  const socialClubWidth = socialClubHeight * aspectRatio;

  // Center the social club
  const x = (landWidth - socialClubWidth) / 2;
  const y = (landHeight - socialClubHeight) / 2;

  return {
    width: socialClubWidth,
    height: socialClubHeight,
    area: socialClubArea,
    x,
    y,
    selectedAmenities: [],
    storageType: 'dedicated',
    totalCost: 0,
  };
}

/**
 * T042: Subdivide a quadrant into micro villa lots using grid-based algorithm
 *
 * Per FR-014: Use grid-based subdivision creating rectangular lots
 * Per FR-018: All lots must be ≥90 sqm
 *
 * @param quadrantWidth Width of the quadrant in meters
 * @param quadrantHeight Height of the quadrant in meters
 * @param offsetX X offset for positioning lots on the land parcel
 * @param offsetY Y offset for positioning lots on the land parcel
 * @param quadrant Quadrant identifier ('north', 'south', 'east', 'west')
 * @param startLotNumber Starting lot number for this quadrant
 * @returns Array of micro villa lots for this quadrant
 */
export function subdivideQuadrant(
  quadrantWidth: number,
  quadrantHeight: number,
  offsetX: number,
  offsetY: number,
  quadrant: 'north' | 'south' | 'east' | 'west',
  startLotNumber: number
): MicroVillaLot[] {
  const lots: MicroVillaLot[] = [];
  const quadrantArea = quadrantWidth * quadrantHeight;

  // Early exit if quadrant is too small
  if (quadrantArea < MIN_LOT_SIZE_SQM) {
    return lots;
  }

  // Determine optimal grid configuration
  // Try to create square-ish lots by testing different row/column combinations
  let bestConfig: {
    rows: number;
    cols: number;
    lotWidth: number;
    lotHeight: number;
    minLotArea: number;
  } | null = null;

  // Test different grid configurations
  // For efficiency, limit test range based on quadrant size
  const maxDivisions = Math.floor(Math.sqrt(quadrantArea / MIN_LOT_SIZE_SQM)) + 1;

  for (let rows = 1; rows <= maxDivisions; rows++) {
    for (let cols = 1; cols <= maxDivisions; cols++) {
      const lotWidth = quadrantWidth / cols;
      const lotHeight = quadrantHeight / rows;
      const lotArea = lotWidth * lotHeight;

      // Skip if lots would be too small
      if (lotArea < MIN_LOT_SIZE_SQM) continue;

      // Prefer more square-ish lots (aspect ratio closer to 1)
      const aspectRatio = Math.max(lotWidth, lotHeight) / Math.min(lotWidth, lotHeight);

      if (!bestConfig || lotArea < bestConfig.minLotArea ||
          (Math.abs(lotArea - bestConfig.minLotArea) < 5 && aspectRatio <
           Math.max(bestConfig.lotWidth, bestConfig.lotHeight) / Math.min(bestConfig.lotWidth, bestConfig.lotHeight))) {
        bestConfig = { rows, cols, lotWidth, lotHeight, minLotArea: lotArea };
      }
    }
  }

  // If no valid configuration found, return empty array
  if (!bestConfig) {
    return lots;
  }

  // Generate lots using the best configuration
  let lotNumber = startLotNumber;
  for (let row = 0; row < bestConfig.rows; row++) {
    for (let col = 0; col < bestConfig.cols; col++) {
      const x = offsetX + col * bestConfig.lotWidth;
      const y = offsetY + row * bestConfig.lotHeight;
      const area = bestConfig.lotWidth * bestConfig.lotHeight;

      lots.push({
        id: `lot-${lotNumber}`,
        lotNumber,
        x,
        y,
        width: bestConfig.lotWidth,
        height: bestConfig.lotHeight,
        area,
        commonAreaPercentage: 0, // Calculated later in T047
        images: [],
        quadrant,
        isValid: area >= MIN_LOT_SIZE_SQM,
        color: '#3b82f6', // Blue color for lots
      });

      lotNumber++;
    }
  }

  return lots;
}

/**
 * T043: Calculate complete grid-based subdivision for a given social club percentage
 *
 * Per FR-013: Social club centered, lots distributed in 4 quadrants around it
 * Per FR-014: Grid-based subdivision algorithm
 *
 * @param land Land parcel to subdivide
 * @param socialClubPercentage Percentage of land for social club (10-30)
 * @returns Complete subdivision scenario with social club and all lots
 */
export function calculateGridSubdivision(
  land: LandParcel,
  socialClubPercentage: number
): Omit<SubdivisionScenario, 'id' | 'isSelected' | 'createdAt'> {
  // Calculate social club layout
  const socialClub = calculateSocialClubDimensions(
    land.width,
    land.height,
    socialClubPercentage
  );

  // Calculate quadrant dimensions
  // Each quadrant is the space between the social club and the land boundary

  // North quadrant: full width, from top to social club top
  const northWidth = land.width;
  const northHeight = socialClub.y;

  // South quadrant: full width, from social club bottom to bottom
  const southWidth = land.width;
  const southHeight = land.height - (socialClub.y + socialClub.height);

  // East quadrant: from social club right to right edge, height of social club
  const eastWidth = land.width - (socialClub.x + socialClub.width);
  const eastHeight = socialClub.height;

  // West quadrant: from left to social club left, height of social club
  const westWidth = socialClub.x;
  const westHeight = socialClub.height;

  // Subdivide each quadrant
  const northLots = subdivideQuadrant(
    northWidth,
    northHeight,
    0,
    0,
    'north',
    1
  );

  const southLots = subdivideQuadrant(
    southWidth,
    southHeight,
    0,
    socialClub.y + socialClub.height,
    'south',
    northLots.length + 1
  );

  const eastLots = subdivideQuadrant(
    eastWidth,
    eastHeight,
    socialClub.x + socialClub.width,
    socialClub.y,
    'east',
    northLots.length + southLots.length + 1
  );

  const westLots = subdivideQuadrant(
    westWidth,
    westHeight,
    0,
    socialClub.y,
    'west',
    northLots.length + southLots.length + eastLots.length + 1
  );

  // Combine all lots
  const allLots = [...northLots, ...southLots, ...eastLots, ...westLots];

  // Calculate metrics
  const totalLots = allLots.length;
  const averageLotSize = totalLots > 0
    ? allLots.reduce((sum, lot) => sum + lot.area, 0) / totalLots
    : 0;

  const totalLotArea = allLots.reduce((sum, lot) => sum + lot.area, 0);
  const efficiency = ((totalLotArea + socialClub.area) / land.totalArea) * 100;

  // Check if scenario is viable (all lots >= 90 sqm)
  const isViable = allLots.every(lot => lot.isValid);

  return {
    socialClubPercentage,
    socialClub,
    lots: allLots,
    totalLots,
    averageLotSize,
    efficiency,
    isViable,
  };
}

/**
 * T044: Generate all 21 subdivision scenarios (10-30% in 1% increments)
 *
 * Per FR-008: Generate 21 scenarios (10-30% social club in 1% increments)
 * Per SC-002: Must complete in <2 seconds
 *
 * @param land Land parcel to subdivide
 * @returns Array of all subdivision scenarios
 */
export function calculateAllScenarios(land: LandParcel): SubdivisionScenario[] {
  // Check cache first (T046)
  const cached = getCachedScenarios(land);
  if (cached) {
    return cached;
  }

  const scenarios: SubdivisionScenario[] = [];
  const startTime = performance.now();

  for (
    let percentage = MIN_SOCIAL_CLUB_PERCENTAGE;
    percentage <= MAX_SOCIAL_CLUB_PERCENTAGE;
    percentage += SOCIAL_CLUB_PERCENTAGE_INCREMENT
  ) {
    const subdivision = calculateGridSubdivision(land, percentage);

    // T045: Filter out scenarios with lots < 90 sqm
    // Skip if any lot is below minimum size
    if (!subdivision.isViable) {
      continue;
    }

    // T047: Calculate common area percentage for each lot
    const lotsWithCommonArea = calculateCommonAreaPercentages(
      subdivision.lots,
      subdivision.socialClub.area
    );

    const scenario: SubdivisionScenario = {
      id: `scenario-${percentage}`,
      ...subdivision,
      lots: lotsWithCommonArea,
      isSelected: percentage === 20, // Default to 20% (FR-009)
      createdAt: new Date().toISOString(),
    };

    scenarios.push(scenario);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // T048: Log performance for monitoring
  if (duration > 2000) {
    console.warn(
      `Subdivision calculation took ${duration.toFixed(0)}ms (exceeds 2s requirement)`,
      { landWidth: land.width, landHeight: land.height, scenarioCount: scenarios.length }
    );
  }

  // Cache the results (T046)
  setCachedScenarios(land, scenarios);

  return scenarios;
}

/**
 * T047: Calculate common area percentage for each lot
 *
 * Per FR-015: Each lot owner has proportional ownership of social club
 * Per FR-015: All percentages must sum to 100% (±0.01%)
 *
 * @param lots Array of micro villa lots
 * @param socialClubArea Total social club area in sqm
 * @returns Lots with calculated common area percentages
 */
export function calculateCommonAreaPercentages(
  lots: MicroVillaLot[],
  socialClubArea: number
): MicroVillaLot[] {
  if (lots.length === 0) {
    return lots;
  }

  // Calculate total lot area
  const totalLotArea = lots.reduce((sum, lot) => sum + lot.area, 0);

  // Calculate proportional ownership for each lot
  const lotsWithPercentages = lots.map(lot => ({
    ...lot,
    commonAreaPercentage: (lot.area / totalLotArea) * 100,
  }));

  // Verify sum is 100% (±0.01%)
  const sum = lotsWithPercentages.reduce(
    (total, lot) => total + lot.commonAreaPercentage,
    0
  );

  if (Math.abs(sum - 100) > COMMON_AREA_TOLERANCE) {
    console.warn(
      `Common area percentages sum to ${sum.toFixed(4)}% (expected 100% ±${COMMON_AREA_TOLERANCE}%)`,
      { totalLots: lots.length, totalLotArea, socialClubArea }
    );
  }

  return lotsWithPercentages;
}

/**
 * Get the default scenario (20% social club percentage)
 *
 * Per FR-009: System defaults to 20% social club allocation
 *
 * @param scenarios Array of all scenarios
 * @returns Default scenario or null if not found
 */
export function getDefaultScenario(
  scenarios: SubdivisionScenario[]
): SubdivisionScenario | null {
  return scenarios.find(s => s.socialClubPercentage === 20) || null;
}

/**
 * Get scenario by social club percentage
 *
 * @param scenarios Array of all scenarios
 * @param percentage Social club percentage (10-30)
 * @returns Matching scenario or null
 */
export function getScenarioByPercentage(
  scenarios: SubdivisionScenario[],
  percentage: number
): SubdivisionScenario | null {
  return scenarios.find(s => s.socialClubPercentage === percentage) || null;
}
