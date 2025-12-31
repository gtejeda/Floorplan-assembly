import { useFloorplanStore } from '@store/index';
import type { ViewMode } from '@models/types';

const views: { id: ViewMode; label: string }[] = [
  { id: '2d', label: '2D' },
  { id: '3d', label: '3D' },
];

export function ViewToggle() {
  const activeView = useFloorplanStore((state) => state.activeView);
  const setActiveView = useFloorplanStore((state) => state.setActiveView);

  return (
    <div className="flex items-center gap-1 bg-gray-700 rounded p-0.5">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => setActiveView(view.id)}
          className={`
            px-3 py-1 rounded text-sm font-medium transition-colors
            ${
              activeView === view.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }
          `}
          title={`Switch to ${view.label} view (Tab)`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
