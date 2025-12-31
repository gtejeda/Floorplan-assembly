import { useFloorplanStore } from '@store/index';
import {
  selectUsedArea,
  selectTotalLotArea,
  selectRemainingArea,
  selectAreaUsagePercentage,
  selectHasOverlaps,
} from '@store/selectors';
import { formatArea } from '@lib/coordinates';

export function StatusBar() {
  const project = useFloorplanStore((state) => state.project);
  const usedArea = useFloorplanStore(selectUsedArea);
  const totalArea = useFloorplanStore(selectTotalLotArea);
  const remainingArea = useFloorplanStore(selectRemainingArea);
  const usagePercentage = useFloorplanStore(selectAreaUsagePercentage);
  const hasOverlaps = useFloorplanStore(selectHasOverlaps);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  if (!project) {
    return <span className="text-gray-400">No project loaded</span>;
  }

  return (
    <>
      {/* Area statistics */}
      <div className="flex items-center gap-4 text-gray-300">
        <span>
          Total: <strong>{formatArea(totalArea, displayUnit)}</strong>
        </span>
        <span className="text-gray-600">|</span>
        <span>
          Used:{' '}
          <strong className="text-blue-400">
            {formatArea(usedArea, displayUnit)} ({usagePercentage.toFixed(1)}%)
          </strong>
        </span>
        <span className="text-gray-600">|</span>
        <span>
          Remaining:{' '}
          <strong className="text-green-400">
            {formatArea(remainingArea, displayUnit)}
          </strong>
        </span>
        {hasOverlaps && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-yellow-400">⚠ Overlapping areas</span>
          </>
        )}
      </div>

      {/* Selection info */}
      <div className="text-gray-400">
        {selectedIds.length > 0 ? (
          <span>{selectedIds.length} selected</span>
        ) : (
          <span>No selection</span>
        )}
      </div>
    </>
  );
}
