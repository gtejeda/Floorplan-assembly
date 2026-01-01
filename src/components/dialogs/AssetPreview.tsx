import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFloorplanStore } from '@store/index';
import type { Asset } from '@models/types';

interface AssetPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: string | null; // null = project-level assets
  initialAssetId?: string; // Start slideshow at specific asset
}

export function AssetPreview({ isOpen, onClose, areaId, initialAssetId }: AssetPreviewProps) {
  const areas = useFloorplanStore((state) => state.project?.areas ?? []);
  const projectAssets = useFloorplanStore((state) => state.project?.assets ?? []);

  // Get the target area and its assets
  const targetArea = useMemo(() => {
    if (areaId) {
      return areas.find((a) => a.id === areaId);
    }
    return null;
  }, [areaId, areas]);

  const assets = useMemo(() => {
    if (targetArea) {
      return (targetArea.assets ?? []).filter((a) => a.visible);
    }
    return projectAssets.filter((a) => a.visible);
  }, [targetArea, projectAssets]);

  // Get all assets across all areas for "view all" mode
  const allAssets = useMemo(() => {
    const areaAssets = areas.flatMap((area) =>
      (area.assets ?? []).filter((a) => a.visible).map((asset) => ({
        ...asset,
        areaName: area.name,
        areaId: area.id,
      }))
    );
    const projAssets = projectAssets.filter((a) => a.visible).map((asset) => ({
      ...asset,
      areaName: 'Project',
      areaId: null as string | null,
    }));
    return [...areaAssets, ...projAssets];
  }, [areas, projectAssets]);

  const targetLabel = targetArea ? targetArea.name : 'Project';

  // Slideshow state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewAllMode, setViewAllMode] = useState(false);

  // Which assets to show based on mode
  const displayAssets = viewAllMode ? allAssets : assets;

  // Reset index when assets change or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (initialAssetId) {
        const idx = displayAssets.findIndex((a) => a.id === initialAssetId);
        setCurrentIndex(idx >= 0 ? idx : 0);
      } else {
        setCurrentIndex(0);
      }
    }
  }, [isOpen, initialAssetId, displayAssets]);

  // Navigation
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayAssets.length);
  }, [displayAssets.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + displayAssets.length) % displayAssets.length);
  }, [displayAssets.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!isOpen) return null;

  const currentAsset = displayAssets[currentIndex];

  if (displayAssets.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-xl mb-2">No assets to preview</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black bg-opacity-95">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">
            {viewAllMode ? 'All Assets' : `${targetLabel} Assets`}
          </h2>
          <span className="text-gray-400">
            {currentIndex + 1} / {displayAssets.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* View All toggle */}
          <button
            onClick={() => {
              setViewAllMode(!viewAllMode);
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              viewAllMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {viewAllMode ? 'Show Current Only' : 'View All Assets'}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous button */}
        {displayAssets.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 p-3 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Asset display */}
        <div className="max-w-[90vw] max-h-[70vh] flex items-center justify-center">
          {currentAsset?.type === 'image' && currentAsset.sourceUrl && (
            <img
              src={currentAsset.sourceUrl}
              alt={currentAsset.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
          )}
          {currentAsset?.type === 'video' && currentAsset.sourceUrl && (
            <video
              src={currentAsset.sourceUrl}
              controls
              autoPlay
              className="max-w-full max-h-[70vh] rounded-lg shadow-2xl"
            />
          )}
          {currentAsset?.type === 'model' && (
            <div className="flex flex-col items-center justify-center text-white">
              <div className="text-8xl mb-4">🗿</div>
              <p className="text-xl">{currentAsset.name}</p>
              <p className="text-gray-400 mt-2">3D Model Preview</p>
              <p className="text-sm text-gray-500 mt-1">
                {currentAsset.width.toFixed(1)}m × {currentAsset.height.toFixed(1)}m × {currentAsset.depth.toFixed(1)}m
              </p>
            </div>
          )}
        </div>

        {/* Next button */}
        {displayAssets.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 p-3 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer with asset info */}
      <div className="px-6 py-4 bg-black bg-opacity-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white">{currentAsset?.name}</h3>
          {viewAllMode && 'areaName' in currentAsset && (
            <p className="text-sm text-blue-400 mt-1">
              {(currentAsset as typeof currentAsset & { areaName: string }).areaName}
            </p>
          )}
          <p className="text-sm text-gray-400 mt-1">
            {currentAsset?.type.charAt(0).toUpperCase() + currentAsset?.type.slice(1)} •{' '}
            {currentAsset?.width.toFixed(1)}m × {currentAsset?.height.toFixed(1)}m
          </p>
        </div>

        {/* Thumbnail strip */}
        {displayAssets.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 overflow-x-auto py-2">
            {displayAssets.map((asset, idx) => (
              <button
                key={asset.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all ${
                  idx === currentIndex
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black'
                    : 'opacity-50 hover:opacity-75'
                }`}
              >
                {asset.type === 'image' && asset.sourceUrl ? (
                  <img
                    src={asset.sourceUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : asset.type === 'video' && asset.sourceUrl ? (
                  <video
                    src={asset.sourceUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-2xl">
                    {asset.type === 'model' ? '🗿' : '📄'}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Keyboard hint */}
        <p className="text-center text-xs text-gray-600 mt-4">
          Use ← → arrow keys to navigate • Space for next • Escape to close
        </p>
      </div>
    </div>
  );
}
