import { useCallback, useMemo } from 'react';
import { useFloorplanStore } from '@store/index';
import type { AreaType } from '@models/types';
import { formatArea } from '@lib/coordinates';

const AREA_TYPE_ICONS: Record<AreaType, string> = {
  house: '🏠',
  pool: '🏊',
  court: '🎾',
  lounge: '🛋️',
  garden: '🌳',
  parking: '🅿️',
  custom: '📦',
};

export function AreaList() {
  // Get raw areas from store and sort in component with useMemo
  const rawAreas = useFloorplanStore((state) => state.project?.areas);
  const areas = useMemo(() => {
    if (!rawAreas || rawAreas.length === 0) return [];
    return [...rawAreas].sort((a, b) => a.zIndex - b.zIndex);
  }, [rawAreas]);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const select = useFloorplanStore((state) => state.select);
  const addToSelection = useFloorplanStore((state) => state.addToSelection);
  const updateArea = useFloorplanStore((state) => state.updateArea);
  const deleteArea = useFloorplanStore((state) => state.deleteArea);
  const duplicateArea = useFloorplanStore((state) => state.duplicateArea);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  const handleClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (event.shiftKey) {
        addToSelection(id);
      } else {
        select([id]);
      }
    },
    [select, addToSelection]
  );

  const handleVisibilityToggle = useCallback(
    (id: string, visible: boolean, event: React.MouseEvent) => {
      event.stopPropagation();
      updateArea(id, { visible: !visible });
    },
    [updateArea]
  );

  const handleLockToggle = useCallback(
    (id: string, locked: boolean, event: React.MouseEvent) => {
      event.stopPropagation();
      updateArea(id, { locked: !locked });
    },
    [updateArea]
  );

  const handleDelete = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.stopPropagation();
      deleteArea(id);
    },
    [deleteArea]
  );

  const handleDuplicate = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const newId = duplicateArea(id);
      if (newId) {
        select([newId]);
      }
    },
    [duplicateArea, select]
  );

  if (areas.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Areas
        </h2>
        <p className="text-sm text-gray-500">
          No areas yet. Use the Add Area tool (A) to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Areas ({areas.length})
      </h2>
      <div className="space-y-1">
        {areas.map((area) => {
          const isSelected = selectedIds.includes(area.id);
          return (
            <div
              key={area.id}
              onClick={(e) => handleClick(area.id, e)}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
                ${isSelected ? 'bg-blue-600' : 'hover:bg-gray-700'}
                ${!area.visible ? 'opacity-50' : ''}
              `}
            >
              {/* Color swatch */}
              <div
                className="w-3 h-3 rounded flex-shrink-0"
                style={{ backgroundColor: area.color }}
              />

              {/* Type icon */}
              <span className="text-sm flex-shrink-0">
                {AREA_TYPE_ICONS[area.type]}
              </span>

              {/* Name */}
              <span className="flex-1 text-sm truncate text-white">
                {area.name}
              </span>

              {/* Area size */}
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatArea(area.width * area.height, displayUnit, 0)}
              </span>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Visibility toggle */}
                <button
                  onClick={(e) => handleVisibilityToggle(area.id, area.visible, e)}
                  className="p-1 text-gray-400 hover:text-white"
                  title={area.visible ? 'Hide' : 'Show'}
                >
                  {area.visible ? '👁️' : '👁️‍🗨️'}
                </button>

                {/* Lock toggle */}
                <button
                  onClick={(e) => handleLockToggle(area.id, area.locked, e)}
                  className="p-1 text-gray-400 hover:text-white"
                  title={area.locked ? 'Unlock' : 'Lock'}
                >
                  {area.locked ? '🔒' : '🔓'}
                </button>

                {/* Duplicate */}
                <button
                  onClick={(e) => handleDuplicate(area.id, e)}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Duplicate"
                >
                  📋
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(area.id, e)}
                  className="p-1 text-gray-400 hover:text-red-400"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
