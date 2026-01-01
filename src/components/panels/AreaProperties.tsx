import { useCallback, useMemo } from 'react';
import { useFloorplanStore } from '@store/index';
import type { AreaType } from '@models/types';
import { AREA_TYPE_PROPERTIES } from '@models/types';
import {
  metersToDisplayUnit,
  displayUnitToMeters,
  formatArea,
  getUnitAbbreviation,
} from '@lib/coordinates';

const AREA_TYPES: { id: AreaType; label: string; group: string }[] = [
  // Spaces
  { id: 'house', label: 'House', group: 'Spaces' },
  { id: 'lounge', label: 'Lounge', group: 'Spaces' },
  { id: 'garden', label: 'Garden', group: 'Spaces' },
  { id: 'parking', label: 'Parking', group: 'Spaces' },
  { id: 'court', label: 'Court', group: 'Spaces' },
  { id: 'pool', label: 'Pool', group: 'Spaces' },
  // Structural
  { id: 'wall', label: 'Wall', group: 'Structural' },
  { id: 'column', label: 'Column', group: 'Structural' },
  { id: 'stairs', label: 'Stairs', group: 'Structural' },
  { id: 'void', label: 'Void/Opening', group: 'Structural' },
  // Openings
  { id: 'door', label: 'Door', group: 'Openings' },
  { id: 'window', label: 'Window', group: 'Openings' },
  // Other
  { id: 'custom', label: 'Custom', group: 'Other' },
];

export function AreaProperties() {
  const rawAreas = useFloorplanStore((state) => state.project?.areas);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const updateArea = useFloorplanStore((state) => state.updateArea);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  const unitAbbr = getUnitAbbreviation(displayUnit);

  // Compute selected areas with useMemo to prevent infinite loops
  const selectedAreas = useMemo(() => {
    if (!rawAreas || rawAreas.length === 0 || selectedIds.length === 0) return [];
    return rawAreas.filter((area) => selectedIds.includes(area.id));
  }, [rawAreas, selectedIds]);

  const handleUpdate = useCallback(
    (field: string, value: string | number | boolean) => {
      selectedAreas.forEach((area) => {
        updateArea(area.id, { [field]: value });
      });
    },
    [selectedAreas, updateArea]
  );

  // Handle dimension updates - convert from display unit to meters for storage
  const handleDimensionUpdate = useCallback(
    (field: string, displayValue: number) => {
      const metersValue = displayUnitToMeters(displayValue, displayUnit);
      selectedAreas.forEach((area) => {
        updateArea(area.id, { [field]: metersValue });
      });
    },
    [selectedAreas, updateArea, displayUnit]
  );

  if (selectedAreas.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Properties
        </h2>
        <p className="text-sm text-gray-500">
          Select an area to edit its properties
        </p>
      </div>
    );
  }

  // Multi-selection: show common properties
  if (selectedAreas.length > 1) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Properties ({selectedAreas.length} selected)
        </h2>

        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select
              value=""
              onChange={(e) => handleUpdate('type', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Mixed
              </option>
              {['Spaces', 'Structural', 'Openings', 'Other'].map((group) => (
                <optgroup key={group} label={group}>
                  {AREA_TYPES.filter((t) => t.group === group).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Color</label>
            <input
              type="color"
              onChange={(e) => handleUpdate('color', e.target.value)}
              className="w-full h-10 rounded cursor-pointer bg-transparent border border-gray-600"
            />
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              onChange={(e) => handleUpdate('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Single selection: show all properties
  const area = selectedAreas[0];

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Properties
      </h2>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={area.name}
            onChange={(e) => handleUpdate('name', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Type</label>
          <select
            value={area.type}
            onChange={(e) => handleUpdate('type', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {['Spaces', 'Structural', 'Openings', 'Other'].map((group) => (
              <optgroup key={group} label={group}>
                {AREA_TYPES.filter((t) => t.group === group).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">X ({unitAbbr})</label>
            <input
              type="number"
              value={parseFloat(metersToDisplayUnit(area.x, displayUnit).toFixed(2))}
              onChange={(e) => handleDimensionUpdate('x', parseFloat(e.target.value) || 0)}
              step={displayUnit === 'feet' ? 1 : 0.5}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y ({unitAbbr})</label>
            <input
              type="number"
              value={parseFloat(metersToDisplayUnit(area.y, displayUnit).toFixed(2))}
              onChange={(e) => handleDimensionUpdate('y', parseFloat(e.target.value) || 0)}
              step={displayUnit === 'feet' ? 1 : 0.5}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Width ({unitAbbr})</label>
            <input
              type="number"
              value={parseFloat(metersToDisplayUnit(area.width, displayUnit).toFixed(2))}
              onChange={(e) => {
                const typeProps = AREA_TYPE_PROPERTIES[area.type];
                const minValue = typeProps.allowZeroWidth ? 0 : (displayUnit === 'feet' ? 1.64 : 0.5);
                const val = parseFloat(e.target.value);
                handleDimensionUpdate('width', isNaN(val) ? minValue : Math.max(minValue, val));
              }}
              min={AREA_TYPE_PROPERTIES[area.type].allowZeroWidth ? 0 : (displayUnit === 'feet' ? 1.64 : 0.5)}
              step={displayUnit === 'feet' ? 0.5 : 0.1}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Depth ({unitAbbr})</label>
            <input
              type="number"
              value={parseFloat(metersToDisplayUnit(area.height, displayUnit).toFixed(2))}
              onChange={(e) => {
                const typeProps = AREA_TYPE_PROPERTIES[area.type];
                const minValue = typeProps.allowZeroHeight ? 0 : (displayUnit === 'feet' ? 1.64 : 0.5);
                const val = parseFloat(e.target.value);
                handleDimensionUpdate('height', isNaN(val) ? minValue : Math.max(minValue, val));
              }}
              min={AREA_TYPE_PROPERTIES[area.type].allowZeroHeight ? 0 : (displayUnit === 'feet' ? 1.64 : 0.5)}
              step={displayUnit === 'feet' ? 0.5 : 0.1}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Elevation (height of box) */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Height ({unitAbbr})
            <span className="text-gray-500 ml-1 font-normal">
              (box height)
            </span>
          </label>
          <input
            type="number"
            value={parseFloat(metersToDisplayUnit(area.elevation, displayUnit).toFixed(2))}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleDimensionUpdate('elevation', isNaN(value) ? 0 : value);
            }}
            step={displayUnit === 'feet' ? 1 : 0.5}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Base Height (vertical position) */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Base Height ({unitAbbr})
            <span className="text-gray-500 ml-1 font-normal">
              (height from ground)
            </span>
          </label>
          <input
            type="number"
            value={parseFloat(metersToDisplayUnit(area.baseHeight ?? 0, displayUnit).toFixed(2))}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleDimensionUpdate('baseHeight', isNaN(value) ? 0 : Math.max(0, value));
            }}
            min={0}
            step={displayUnit === 'feet' ? 0.5 : 0.1}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Rotation
            <span className="text-gray-500 ml-1 font-normal">
              (press R in 3D to rotate 90°)
            </span>
          </label>
          <select
            value={area.rotation ?? 0}
            onChange={(e) => handleUpdate('rotation', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value={0}>0° (North)</option>
            <option value={90}>90° (East)</option>
            <option value={180}>180° (South)</option>
            <option value={270}>270° (West)</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Description
            <span className="text-gray-500 ml-1 font-normal">
              (for AI rendering)
            </span>
          </label>
          <textarea
            value={area.description ?? ''}
            onChange={(e) => handleUpdate('description', e.target.value)}
            placeholder="e.g., Modern white walls, large glass windows, wooden deck..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={area.color}
              onChange={(e) => handleUpdate('color', e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600"
            />
            <input
              type="text"
              value={area.color}
              onChange={(e) => handleUpdate('color', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Opacity ({Math.round(area.opacity * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={area.opacity}
            onChange={(e) => handleUpdate('opacity', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Area info */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Area:</span>
            <span className="text-white font-medium">
              {formatArea(area.width * area.height, displayUnit)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Volume:</span>
            <span className="text-gray-300">
              {displayUnit === 'feet'
                ? `${(area.width * area.height * area.elevation * 35.3147).toFixed(1)} ft³`
                : `${(area.width * area.height * area.elevation).toFixed(1)} m³`}
            </span>
          </div>
        </div>

        {/* Lock toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="locked"
            checked={area.locked}
            onChange={(e) => handleUpdate('locked', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="locked" className="text-sm text-gray-300">
            Lock area (prevent editing)
          </label>
        </div>
      </div>
    </div>
  );
}
