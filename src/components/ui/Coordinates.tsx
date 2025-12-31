import { formatMeters } from '@lib/coordinates';

interface CoordinatesProps {
  x: number;
  y: number;
}

export function Coordinates({ x, y }: CoordinatesProps) {
  return (
    <div className="flex items-center gap-4 text-gray-400 text-sm">
      <span>
        X: <strong className="text-white">{formatMeters(x, 2)}</strong>
      </span>
      <span>
        Y: <strong className="text-white">{formatMeters(y, 2)}</strong>
      </span>
    </div>
  );
}
