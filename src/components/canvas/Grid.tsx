import { Line, Text, Group } from 'react-konva';
import { useMemo } from 'react';
import { metersToPixels, PIXELS_PER_METER, metersToDisplayUnit, getUnitAbbreviation } from '@lib/coordinates';
import type { DisplayUnit } from '@models/types';

interface GridProps {
  lotWidth: number;
  lotHeight: number;
  gridSize: number;
  zoom: number;
  showLabels?: boolean;
  displayUnit?: DisplayUnit;
}

export function Grid({ lotWidth, lotHeight, gridSize, zoom, showLabels = true, displayUnit = 'meters' }: GridProps) {
  const unitAbbr = getUnitAbbreviation(displayUnit);
  const canvasWidth = metersToPixels(lotWidth);
  const canvasHeight = metersToPixels(lotHeight);

  // Calculate grid lines
  const gridLines = useMemo(() => {
    const lines: { points: number[]; isMain: boolean }[] = [];
    const gridPixels = metersToPixels(gridSize);

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridPixels) {
      const isMain = (x / PIXELS_PER_METER) % 10 === 0;
      lines.push({
        points: [x, 0, x, canvasHeight],
        isMain,
      });
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridPixels) {
      const isMain = (y / PIXELS_PER_METER) % 10 === 0;
      lines.push({
        points: [0, y, canvasWidth, y],
        isMain,
      });
    }

    return lines;
  }, [canvasWidth, canvasHeight, gridSize]);

  // Calculate dimension labels
  const labels = useMemo(() => {
    if (!showLabels) return [];

    const labelData: { x: number; y: number; text: string; rotation: number }[] = [];
    const labelInterval = Math.max(1, Math.ceil(10 / gridSize)) * gridSize; // Show labels every ~10m
    const gridPixels = metersToPixels(labelInterval);

    // X-axis labels (bottom)
    for (let x = 0; x <= canvasWidth; x += gridPixels) {
      const meters = x / PIXELS_PER_METER;
      const displayValue = metersToDisplayUnit(meters, displayUnit);
      labelData.push({
        x,
        y: canvasHeight + 15 / zoom,
        text: `${displayValue.toFixed(displayUnit === 'feet' ? 1 : 0)}${unitAbbr}`,
        rotation: 0,
      });
    }

    // Y-axis labels (left)
    for (let y = 0; y <= canvasHeight; y += gridPixels) {
      const meters = y / PIXELS_PER_METER;
      const displayValue = metersToDisplayUnit(meters, displayUnit);
      labelData.push({
        x: -35 / zoom,
        y,
        text: `${displayValue.toFixed(displayUnit === 'feet' ? 1 : 0)}${unitAbbr}`,
        rotation: 0,
      });
    }

    return labelData;
  }, [canvasWidth, canvasHeight, gridSize, zoom, showLabels, displayUnit, unitAbbr]);

  return (
    <Group>
      {/* Grid lines */}
      {gridLines.map((line, index) => (
        <Line
          key={`grid-${index}`}
          points={line.points}
          stroke={line.isMain ? '#4a5568' : '#2d3748'}
          strokeWidth={(line.isMain ? 1 : 0.5) / zoom}
          listening={false}
        />
      ))}

      {/* Lot boundary */}
      <Line
        points={[0, 0, canvasWidth, 0, canvasWidth, canvasHeight, 0, canvasHeight, 0, 0]}
        stroke="#3182ce"
        strokeWidth={2 / zoom}
        listening={false}
      />

      {/* Dimension labels */}
      {labels.map((label, index) => (
        <Text
          key={`label-${index}`}
          x={label.x}
          y={label.y}
          text={label.text}
          fontSize={12 / zoom}
          fill="#718096"
          rotation={label.rotation}
          listening={false}
        />
      ))}
    </Group>
  );
}
