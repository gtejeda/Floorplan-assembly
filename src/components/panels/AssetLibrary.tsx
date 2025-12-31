import { useCallback, useMemo } from 'react';
import { useFloorplanStore } from '@store/index';
import type { Asset } from '@models/types';

interface AssetLibraryProps {
  onImportClick?: () => void;
}

function AssetListItem({
  asset,
  isSelected,
  onSelect,
  onDelete,
  onVisibilityToggle,
}: {
  asset: Asset;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onVisibilityToggle: (id: string, visible: boolean) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(asset.id);
    },
    [asset.id, onSelect]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(asset.id);
    },
    [asset.id, onDelete]
  );

  const handleVisibilityClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onVisibilityToggle(asset.id, !asset.visible);
    },
    [asset.id, asset.visible, onVisibilityToggle]
  );

  // Generate thumbnail for images
  const thumbnail =
    asset.type === 'image' && asset.sourceUrl ? (
      <img
        src={asset.sourceUrl}
        alt={asset.name}
        className="w-8 h-8 object-cover rounded"
      />
    ) : (
      <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-lg">
        🗿
      </div>
    );

  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-600/30 border border-blue-500' : 'hover:bg-gray-700 border border-transparent'}
        ${!asset.visible ? 'opacity-50' : ''}
      `}
      onClick={handleClick}
    >
      {thumbnail}

      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{asset.name}</div>
        <div className="text-xs text-gray-500">
          {asset.width.toFixed(1)}m × {asset.height.toFixed(1)}m
          {asset.type === 'model' && ` × ${asset.depth.toFixed(1)}m`}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Visibility toggle */}
        <button
          onClick={handleVisibilityClick}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title={asset.visible ? 'Hide' : 'Show'}
        >
          {asset.visible ? '👁' : '🙈'}
        </button>

        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

export function AssetLibrary({ onImportClick }: AssetLibraryProps) {
  const rawAssets = useFloorplanStore((state) => state.project?.assets);
  const assets = useMemo(() => rawAssets ?? [], [rawAssets]);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const select = useFloorplanStore((state) => state.select);
  const deleteAsset = useFloorplanStore((state) => state.deleteAsset);
  const updateAsset = useFloorplanStore((state) => state.updateAsset);

  const handleSelect = useCallback(
    (id: string) => {
      select([id]);
    },
    [select]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteAsset(id);
    },
    [deleteAsset]
  );

  const handleVisibilityToggle = useCallback(
    (id: string, visible: boolean) => {
      updateAsset(id, { visible });
    },
    [updateAsset]
  );

  // Separate images and models
  const images = assets.filter((a) => a.type === 'image');
  const models = assets.filter((a) => a.type === 'model');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white">Assets</h3>
        <button
          onClick={onImportClick}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          + Import
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {assets.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <div className="text-4xl mb-2">📁</div>
            <p>No assets imported</p>
            <button
              onClick={onImportClick}
              className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Import an asset
            </button>
          </div>
        ) : (
          <>
            {/* Images section */}
            {images.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Images ({images.length})
                </h4>
                <div className="space-y-1">
                  {images.map((asset) => (
                    <AssetListItem
                      key={asset.id}
                      asset={asset}
                      isSelected={selectedIds.includes(asset.id)}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      onVisibilityToggle={handleVisibilityToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Models section */}
            {models.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  3D Models ({models.length})
                </h4>
                <div className="space-y-1">
                  {models.map((asset) => (
                    <AssetListItem
                      key={asset.id}
                      asset={asset}
                      isSelected={selectedIds.includes(asset.id)}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      onVisibilityToggle={handleVisibilityToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with summary */}
      {assets.length > 0 && (
        <div className="p-2 border-t border-gray-700 text-xs text-gray-500">
          {assets.length} asset{assets.length !== 1 ? 's' : ''} total
        </div>
      )}
    </div>
  );
}
