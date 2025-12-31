import { useState, useCallback, useRef, useEffect } from 'react';
import type { AssetType } from '@models/types';
import { useFloorplanStore } from '@store/index';
import {
  readFileAsDataURL,
  getImageDimensions,
  getAssetTypeFromFile,
} from '@lib/storage';
import {
  extractYouTubeVideoId,
  isValidYouTubeUrl,
  getYouTubeThumbnailUrl,
} from '@lib/youtube';
import {
  displayUnitToMeters,
  metersToDisplayUnit,
  getUnitAbbreviation,
  formatLength,
} from '@lib/coordinates';

type ImportMode = 'file' | 'youtube';

interface AssetImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

interface PreviewState {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

export function AssetImportDialog({
  isOpen,
  onClose,
  initialPosition = { x: 0, y: 0 },
}: AssetImportDialogProps) {
  const addAsset = useFloorplanStore((state) => state.addAsset);
  const select = useFloorplanStore((state) => state.select);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  const unitAbbr = getUnitAbbreviation(displayUnit);

  const [importMode, setImportMode] = useState<ImportMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [assetType, setAssetType] = useState<AssetType | null>(null);
  const [name, setName] = useState('');
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [depth, setDepth] = useState(1);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube-specific state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setImportMode('file');
      setFile(null);
      setPreview(null);
      setAssetType(null);
      setName('');
      setWidth(1);
      setHeight(1);
      setDepth(1);
      setMaintainAspectRatio(true);
      setAspectRatio(1);
      setError(null);
      setYoutubeUrl('');
      setYoutubeVideoId(null);
    }
  }, [isOpen]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setLoading(true);
    setError(null);

    try {
      const type = getAssetTypeFromFile(selectedFile);

      if (!type) {
        setError('Unsupported file type. Please use PNG, JPG, SVG, GLTF, or GLB files.');
        setLoading(false);
        return;
      }

      setFile(selectedFile);
      setAssetType(type);
      setName(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension

      // Default size: 5 meters, converted to display unit
      const defaultSizeInDisplayUnit = metersToDisplayUnit(5, displayUnit);

      if (type === 'image') {
        const dataUrl = await readFileAsDataURL(selectedFile);
        const dimensions = await getImageDimensions(selectedFile);

        setPreview({
          dataUrl,
          naturalWidth: dimensions.width,
          naturalHeight: dimensions.height,
        });

        // Default to 5m wide, maintain aspect ratio
        const ratio = dimensions.width / dimensions.height;
        setAspectRatio(ratio);
        setWidth(defaultSizeInDisplayUnit);
        setHeight(defaultSizeInDisplayUnit / ratio);
      } else {
        // 3D model - no preview, default dimensions
        setPreview(null);
        setWidth(defaultSizeInDisplayUnit);
        setHeight(defaultSizeInDisplayUnit);
        setDepth(defaultSizeInDisplayUnit);
        setAspectRatio(1);
      }
    } catch {
      setError('Failed to read file. Please try again.');
    }

    setLoading(false);
  }, [displayUnit]);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);
      if (maintainAspectRatio && aspectRatio > 0) {
        setHeight(newWidth / aspectRatio);
      }
    },
    [maintainAspectRatio, aspectRatio]
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setHeight(newHeight);
      if (maintainAspectRatio && aspectRatio > 0) {
        setWidth(newHeight * aspectRatio);
      }
    },
    [maintainAspectRatio, aspectRatio]
  );

  // Handle YouTube URL input
  const handleYoutubeUrlChange = useCallback((url: string) => {
    setYoutubeUrl(url);
    setError(null);

    if (!url.trim()) {
      setYoutubeVideoId(null);
      setPreview(null);
      setAssetType(null);
      return;
    }

    if (isValidYouTubeUrl(url)) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        setYoutubeVideoId(videoId);
        setAssetType('video');
        setName(`YouTube Video ${videoId}`);
        // YouTube videos have 16:9 aspect ratio
        setAspectRatio(16 / 9);
        // Default size: 5 meters, converted to display unit
        const defaultSizeInDisplayUnit = metersToDisplayUnit(5, displayUnit);
        setWidth(defaultSizeInDisplayUnit);
        setHeight(defaultSizeInDisplayUnit / (16 / 9));
        setPreview({
          dataUrl: getYouTubeThumbnailUrl(videoId, 'hq'),
          naturalWidth: 480,
          naturalHeight: 360,
        });
      }
    } else {
      setYoutubeVideoId(null);
      setPreview(null);
      setAssetType(null);
      if (url.length > 5) {
        setError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      }
    }
  }, [displayUnit]);

  const handleImport = useCallback(async () => {
    // Convert dimensions from display unit to meters for storage
    const widthInMeters = displayUnitToMeters(width, displayUnit);
    const heightInMeters = displayUnitToMeters(height, displayUnit);
    const depthInMeters = displayUnitToMeters(depth, displayUnit);

    // Handle YouTube import
    if (importMode === 'youtube') {
      if (!youtubeVideoId) return;

      const id = addAsset({
        name,
        type: 'video',
        sourceUrl: youtubeVideoId, // Store video ID as sourceUrl
        originalFilename: youtubeUrl,
        mimeType: 'video/youtube',
        x: initialPosition.x,
        y: initialPosition.y,
        width: widthInMeters,
        height: heightInMeters,
        depth: 0,
        rotation: 0,
        scale: 1,
        locked: false,
        visible: true,
        zIndex: 0,
      });

      select([id]);
      onClose();
      return;
    }

    // Handle file import
    if (!file || !assetType) return;

    setLoading(true);

    try {
      const dataUrl = preview?.dataUrl || (await readFileAsDataURL(file));

      const id = addAsset({
        name,
        type: assetType,
        sourceUrl: dataUrl,
        originalFilename: file.name,
        mimeType: file.type || (assetType === 'model' ? 'model/gltf-binary' : 'image/png'),
        x: initialPosition.x,
        y: initialPosition.y,
        width: widthInMeters,
        height: heightInMeters,
        depth: assetType === 'model' ? depthInMeters : 0,
        rotation: 0,
        scale: 1,
        locked: false,
        visible: true,
        zIndex: 0,
      });

      select([id]);
      onClose();
    } catch {
      setError('Failed to import asset. Please try again.');
    }

    setLoading(false);
  }, [
    importMode,
    youtubeVideoId,
    youtubeUrl,
    file,
    assetType,
    preview,
    name,
    width,
    height,
    depth,
    displayUnit,
    initialPosition,
    addAsset,
    select,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-[500px] max-w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Import Asset</h2>
          <p className="text-sm text-gray-400 mt-1">
            Import images, 3D models, or embed YouTube videos
          </p>
        </div>

        {/* Import Mode Tabs */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => setImportMode('file')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              importMode === 'file'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            File Upload
          </button>
          <button
            onClick={() => setImportMode('youtube')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              importMode === 'youtube'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            YouTube Video
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 bg-gray-700/30">
          {/* File Input Mode */}
          {importMode === 'file' && !file && (
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={handleBrowseClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.gltf,.glb"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-300">Drag and drop a file here</p>
              <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              <p className="text-gray-600 text-xs mt-2">
                Supported: PNG, JPG, SVG, GLTF, GLB
              </p>
            </div>
          )}

          {/* YouTube URL Input Mode */}
          {importMode === 'youtube' && !youtubeVideoId && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  YouTube Video URL
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="text-center text-gray-500 text-sm">
                <p>Paste a YouTube video URL to embed it as a placeholder image.</p>
                <p className="mt-1">Double-click the embedded video to play it.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full"></div>
              <p className="text-gray-400 mt-2">Processing...</p>
            </div>
          )}

          {/* YouTube Video Selected */}
          {importMode === 'youtube' && youtubeVideoId && preview && (
            <>
              {/* YouTube Thumbnail Preview */}
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <img
                  src={preview.dataUrl}
                  alt="YouTube thumbnail"
                  className="max-h-48 max-w-full mx-auto rounded"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 text-xs text-center mt-2">
                  Video ID: {youtubeVideoId}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Dimensions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">
                    Real-World Dimensions ({unitAbbr})
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    Lock 16:9 ratio
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width ({unitAbbr})</label>
                    <input
                      type="number"
                      value={parseFloat(width.toFixed(2))}
                      onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0.1)}
                      min={0.1}
                      step={displayUnit === 'feet' ? 1 : 0.1}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height ({unitAbbr})</label>
                    <input
                      type="number"
                      value={parseFloat(height.toFixed(2))}
                      onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0.1)}
                      min={0.1}
                      step={displayUnit === 'feet' ? 1 : 0.1}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Position info */}
              <div className="text-sm text-gray-500">
                Will be placed at: {formatLength(initialPosition.x, displayUnit)}, {formatLength(initialPosition.y, displayUnit)}
              </div>

              {/* Change URL */}
              <button
                onClick={() => {
                  setYoutubeVideoId(null);
                  setPreview(null);
                  setAssetType(null);
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Use a different YouTube URL
              </button>
            </>
          )}

          {/* File Selected */}
          {importMode === 'file' && file && !loading && (
            <>
              {/* Preview */}
              {preview && assetType === 'image' && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <img
                    src={preview.dataUrl}
                    alt="Preview"
                    className="max-h-48 max-w-full mx-auto rounded"
                  />
                  <p className="text-gray-500 text-xs text-center mt-2">
                    Original: {preview.naturalWidth} × {preview.naturalHeight} px
                  </p>
                </div>
              )}

              {/* 3D Model Icon */}
              {assetType === 'model' && (
                <div className="bg-gray-900 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-2">🗿</div>
                  <p className="text-gray-400">3D Model Selected</p>
                  <p className="text-gray-500 text-sm">{file.name}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Dimensions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">
                    Real-World Dimensions ({unitAbbr})
                  </label>
                  {assetType === 'image' && (
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      Lock aspect ratio
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Width ({unitAbbr})
                    </label>
                    <input
                      type="number"
                      value={parseFloat(width.toFixed(2))}
                      onChange={(e) =>
                        handleWidthChange(parseFloat(e.target.value) || 0.1)
                      }
                      min={0.1}
                      step={displayUnit === 'feet' ? 1 : 0.1}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Height ({unitAbbr})
                    </label>
                    <input
                      type="number"
                      value={parseFloat(height.toFixed(2))}
                      onChange={(e) =>
                        handleHeightChange(parseFloat(e.target.value) || 0.1)
                      }
                      min={0.1}
                      step={displayUnit === 'feet' ? 1 : 0.1}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Depth for 3D models */}
                {assetType === 'model' && (
                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-1">
                      Depth ({unitAbbr})
                    </label>
                    <input
                      type="number"
                      value={parseFloat(depth.toFixed(2))}
                      onChange={(e) =>
                        setDepth(parseFloat(e.target.value) || 0.1)
                      }
                      min={0.1}
                      step={displayUnit === 'feet' ? 1 : 0.1}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Position info */}
              <div className="text-sm text-gray-500">
                Will be placed at: {formatLength(initialPosition.x, displayUnit)},{' '}
                {formatLength(initialPosition.y, displayUnit)}
              </div>

              {/* Change File */}
              <button
                onClick={handleBrowseClick}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Choose a different file
              </button>
            </>
          )}
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
            onClick={handleImport}
            disabled={(importMode === 'file' ? !file : !youtubeVideoId) || loading}
            className={`px-4 py-2 rounded transition-colors ${
              (importMode === 'file' ? file : youtubeVideoId) && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {importMode === 'youtube' ? 'Embed Video' : 'Import Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}
