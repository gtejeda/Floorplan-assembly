import { Text, Group } from 'react-konva';
import type { Area, DisplayUnit } from '@models/types';
import { metersToPixels, formatArea, metersToDisplayUnit, getUnitAbbreviation } from '@lib/coordinates';

interface AreaLabelProps {
  area: Area;
  zoom: number;
  displayUnit?: DisplayUnit;
}

export function AreaLabel({ area, zoom, displayUnit = 'meters' }: AreaLabelProps) {
  if (!area.visible) return null;

  const x = metersToPixels(area.x);
  const y = metersToPixels(area.y);
  const width = metersToPixels(area.width);
  const height = metersToPixels(area.height);

  const fontSize = 14 / zoom;
  const lineHeight = fontSize * 1.4;
  const areaValue = area.width * area.height;

  const unitAbbr = getUnitAbbreviation(displayUnit);
  const displayWidth = metersToDisplayUnit(area.width, displayUnit);
  const displayHeight = metersToDisplayUnit(area.height, displayUnit);

  // Total height of all three lines
  const totalTextHeight = lineHeight * 3;
  const startY = y + (height - totalTextHeight) / 2;

  return (
    <Group listening={false} opacity={0.5}>
      {/* Area name - centered */}
      <Text
        x={x}
        y={startY}
        width={width}
        text={area.name}
        fontSize={fontSize}
        fontStyle="bold"
        fill="#ffffff"
        align="center"
      />

      {/* Dimensions - centered */}
      <Text
        x={x}
        y={startY + lineHeight}
        width={width}
        text={`${displayWidth.toFixed(1)}${unitAbbr} × ${displayHeight.toFixed(1)}${unitAbbr}`}
        fontSize={fontSize * 0.85}
        fill="#e5e7eb"
        align="center"
      />

      {/* Area value - centered */}
      <Text
        x={x}
        y={startY + lineHeight * 2}
        width={width}
        text={formatArea(areaValue, displayUnit, 1)}
        fontSize={fontSize * 0.75}
        fill="#d1d5db"
        align="center"
      />
    </Group>
  );
}
