import { useEffect, useState } from 'react';
import { useFloorplanStore } from '@store/index';

interface TooltipProps {
  visible?: boolean;
}

export function Tooltip({ visible = true }: TooltipProps) {
  const hoveredId = useFloorplanStore((state) => state.hoveredId);
  const project = useFloorplanStore((state) => state.project);
  const showTooltips = useFloorplanStore((state) => state.showTooltips);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!visible || !showTooltips || !hoveredId || !project) {
    return null;
  }

  // Find hovered area or asset
  const hoveredArea = project.areas.find((a) => a.id === hoveredId);
  const hoveredAsset = project.assets.find((a) => a.id === hoveredId);

  if (!hoveredArea && !hoveredAsset) {
    return null;
  }

  // Calculate tooltip position (offset from cursor)
  const tooltipStyle = {
    left: mousePos.x + 15,
    top: mousePos.y + 15,
  };

  if (hoveredArea) {
    const areaSize = hoveredArea.width * hoveredArea.height;
    const volume = areaSize * hoveredArea.elevation;

    return (
      <div
        className="fixed z-50 pointer-events-none bg-gray-900 bg-opacity-95 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 min-w-[150px]"
        style={tooltipStyle}
      >
        <div className="font-semibold text-sm mb-1">{hoveredArea.name}</div>
        <div className="text-xs text-gray-300 space-y-0.5">
          <div className="flex justify-between gap-4">
            <span>Type:</span>
            <span className="capitalize">{hoveredArea.type}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Size:</span>
            <span>{hoveredArea.width.toFixed(1)}m x {hoveredArea.height.toFixed(1)}m</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Area:</span>
            <span>{areaSize.toFixed(1)} m2</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Height:</span>
            <span>{hoveredArea.elevation.toFixed(1)}m</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Volume:</span>
            <span>{volume.toFixed(1)} m3</span>
          </div>
        </div>
      </div>
    );
  }

  if (hoveredAsset) {
    return (
      <div
        className="fixed z-50 pointer-events-none bg-gray-900 bg-opacity-95 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 min-w-[150px]"
        style={tooltipStyle}
      >
        <div className="font-semibold text-sm mb-1">{hoveredAsset.name}</div>
        <div className="text-xs text-gray-300 space-y-0.5">
          <div className="flex justify-between gap-4">
            <span>Type:</span>
            <span className="capitalize">{hoveredAsset.type}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Size:</span>
            <span>{hoveredAsset.width.toFixed(1)}m x {hoveredAsset.height.toFixed(1)}m</span>
          </div>
          {hoveredAsset.type === 'model' && hoveredAsset.depth > 0 && (
            <div className="flex justify-between gap-4">
              <span>Depth:</span>
              <span>{hoveredAsset.depth.toFixed(1)}m</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
