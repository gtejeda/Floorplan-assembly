/**
 * ScenarioList - Display and select subdivision scenarios
 *
 * Per spec requirements:
 * - FR-010: Display all viable scenarios with key metrics
 * - FR-011: Allow manual selection of any viable scenario
 * - FR-012: Highlight default scenario (20% social club)
 * - Show metrics: social club %, lot count, average lot size, efficiency
 */

import { useMemo } from 'react';
import { useFloorplanStore } from '../../store';
import type { SubdivisionScenario } from '../../models/types';

// ==================== Constants ====================

const DEFAULT_SOCIAL_CLUB_PERCENTAGE = 20; // Per FR-009

// ==================== Component ====================

export function ScenarioList() {
  const scenarios = useFloorplanStore(state => state.subdivisionScenarios);
  const selectedScenarioId = useFloorplanStore(state => state.selectedScenarioId);
  const selectScenario = useFloorplanStore(state => state.selectScenario);

  // Sort scenarios by social club percentage
  const sortedScenarios = useMemo(() => {
    return [...scenarios].sort((a, b) => a.socialClubPercentage - b.socialClubPercentage);
  }, [scenarios]);

  // Note: default scenario highlighting is handled in ScenarioCard component

  if (scenarios.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded">
        <p className="text-gray-500 text-sm">No scenarios available. Configure land parcel first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with scenario count */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold">Subdivision Scenarios</h3>
        <p className="text-sm text-gray-600 mt-1">
          {sortedScenarios.length} viable scenario{sortedScenarios.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* T057: Manual social club percentage slider */}
      <div className="p-4 border-b bg-white">
        <SocialClubPercentageSlider scenarios={sortedScenarios} />
      </div>

      {/* Scenario list */}
      <div className="flex-1 overflow-y-auto">
        {sortedScenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={scenario.id === selectedScenarioId}
            isDefault={scenario.socialClubPercentage === DEFAULT_SOCIAL_CLUB_PERCENTAGE}
            onSelect={() => selectScenario(scenario.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

/**
 * T057: Manual social club percentage adjustment slider
 * Allows user to jump to any scenario by percentage
 */
function SocialClubPercentageSlider({ scenarios }: { scenarios: SubdivisionScenario[] }) {
  const selectedScenarioId = useFloorplanStore(state => state.selectedScenarioId);
  const selectScenario = useFloorplanStore(state => state.selectScenario);

  // Get current selected scenario
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  if (!selectedScenario) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(e.target.value, 10);
    const targetScenario = scenarios.find(s => s.socialClubPercentage === percentage);
    if (targetScenario) {
      selectScenario(targetScenario.id);
    }
  };

  // Get available percentages from scenarios
  const availablePercentages = scenarios.map(s => s.socialClubPercentage).sort((a, b) => a - b);
  const minPercentage = Math.min(...availablePercentages);
  const maxPercentage = Math.max(...availablePercentages);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Social Club Percentage: {selectedScenario.socialClubPercentage}%
      </label>
      <input
        type="range"
        min={minPercentage}
        max={maxPercentage}
        step={1}
        value={selectedScenario.socialClubPercentage}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{minPercentage}%</span>
        <span className="text-orange-600 font-medium">{DEFAULT_SOCIAL_CLUB_PERCENTAGE}% (default)</span>
        <span>{maxPercentage}%</span>
      </div>
    </div>
  );
}

/**
 * Individual scenario card with metrics
 * T055: Scenario selection handler
 * T056: Highlight default and selected scenarios
 */
function ScenarioCard({
  scenario,
  isSelected,
  isDefault,
  onSelect,
}: {
  scenario: SubdivisionScenario;
  isSelected: boolean;
  isDefault: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 border-b text-left transition-colors
        ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}
        ${isDefault && !isSelected ? 'border-l-4 border-l-orange-400' : ''}
      `}
    >
      {/* Header with percentage and badges */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">
          {scenario.socialClubPercentage}% Social Club
        </h4>
        <div className="flex gap-2">
          {isDefault && (
            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
              Default
            </span>
          )}
          {isSelected && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              Selected
            </span>
          )}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <MetricItem label="Lots" value={scenario.totalLots.toString()} />
        <MetricItem
          label="Avg. Lot Size"
          value={`${scenario.averageLotSize.toFixed(1)} sqm`}
        />
        <MetricItem
          label="Social Club Area"
          value={`${scenario.socialClub.area.toFixed(1)} sqm`}
        />
        <MetricItem
          label="Efficiency"
          value={`${scenario.efficiency.toFixed(1)}%`}
        />
      </div>

      {/* Additional info for selected scenario */}
      {isSelected && scenario.lots.length > 0 && (
        <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Smallest lot:</span>
            <span className="font-medium">
              {Math.min(...scenario.lots.map(l => l.area)).toFixed(1)} sqm
            </span>
          </div>
          <div className="flex justify-between">
            <span>Largest lot:</span>
            <span className="font-medium">
              {Math.max(...scenario.lots.map(l => l.area)).toFixed(1)} sqm
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

/**
 * Metric display item
 */
function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
