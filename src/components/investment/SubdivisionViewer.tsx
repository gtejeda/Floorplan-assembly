/**
 * SubdivisionViewer - 2D visualization of subdivision scenarios using Konva
 *
 * Per spec requirements:
 * - FR-020: Display 2D schematic diagrams showing land parcel, social club, and micro villa lots
 * - FR-021: Show dimensions for all elements (land, social club, lots)
 * - FR-022: Label lots with sequential numbers
 * - Visual design: Orange social club, blue lots, clear borders
 */

import { useMemo } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { useFloorplanStore } from '../../store';
import type { MicroVillaLot, SocialClubLayout } from '../../models/types';

// ==================== Constants ====================

const SCALE = 10; // 10 pixels per meter (adjustable based on display)
const PADDING = 40; // Padding around the canvas in pixels
const LAND_BORDER_COLOR = '#1f2937'; // Dark gray
const LAND_BORDER_WIDTH = 2;
const SOCIAL_CLUB_COLOR = '#f97316'; // Orange
const SOCIAL_CLUB_BORDER_COLOR = '#ea580c'; // Darker orange
const SOCIAL_CLUB_BORDER_WIDTH = 2;
const LOT_COLOR = '#3b82f6'; // Blue
const LOT_BORDER_COLOR = '#1d4ed8'; // Darker blue
const LOT_BORDER_WIDTH = 1;
const LABEL_FONT_SIZE = 12;
const LABEL_FONT_FAMILY = 'Arial, sans-serif';
const LABEL_COLOR = '#000000';
const DIMENSION_LABEL_COLOR = '#4b5563'; // Gray

// ==================== Component ====================

export function SubdivisionViewer() {
  const landParcel = useFloorplanStore(state => state.landParcel);
  const scenarios = useFloorplanStore(state => state.subdivisionScenarios);
  const selectedScenarioId = useFloorplanStore(state => state.selectedScenarioId);

  // Get the selected scenario
  const selectedScenario = useMemo(() => {
    return scenarios.find(s => s.id === selectedScenarioId) || scenarios[0] || null;
  }, [scenarios, selectedScenarioId]);

  // Calculate canvas dimensions
  const canvasWidth = useMemo(() => {
    if (!landParcel) return 800;
    return landParcel.width * SCALE + PADDING * 2;
  }, [landParcel]);

  const canvasHeight = useMemo(() => {
    if (!landParcel) return 600;
    return landParcel.height * SCALE + PADDING * 2;
  }, [landParcel]);

  if (!landParcel) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Configure land parcel to view subdivision</p>
      </div>
    );
  }

  if (!selectedScenario) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Calculating subdivision scenarios...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 flex items-center justify-center">
      <Stage width={canvasWidth} height={canvasHeight}>
        <Layer>
          {/* T050: Land parcel boundary */}
          <Rect
            x={PADDING}
            y={PADDING}
            width={landParcel.width * SCALE}
            height={landParcel.height * SCALE}
            fill="white"
            stroke={LAND_BORDER_COLOR}
            strokeWidth={LAND_BORDER_WIDTH}
          />

          {/* Land dimensions label */}
          <Text
            x={PADDING}
            y={PADDING - 20}
            text={`Land: ${landParcel.width.toFixed(1)}m × ${landParcel.height.toFixed(1)}m (${landParcel.totalArea.toFixed(1)} sqm)`}
            fontSize={LABEL_FONT_SIZE}
            fontFamily={LABEL_FONT_FAMILY}
            fill={DIMENSION_LABEL_COLOR}
          />

          {/* T051: Social club rectangle (centered, orange fill) */}
          <SocialClubRect
            socialClub={selectedScenario.socialClub}
            offsetX={PADDING}
            offsetY={PADDING}
          />

          {/* T052: Micro Villa lots rendering (grid of blue rectangles with borders) */}
          {selectedScenario.lots.map(lot => (
            <LotRect
              key={lot.id}
              lot={lot}
              offsetX={PADDING}
              offsetY={PADDING}
            />
          ))}

          {/* T053: Dimension labels for lots and social club */}
          {selectedScenario.lots.map(lot => (
            <LotLabel
              key={`label-${lot.id}`}
              lot={lot}
              offsetX={PADDING}
              offsetY={PADDING}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

// ==================== Sub-components ====================

/**
 * Social club rectangle with label
 */
function SocialClubRect({
  socialClub,
  offsetX,
  offsetY,
}: {
  socialClub: SocialClubLayout;
  offsetX: number;
  offsetY: number;
}) {
  const x = offsetX + socialClub.x * SCALE;
  const y = offsetY + socialClub.y * SCALE;
  const width = socialClub.width * SCALE;
  const height = socialClub.height * SCALE;

  return (
    <>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={SOCIAL_CLUB_COLOR}
        stroke={SOCIAL_CLUB_BORDER_COLOR}
        strokeWidth={SOCIAL_CLUB_BORDER_WIDTH}
        opacity={0.7}
      />

      {/* Social club label */}
      <Text
        x={x + width / 2}
        y={y + height / 2 - 20}
        text="Social Club"
        fontSize={LABEL_FONT_SIZE + 2}
        fontFamily={LABEL_FONT_FAMILY}
        fontStyle="bold"
        fill={LABEL_COLOR}
        align="center"
        offsetX={40} // Center the text horizontally
      />

      {/* Social club dimensions */}
      <Text
        x={x + width / 2}
        y={y + height / 2}
        text={`${socialClub.width.toFixed(1)}m × ${socialClub.height.toFixed(1)}m`}
        fontSize={LABEL_FONT_SIZE}
        fontFamily={LABEL_FONT_FAMILY}
        fill={LABEL_COLOR}
        align="center"
        offsetX={50} // Center the text horizontally
      />

      {/* Social club area */}
      <Text
        x={x + width / 2}
        y={y + height / 2 + 15}
        text={`${socialClub.area.toFixed(1)} sqm`}
        fontSize={LABEL_FONT_SIZE}
        fontFamily={LABEL_FONT_FAMILY}
        fill={LABEL_COLOR}
        align="center"
        offsetX={40} // Center the text horizontally
      />
    </>
  );
}

/**
 * Lot rectangle rendering
 */
function LotRect({
  lot,
  offsetX,
  offsetY,
}: {
  lot: MicroVillaLot;
  offsetX: number;
  offsetY: number;
}) {
  const x = offsetX + lot.x * SCALE;
  const y = offsetY + lot.y * SCALE;
  const width = lot.width * SCALE;
  const height = lot.height * SCALE;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={lot.color || LOT_COLOR}
      stroke={LOT_BORDER_COLOR}
      strokeWidth={LOT_BORDER_WIDTH}
      opacity={0.5}
    />
  );
}

/**
 * T053: Lot labels with smart positioning
 * Shows lot number and dimensions centered within each lot
 */
function LotLabel({
  lot,
  offsetX,
  offsetY,
}: {
  lot: MicroVillaLot;
  offsetX: number;
  offsetY: number;
}) {
  const x = offsetX + lot.x * SCALE;
  const y = offsetY + lot.y * SCALE;
  const width = lot.width * SCALE;
  const height = lot.height * SCALE;

  // Smart positioning: Only show labels if there's enough space
  const hasEnoughSpace = width > 60 && height > 40;

  if (!hasEnoughSpace) {
    // For small lots, just show lot number
    return (
      <Text
        x={x + width / 2}
        y={y + height / 2}
        text={`${lot.lotNumber}`}
        fontSize={LABEL_FONT_SIZE - 2}
        fontFamily={LABEL_FONT_FAMILY}
        fill={LABEL_COLOR}
        align="center"
        offsetX={10}
        offsetY={6}
      />
    );
  }

  return (
    <>
      {/* Lot number */}
      <Text
        x={x + width / 2}
        y={y + height / 2 - 15}
        text={`Lot ${lot.lotNumber}`}
        fontSize={LABEL_FONT_SIZE}
        fontFamily={LABEL_FONT_FAMILY}
        fontStyle="bold"
        fill={LABEL_COLOR}
        align="center"
        offsetX={25}
      />

      {/* Lot dimensions */}
      <Text
        x={x + width / 2}
        y={y + height / 2}
        text={`${lot.width.toFixed(1)}m × ${lot.height.toFixed(1)}m`}
        fontSize={LABEL_FONT_SIZE - 1}
        fontFamily={LABEL_FONT_FAMILY}
        fill={LABEL_COLOR}
        align="center"
        offsetX={45}
      />

      {/* Lot area */}
      <Text
        x={x + width / 2}
        y={y + height / 2 + 12}
        text={`${lot.area.toFixed(1)} sqm`}
        fontSize={LABEL_FONT_SIZE - 1}
        fontFamily={LABEL_FONT_FAMILY}
        fill={LABEL_COLOR}
        align="center"
        offsetX={35}
      />
    </>
  );
}
