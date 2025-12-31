import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useFloorplanStore, useUndo, useRedo } from '@store/index';
import { getLastProject } from '@lib/storage';
import { Toolbar } from '@components/ui/Toolbar';
import { ViewToggle } from '@components/ui/ViewToggle';
import { StatusBar } from '@components/ui/StatusBar';
import { LotPanel } from '@components/panels/LotPanel';
import { AreaList } from '@components/panels/AreaList';
import { AreaProperties } from '@components/panels/AreaProperties';
import { AreaSummary } from '@components/ui/AreaSummary';
import { AssetLibrary } from '@components/panels/AssetLibrary';
import { Canvas2D } from '@components/canvas/Canvas2D';
import { Viewer3D } from '@components/viewer/Viewer3D';
import { Coordinates } from '@components/ui/Coordinates';
import { Tooltip } from '@components/ui/Tooltip';
import { AreaCreateDialog } from '@components/dialogs/AreaCreateDialog';
import { AssetImportDialog } from '@components/dialogs/AssetImportDialog';

// Keyboard shortcuts data for help dialog
const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+S', description: 'Save project' },
  { keys: 'Ctrl+E', description: 'Export project to file' },
  { keys: 'Ctrl+Z', description: 'Undo' },
  { keys: 'Ctrl+Shift+Z', description: 'Redo' },
  { keys: 'Ctrl+D', description: 'Duplicate selected' },
  { keys: 'Delete / Backspace', description: 'Delete selected' },
  { keys: 'Escape', description: 'Clear selection / Close dialog' },
  { keys: 'Tab', description: 'Toggle 2D/3D view' },
  { keys: 'G', description: 'Toggle grid' },
  { keys: 'I', description: 'Open import dialog' },
  { keys: '?', description: 'Show keyboard shortcuts' },
];

function App() {
  const project = useFloorplanStore((state) => state.project);
  const activeView = useFloorplanStore((state) => state.activeView);
  const activeTool = useFloorplanStore((state) => state.activeTool);
  const createProject = useFloorplanStore((state) => state.createProject);
  const loadProject = useFloorplanStore((state) => state.loadProject);
  const setActiveView = useFloorplanStore((state) => state.setActiveView);
  const toggleGrid = useFloorplanStore((state) => state.toggleGrid);
  const clearSelection = useFloorplanStore((state) => state.clearSelection);
  const deleteArea = useFloorplanStore((state) => state.deleteArea);
  const deleteAsset = useFloorplanStore((state) => state.deleteAsset);
  const duplicateArea = useFloorplanStore((state) => state.duplicateArea);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const setActiveTool = useFloorplanStore((state) => state.setActiveTool);
  const projectAreas = useFloorplanStore((state) => state.project?.areas);
  const projectAssets = useFloorplanStore((state) => state.project?.assets);
  const saveProject = useFloorplanStore((state) => state.saveProject);

  // Use stable empty array references to prevent infinite re-renders
  const areas = useMemo(() => projectAreas ?? [], [projectAreas]);
  const assets = useMemo(() => projectAssets ?? [], [projectAssets]);
  const exportProjectToFile = useFloorplanStore((state) => state.exportProjectToFile);
  const undo = useUndo();
  const redo = useRedo();

  // Hydration state
  const [isHydrating, setIsHydrating] = useState(true);
  const hydrationAttempted = useRef(false);

  // Coordinate state for status bar
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  // Area creation dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 });

  // Asset import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPosition, setImportPosition] = useState({ x: 0, y: 0 });

  // Keyboard shortcuts help dialog state
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    if (hydrationAttempted.current) return;
    hydrationAttempted.current = true;

    const hydrate = async () => {
      try {
        const savedProject = await getLastProject();
        if (savedProject) {
          loadProject(savedProject);
        } else {
          // No saved project, create a new one
          createProject('New Floorplan', {
            width: 50,
            height: 30,
            gridSize: 1.0,
            unit: 'meters',
          });
        }
      } catch (error) {
        console.error('Failed to hydrate project from IndexedDB:', error);
        // On error, create a new project
        createProject('New Floorplan', {
          width: 50,
          height: 30,
          gridSize: 1.0,
          unit: 'meters',
        });
      } finally {
        setIsHydrating(false);
      }
    };

    hydrate();
  }, [loadProject, createProject]);

  // Open import dialog when import tool is activated
  useEffect(() => {
    if (activeTool === 'import' && !isImportDialogOpen) {
      const lot = project?.lot;
      if (lot) {
        setImportPosition({ x: lot.width / 4, y: lot.height / 4 });
      }
      setIsImportDialogOpen(true);
    }
  }, [activeTool, isImportDialogOpen, project?.lot]);

  // Handle area creation from canvas click
  const handleAreaCreate = useCallback((x: number, y: number) => {
    setCreatePosition({ x, y });
    setIsCreateDialogOpen(true);
  }, []);

  // Handle asset import dialog open
  const handleAssetImportOpen = useCallback(() => {
    const lot = project?.lot;
    if (lot) {
      setImportPosition({ x: lot.width / 4, y: lot.height / 4 });
    }
    setIsImportDialogOpen(true);
  }, [project?.lot]);

  // Handle dialog close - switch back to select tool
  const handleDialogClose = useCallback(() => {
    setIsCreateDialogOpen(false);
    setActiveTool('select');
  }, [setActiveTool]);

  // Handle import dialog close
  const handleImportDialogClose = useCallback(() => {
    setIsImportDialogOpen(false);
    setActiveTool('select');
  }, [setActiveTool]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore WASD keys when in 3D view (used for camera movement)
      const wasdKeys = ['w', 'a', 's', 'd'];
      if (activeView === '3d' && wasdKeys.includes(e.key.toLowerCase())) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Global shortcuts
      if (ctrl && key === 'z' && !shift) {
        e.preventDefault();
        undo();
      } else if (ctrl && key === 'z' && shift) {
        e.preventDefault();
        redo();
      } else if (ctrl && key === 's') {
        e.preventDefault();
        saveProject();
      } else if (ctrl && key === 'e') {
        e.preventDefault();
        exportProjectToFile();
      } else if (ctrl && key === 'd') {
        e.preventDefault();
        // Duplicate selected areas
        selectedIds.forEach((id) => {
          if (areas.find((a) => a.id === id)) {
            duplicateArea(id);
          }
        });
      } else if (key === 'escape') {
        if (isShortcutsHelpOpen) {
          setIsShortcutsHelpOpen(false);
        } else if (isCreateDialogOpen) {
          setIsCreateDialogOpen(false);
        } else if (isImportDialogOpen) {
          setIsImportDialogOpen(false);
        } else {
          clearSelection();
        }
        setActiveTool('select');
      } else if (key === 'delete' || key === 'backspace') {
        // Delete selected areas and assets
        selectedIds.forEach((id) => {
          if (areas.find((a) => a.id === id)) {
            deleteArea(id);
          } else if (assets.find((a) => a.id === id)) {
            deleteAsset(id);
          }
        });
        clearSelection();
      } else if (key === 'tab') {
        e.preventDefault();
        setActiveView(activeView === '2d' ? '3d' : '2d');
      } else if (key === 'g') {
        toggleGrid();
      } else if (key === 'i' && !ctrl) {
        // Import shortcut
        e.preventDefault();
        handleAssetImportOpen();
      } else if (e.key === '?' || (shift && key === '/')) {
        // Show keyboard shortcuts help dialog
        e.preventDefault();
        setIsShortcutsHelpOpen(true);
      }
    },
    [
      undo,
      redo,
      saveProject,
      exportProjectToFile,
      selectedIds,
      areas,
      assets,
      duplicateArea,
      clearSelection,
      deleteArea,
      deleteAsset,
      setActiveView,
      activeView,
      toggleGrid,
      isCreateDialogOpen,
      isImportDialogOpen,
      isShortcutsHelpOpen,
      setActiveTool,
      handleAssetImportOpen,
    ]
  );

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show loading state while hydrating
  if (isHydrating) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">
            {project?.name ?? 'Floorplan Assembly'}
          </h1>
        </div>
        <ViewToggle />
      </header>

      {/* Toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Left */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <LotPanel />
          <div className="border-t border-gray-700">
            <AreaList />
          </div>
          <div className="border-t border-gray-700">
            <AssetLibrary onImportClick={handleAssetImportOpen} />
          </div>
          <AreaSummary />
        </aside>

        {/* Canvas/Viewer area */}
        <main className="flex-1 relative bg-gray-950">
          {activeView === '2d' ? (
            <Canvas2D
              onCoordinateChange={(x, y) => setMouseCoords({ x, y })}
              onAreaCreate={handleAreaCreate}
            />
          ) : (
            <Viewer3D />
          )}
        </main>

        {/* Sidebar - Right (Properties) */}
        <aside className="w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
          <AreaProperties />
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-sm">
        <Coordinates x={mouseCoords.x} y={mouseCoords.y} />
        <StatusBar />
      </footer>

      {/* Area Creation Dialog */}
      <AreaCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={handleDialogClose}
        initialPosition={createPosition}
      />

      {/* Asset Import Dialog */}
      <AssetImportDialog
        isOpen={isImportDialogOpen}
        onClose={handleImportDialogClose}
        initialPosition={importPosition}
      />

      {/* Tooltip for 3D hover */}
      <Tooltip visible={activeView === '3d'} />

      {/* Keyboard Shortcuts Help Dialog */}
      {isShortcutsHelpOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsShortcutsHelpOpen(false)}
        >
          <div
            className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsShortcutsHelpOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                >
                  <span className="text-gray-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-sm font-mono text-gray-200">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              Press Escape or click outside to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
