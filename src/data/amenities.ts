/**
 * Social Club Amenities Catalog
 * Total: 35 amenities across 5 categories
 * All costs in USD based on 2025-2026 Dominican Republic market research
 * Users can override default costs per FR-032
 */

import type { Amenity, AmenityCategory } from '@/models/types';

/**
 * Complete amenities catalog with estimated costs
 * Per spec FR-026: Comprehensive catalog of social club features
 * Per spec FR-031: Provide recommended USD defaults
 */
export const AMENITIES_CATALOG: readonly Amenity[] = [
  // ==================== AQUATIC AMENITIES (6) ====================
  {
    id: 'pool-small',
    name: 'Small Swimming Pool',
    category: 'aquatic',
    description: 'Basic rectangular pool with filter and pump system (20-30 sqm)',
    defaultCostUSD: 14500,
    unit: 'unit',
    spaceRequirement: 25,
  },
  {
    id: 'pool-medium',
    name: 'Medium Swimming Pool',
    category: 'aquatic',
    description: 'Standard pool with LED lighting and chemical system (40-60 sqm)',
    defaultCostUSD: 25000,
    unit: 'unit',
    spaceRequirement: 50,
  },
  {
    id: 'pool-large',
    name: 'Large Swimming Pool',
    category: 'aquatic',
    description: 'Premium pool with advanced features and waterfall (60+ sqm)',
    defaultCostUSD: 40000,
    unit: 'unit',
    spaceRequirement: 70,
  },
  {
    id: 'pool-infinity',
    name: 'Infinity Pool',
    category: 'aquatic',
    description: 'Luxury infinity edge pool with vanishing edge design',
    defaultCostUSD: 55000,
    unit: 'unit',
    spaceRequirement: 60,
  },
  {
    id: 'jacuzzi',
    name: 'Jacuzzi / Hot Tub',
    category: 'aquatic',
    description: '6-8 person hot tub with jets and heating (8-10 sqm)',
    defaultCostUSD: 8000,
    unit: 'unit',
    spaceRequirement: 9,
  },
  {
    id: 'wading-pool',
    name: 'Children\'s Wading Pool',
    category: 'aquatic',
    description: 'Shallow pool for children with safety features (15-20 sqm)',
    defaultCostUSD: 6000,
    unit: 'unit',
    spaceRequirement: 18,
  },

  // ==================== DINING AMENITIES (5) ====================
  {
    id: 'bbq-station',
    name: 'BBQ Grilling Station',
    category: 'dining',
    description: 'Built-in grill with counter space and basic storage',
    defaultCostUSD: 3500,
    unit: 'unit',
    spaceRequirement: 6,
  },
  {
    id: 'outdoor-kitchen-basic',
    name: 'Basic Outdoor Kitchen',
    category: 'dining',
    description: 'Compact kitchen with grill, sink, and refrigerator (10 sqm)',
    defaultCostUSD: 8000,
    unit: 'unit',
    spaceRequirement: 10,
  },
  {
    id: 'outdoor-kitchen-full',
    name: 'Full Outdoor Kitchen',
    category: 'dining',
    description: 'Complete kitchen with appliances, bar seating, and pizza oven (20+ sqm)',
    defaultCostUSD: 18000,
    unit: 'unit',
    spaceRequirement: 22,
  },
  {
    id: 'dining-pavilion',
    name: 'Covered Dining Pavilion',
    category: 'dining',
    description: 'Roofed dining area with ceiling fans (30-40 sqm)',
    defaultCostUSD: 12000,
    unit: 'unit',
    spaceRequirement: 35,
  },
  {
    id: 'outdoor-bar',
    name: 'Outdoor Bar Counter',
    category: 'dining',
    description: 'Bar with stools, sink, and mini-fridge',
    defaultCostUSD: 5000,
    unit: 'unit',
    spaceRequirement: 8,
  },

  // ==================== RECREATION AMENITIES (8) ====================
  {
    id: 'gazebo',
    name: 'Lounge Gazebo',
    category: 'recreation',
    description: 'Covered relaxation area with built-in seating',
    defaultCostUSD: 4000,
    unit: 'unit',
    spaceRequirement: 12,
  },
  {
    id: 'pergola',
    name: 'Pergola',
    category: 'recreation',
    description: 'Open-air structure with climbing plants (20-30 sqm)',
    defaultCostUSD: 4500,
    unit: 'unit',
    spaceRequirement: 25,
  },
  {
    id: 'tennis-court',
    name: 'Tennis Court',
    category: 'recreation',
    description: 'Full-size court with professional surface and net (600+ sqm)',
    defaultCostUSD: 65000,
    unit: 'unit',
    spaceRequirement: 650,
  },
  {
    id: 'basketball-court',
    name: 'Basketball Court',
    category: 'recreation',
    description: 'Half-court with quality surface and hoops (200-300 sqm)',
    defaultCostUSD: 40000,
    unit: 'unit',
    spaceRequirement: 250,
  },
  {
    id: 'multi-sport-court',
    name: 'Multi-Sport Court',
    category: 'recreation',
    description: 'Versatile court for basketball, volleyball, and tennis (400 sqm)',
    defaultCostUSD: 50000,
    unit: 'unit',
    spaceRequirement: 400,
  },
  {
    id: 'playground',
    name: 'Children\'s Playground',
    category: 'recreation',
    description: 'Safe play area with swings, slides, and climbing structures',
    defaultCostUSD: 8000,
    unit: 'unit',
    spaceRequirement: 50,
  },
  {
    id: 'fire-pit',
    name: 'Fire Pit Seating Area',
    category: 'recreation',
    description: 'Built-in fire pit with stone seating circle',
    defaultCostUSD: 2500,
    unit: 'unit',
    spaceRequirement: 15,
  },
  {
    id: 'game-area',
    name: 'Covered Game Area',
    category: 'recreation',
    description: 'Roofed space for table tennis, billiards, and board games (25-30 sqm)',
    defaultCostUSD: 15000,
    unit: 'unit',
    spaceRequirement: 28,
  },

  // ==================== FURNITURE & FIXTURES (7) ====================
  {
    id: 'lounge-chairs-6',
    name: 'Pool Lounge Chairs (Set of 6)',
    category: 'furniture',
    description: 'Weather-resistant reclining chairs with cushions',
    defaultCostUSD: 1800,
    unit: 'set',
  },
  {
    id: 'lounge-chairs-12',
    name: 'Pool Lounge Chairs (Set of 12)',
    category: 'furniture',
    description: 'Premium weather-resistant reclining chairs with cushions',
    defaultCostUSD: 3200,
    unit: 'set',
  },
  {
    id: 'umbrellas-4',
    name: 'Pool Umbrellas (Set of 4)',
    category: 'furniture',
    description: 'Large sun umbrellas with heavy-duty bases',
    defaultCostUSD: 1200,
    unit: 'set',
  },
  {
    id: 'shade-umbrellas-2',
    name: 'Large Shade Umbrellas (Set of 2)',
    category: 'furniture',
    description: 'Commercial-grade cantilever umbrellas (3m+ diameter)',
    defaultCostUSD: 1500,
    unit: 'set',
  },
  {
    id: 'poolside-cabana',
    name: 'Poolside Cabana',
    category: 'furniture',
    description: 'Fabric cabana with curtains and daybed',
    defaultCostUSD: 2500,
    unit: 'unit',
  },
  {
    id: 'dining-tables-3',
    name: 'Outdoor Dining Tables (Set of 3)',
    category: 'furniture',
    description: 'Weather-resistant tables with 6 chairs each (18 seats total)',
    defaultCostUSD: 3000,
    unit: 'set',
  },
  {
    id: 'lounge-furniture-set',
    name: 'Outdoor Lounge Furniture Set',
    category: 'furniture',
    description: 'Sectional sofa set with coffee table and cushions',
    defaultCostUSD: 4000,
    unit: 'set',
  },

  // ==================== UTILITIES & FACILITIES (9) ====================
  {
    id: 'bathrooms-basic',
    name: 'Basic Bathrooms (2 units)',
    category: 'utilities',
    description: 'Two standard bathrooms with sinks and toilets (15-20 sqm total)',
    defaultCostUSD: 12000,
    unit: 'set',
    spaceRequirement: 18,
  },
  {
    id: 'bathrooms-full',
    name: 'Full Bathrooms with Showers (2 units)',
    category: 'utilities',
    description: 'Two complete bathrooms with showers and lockers (30-40 sqm total)',
    defaultCostUSD: 22000,
    unit: 'set',
    spaceRequirement: 35,
  },
  {
    id: 'changing-rooms',
    name: 'Changing Rooms',
    category: 'utilities',
    description: 'Two changing rooms with benches and hooks (15 sqm total)',
    defaultCostUSD: 8000,
    unit: 'unit',
    spaceRequirement: 15,
  },
  {
    id: 'storage-room',
    name: 'Equipment Storage Room',
    category: 'utilities',
    description: 'Secure storage for pool and recreational equipment (20 sqm)',
    defaultCostUSD: 6000,
    unit: 'unit',
    spaceRequirement: 20,
  },
  {
    id: 'rinse-showers',
    name: 'Outdoor Rinse Showers (Set of 2)',
    category: 'utilities',
    description: 'Basic outdoor showers for pool area',
    defaultCostUSD: 2000,
    unit: 'set',
    spaceRequirement: 4,
  },
  {
    id: 'landscaping-basic',
    name: 'Basic Landscaping (per 100 sqm)',
    category: 'utilities',
    description: 'Grass, shrubs, and basic plantings with irrigation',
    defaultCostUSD: 3500,
    unit: 'per 100 sqm',
  },
  {
    id: 'landscaping-premium',
    name: 'Premium Landscaping (per 100 sqm)',
    category: 'utilities',
    description: 'Tropical plants, palm trees, stone features, and automated irrigation',
    defaultCostUSD: 7000,
    unit: 'per 100 sqm',
  },
  {
    id: 'parking',
    name: 'Parking Area (per 10 spaces)',
    category: 'utilities',
    description: 'Paved parking with striping and lighting (10 car spaces)',
    defaultCostUSD: 8000,
    unit: 'per 10 spaces',
    spaceRequirement: 250,
  },
  {
    id: 'security-lighting',
    name: 'Security & Pathway Lighting System',
    category: 'utilities',
    description: 'LED pathway lights and security lighting throughout social club',
    defaultCostUSD: 4500,
    unit: 'system',
  },
  {
    id: 'wifi-system',
    name: 'WiFi Network System',
    category: 'utilities',
    description: 'Commercial-grade WiFi coverage for social club area',
    defaultCostUSD: 2500,
    unit: 'system',
  },
] as const;

/**
 * Get amenities by category
 */
export function getAmenitiesByCategory(category: AmenityCategory): Amenity[] {
  return AMENITIES_CATALOG.filter(a => a.category === category);
}

/**
 * Get amenity by ID
 */
export function getAmenityById(id: string): Amenity | undefined {
  return AMENITIES_CATALOG.find(a => a.id === id);
}

/**
 * Calculate total cost of selected amenities
 * Uses custom costs if provided, otherwise defaults
 */
export function calculateTotalAmenitiesCost(
  selectedAmenityIds: string[],
  customCosts?: Record<string, number>
): number {
  return selectedAmenityIds.reduce((total, id) => {
    const amenity = getAmenityById(id);
    if (!amenity) return total;

    const cost = customCosts?.[id] ?? amenity.defaultCostUSD;
    return total + cost;
  }, 0);
}

/**
 * Get all category names
 */
export const AMENITY_CATEGORIES: readonly AmenityCategory[] = [
  'aquatic',
  'dining',
  'recreation',
  'furniture',
  'utilities',
] as const;

/**
 * Category display names for UI
 */
export const CATEGORY_DISPLAY_NAMES: Record<AmenityCategory, string> = {
  aquatic: 'Aquatic Features',
  dining: 'Dining & Kitchen',
  recreation: 'Recreation & Sports',
  furniture: 'Furniture & Fixtures',
  utilities: 'Utilities & Facilities',
};

/**
 * Default amenity selections for a typical social club
 * Based on common Micro Villas projects in Dominican Republic
 */
export const DEFAULT_AMENITY_SELECTION = [
  'pool-medium',
  'bbq-station',
  'lounge-chairs-12',
  'umbrellas-4',
  'bathrooms-full',
  'landscaping-basic',
  'security-lighting',
];
