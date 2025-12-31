import { useFloorplanStore } from '@store/index';
import {
  selectTotalLotArea,
  selectUsedArea,
  selectRemainingArea,
  selectAreaUsagePercentage,
  selectHasOverlaps,
} from '@store/selectors';
import { formatSquareMeters } from '@lib/coordinates';

export function AreaSummary() {
  const totalArea = useFloorplanStore(selectTotalLotArea);
  const usedArea = useFloorplanStore(selectUsedArea);
  const remainingArea = useFloorplanStore(selectRemainingArea);
  const usagePercentage = useFloorplanStore(selectAreaUsagePercentage);
  const hasOverlaps = useFloorplanStore(selectHasOverlaps);

  if (totalArea === 0) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-700">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Area Summary
      </h2>

      <div className="space-y-2">
        {/* Total lot area */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Lot:</span>
          <span className="text-white font-medium">
            {formatSquareMeters(totalArea, 1)}
          </span>
        </div>

        {/* Used area */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Used:</span>
          <span className="text-blue-400 font-medium">
            {formatSquareMeters(usedArea, 1)}
          </span>
        </div>

        {/* Remaining area */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Remaining:</span>
          <span className={`font-medium ${remainingArea < 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatSquareMeters(Math.abs(remainingArea), 1)}
            {remainingArea < 0 && ' over'}
          </span>
        </div>

        {/* Usage bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Usage</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePercentage > 100
                  ? 'bg-red-500'
                  : usagePercentage > 80
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Overlap warning */}
        {hasOverlaps && (
          <div className="mt-3 flex items-center gap-2 text-sm text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded">
            <span>Areas are overlapping</span>
          </div>
        )}
      </div>
    </div>
  );
}
