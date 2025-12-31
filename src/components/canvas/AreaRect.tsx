import { useRef, useEffect, useCallback } from 'react';
import { Rect, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import type { Area } from '@models/types';
import { metersToPixels, pixelsToMeters } from '@lib/coordinates';
import { useFloorplanStore } from '@store/index';

interface AreaRectProps {
  area: Area;
  isSelected: boolean;
  onSelect: (id: string, additive: boolean) => void;
}

export function AreaRect({ area, isSelected, onSelect }: AreaRectProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const updateArea = useFloorplanStore((state) => state.updateArea);
  const setHoveredId = useFloorplanStore((state) => state.setHoveredId);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle drag end
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (area.locked) return;

      const node = e.target;
      const newX = pixelsToMeters(node.x());
      const newY = pixelsToMeters(node.y());

      updateArea(area.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
    },
    [area.id, area.locked, updateArea]
  );

  // Handle transform end (resize)
  const handleTransformEnd = useCallback(
    (_e: Konva.KonvaEventObject<Event>) => {
      if (area.locked) return;

      const node = shapeRef.current;
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

      updateArea(area.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: Math.max(0.5, newWidth),
        height: Math.max(0.5, newHeight),
      });
    },
    [area.id, area.locked, updateArea]
  );

  // Handle click for selection
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true; // Prevent canvas click
      const isShift = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onSelect(area.id, isShift);
    },
    [area.id, onSelect]
  );

  // Handle hover
  const handleMouseEnter = useCallback(() => {
    setHoveredId(area.id);
  }, [area.id, setHoveredId]);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, [setHoveredId]);

  if (!area.visible) return null;

  const x = metersToPixels(area.x);
  const y = metersToPixels(area.y);
  const width = metersToPixels(area.width);
  const height = metersToPixels(area.height);

  return (
    <Group>
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={area.color}
        opacity={area.opacity}
        stroke={isSelected ? '#3b82f6' : '#1e3a5f'}
        strokeWidth={isSelected ? 2 : 1}
        draggable={!area.locked}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={handleClick}
        onTap={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        shadowColor={isSelected ? '#3b82f6' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraint
            const minWidth = metersToPixels(0.5);
            const minHeight = metersToPixels(0.5);
            if (newBox.width < minWidth || newBox.height < minHeight) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={false}
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
