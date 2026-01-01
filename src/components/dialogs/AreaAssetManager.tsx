import { useCallback, useMemo, useRef, useState } from 'react';
import { useFloorplanStore } from '@store/index';
import type { Asset, AssetType } from '@models/types';

interface AreaAssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: string | null; // null = project-level assets
}

function AssetListItem({
  asset,
  onDelete,
  onVisibilityToggle,
  onEdit,
}: {
  asset: Asset;
  onDelete: () => void;
  onVisibilityToggle: () => void;
  onEdit: () => void;
}) {
  // Generate thumbnail for images
  const thumbnail =
    asset.type === 'image' && asset.sourceUrl ? (
      <img
        src={asset.sourceUrl}
        alt={asset.name}
        className="w-12 h-12 object-cover rounded"
      />
    ) : asset.type === 'video' && asset.sourceUrl ? (
      <video
        src={asset.sourceUrl}
        className="w-12 h-12 object-cover rounded"
        muted
      />
    ) : (
      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-2xl">
        {asset.type === 'model' ? '🗿' : '📄'}
      </div>
    );

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-colors
        ${!asset.visible ? 'opacity-50 border-gray-700' : 'border-gray-600 hover:border-gray-500'}
        bg-gray-800
      `}
    >
      {thumbnail}

      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate font-medium">{asset.name}</div>
        <div className="text-xs text-gray-400">
          {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} •{' '}
          {asset.width.toFixed(1)}m × {asset.height.toFixed(1)}m
          {asset.type === 'model' && ` × ${asset.depth.toFixed(1)}m`}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Edit button */}
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Edit asset"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        {/* Visibility toggle */}
        <button
          onClick={onVisibilityToggle}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title={asset.visible ? 'Hide' : 'Show'}
        >
          {asset.visible ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function AreaAssetManager({ isOpen, onClose, areaId }: AreaAssetManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Store selectors
  const areas = useFloorplanStore((state) => state.project?.areas ?? []);
  const projectAssets = useFloorplanStore((state) => state.project?.assets ?? []);
  const addAsset = useFloorplanStore((state) => state.addAsset);
  const updateAsset = useFloorplanStore((state) => state.updateAsset);
  const deleteAsset = useFloorplanStore((state) => state.deleteAsset);
  const addAssetToArea = useFloorplanStore((state) => state.addAssetToArea);
  const updateAssetInArea = useFloorplanStore((state) => state.updateAssetInArea);
  const deleteAssetFromArea = useFloorplanStore((state) => state.deleteAssetFromArea);

  // Get the target area and its assets
  const targetArea = useMemo(() => {
    if (areaId) {
      return areas.find((a) => a.id === areaId);
    }
    return null;
  }, [areaId, areas]);

  const assets = useMemo(() => {
    if (targetArea) {
      return targetArea.assets ?? [];
    }
    return projectAssets;
  }, [targetArea, projectAssets]);

  const targetLabel = targetArea ? targetArea.name : 'Project';

  // Handle file import
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isModel = file.name.endsWith('.glb') || file.name.endsWith('.gltf');

        if (!isImage && !isVideo && !isModel) continue;

        // Create object URL for preview
        const sourceUrl = URL.createObjectURL(file);

        // Determine asset type
        let assetType: AssetType = 'image';
        if (isVideo) assetType = 'video';
        if (isModel) assetType = 'model';

        // Get image/video dimensions
        let width = 1;
        let height = 1;

        if (isImage) {
          const img = new Image();
          img.src = sourceUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          // Default to 1m for the larger dimension
          const ratio = img.width / img.height;
          if (ratio > 1) {
            width = 1;
            height = 1 / ratio;
          } else {
            width = ratio;
            height = 1;
          }
        }

        const newAsset: Omit<Asset, 'id'> = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: assetType,
          sourceUrl,
          originalFilename: file.name,
          mimeType: file.type,
          x: 0,
          y: 0,
          width,
          height,
          depth: isModel ? 1 : 0,
          rotation: 0,
          scale: 1,
          locked: false,
          visible: true,
          zIndex: 0,
        };

        if (areaId) {
          addAssetToArea(areaId, newAsset);
        } else {
          addAsset(newAsset);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [areaId, addAsset, addAssetToArea]
  );

  // Handle delete
  const handleDelete = useCallback(
    (assetId: string) => {
      if (areaId) {
        deleteAssetFromArea(areaId, assetId);
      } else {
        deleteAsset(assetId);
      }
    },
    [areaId, deleteAsset, deleteAssetFromArea]
  );

  // Handle visibility toggle
  const handleVisibilityToggle = useCallback(
    (assetId: string, visible: boolean) => {
      if (areaId) {
        updateAssetInArea(areaId, assetId, { visible });
      } else {
        updateAsset(assetId, { visible });
      }
    },
    [areaId, updateAsset, updateAssetInArea]
  );

  // Handle edit save
  const handleEditSave = useCallback(
    (updates: Partial<Asset>) => {
      if (!editingAsset) return;

      if (areaId) {
        updateAssetInArea(areaId, editingAsset.id, updates);
      } else {
        updateAsset(editingAsset.id, updates);
      }
      setEditingAsset(null);
    },
    [areaId, editingAsset, updateAsset, updateAssetInArea]
  );

  if (!isOpen) return null;

  // Separate by type
  const images = assets.filter((a) => a.type === 'image');
  const videos = assets.filter((a) => a.type === 'video');
  const models = assets.filter((a) => a.type === 'model');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-gray-900 rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {targetLabel} Assets
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-lg mb-2">No assets yet</p>
              <p className="text-sm">Import images, videos, or 3D models to attach to {targetLabel.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Images section */}
              {images.length > 0 && (
                <div>
                  <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                    Images ({images.length})
                  </h3>
                  <div className="space-y-2">
                    {images.map((asset) => (
                      <AssetListItem
                        key={asset.id}
                        asset={asset}
                        onDelete={() => handleDelete(asset.id)}
                        onVisibilityToggle={() => handleVisibilityToggle(asset.id, !asset.visible)}
                        onEdit={() => setEditingAsset(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Videos section */}
              {videos.length > 0 && (
                <div>
                  <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                    Videos ({videos.length})
                  </h3>
                  <div className="space-y-2">
                    {videos.map((asset) => (
                      <AssetListItem
                        key={asset.id}
                        asset={asset}
                        onDelete={() => handleDelete(asset.id)}
                        onVisibilityToggle={() => handleVisibilityToggle(asset.id, !asset.visible)}
                        onEdit={() => setEditingAsset(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Models section */}
              {models.length > 0 && (
                <div>
                  <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                    3D Models ({models.length})
                  </h3>
                  <div className="space-y-2">
                    {models.map((asset) => (
                      <AssetListItem
                        key={asset.id}
                        asset={asset}
                        onDelete={() => handleDelete(asset.id)}
                        onVisibilityToggle={() => handleVisibilityToggle(asset.id, !asset.visible)}
                        onEdit={() => setEditingAsset(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} total
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              + Import Asset
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.glb,.gltf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setEditingAsset(null)}
          />
          <div className="relative bg-gray-800 rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Asset</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Width (m)</label>
                  <input
                    type="number"
                    defaultValue={editingAsset.width}
                    onChange={(e) => setEditingAsset({ ...editingAsset, width: parseFloat(e.target.value) || 1 })}
                    step={0.1}
                    min={0.1}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Height (m)</label>
                  <input
                    type="number"
                    defaultValue={editingAsset.height}
                    onChange={(e) => setEditingAsset({ ...editingAsset, height: parseFloat(e.target.value) || 1 })}
                    step={0.1}
                    min={0.1}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSave({
                  name: editingAsset.name,
                  width: editingAsset.width,
                  height: editingAsset.height,
                })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
