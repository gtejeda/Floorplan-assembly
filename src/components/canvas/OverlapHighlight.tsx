import { Rect } from 'react-konva';
import type { Bounds } from '@models/types';
import { metersToPixels } from '@lib/coordinates';

interface OverlapHighlightProps {
  bounds: Bounds;
}

/**
 * Renders a highlight rectangle to indicate overlapping areas
 */
export function OverlapHighlight({ bounds }: OverlapHighlightProps) {
  const x = metersToPixels(bounds.minX);
  const y = metersToPixels(bounds.minY);
  const width = metersToPixels(bounds.maxX - bounds.minX);
  const height = metersToPixels(bounds.maxY - bounds.minY);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(239, 68, 68, 0.3)"
      stroke="#ef4444"
      strokeWidth={2}
      dash={[5, 5]}
      listening={false}
    />
  );
}
