import { useState, useCallback, useEffect } from 'react';
import type { AreaType } from '@models/types';
import { DEFAULT_AREA_COLORS, AREA_TYPE_PROPERTIES } from '@models/types';
import { useFloorplanStore } from '@store/index';
import {
  metersToDisplayUnit,
  displayUnitToMeters,
  formatLength,
  getUnitAbbreviation,
} from '@lib/coordinates';

interface AreaCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition: { x: number; y: number };
}

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

export function AreaCreateDialog({
  isOpen,
  onClose,
  initialPosition,
}: AreaCreateDialogProps) {
  const addArea = useFloorplanStore((state) => state.addArea);
  const select = useFloorplanStore((state) => state.select);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  const unitAbbr = getUnitAbbreviation(displayUnit);

  const [name, setName] = useState('New Area');
  const [type, setType] = useState<AreaType>('house');
  const [width, setWidth] = useState(() => metersToDisplayUnit(10, displayUnit));
  const [height, setHeight] = useState(() => metersToDisplayUnit(10, displayUnit));
  const [elevation, setElevation] = useState(() => metersToDisplayUnit(3, displayUnit));
  const [baseHeight, setBaseHeight] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [color, setColor] = useState(DEFAULT_AREA_COLORS.house);

  // Sync default values when displayUnit changes
  useEffect(() => {
    setWidth(metersToDisplayUnit(10, displayUnit));
    setHeight(metersToDisplayUnit(10, displayUnit));
    setElevation(metersToDisplayUnit(3, displayUnit));
  }, [displayUnit]);

  const handleTypeChange = useCallback((newType: AreaType) => {
    setType(newType);
    setColor(DEFAULT_AREA_COLORS[newType]);
    // Apply type-specific defaults
    const props = AREA_TYPE_PROPERTIES[newType];
    if (props.defaultElevation !== undefined) {
      setElevation(metersToDisplayUnit(props.defaultElevation, displayUnit));
    } else {
      setElevation(metersToDisplayUnit(3, displayUnit));
    }
    if (props.defaultBaseHeight !== undefined) {
      setBaseHeight(metersToDisplayUnit(props.defaultBaseHeight, displayUnit));
    } else {
      setBaseHeight(0);
    }
    if (props.defaultWidth !== undefined) {
      setWidth(metersToDisplayUnit(props.defaultWidth, displayUnit));
    } else {
      setWidth(metersToDisplayUnit(10, displayUnit));
    }
    if (props.defaultHeight !== undefined) {
      setHeight(metersToDisplayUnit(props.defaultHeight, displayUnit));
    } else {
      setHeight(metersToDisplayUnit(10, displayUnit));
    }
  }, [displayUnit]);

  const handleCreate = useCallback(() => {
    // Convert from display units to meters for storage
    const widthMeters = displayUnitToMeters(width, displayUnit);
    const heightMeters = displayUnitToMeters(height, displayUnit);
    const elevationMeters = displayUnitToMeters(elevation, displayUnit);
    const baseHeightMeters = displayUnitToMeters(baseHeight, displayUnit);

    const id = addArea({
      name,
      type,
      x: initialPosition.x,
      y: initialPosition.y,
      width: widthMeters,
      height: heightMeters,
      elevation: elevationMeters,
      baseHeight: baseHeightMeters,
      rotation,
      color,
      opacity: 0.7,
      locked: false,
      visible: true,
      zIndex: 0,
    });

    // Select the newly created area
    select([id]);

    // Reset form (defaults in display units)
    setName('New Area');
    setType('house');
    setWidth(metersToDisplayUnit(10, displayUnit));
    setHeight(metersToDisplayUnit(10, displayUnit));
    setElevation(metersToDisplayUnit(3, displayUnit));
    setBaseHeight(0);
    setRotation(0);
    setColor(DEFAULT_AREA_COLORS.house);

    onClose();
  }, [
    name,
    type,
    width,
    height,
    elevation,
    baseHeight,
    rotation,
    color,
    initialPosition,
    displayUnit,
    addArea,
    select,
    onClose,
  ]);

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
          <h2 className="text-lg font-semibold text-white">Create New Area</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as AreaType)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
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

          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Width ({unitAbbr})
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const minVal = AREA_TYPE_PROPERTIES[type].allowZeroWidth ? 0 : 0.5;
                  setWidth(isNaN(val) ? minVal : Math.max(minVal, val));
                }}
                min={AREA_TYPE_PROPERTIES[type].allowZeroWidth ? 0 : 0.5}
                step={0.1}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Depth ({unitAbbr})
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const minVal = AREA_TYPE_PROPERTIES[type].allowZeroHeight ? 0 : 0.5;
                  setHeight(isNaN(val) ? minVal : Math.max(minVal, val));
                }}
                min={AREA_TYPE_PROPERTIES[type].allowZeroHeight ? 0 : 0.5}
                step={0.1}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Elevation (box height) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Height ({unitAbbr})
              <span className="text-gray-500 ml-1 font-normal text-xs">
                (box height)
              </span>
            </label>
            <input
              type="number"
              value={elevation}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setElevation(isNaN(val) ? 0 : val);
              }}
              step={0.5}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Base Height (vertical position from ground) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Base Height ({unitAbbr})
              <span className="text-gray-500 ml-1 font-normal text-xs">
                (height from ground)
              </span>
            </label>
            <input
              type="number"
              value={baseHeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBaseHeight(isNaN(val) ? 0 : Math.max(0, val));
              }}
              min={0}
              step={0.1}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Rotation
              <span className="text-gray-500 ml-1 font-normal text-xs">
                (wall orientation)
              </span>
            </label>
            <select
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            >
              <option value={0}>0° (North)</option>
              <option value={90}>90° (East)</option>
              <option value={180}>180° (South)</option>
              <option value={270}>270° (West)</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Position info */}
          <div className="text-sm text-gray-500">
            Position: {formatLength(initialPosition.x, displayUnit, 1)}, {formatLength(initialPosition.y, displayUnit, 1)}
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
            Create Area
          </button>
        </div>
      </div>
    </div>
  );
}
