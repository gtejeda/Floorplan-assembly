/**
 * Pricing Scenarios Component
 *
 * Displays pricing analysis with multiple profit margin scenarios
 * - Profit margin selector (15%, 20%, 25%, 30%, 40%) with custom input
 * - Calculated metrics table showing:
 *   - Lot sale price per margin
 *   - Total revenue per margin
 *   - Total profit per margin
 *   - ROI per margin
 *
 * Per spec FR-039 to FR-042
 * Real-time updates (<1 second per SC-005)
 */

import { useState, useMemo } from 'react';
import { useFloorplanStore } from '../../store';
import { formatCurrency, formatPercentage } from '../../lib/financial';
import type { Currency } from '../../models/types';

export function PricingScenarios() {
  const financialAnalysis = useFloorplanStore(state => state.financialAnalysis);
  const targetProfitMargins = useFloorplanStore(state => state.targetProfitMargins);
  const addTargetProfitMargin = useFloorplanStore(state => state.addTargetProfitMargin);
  const removeTargetProfitMargin = useFloorplanStore(state => state.removeTargetProfitMargin);
  const selectedScenario = useFloorplanStore(state => {
    const scenarios = state.subdivisionScenarios;
    const selectedId = state.selectedScenarioId;
    return scenarios.find(s => s.id === selectedId) || null;
  });

  // Local state
  const [customMargin, setCustomMargin] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Common profit margins
  const commonMargins = [15, 20, 25, 30, 40];

  // Currency from financial analysis
  const currency: Currency = financialAnalysis?.currency || 'USD';

  // Format currency for display
  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currency, true);
  };

  // Handle add custom margin
  const handleAddCustomMargin = () => {
    const margin = parseFloat(customMargin);
    if (isNaN(margin) || margin <= 0 || margin > 200) {
      alert('Please enter a valid profit margin between 0 and 200%');
      return;
    }

    addTargetProfitMargin(margin);
    setCustomMargin('');
    setShowCustomInput(false);
  };

  // Handle toggle margin
  const handleToggleMargin = (margin: number) => {
    if (targetProfitMargins.includes(margin)) {
      if (targetProfitMargins.length === 1) {
        alert('At least one profit margin must be selected');
        return;
      }
      removeTargetProfitMargin(margin);
    } else {
      addTargetProfitMargin(margin);
    }
  };

  // Handle remove custom margin
  const handleRemoveCustomMargin = (margin: number) => {
    if (targetProfitMargins.length === 1) {
      alert('At least one profit margin must be selected');
      return;
    }
    if (confirm(`Remove ${margin}% profit margin?`)) {
      removeTargetProfitMargin(margin);
    }
  };

  // Get pricing scenarios sorted by profit margin
  const sortedScenarios = useMemo(() => {
    if (!financialAnalysis) return [];
    return [...financialAnalysis.pricingScenarios].sort(
      (a, b) => a.profitMarginPercentage - b.profitMarginPercentage
    );
  }, [financialAnalysis]);

  // Check if data is ready
  const isDataReady = financialAnalysis && selectedScenario && financialAnalysis.totalProjectCost > 0;

  // Separate common and custom margins
  const customMargins = targetProfitMargins.filter(m => !commonMargins.includes(m));

  return (
    <div className="p-4 space-y-6 bg-white border-b border-gray-200">
      <h2 className="text-xl font-bold text-gray-900">Pricing Scenarios</h2>

      {!isDataReady && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800">
            Configure land parcel, select a subdivision scenario, and enter costs to see pricing scenarios.
          </p>
        </div>
      )}

      {isDataReady && (
        <>
          {/* Profit Margin Selector */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Select Profit Margins</h3>

            {/* Common Margins */}
            <div className="flex flex-wrap gap-2">
              {commonMargins.map(margin => (
                <button
                  key={margin}
                  onClick={() => handleToggleMargin(margin)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    targetProfitMargins.includes(margin)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {margin}%
                </button>
              ))}
            </div>

            {/* Custom Margins */}
            {customMargins.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">Custom Margins:</h4>
                <div className="flex flex-wrap gap-2">
                  {customMargins.map(margin => (
                    <div
                      key={margin}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-900 rounded"
                    >
                      <span className="font-medium">{margin}%</span>
                      <button
                        onClick={() => handleRemoveCustomMargin(margin)}
                        className="text-purple-600 hover:text-purple-800"
                        title="Remove margin"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Margin */}
            <div className="pt-2">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Custom Margin
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customMargin}
                    onChange={(e) => setCustomMargin(e.target.value)}
                    placeholder="Enter %"
                    step="1"
                    min="0"
                    max="200"
                    className="w-32 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustomMargin();
                      if (e.key === 'Escape') {
                        setShowCustomInput(false);
                        setCustomMargin('');
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCustomMargin}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomMargin('');
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Table */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Pricing Analysis</h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Profit Margin
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Lot Sale Price
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Total Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Total Profit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Profit per Lot
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedScenarios.map((scenario, index) => (
                    <tr
                      key={scenario.profitMarginPercentage}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatPercentage(scenario.profitMarginPercentage, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatAmount(scenario.lotSalePrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatAmount(scenario.totalRevenue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${
                          scenario.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {formatAmount(scenario.totalProfit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {formatAmount(scenario.profitPerLot)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${
                          scenario.returnOnInvestment >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {formatPercentage(scenario.returnOnInvestment, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Number of Lots</div>
              <div className="text-2xl font-bold text-blue-900">
                {selectedScenario.totalLots}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Average Lot Size</div>
              <div className="text-2xl font-bold text-green-900">
                {selectedScenario.averageLotSize.toFixed(1)} sqm
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Project Cost</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatAmount(financialAnalysis.totalProjectCost)}
              </div>
            </div>
          </div>

          {/* Helpful Tips */}
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
            <p className="font-medium text-gray-800">Understanding the Table:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Lot Sale Price:</strong> Price per lot at the given profit margin</li>
              <li><strong>Total Revenue:</strong> Income from selling all lots</li>
              <li><strong>Total Profit:</strong> Revenue minus total project cost</li>
              <li><strong>ROI:</strong> Return on investment as a percentage</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
