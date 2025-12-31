import { useState, useCallback, useEffect } from 'react';
import { useFloorplanStore } from '@store/index';
import type { FloorplanStore } from '@store/index';
import {
  metersToDisplayUnit,
  displayUnitToMeters,
  formatLength,
  getUnitAbbreviation,
} from '@lib/coordinates';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Grid size options stored in meters
const GRID_SIZE_OPTIONS_METERS = [0.5, 1.0, 5.0, 10.0];

export function NewProjectDialog({ isOpen, onClose }: NewProjectDialogProps) {
  const createProject = useFloorplanStore((state: FloorplanStore) => state.createProject);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  const unitAbbr = getUnitAbbreviation(displayUnit);

  const [name, setName] = useState('New Project');
  const [width, setWidth] = useState(() => metersToDisplayUnit(50, displayUnit));
  const [height, setHeight] = useState(() => metersToDisplayUnit(30, displayUnit));
  const [gridSize, setGridSize] = useState(1.0);

  // Sync default values when displayUnit changes
  useEffect(() => {
    setWidth(metersToDisplayUnit(50, displayUnit));
    setHeight(metersToDisplayUnit(30, displayUnit));
  }, [displayUnit]);

  const handleCreate = useCallback(() => {
    // Convert from display units to meters for storage
    const widthMeters = displayUnitToMeters(width, displayUnit);
    const heightMeters = displayUnitToMeters(height, displayUnit);

    createProject(name, {
      width: widthMeters,
      height: heightMeters,
      gridSize,
    });

    // Reset form to defaults (in display units)
    setName('New Project');
    setWidth(metersToDisplayUnit(50, displayUnit));
    setHeight(metersToDisplayUnit(30, displayUnit));
    setGridSize(1.0);

    onClose();
  }, [name, width, height, gridSize, displayUnit, createProject, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-96 max-w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Create New Project</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Lot Width & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Lot Width ({unitAbbr})
              </label>
              <input
                type="number"
                value={parseFloat(width.toFixed(2))}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                min={1}
                step={displayUnit === 'feet' ? 1 : 1}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Lot Height ({unitAbbr})
              </label>
              <input
                type="number"
                value={parseFloat(height.toFixed(2))}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 1)}
                min={1}
                step={displayUnit === 'feet' ? 1 : 1}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Grid Size */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Grid Size
            </label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            >
              {GRID_SIZE_OPTIONS_METERS.map((size) => (
                <option key={size} value={size}>
                  {formatLength(size, displayUnit, 1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
