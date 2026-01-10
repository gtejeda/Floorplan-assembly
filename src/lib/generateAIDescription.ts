/**
 * AI-Ready Project Description Generator
 *
 * Generates detailed textual descriptions of Micro Villas investment projects
 * suitable for multi-modal AI systems to generate visual concepts and marketing materials.
 *
 * Per spec FR-047: Generate comprehensive description with all project details
 * Per spec FR-048: Description includes location, dimensions, amenities, ownership structure
 * Per spec SC-008: Generate description in <3 seconds
 */

import type {
  InvestmentProject,
  LandParcel,
  SubdivisionScenario,
  Amenity,
  StorageType
} from '@/models/types';
import { AMENITIES_CATALOG } from '@/data/amenities';

/**
 * Main function to generate AI-ready description from investment project data
 *
 * @param project - Complete investment project with all data
 * @returns Structured text description suitable for AI consumption
 */
export function generateAIDescription(project: InvestmentProject): string {
  const startTime = performance.now();

  // Get the selected subdivision scenario
  const selectedScenario = project.subdivisionScenarios.find(
    s => s.id === project.selectedScenarioId
  );

  if (!selectedScenario) {
    throw new Error('No subdivision scenario selected. Please select a scenario first.');
  }

  // Build description sections
  const sections: string[] = [];

  // Header
  sections.push(generateHeader(project));

  // Location details
  sections.push(generateLocationSection(project.landParcel));

  // Land dimensions
  sections.push(generateLandDimensionsSection(project.landParcel));

  // Subdivision configuration
  sections.push(generateSubdivisionSection(selectedScenario));

  // Social club details
  sections.push(generateSocialClubSection(
    selectedScenario,
    project.socialClub.selectedAmenities
  ));

  // Common area ownership
  sections.push(generateCommonAreaOwnershipSection(selectedScenario));

  // Storage arrangement
  sections.push(generateStorageArrangementSection(project.socialClub.storageType));

  // Financial overview (optional but useful for AI context)
  sections.push(generateFinancialOverviewSection(project));

  // Performance check
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 3000) {
    console.warn(`AI description generation took ${duration.toFixed(0)}ms (exceeds 3s requirement)`);
  }

  return sections.join('\n\n');
}

/**
 * Generate project header with basic identification
 */
function generateHeader(project: InvestmentProject): string {
  return `# ${project.name || 'Micro Villas Investment Project'}

**Project Type**: Micro Villas Residential Development
**Version**: ${project.version}
**Created**: ${new Date(project.created).toLocaleDateString()}
**Last Modified**: ${new Date(project.modified).toLocaleDateString()}

---`;
}

/**
 * Generate location section with province, landmarks, and nearby attractions
 * T104: Location section implementation
 */
function generateLocationSection(landParcel: LandParcel): string {
  const lines: string[] = [
    '## Location',
    '',
    `**Province**: ${landParcel.province}, Dominican Republic`,
  ];

  if (landParcel.landmarks && landParcel.landmarks.length > 0) {
    lines.push('');
    lines.push('**Nearby Landmarks and Attractions**:');
    landParcel.landmarks.forEach(landmark => {
      lines.push(`- ${landmark}`);
    });
  }

  // Add urbanization status
  lines.push('');
  lines.push(`**Urbanization Status**: ${landParcel.isUrbanized ? 'Fully urbanized with utilities available' : 'Raw land requiring urbanization'}`);

  return lines.join('\n');
}

/**
 * Generate land dimensions section with total area and measurements
 * T105: Land dimensions section implementation
 */
function generateLandDimensionsSection(landParcel: LandParcel): string {
  const totalAreaSqm = landParcel.totalArea;
  const totalAreaSqft = (totalAreaSqm * 10.7639).toFixed(2);

  return `## Land Dimensions

**Total Area**: ${totalAreaSqm.toFixed(2)} sqm (${totalAreaSqft} sqft)
**Dimensions**: ${landParcel.width.toFixed(2)}m × ${landParcel.height.toFixed(2)}m
**Shape**: Rectangular parcel`;
}

/**
 * Generate subdivision configuration section
 * T106: Subdivision configuration section implementation
 */
function generateSubdivisionSection(
  scenario: SubdivisionScenario
): string {
  const lines: string[] = [
    '## Subdivision Configuration',
    '',
    `**Total Lots**: ${scenario.totalLots} Micro Villa lots`,
    `**Average Lot Size**: ${scenario.averageLotSize.toFixed(2)} sqm`,
    `**Minimum Lot Size**: ${Math.min(...scenario.lots.map(l => l.area)).toFixed(2)} sqm`,
    `**Maximum Lot Size**: ${Math.max(...scenario.lots.map(l => l.area)).toFixed(2)} sqm`,
    `**Social Club Allocation**: ${scenario.socialClubPercentage}% of total land`,
    `**Layout Efficiency**: ${scenario.efficiency.toFixed(1)}%`,
    '',
    '**Lot Distribution**:',
  ];

  // Group lots by quadrant
  const lotsByQuadrant = scenario.lots.reduce((acc, lot) => {
    if (!acc[lot.quadrant]) acc[lot.quadrant] = [];
    acc[lot.quadrant].push(lot);
    return acc;
  }, {} as Record<string, typeof scenario.lots>);

  // List lots by quadrant
  Object.entries(lotsByQuadrant).forEach(([quadrant, lots]) => {
    lines.push(`- ${quadrant.charAt(0).toUpperCase() + quadrant.slice(1)} Quadrant: ${lots.length} lots`);
    lots.forEach(lot => {
      lines.push(`  - Lot ${lot.lotNumber}: ${lot.width.toFixed(2)}m × ${lot.height.toFixed(2)}m (${lot.area.toFixed(2)} sqm)`);
    });
  });

  return lines.join('\n');
}

/**
 * Generate social club details section with amenities
 * T107: Social club details section implementation
 */
function generateSocialClubSection(
  scenario: SubdivisionScenario,
  selectedAmenityIds: string[]
): string {
  const socialClub = scenario.socialClub;

  const lines: string[] = [
    '## Social Club Area',
    '',
    `**Position**: Centrally located within the development`,
    `**Dimensions**: ${socialClub.width.toFixed(2)}m × ${socialClub.height.toFixed(2)}m`,
    `**Total Area**: ${socialClub.area.toFixed(2)} sqm`,
    `**Coordinates**: X: ${socialClub.x.toFixed(2)}m, Y: ${socialClub.y.toFixed(2)}m (from top-left)`,
    '',
  ];

  // Add amenities list
  if (selectedAmenityIds.length > 0) {
    lines.push('**Selected Amenities**:');
    lines.push('');

    // Group amenities by category
    const amenitiesByCategory = new Map<string, Amenity[]>();

    selectedAmenityIds.forEach(amenityId => {
      const amenity = AMENITIES_CATALOG.find(a => a.id === amenityId);
      if (amenity) {
        const category = amenity.category;
        if (!amenitiesByCategory.has(category)) {
          amenitiesByCategory.set(category, []);
        }
        amenitiesByCategory.get(category)!.push(amenity);
      }
    });

    // Output amenities by category
    const categoryNames: Record<string, string> = {
      aquatic: 'Aquatic Features',
      dining: 'Dining & Entertainment',
      recreation: 'Recreation & Sports',
      furniture: 'Furniture & Seating',
      utilities: 'Utilities & Services',
    };

    amenitiesByCategory.forEach((amenities, category) => {
      lines.push(`### ${categoryNames[category] || category}`);
      amenities.forEach(amenity => {
        lines.push(`- **${amenity.name}**: ${amenity.description}`);
      });
      lines.push('');
    });
  } else {
    lines.push('**Selected Amenities**: None selected yet');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate common area ownership section explaining percentage calculations
 * T108: Common area ownership section implementation
 */
function generateCommonAreaOwnershipSection(scenario: SubdivisionScenario): string {
  const lines: string[] = [
    '## Common Area Ownership Structure',
    '',
    'Each Micro Villa lot includes proportional ownership of the social club common area.',
    'Ownership percentages are calculated based on lot size relative to total residential area.',
    '',
    '**Ownership Breakdown**:',
    '',
  ];

  // Sort lots by lot number
  const sortedLots = [...scenario.lots].sort((a, b) => a.lotNumber - b.lotNumber);

  sortedLots.forEach(lot => {
    lines.push(`- **Lot ${lot.lotNumber}** (${lot.area.toFixed(2)} sqm): ${lot.commonAreaPercentage.toFixed(2)}% common area ownership`);
  });

  lines.push('');
  lines.push('**Note**: Ownership percentages sum to 100%, ensuring all owners have proportional rights to the social club facilities.');

  return lines.join('\n');
}

/**
 * Generate storage arrangement section
 * T109: Storage arrangement section implementation
 */
function generateStorageArrangementSection(storageType: StorageType): string {
  const descriptions: Record<StorageType, string> = {
    dedicated: 'Each Micro Villa includes a dedicated storage room within the residential unit. Storage rooms are climate-controlled and secure, providing convenient access for owners to store personal belongings, tools, and seasonal items.',
    patio: 'Each Micro Villa features patio-integrated storage solutions. Storage is built into the outdoor living space, typically as lockable cabinets or storage benches that blend seamlessly with the patio design while maximizing functionality.',
  };

  return `## Storage Arrangements

**Storage Type**: ${storageType === 'dedicated' ? 'Dedicated Storage Room' : 'Patio-Integrated Storage'}

${descriptions[storageType]}`;
}

/**
 * Generate financial overview section (optional but useful for context)
 */
function generateFinancialOverviewSection(project: InvestmentProject): string {
  const financial = project.financialAnalysis;

  if (!financial) {
    return `## Financial Overview

*Financial analysis not yet completed.*`;
  }

  const lines: string[] = [
    '## Financial Overview',
    '',
    `**Total Project Cost**: ${formatCurrency(financial.totalProjectCost, financial.currency)}`,
    `**Cost Per Square Meter**: ${formatCurrency(financial.costPerSqm, financial.currency)}`,
    `**Base Cost Per Lot**: ${formatCurrency(financial.baseCostPerLot, financial.currency)}`,
  ];

  if (financial.pricingScenarios && financial.pricingScenarios.length > 0) {
    lines.push('');
    lines.push('**Pricing Scenarios**:');
    financial.pricingScenarios.forEach(scenario => {
      lines.push(`- ${scenario.profitMarginPercentage}% profit margin: ${formatCurrency(scenario.lotSalePrice, financial.currency)} per lot (ROI: ${scenario.returnOnInvestment.toFixed(1)}%)`);
    });
  }

  return lines.join('\n');
}

/**
 * Format currency values with proper symbols
 */
function formatCurrency(amount: number, currency: 'USD' | 'DOP'): string {
  const symbol = currency === 'USD' ? '$' : 'RD$';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Copy text to clipboard with fallback for older browsers
 *
 * @param text - Text to copy to clipboard
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API (preferred)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
