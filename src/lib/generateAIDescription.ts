import type { Project, Area, DisplayUnit } from '@models/types';
import { metersToDisplayUnit, getUnitAbbreviation } from './coordinates';

/**
 * Generates an optimized description of the project for AI image generation.
 * The description includes spatial relationships, dimensions, and user-provided details.
 */
export function generateAIDescription(
  project: Project,
  displayUnit: DisplayUnit,
  options: {
    includeCoordinates?: boolean;
    includeColors?: boolean;
    viewAngle?: 'aerial' | 'eye-level' | 'perspective';
  } = {}
): string {
  const {
    includeCoordinates = false,
    includeColors = false,
    viewAngle = 'perspective',
  } = options;

  const unitAbbr = getUnitAbbreviation(displayUnit);
  const lot = project.lot;
  const areas = project.areas.filter((a) => a.visible);

  // Format dimensions helper
  const formatDim = (meters: number): string => {
    const val = metersToDisplayUnit(meters, displayUnit);
    return `${val.toFixed(1)}${unitAbbr}`;
  };

  // Group areas by type
  const areasByType = areas.reduce((acc, area) => {
    const type = area.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(area);
    return acc;
  }, {} as Record<string, Area[]>);

  // Build the description
  const parts: string[] = [];

  // 1. View angle instruction
  const viewInstructions: Record<string, string> = {
    'aerial': 'Aerial top-down view of',
    'eye-level': 'Eye-level architectural photograph of',
    'perspective': 'Architectural perspective rendering of',
  };
  parts.push(viewInstructions[viewAngle]);

  // 2. Project overview with lot dimensions
  const lotArea = lot.width * lot.height;
  parts.push(
    `a property measuring ${formatDim(lot.width)} wide by ${formatDim(lot.height)} deep (${formatDim(lotArea)} total area).`
  );

  // 3. Project description (user-provided)
  if (lot.description?.trim()) {
    parts.push(lot.description.trim() + '.');
  }

  // 4. Main structures (houses, buildings)
  const mainStructures = areasByType['house'] || [];
  if (mainStructures.length > 0) {
    const structureDescriptions = mainStructures.map((area) => {
      let desc = `${area.name} (${formatDim(area.width)} x ${formatDim(area.height)}, ${formatDim(area.elevation)} tall)`;
      if (area.description?.trim()) {
        desc += `: ${area.description.trim()}`;
      }
      return desc;
    });
    parts.push(`Main structures: ${structureDescriptions.join('; ')}.`);
  }

  // 5. Outdoor spaces (pool, garden, court, lounge, parking)
  const outdoorTypes = ['pool', 'garden', 'court', 'lounge', 'parking'];
  const outdoorSpaces = outdoorTypes.flatMap((type) => areasByType[type] || []);
  if (outdoorSpaces.length > 0) {
    const outdoorDescriptions = outdoorSpaces.map((area) => {
      let desc = `${area.name} (${area.type}, ${formatDim(area.width)} x ${formatDim(area.height)})`;
      if (area.description?.trim()) {
        desc += `: ${area.description.trim()}`;
      }
      return desc;
    });
    parts.push(`Outdoor spaces: ${outdoorDescriptions.join('; ')}.`);
  }

  // 6. Structural elements (walls, columns, stairs)
  const structuralTypes = ['wall', 'column', 'stairs'];
  const structuralElements = structuralTypes.flatMap((type) => areasByType[type] || []);
  if (structuralElements.length > 0) {
    const structuralDescriptions = structuralElements.map((area) => {
      let desc = `${area.name} (${area.type})`;
      if (area.description?.trim()) {
        desc += `: ${area.description.trim()}`;
      }
      return desc;
    });
    parts.push(`Structural elements: ${structuralDescriptions.join('; ')}.`);
  }

  // 7. Openings (doors, windows)
  const openingTypes = ['door', 'window'];
  const openings = openingTypes.flatMap((type) => areasByType[type] || []);
  if (openings.length > 0) {
    const windowCount = (areasByType['window'] || []).length;
    const doorCount = (areasByType['door'] || []).length;

    const openingParts: string[] = [];
    if (windowCount > 0) {
      const windowDescriptions = (areasByType['window'] || [])
        .filter((w) => w.description?.trim())
        .map((w) => w.description!.trim());
      if (windowDescriptions.length > 0) {
        openingParts.push(`${windowCount} window(s): ${windowDescriptions.join(', ')}`);
      } else {
        openingParts.push(`${windowCount} window(s)`);
      }
    }
    if (doorCount > 0) {
      const doorDescriptions = (areasByType['door'] || [])
        .filter((d) => d.description?.trim())
        .map((d) => d.description!.trim());
      if (doorDescriptions.length > 0) {
        openingParts.push(`${doorCount} door(s): ${doorDescriptions.join(', ')}`);
      } else {
        openingParts.push(`${doorCount} door(s)`);
      }
    }
    parts.push(`Openings: ${openingParts.join('; ')}.`);
  }

  // 8. Voids and custom areas
  const voids = areasByType['void'] || [];
  const customs = areasByType['custom'] || [];
  if (voids.length > 0 || customs.length > 0) {
    const otherDescriptions = [...voids, ...customs].map((area) => {
      let desc = area.name;
      if (area.description?.trim()) {
        desc += `: ${area.description.trim()}`;
      }
      return desc;
    });
    parts.push(`Other features: ${otherDescriptions.join('; ')}.`);
  }

  // 9. Optional: Include coordinates for spatial reference
  if (includeCoordinates && areas.length > 0) {
    const coordDescriptions = areas.slice(0, 10).map((area) => {
      return `${area.name} at position (${formatDim(area.x)}, ${formatDim(area.y)})`;
    });
    parts.push(`Spatial layout: ${coordDescriptions.join('; ')}.`);
  }

  // 10. Optional: Include colors
  if (includeColors) {
    const coloredAreas = areas.filter((a) => a.color && a.color !== '#000000');
    if (coloredAreas.length > 0) {
      const colorDescriptions = coloredAreas.slice(0, 5).map((area) => {
        return `${area.name} in ${area.color}`;
      });
      parts.push(`Color scheme: ${colorDescriptions.join(', ')}.`);
    }
  }

  // 11. Closing instruction for AI
  parts.push('High quality architectural visualization, professional lighting, detailed materials and textures.');

  return parts.join(' ');
}

/**
 * Generates a compact JSON representation of the project for structured AI input.
 */
export function generateProjectJSON(
  project: Project,
  displayUnit: DisplayUnit
): string {
  const formatDim = (meters: number) => {
    const val = metersToDisplayUnit(meters, displayUnit);
    return parseFloat(val.toFixed(2));
  };

  const unitAbbr = getUnitAbbreviation(displayUnit);

  const output = {
    unit: unitAbbr,
    lot: {
      width: formatDim(project.lot.width),
      height: formatDim(project.lot.height),
      description: project.lot.description || undefined,
    },
    areas: project.areas
      .filter((a) => a.visible)
      .map((area) => ({
        name: area.name,
        type: area.type,
        position: { x: formatDim(area.x), y: formatDim(area.y) },
        size: {
          width: formatDim(area.width),
          depth: formatDim(area.height),
          height: formatDim(area.elevation),
        },
        baseHeight: area.baseHeight > 0 ? formatDim(area.baseHeight) : undefined,
        rotation: area.rotation || undefined,
        description: area.description || undefined,
      })),
  };

  return JSON.stringify(output, null, 2);
}
