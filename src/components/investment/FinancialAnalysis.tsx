/**
 * Financial Analysis Component
 *
 * Displays comprehensive financial analysis for Micro Villas investment
 * - Land cost (read from land parcel)
 * - Amenities cost (auto-calculated from selected amenities)
 * - Legal costs (user input)
 * - Other costs (custom categories with add/remove/edit)
 * - Exchange rate input for DOP/USD conversion
 * - Currency display toggle (USD/DOP)
 * - Total monthly maintenance cost input
 *
 * Per spec FR-033 to FR-046
 * Auto-save enabled via unified middleware (T030)
 * Real-time recalculation on any cost changes (<1 second per SC-005)
 */

import { useState, useEffect, useMemo } from 'react';
import { useFloorplanStore } from '../../store';
import { AMENITIES_CATALOG } from '../../data/amenities';
import { calculateFinancialAnalysis, formatCurrency, convertCurrency } from '../../lib/financial';
import type { Currency, OtherCost } from '../../models/types';

export function FinancialAnalysis() {
  const landParcel = useFloorplanStore(state => state.landParcel);
  const selectedScenario = useFloorplanStore(state => {
    const scenarios = state.subdivisionScenarios;
    const selectedId = state.selectedScenarioId;
    return scenarios.find(s => s.id === selectedId) || null;
  });
  const selectedAmenities = useFloorplanStore(state => state.selectedAmenities);
  const customAmenityCosts = useFloorplanStore(state => state.customAmenityCosts);
  const financialAnalysis = useFloorplanStore(state => state.financialAnalysis);
  const targetProfitMargins = useFloorplanStore(state => state.targetProfitMargins);

  // Actions
  const updateFinancialAnalysis = useFloorplanStore(state => state.updateFinancialAnalysis);
  const addOtherCost = useFloorplanStore(state => state.addOtherCost);
  const updateOtherCost = useFloorplanStore(state => state.updateOtherCost);
  const removeOtherCost = useFloorplanStore(state => state.removeOtherCost);
  const setCurrency = useFloorplanStore(state => state.setCurrency);
  const setExchangeRate = useFloorplanStore(state => state.setExchangeRate);
  const setTotalMonthlyMaintenance = useFloorplanStore(state => state.setTotalMonthlyMaintenance);

  // Local state
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(
    financialAnalysis?.currency || 'USD'
  );
  const [exchangeRate, setExchangeRateLocal] = useState<string>(
    financialAnalysis?.exchangeRate.toString() || '58.5'
  );
  const [legalCosts, setLegalCosts] = useState<string>(
    financialAnalysis?.legalCosts.toString() || '0'
  );
  const [monthlyMaintenance, setMonthlyMaintenance] = useState<string>(
    financialAnalysis?.totalMonthlyMaintenance.toString() || '0'
  );

  // New other cost form
  const [showAddCostForm, setShowAddCostForm] = useState(false);
  const [newCostLabel, setNewCostLabel] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [newCostCategory, setNewCostCategory] = useState('');

  // Editing other cost
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [editCostLabel, setEditCostLabel] = useState('');
  const [editCostAmount, setEditCostAmount] = useState('');

  // Validation
  const [exchangeRateError, setExchangeRateError] = useState('');

  // Calculate amenities cost from selected amenities
  const amenitiesCost = useMemo(() => {
    let total = 0;
    selectedAmenities.forEach(amenityId => {
      // Check if there's a custom cost, otherwise use default
      if (customAmenityCosts[amenityId] !== undefined) {
        total += customAmenityCosts[amenityId];
      } else {
        const amenity = AMENITIES_CATALOG.find(a => a.id === amenityId);
        if (amenity) {
          total += amenity.defaultCostUSD;
        }
      }
    });
    return total;
  }, [selectedAmenities, customAmenityCosts]);

  // Get land cost (always in land parcel's currency)
  const landCost = landParcel?.acquisitionCost || 0;
  const landCurrency = landParcel?.acquisitionCurrency || 'USD';

  // Convert land cost to analysis currency if needed
  const landCostInAnalysisCurrency = useMemo(() => {
    const rate = parseFloat(exchangeRate) || 58.5;
    return convertCurrency(landCost, landCurrency, displayCurrency, rate);
  }, [landCost, landCurrency, displayCurrency, exchangeRate]);

  // Debounced recalculation (300ms per spec T089)
  useEffect(() => {
    const timer = setTimeout(() => {
      const legalCostsNum = parseFloat(legalCosts) || 0;
      const monthlyMaintenanceNum = parseFloat(monthlyMaintenance) || 0;
      const exchangeRateNum = parseFloat(exchangeRate) || 58.5;

      if (landParcel && selectedScenario) {
        const analysis = calculateFinancialAnalysis(
          landCostInAnalysisCurrency,
          amenitiesCost,
          legalCostsNum,
          financialAnalysis?.otherCosts || [],
          landParcel.totalArea,
          selectedScenario,
          targetProfitMargins,
          monthlyMaintenanceNum,
          displayCurrency,
          exchangeRateNum
        );

        updateFinancialAnalysis(analysis);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    landCostInAnalysisCurrency,
    amenitiesCost,
    legalCosts,
    monthlyMaintenance,
    financialAnalysis?.otherCosts,
    landParcel,
    selectedScenario,
    targetProfitMargins,
    displayCurrency,
    exchangeRate,
  ]);

  // Handle exchange rate change
  const handleExchangeRateChange = (value: string) => {
    setExchangeRateLocal(value);
    const rate = parseFloat(value);

    if (isNaN(rate) || rate <= 0) {
      setExchangeRateError('Exchange rate must be greater than 0');
      return;
    }

    setExchangeRateError('');
    setExchangeRate(rate);
  };

  // Handle currency toggle
  const handleCurrencyToggle = () => {
    const newCurrency: Currency = displayCurrency === 'USD' ? 'DOP' : 'USD';
    setDisplayCurrency(newCurrency);
    setCurrency(newCurrency);
  };

  // Handle legal costs change
  const handleLegalCostsChange = (value: string) => {
    setLegalCosts(value);
  };

  // Handle monthly maintenance change
  const handleMonthlyMaintenanceChange = (value: string) => {
    setMonthlyMaintenance(value);
    const amount = parseFloat(value) || 0;
    setTotalMonthlyMaintenance(amount);
  };

  // Handle add other cost
  const handleAddOtherCost = () => {
    if (!newCostLabel.trim() || !newCostAmount.trim()) return;

    const amount = parseFloat(newCostAmount);
    if (isNaN(amount) || amount < 0) return;

    addOtherCost({
      label: newCostLabel.trim(),
      amount,
      category: newCostCategory.trim() || undefined,
    });

    // Reset form
    setNewCostLabel('');
    setNewCostAmount('');
    setNewCostCategory('');
    setShowAddCostForm(false);
  };

  // Handle edit other cost
  const handleEditOtherCost = (cost: OtherCost) => {
    setEditingCostId(cost.id);
    setEditCostLabel(cost.label);
    setEditCostAmount(cost.amount.toString());
  };

  // Handle save edit
  const handleSaveEdit = (costId: string) => {
    if (!editCostLabel.trim() || !editCostAmount.trim()) return;

    const amount = parseFloat(editCostAmount);
    if (isNaN(amount) || amount < 0) return;

    updateOtherCost(costId, {
      label: editCostLabel.trim(),
      amount,
    });

    setEditingCostId(null);
    setEditCostLabel('');
    setEditCostAmount('');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCostId(null);
    setEditCostLabel('');
    setEditCostAmount('');
  };

  // Handle remove other cost
  const handleRemoveOtherCost = (costId: string) => {
    if (confirm('Are you sure you want to remove this cost item?')) {
      removeOtherCost(costId);
    }
  };

  // Format currency for display
  const formatAmount = (amount: number) => {
    return formatCurrency(amount, displayCurrency, true);
  };

  // Group other costs by category
  const groupedOtherCosts = useMemo(() => {
    const costs = financialAnalysis?.otherCosts || [];
    const groups: Record<string, OtherCost[]> = {
      uncategorized: [],
    };

    costs.forEach(cost => {
      const category = cost.category || 'uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cost);
    });

    return groups;
  }, [financialAnalysis?.otherCosts]);

  return (
    <div className="p-4 space-y-6 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Financial Analysis</h2>

        {/* Currency Toggle */}
        <button
          onClick={handleCurrencyToggle}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          title="Toggle display currency"
        >
          Display: {displayCurrency === 'USD' ? 'USD ($)' : 'DOP (RD$)'}
        </button>
      </div>

      {/* Exchange Rate Input */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exchange Rate (DOP per USD)
        </label>
        <input
          type="number"
          value={exchangeRate}
          onChange={(e) => handleExchangeRateChange(e.target.value)}
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="58.50"
        />
        {exchangeRateError && (
          <p className="mt-1 text-sm text-red-600">{exchangeRateError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Current: 1 USD = {exchangeRate} DOP
        </p>
      </div>

      {/* Cost Inputs Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Project Costs</h3>

        {/* Land Cost (Read-only, from land parcel) */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Land Acquisition Cost
          </label>
          <div className="text-2xl font-bold text-blue-900">
            {formatAmount(landCostInAnalysisCurrency)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            From land parcel configuration ({landCurrency})
          </p>
        </div>

        {/* Amenities Cost (Auto-calculated, read-only) */}
        <div className="p-4 bg-green-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Social Club Amenities Cost
          </label>
          <div className="text-2xl font-bold text-green-900">
            {formatAmount(amenitiesCost)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Auto-calculated from {selectedAmenities.length} selected amenities
          </p>
        </div>

        {/* Legal Costs (User input) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Legal Costs (Notary, Permits, Registrations)
          </label>
          <input
            type="number"
            value={legalCosts}
            onChange={(e) => handleLegalCostsChange(e.target.value)}
            step="100"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10000"
          />
        </div>

        {/* Monthly Maintenance Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Monthly Maintenance Cost
          </label>
          <input
            type="number"
            value={monthlyMaintenance}
            onChange={(e) => handleMonthlyMaintenanceChange(e.target.value)}
            step="50"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Total monthly cost for maintaining common areas (pool, amenities, landscaping)
          </p>
        </div>

        {/* Other Costs Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-gray-800">Other Costs</h4>
            <button
              onClick={() => setShowAddCostForm(!showAddCostForm)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAddCostForm ? '- Cancel' : '+ Add Cost'}
            </button>
          </div>

          {/* Add Cost Form */}
          {showAddCostForm && (
            <div className="p-4 bg-gray-50 rounded-lg mb-3 space-y-3">
              <input
                type="text"
                value={newCostLabel}
                onChange={(e) => setNewCostLabel(e.target.value)}
                placeholder="Cost label (e.g., Infrastructure)"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={newCostAmount}
                onChange={(e) => setNewCostAmount(e.target.value)}
                placeholder="Amount"
                step="100"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newCostCategory}
                onChange={(e) => setNewCostCategory(e.target.value)}
                placeholder="Category (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddOtherCost}
                disabled={!newCostLabel.trim() || !newCostAmount.trim()}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add Cost Item
              </button>
            </div>
          )}

          {/* Other Costs List */}
          <div className="space-y-2">
            {Object.entries(groupedOtherCosts).map(([category, costs]) => (
              <div key={category}>
                {category !== 'uncategorized' && (
                  <h5 className="text-sm font-medium text-gray-600 mt-3 mb-1">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h5>
                )}
                {costs.map(cost => (
                  <div
                    key={cost.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    {editingCostId === cost.id ? (
                      // Edit mode
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editCostLabel}
                          onChange={(e) => setEditCostLabel(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="number"
                          value={editCostAmount}
                          onChange={(e) => setEditCostAmount(e.target.value)}
                          step="100"
                          min="0"
                          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => handleSaveEdit(cost.id)}
                          className="px-2 py-1 text-sm text-green-600 hover:text-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{cost.label}</div>
                          <div className="text-sm text-gray-600">{formatAmount(cost.amount)}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditOtherCost(cost)}
                            className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveOtherCost(cost.id)}
                            className="px-2 py-1 text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {(!financialAnalysis?.otherCosts || financialAnalysis.otherCosts.length === 0) && (
              <p className="text-sm text-gray-500 italic py-2">
                No other costs added. Click "+ Add Cost" to add infrastructure, marketing, or other expenses.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {financialAnalysis && (
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Financial Summary</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Project Cost</div>
              <div className="text-xl font-bold text-purple-900">
                {formatAmount(financialAnalysis.totalProjectCost)}
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg">
              <div className="text-sm text-gray-600">Cost per sqm</div>
              <div className="text-xl font-bold text-indigo-900">
                {formatAmount(financialAnalysis.costPerSqm)}
              </div>
            </div>

            {selectedScenario && (
              <>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <div className="text-sm text-gray-600">Base Cost per Lot</div>
                  <div className="text-xl font-bold text-pink-900">
                    {formatAmount(financialAnalysis.baseCostPerLot)}
                  </div>
                </div>

                <div className="p-3 bg-teal-50 rounded-lg">
                  <div className="text-sm text-gray-600">Avg. Monthly Maintenance per Owner</div>
                  <div className="text-xl font-bold text-teal-900">
                    {formatAmount(financialAnalysis.monthlyMaintenancePerOwner)}
                  </div>
                </div>
              </>
            )}
          </div>

          {!selectedScenario && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              Select a subdivision scenario to see per-lot costs and maintenance calculations.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
