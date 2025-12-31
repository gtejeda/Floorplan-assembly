import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import type { Layer as KonvaLayer } from 'konva/lib/Layer';
import { useFloorplanStore } from '@store/index';
import { Grid } from './Grid';
import { AreaRect } from './AreaRect';
import { AreaLabel } from './AreaLabel';
import { OverlapHighlight } from './OverlapHighlight';
import { Asset2D } from './Asset2D';
import { ImageViewer } from '@components/ui/ImageViewer';
import { VideoPlayer } from '@components/ui/VideoPlayer';
import { metersToPixels, pixelsToMeters, clamp } from '@lib/coordinates';
import { getBounds, findOverlappingAreas } from '@lib/geometry';
import type { Bounds, Area, Asset } from '@models/types';

/**
 * Calculate the intersection bounds of two areas
 */
function getIntersectionBounds(areaA: Area, areaB: Area): Bounds {
  const boundsA = getBounds(areaA);
  const boundsB = getBounds(areaB);
  return {
    minX: Math.max(boundsA.minX, boundsB.minX),
    minY: Math.max(boundsA.minY, boundsB.minY),
    maxX: Math.min(boundsA.maxX, boundsB.maxX),
    maxY: Math.min(boundsA.maxY, boundsB.maxY),
  };
}

interface Canvas2DProps {
  onCoordinateChange?: (x: number, y: number) => void;
  onAreaCreate?: (x: number, y: number) => void;
}

export function Canvas2D({ onCoordinateChange, onAreaCreate }: Canvas2DProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<KonvaLayer>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [fullscreenImage, setFullscreenImage] = useState<Asset | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<Asset | null>(null);

  // Store state
  const project = useFloorplanStore((state) => state.project);
  const rawAreas = useFloorplanStore((state) => state.project?.areas);
  const rawAssets = useFloorplanStore((state) => state.project?.assets);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);

  // Derived state with useMemo to prevent infinite loops
  const areas = useMemo(() => {
    if (!rawAreas || rawAreas.length === 0) return [];
    return [...rawAreas].sort((a, b) => a.zIndex - b.zIndex);
  }, [rawAreas]);

  const assets = useMemo(() => rawAssets ?? [], [rawAssets]);

  const overlappingAreas = useMemo(() => {
    if (!rawAreas || rawAreas.length === 0) return [];
    return findOverlappingAreas(rawAreas);
  }, [rawAreas]);
  const zoom = useFloorplanStore((state) => state.canvas2d.zoom);
  const panX = useFloorplanStore((state) => state.canvas2d.panX);
  const panY = useFloorplanStore((state) => state.canvas2d.panY);
  const showGrid = useFloorplanStore((state) => state.showGrid);
  const showLabels = useFloorplanStore((state) => state.showLabels);
  const activeTool = useFloorplanStore((state) => state.activeTool);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  // Store actions
  const setZoom = useFloorplanStore((state) => state.setZoom);
  const setPan = useFloorplanStore((state) => state.setPan);
  const clearSelection = useFloorplanStore((state) => state.clearSelection);
  const select = useFloorplanStore((state) => state.select);
  const addToSelection = useFloorplanStore((state) => state.addToSelection);

  // Pan state for dragging
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 });

  // Calculate overlap intersection bounds for visualization
  const overlapBounds = useMemo(() => {
    if (overlappingAreas.length === 0) return [];

    const areasMap = new Map(areas.map((a) => [a.id, a]));
    const bounds: Bounds[] = [];

    for (const [id1, id2] of overlappingAreas) {
      const area1 = areasMap.get(id1);
      const area2 = areasMap.get(id2);
      if (area1 && area2) {
        bounds.push(getIntersectionBounds(area1, area2));
      }
    }

    return bounds;
  }, [overlappingAreas, areas]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Cache grid layer for performance optimization
  // Grid is re-cached when lot dimensions or grid settings change
  useEffect(() => {
    const gridLayer = gridLayerRef.current;
    if (gridLayer && showGrid && project?.lot) {
      // Clear previous cache and re-cache
      gridLayer.clearCache();
      gridLayer.cache();
    }
  }, [showGrid, project?.lot?.width, project?.lot?.height, project?.lot?.gridSize]);

  // Handle area selection
  const handleAreaSelect = useCallback(
    (id: string, additive: boolean) => {
      if (additive) {
        addToSelection(id);
      } else {
        select([id]);
      }
    },
    [select, addToSelection]
  );

  // Handle asset double-click for fullscreen image/video view
  const handleAssetDoubleClick = useCallback((asset: Asset) => {
    if (!asset.sourceUrl) return;

    if (asset.type === 'image') {
      setFullscreenImage(asset);
    } else if (asset.type === 'video') {
      setFullscreenVideo(asset);
    }
  }, []);

  // Close fullscreen image viewer
  const handleCloseFullscreen = useCallback(() => {
    setFullscreenImage(null);
  }, []);

  // Close fullscreen video viewer
  const handleCloseVideoFullscreen = useCallback(() => {
    setFullscreenVideo(null);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = clamp(
        direction > 0 ? oldScale * scaleBy : oldScale / scaleBy,
        0.1,
        10
      );

      // Zoom toward pointer position
      const mousePointTo = {
        x: (pointer.x - panX) / oldScale,
        y: (pointer.y - panY) / oldScale,
      };

      const newPanX = pointer.x - mousePointTo.x * newScale;
      const newPanY = pointer.y - mousePointTo.y * newScale;

      setZoom(newScale);
      setPan(newPanX, newPanY);
    },
    [zoom, panX, panY, setZoom, setPan]
  );

  // Mouse move for coordinates and panning
  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Update coordinates
      if (onCoordinateChange) {
        const x = pixelsToMeters((pointer.x - panX) / zoom);
        const y = pixelsToMeters((pointer.y - panY) / zoom);
        onCoordinateChange(x, y);
      }

      // Handle panning
      if (isPanning) {
        const dx = pointer.x - lastPointerPosition.x;
        const dy = pointer.y - lastPointerPosition.y;
        setPan(panX + dx, panY + dy);
        setLastPointerPosition({ x: pointer.x, y: pointer.y });
      }
    },
    [zoom, panX, panY, isPanning, lastPointerPosition, onCoordinateChange, setPan]
  );

  // Mouse down for pan start or area creation
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Check if clicking on empty canvas (not on a shape)
      const clickedOnEmpty = e.target === e.target.getStage();

      if (activeTool === 'pan' || (clickedOnEmpty && e.evt.button === 1)) {
        // Middle mouse button or pan tool
        setIsPanning(true);
        setLastPointerPosition({ x: pointer.x, y: pointer.y });
      } else if (clickedOnEmpty && activeTool === 'select') {
        // Deselect when clicking on empty canvas
        clearSelection();
      } else if (clickedOnEmpty && activeTool === 'area' && onAreaCreate) {
        // Create area at click position
        const x = pixelsToMeters((pointer.x - panX) / zoom);
        const y = pixelsToMeters((pointer.y - panY) / zoom);
        onAreaCreate(Math.max(0, x), Math.max(0, y));
      }
    },
    [activeTool, clearSelection, onAreaCreate, panX, panY, zoom]
  );

  // Mouse up for pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    if (onCoordinateChange) {
      onCoordinateChange(0, 0);
    }
  }, [onCoordinateChange]);

  if (!project) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center bg-gray-950 text-gray-500"
      >
        No project loaded
      </div>
    );
  }

  const { lot } = project;
  const canvasWidth = metersToPixels(lot.width);
  const canvasHeight = metersToPixels(lot.height);

  // Calculate initial offset to center the canvas
  const offsetX = (containerSize.width - canvasWidth * zoom) / 2;
  const offsetY = (containerSize.height - canvasHeight * zoom) / 2;
  const effectivePanX = panX === 0 ? offsetX : panX;
  const effectivePanY = panY === 0 ? offsetY : panY;

  // Determine cursor based on tool
  let cursor = 'default';
  if (isPanning) cursor = 'grabbing';
  else if (activeTool === 'pan') cursor = 'grab';
  else if (activeTool === 'area') cursor = 'crosshair';

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-950 overflow-hidden"
      style={{ cursor }}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={effectivePanX}
        y={effectivePanY}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid layer - non-interactive and cached for performance */}
        <Layer ref={gridLayerRef} listening={false}>
          {showGrid && (
            <Grid
              lotWidth={lot.width}
              lotHeight={lot.height}
              gridSize={lot.gridSize}
              zoom={zoom}
              showLabels={showLabels}
              displayUnit={displayUnit}
            />
          )}
        </Layer>

        {/* Areas layer */}
        <Layer>
          {areas.map((area) => (
            <AreaRect
              key={area.id}
              area={area}
              isSelected={selectedIds.includes(area.id)}
              onSelect={handleAreaSelect}
            />
          ))}
        </Layer>

        {/* Assets layer (images and videos) */}
        <Layer>
          {assets
            .filter((asset) => (asset.type === 'image' || asset.type === 'video') && asset.visible)
            .map((asset) => (
              <Asset2D
                key={asset.id}
                asset={asset}
                isSelected={selectedIds.includes(asset.id)}
                onSelect={handleAreaSelect}
                onDoubleClick={handleAssetDoubleClick}
              />
            ))}
        </Layer>

        {/* Overlap highlights layer - non-interactive */}
        <Layer listening={false}>
          {overlapBounds.map((bounds, index) => (
            <OverlapHighlight key={`overlap-${index}`} bounds={bounds} />
          ))}
        </Layer>

        {/* Labels layer - non-interactive */}
        <Layer listening={false}>
          {showLabels &&
            areas.map((area) => (
              <AreaLabel key={`label-${area.id}`} area={area} zoom={zoom} displayUnit={displayUnit} />
            ))}
        </Layer>
      </Stage>

      {/* Fullscreen image viewer */}
      {fullscreenImage && fullscreenImage.sourceUrl && (
        <ImageViewer
          imageUrl={fullscreenImage.sourceUrl}
          imageName={fullscreenImage.originalFilename || fullscreenImage.name}
          onClose={handleCloseFullscreen}
        />
      )}

      {/* Fullscreen video player */}
      {fullscreenVideo && fullscreenVideo.sourceUrl && (
        <VideoPlayer
          videoId={fullscreenVideo.sourceUrl}
          videoName={fullscreenVideo.originalFilename || fullscreenVideo.name}
          onClose={handleCloseVideoFullscreen}
        />
      )}
    </div>
  );
}
