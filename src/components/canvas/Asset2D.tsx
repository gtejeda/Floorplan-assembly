import { useRef, useEffect, useCallback, useState } from 'react';
import { Image as KonvaImage, Transformer, Group, Circle, RegularPolygon } from 'react-konva';
import type Konva from 'konva';
import type { Asset } from '@models/types';
import { metersToPixels, pixelsToMeters } from '@lib/coordinates';
import { useFloorplanStore } from '@store/index';
import { getYouTubeThumbnailUrl } from '@lib/youtube';

interface Asset2DProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDoubleClick?: (asset: Asset) => void;
}

export function Asset2D({ asset, isSelected, onSelect, onDoubleClick }: Asset2DProps) {
  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const updateAsset = useFloorplanStore((state) => state.updateAsset);
  const setHoveredId = useFloorplanStore((state) => state.setHoveredId);

  // Load image from sourceUrl (or YouTube thumbnail for videos)
  useEffect(() => {
    if (!asset.sourceUrl) return;
    if (asset.type !== 'image' && asset.type !== 'video') return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load image:', asset.originalFilename);
    };

    // For videos, load YouTube thumbnail; for images, load the source directly
    if (asset.type === 'video') {
      img.src = getYouTubeThumbnailUrl(asset.sourceUrl, 'hq');
    } else {
      img.src = asset.sourceUrl;
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [asset.sourceUrl, asset.type, asset.originalFilename]);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle drag end
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (asset.locked) return;

      const node = e.target;
      const newX = pixelsToMeters(node.x());
      const newY = pixelsToMeters(node.y());

      updateAsset(asset.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
    },
    [asset.id, asset.locked, updateAsset]
  );

  // Handle transform end (resize and rotate)
  const handleTransformEnd = useCallback(
    (_e: Konva.KonvaEventObject<Event>) => {
      if (asset.locked) return;

      const node = imageRef.current;
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and update width/height
      node.scaleX(1);
      node.scaleY(1);

      const newWidth = pixelsToMeters(node.width() * scaleX);
      const newHeight = pixelsToMeters(node.height() * scaleY);
      const newX = pixelsToMeters(node.x());
      const newY = pixelsToMeters(node.y());
      const newRotation = node.rotation();

      updateAsset(asset.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: Math.max(0.1, newWidth),
        height: Math.max(0.1, newHeight),
        rotation: newRotation,
      });
    },
    [asset.id, asset.locked, updateAsset]
  );

  // Handle click for selection
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true; // Prevent canvas click
      const isShift = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onSelect(asset.id, isShift);
    },
    [asset.id, onSelect]
  );

  // Handle double-click for fullscreen view (images and videos)
  const handleDoubleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      if (onDoubleClick && (asset.type === 'image' || asset.type === 'video')) {
        onDoubleClick(asset);
      }
    },
    [asset, onDoubleClick]
  );

  // Handle hover
  const handleMouseEnter = useCallback(() => {
    setHoveredId(asset.id);
  }, [asset.id, setHoveredId]);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, [setHoveredId]);

  if (!asset.visible) return null;

  // Only render images and videos - 3D models are handled by Asset3D
  if (asset.type !== 'image' && asset.type !== 'video') return null;

  // Don't render until image is loaded
  if (!image) return null;

  const isVideo = asset.type === 'video';

  const x = metersToPixels(asset.x);
  const y = metersToPixels(asset.y);
  const width = metersToPixels(asset.width);
  const height = metersToPixels(asset.height);

  // Calculate play button size based on asset dimensions
  const playButtonRadius = Math.min(width, height) * 0.15;

  return (
    <Group>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={asset.rotation}
        opacity={1}
        stroke={isSelected ? '#3b82f6' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        draggable={!asset.locked}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        shadowColor={isSelected ? '#3b82f6' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
      />
      {/* Play button overlay for video assets - positioned at image center with same rotation */}
      {isVideo && (
        <Group
          x={x}
          y={y}
          rotation={asset.rotation}
          listening={false}
        >
          {/* Semi-transparent circle background - centered on image */}
          <Circle
            x={width / 2}
            y={height / 2}
            radius={playButtonRadius}
            fill="rgba(0, 0, 0, 0.6)"
          />
          {/* Play triangle icon - slightly offset to appear visually centered */}
          <RegularPolygon
            x={width / 2 + playButtonRadius * 0.1}
            y={height / 2}
            sides={3}
            radius={playButtonRadius * 0.5}
            rotation={90}
            fill="white"
          />
        </Group>
      )}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraint
            const minSize = metersToPixels(0.1);
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          keepRatio={false}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
        />
      )}
    </Group>
  );
}
