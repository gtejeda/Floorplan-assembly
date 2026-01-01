import { useMemo } from 'react';
import { useFloorplanStore } from '@store/index';

interface AreaAssetToolbarProps {
  onEditClick: () => void;
  onPreviewClick: () => void;
}

export function AreaAssetToolbar({ onEditClick, onPreviewClick }: AreaAssetToolbarProps) {
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const areas = useFloorplanStore((state) => state.project?.areas ?? []);
  const projectAssets = useFloorplanStore((state) => state.project?.assets ?? []);

  // Get the selected area (single selection only for asset management)
  const selectedArea = useMemo(() => {
    if (selectedIds.length === 1) {
      return areas.find((a) => a.id === selectedIds[0]);
    }
    return null;
  }, [selectedIds, areas]);

  // Determine which assets to count
  const assetCount = selectedArea ? (selectedArea.assets ?? []).length : projectAssets.length;
  const targetLabel = selectedArea ? selectedArea.name : 'Project';
  const isAreaSelected = !!selectedArea;

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2 bg-gray-800 border-t border-gray-700">
      {/* Context label */}
      <div className="text-sm text-gray-400">
        <span className="font-medium text-gray-300">{targetLabel}</span>
        {' Assets'}
        {assetCount > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-700 rounded-full">
            {assetCount}
          </span>
        )}
      </div>

      {/* Edit Assets button */}
      <button
        onClick={onEditClick}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        title={`Edit ${targetLabel} assets`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Edit Assets
      </button>

      {/* Preview Assets button */}
      <button
        onClick={onPreviewClick}
        disabled={assetCount === 0}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
          assetCount > 0
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title={assetCount > 0 ? `Preview ${targetLabel} assets` : 'No assets to preview'}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        Preview
      </button>

      {/* Help text */}
      {!isAreaSelected && selectedIds.length === 0 && (
        <span className="text-xs text-gray-500">
          Select an area to manage its assets
        </span>
      )}
      {selectedIds.length > 1 && (
        <span className="text-xs text-gray-500">
          Select a single area to manage assets
        </span>
      )}
    </div>
  );
}
