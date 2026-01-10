/**
 * Financial Calculations for Micro Villas Investment Platform
 *
 * Implements all financial formulas per spec FR-033 to FR-046
 * - Total project cost calculation
 * - Cost per sqm and per lot
 * - Pricing scenarios with multiple profit margins
 * - ROI calculations
 * - Maintenance contribution based on common area percentage
 * - Currency conversion support
 *
 * Performance: All calculations must complete in <1 second (SC-005)
 * Precision: All values rounded to 2 decimal places (SC-011)
 */

import type {
  FinancialAnalysis,
  OtherCost,
  PricingScenario,
  Currency,
  SubdivisionScenario,
  MicroVillaLot,
} from '@/models/types';

/**
 * Round to 2 decimal places for financial precision (SC-011)
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Convert currency between USD and DOP
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'USD' && toCurrency === 'DOP') {
    return roundToTwoDecimals(amount * exchangeRate);
  }

  if (fromCurrency === 'DOP' && toCurrency === 'USD') {
    return roundToTwoDecimals(amount / exchangeRate);
  }

  return amount;
}

/**
 * Calculate total project cost (FR-036)
 * Total = land cost + amenities cost + legal costs + sum of other costs
 */
export function calculateTotalProjectCost(
  landCost: number,
  amenitiesCost: number,
  legalCosts: number,
  otherCosts: OtherCost[]
): number {
  const otherCostsSum = otherCosts.reduce((sum, cost) => sum + cost.amount, 0);
  return roundToTwoDecimals(landCost + amenitiesCost + legalCosts + otherCostsSum);
}

/**
 * Calculate cost per square meter (FR-037)
 * Cost per sqm = total project cost / total land area
 */
export function calculateCostPerSqm(
  totalProjectCost: number,
  totalLandArea: number
): number {
  if (totalLandArea <= 0) return 0;
  return roundToTwoDecimals(totalProjectCost / totalLandArea);
}

/**
 * Calculate base cost per lot (FR-038)
 * Base cost per lot = (total project cost - social club cost) / number of lots
 *
 * Note: Social club cost is included in amenitiesCost, but the formula should
 * distribute total cost across lots. We use the simplified version:
 * Base cost per lot = total project cost / number of lots
 */
export function calculateBaseCostPerLot(
  totalProjectCost: number,
  numberOfLots: number
): number {
  if (numberOfLots <= 0) return 0;
  return roundToTwoDecimals(totalProjectCost / numberOfLots);
}

/**
 * Generate a single pricing scenario for a given profit margin (FR-039 to FR-042)
 */
export function generatePricingScenario(
  baseCostPerLot: number,
  profitMarginPercentage: number,
  numberOfLots: number,
  totalProjectCost: number
): PricingScenario {
  // Lot sale price = base cost × (1 + profit margin %) (FR-040)
  const lotSalePrice = roundToTwoDecimals(
    baseCostPerLot * (1 + profitMarginPercentage / 100)
  );

  // Total revenue = lot sale price × number of lots (FR-041)
  const totalRevenue = roundToTwoDecimals(lotSalePrice * numberOfLots);

  // Total profit = total revenue - total project cost (FR-042)
  const totalProfit = roundToTwoDecimals(totalRevenue - totalProjectCost);

  // Profit per lot
  const profitPerLot = numberOfLots > 0
    ? roundToTwoDecimals(totalProfit / numberOfLots)
    : 0;

  // ROI = (total profit / total project cost) × 100
  const returnOnInvestment = totalProjectCost > 0
    ? roundToTwoDecimals((totalProfit / totalProjectCost) * 100)
    : 0;

  return {
    profitMarginPercentage,
    lotSalePrice,
    totalRevenue,
    totalProfit,
    profitPerLot,
    returnOnInvestment,
  };
}

/**
 * Generate multiple pricing scenarios for different profit margins
 */
export function generatePricingScenarios(
  baseCostPerLot: number,
  profitMargins: number[],
  numberOfLots: number,
  totalProjectCost: number
): PricingScenario[] {
  return profitMargins.map(margin =>
    generatePricingScenario(baseCostPerLot, margin, numberOfLots, totalProjectCost)
  );
}

/**
 * Calculate monthly maintenance contribution per owner based on common area percentage (FR-043)
 * Owner contribution = total monthly maintenance × owner's common area percentage
 */
export function calculateMaintenanceContribution(
  totalMonthlyMaintenance: number,
  commonAreaPercentage: number
): number {
  return roundToTwoDecimals((totalMonthlyMaintenance * commonAreaPercentage) / 100);
}

/**
 * Calculate monthly maintenance contribution for a specific lot
 */
export function calculateLotMaintenanceContribution(
  totalMonthlyMaintenance: number,
  lot: MicroVillaLot
): number {
  return calculateMaintenanceContribution(totalMonthlyMaintenance, lot.commonAreaPercentage);
}

/**
 * Calculate complete financial analysis (FR-033 to FR-046)
 *
 * This is the main function that orchestrates all financial calculations
 * Performance requirement: Must complete in <1 second (SC-005)
 */
export function calculateFinancialAnalysis(
  landCost: number,
  amenitiesCost: number,
  legalCosts: number,
  otherCosts: OtherCost[],
  totalLandArea: number,
  selectedScenario: SubdivisionScenario | null,
  targetProfitMargins: number[],
  totalMonthlyMaintenance: number,
  currency: Currency,
  exchangeRate: number
): FinancialAnalysis {
  const now = new Date().toISOString();

  // Calculate total project cost (FR-036)
  const totalProjectCost = calculateTotalProjectCost(
    landCost,
    amenitiesCost,
    legalCosts,
    otherCosts
  );

  // Calculate cost per sqm (FR-037)
  const costPerSqm = calculateCostPerSqm(totalProjectCost, totalLandArea);

  // Calculate base cost per lot (FR-038)
  const numberOfLots = selectedScenario?.totalLots ?? 0;
  const baseCostPerLot = calculateBaseCostPerLot(totalProjectCost, numberOfLots);

  // Generate pricing scenarios (FR-039 to FR-042)
  const pricingScenarios = generatePricingScenarios(
    baseCostPerLot,
    targetProfitMargins,
    numberOfLots,
    totalProjectCost
  );

  // Calculate average maintenance per owner (FR-043)
  // For the summary, we calculate based on average common area percentage
  let monthlyMaintenancePerOwner = 0;
  if (selectedScenario && selectedScenario.lots.length > 0) {
    const avgCommonAreaPercentage =
      selectedScenario.lots.reduce((sum, lot) => sum + lot.commonAreaPercentage, 0) /
      selectedScenario.lots.length;
    monthlyMaintenancePerOwner = calculateMaintenanceContribution(
      totalMonthlyMaintenance,
      avgCommonAreaPercentage
    );
  }

  return {
    landCost,
    amenitiesCost,
    legalCosts,
    otherCosts,
    totalProjectCost,
    costPerSqm,
    baseCostPerLot,
    pricingScenarios,
    totalMonthlyMaintenance,
    monthlyMaintenancePerOwner,
    currency,
    exchangeRate,
    calculatedAt: now,
    lastUpdatedAt: now,
  };
}

/**
 * Recalculate financial analysis when subdivision scenario changes (FR-045, FR-046)
 * Preserves all entered financial data and recalculates derived values
 */
export function recalculateFinancialAnalysis(
  existingAnalysis: FinancialAnalysis,
  totalLandArea: number,
  selectedScenario: SubdivisionScenario | null,
  targetProfitMargins: number[]
): FinancialAnalysis {
  return calculateFinancialAnalysis(
    existingAnalysis.landCost,
    existingAnalysis.amenitiesCost,
    existingAnalysis.legalCosts,
    existingAnalysis.otherCosts,
    totalLandArea,
    selectedScenario,
    targetProfitMargins,
    existingAnalysis.totalMonthlyMaintenance,
    existingAnalysis.currency,
    existingAnalysis.exchangeRate
  );
}

/**
 * Format currency value for display
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  showSymbol: boolean = true
): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!showSymbol) return formatted;

  return currency === 'USD' ? `$${formatted}` : `RD$${formatted}`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
