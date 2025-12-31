import { useFloorplanStore } from '@store/index';
import { useCallback, useState, useEffect } from 'react';
import {
  metersToDisplayUnit,
  displayUnitToMeters,
  formatArea,
  formatLength,
  getUnitAbbreviation,
} from '@lib/coordinates';

const GRID_SIZE_OPTIONS_METERS = [0.5, 1.0, 2.0, 5.0, 10.0];

export function LotPanel() {
  const project = useFloorplanStore((state) => state.project);
  const updateLot = useFloorplanStore((state) => state.updateLot);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  const unitAbbr = getUnitAbbreviation(displayUnit);

  // Local state for controlled inputs (in display units)
  const [width, setWidth] = useState(metersToDisplayUnit(project?.lot.width ?? 50, displayUnit));
  const [height, setHeight] = useState(metersToDisplayUnit(project?.lot.height ?? 30, displayUnit));

  // Sync with store when project or display unit changes
  useEffect(() => {
    if (project) {
      setWidth(metersToDisplayUnit(project.lot.width, displayUnit));
      setHeight(metersToDisplayUnit(project.lot.height, displayUnit));
    }
  }, [project?.lot.width, project?.lot.height, displayUnit]);

  // Update to store - convert from display unit to meters
  const handleWidthChange = useCallback(
    (displayValue: number) => {
      setWidth(displayValue);
      const metersValue = displayUnitToMeters(displayValue, displayUnit);
      if (metersValue > 0 && metersValue <= 10000) {
        updateLot({ width: metersValue });
      }
    },
    [updateLot, displayUnit]
  );

  const handleHeightChange = useCallback(
    (displayValue: number) => {
      setHeight(displayValue);
      const metersValue = displayUnitToMeters(displayValue, displayUnit);
      if (metersValue > 0 && metersValue <= 10000) {
        updateLot({ height: metersValue });
      }
    },
    [updateLot, displayUnit]
  );

  const handleGridSizeChange = useCallback(
    (metersValue: number) => {
      updateLot({ gridSize: metersValue });
    },
    [updateLot]
  );

  if (!project) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No project loaded
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Lot Settings
      </h2>

      <div className="space-y-4">
        {/* Width input */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Width ({unitAbbr})
          </label>
          <input
            type="number"
            value={parseFloat(width.toFixed(2))}
            onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
            min={0.001}
            max={displayUnit === 'feet' ? 32808 : 10000}
            step={displayUnit === 'feet' ? 1 : 1}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Height input */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Height ({unitAbbr})
          </label>
          <input
            type="number"
            value={parseFloat(height.toFixed(2))}
            onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
            min={0.001}
            max={displayUnit === 'feet' ? 32808 : 10000}
            step={displayUnit === 'feet' ? 1 : 1}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Grid size selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Grid Size
          </label>
          <select
            value={project.lot.gridSize}
            onChange={(e) => handleGridSizeChange(parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {GRID_SIZE_OPTIONS_METERS.map((size) => (
              <option key={size} value={size}>
                {formatLength(size, displayUnit, 1)}
              </option>
            ))}
          </select>
        </div>

        {/* Lot area display */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Area:</span>
            <span className="text-white font-medium">
              {formatArea(project.lot.width * project.lot.height, displayUnit)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Dimensions:</span>
            <span className="text-gray-300">
              {formatLength(project.lot.width, displayUnit, 1)} × {formatLength(project.lot.height, displayUnit, 1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
