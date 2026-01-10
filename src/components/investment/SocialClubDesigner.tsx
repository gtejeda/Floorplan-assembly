/**
 * Social Club Designer Component
 * User Story 3: Social Club Amenities Design
 *
 * Enables developers to design the social club by selecting amenities
 * from a comprehensive catalog organized by category.
 *
 * Features:
 * - T060-T061: Category-organized amenities catalog
 * - T062: Checkbox selection for amenities
 * - T063: Display default USD costs
 * - T064: Custom cost override inputs
 * - T065: Storage type selector (dedicated vs patio)
 * - T066: Selected amenities summary panel
 * - T067: Total cost calculation
 * - T068: Clear all selections button
 */

import { useCallback, useMemo } from 'react';
import { useFloorplanStore } from '@/store';
import {
  AMENITIES_CATALOG,
  AMENITY_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  getAmenitiesByCategory,
  calculateTotalAmenitiesCost,
} from '@/data/amenities';
import type { StorageType } from '@/models/types';

export function SocialClubDesigner() {
  // Store state
  const selectedAmenities = useFloorplanStore(state => state.selectedAmenities);
  const storageType = useFloorplanStore(state => state.storageType);
  const customAmenityCosts = useFloorplanStore(state => state.customAmenityCosts);

  // Store actions
  const toggleAmenity = useFloorplanStore(state => state.toggleAmenity);
  const setStorageType = useFloorplanStore(state => state.setStorageType);
  const setCustomAmenityCost = useFloorplanStore(state => state.setCustomAmenityCost);
  const removeCustomAmenityCost = useFloorplanStore(state => state.removeCustomAmenityCost);
  const clearSelectedAmenities = useFloorplanStore(state => state.clearSelectedAmenities);

  // Calculate total cost (T067)
  const totalCost = useMemo(() => {
    return calculateTotalAmenitiesCost(selectedAmenities, customAmenityCosts);
  }, [selectedAmenities, customAmenityCosts]);

  // Get selected amenity details for summary
  const selectedAmenityDetails = useMemo(() => {
    return selectedAmenities
      .map(id => AMENITIES_CATALOG.find(a => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined);
  }, [selectedAmenities]);

  // Handle custom cost change
  const handleCustomCostChange = useCallback((amenityId: string, value: string) => {
    const numValue = parseFloat(value);

    if (value === '' || isNaN(numValue)) {
      // Remove custom cost if empty or invalid
      removeCustomAmenityCost(amenityId);
    } else if (numValue > 0) {
      // Set custom cost if valid
      setCustomAmenityCost(amenityId, numValue);
    }
  }, [setCustomAmenityCost, removeCustomAmenityCost]);

  // Handle clear all button (T068)
  const handleClearAll = useCallback(() => {
    if (selectedAmenities.length === 0) return;

    if (window.confirm('Clear all selected amenities? This will remove all selections and custom costs.')) {
      clearSelectedAmenities();
    }
  }, [selectedAmenities.length, clearSelectedAmenities]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Social Club Designer</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select amenities and configure your social club
        </p>
      </div>

      {/* Storage Type Selector (T065) */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Storage Configuration
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="storageType"
              value="dedicated"
              checked={storageType === 'dedicated'}
              onChange={(e) => setStorageType(e.target.value as StorageType)}
              className="mr-2"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Dedicated Storage</div>
              <div className="text-xs text-gray-600">Separate storage building in social club area</div>
            </div>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="storageType"
              value="patio"
              checked={storageType === 'patio'}
              onChange={(e) => setStorageType(e.target.value as StorageType)}
              className="mr-2"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Patio Storage</div>
              <div className="text-xs text-gray-600">Storage integrated into villa patios</div>
            </div>
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Amenities Catalog by Category (T060, T061) */}
          {AMENITY_CATEGORIES.map((category) => {
            const categoryAmenities = getAmenitiesByCategory(category);

            return (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    {CATEGORY_DISPLAY_NAMES[category]}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {categoryAmenities.length} option{categoryAmenities.length !== 1 ? 's' : ''} available
                  </p>
                </div>

                <div className="divide-y divide-gray-200">
                  {categoryAmenities.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity.id);
                    const customCost = customAmenityCosts[amenity.id];
                    const displayCost = customCost ?? amenity.defaultCostUSD;

                    return (
                      <div
                        key={amenity.id}
                        className={`p-3 transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Amenity Header with Checkbox (T062) */}
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAmenity(amenity.id)}
                            className="mt-1 mr-3 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {amenity.name}
                              </span>
                              {/* Default Cost Display (T063) */}
                              <span className={`text-sm font-semibold ${
                                customCost !== undefined ? 'text-blue-600' : 'text-gray-700'
                              }`}>
                                ${displayCost.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">
                              {amenity.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              Unit: {amenity.unit}
                              {amenity.spaceRequirement && (
                                <> • Space: {amenity.spaceRequirement} sqm</>
                              )}
                            </div>
                          </div>
                        </label>

                        {/* Custom Cost Override Input (T064) */}
                        {isSelected && (
                          <div className="mt-2 ml-7 flex items-center gap-2">
                            <label className="text-xs text-gray-700 font-medium">
                              Custom Cost:
                            </label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                $
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                placeholder={amenity.defaultCostUSD.toString()}
                                value={customCost ?? ''}
                                onChange={(e) => handleCustomCostChange(amenity.id, e.target.value)}
                                className="pl-5 pr-3 py-1 w-32 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            {customCost !== undefined && (
                              <button
                                onClick={() => removeCustomAmenityCost(amenity.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                title="Reset to default cost"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Amenities Summary Panel (T066) */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            Selected Amenities ({selectedAmenities.length})
          </h3>
          {selectedAmenities.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {selectedAmenities.length === 0 ? (
          <p className="text-sm text-gray-600 italic">
            No amenities selected yet. Check the boxes above to add amenities to your social club.
          </p>
        ) : (
          <>
            {/* Selected items list */}
            <div className="max-h-32 overflow-y-auto mb-3 space-y-1">
              {selectedAmenityDetails.map((amenity) => {
                const cost = customAmenityCosts[amenity.id] ?? amenity.defaultCostUSD;
                return (
                  <div
                    key={amenity.id}
                    className="flex justify-between items-center text-sm py-1"
                  >
                    <span className="text-gray-700 truncate flex-1">
                      {amenity.name}
                    </span>
                    <span className={`ml-2 font-medium ${
                      customAmenityCosts[amenity.id] !== undefined
                        ? 'text-blue-600'
                        : 'text-gray-900'
                    }`}>
                      ${cost.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total Cost (T067) */}
            <div className="pt-3 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Amenities Cost:</span>
                <span className="text-xl font-bold text-blue-600">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
              {Object.keys(customAmenityCosts).length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  * Includes {Object.keys(customAmenityCosts).length} custom cost override{Object.keys(customAmenityCosts).length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
