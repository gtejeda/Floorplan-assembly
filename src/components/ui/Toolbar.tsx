import { useState } from 'react';
import { useFloorplanStore, useCanUndo, useCanRedo, useUndo, useRedo } from '@store/index';
import type { Tool } from '@models/types';
import { NewProjectDialog } from '@components/dialogs/NewProjectDialog';
import { ProjectListDialog } from '@components/dialogs/ProjectListDialog';
import { getUnitName } from '@lib/coordinates';

const tools: { id: Tool; label: string; icon: string; shortcut: string }[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'pan', label: 'Pan', icon: '✋', shortcut: 'H' },
  { id: 'area', label: 'Add Area', icon: '⬜', shortcut: 'A' },
  { id: 'import', label: 'Import', icon: '📁', shortcut: 'I' },
];

// SVG Icons
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const LoadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const ExportIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const NewProjectIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UndoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const RedoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
  </svg>
);

export function Toolbar() {
  const activeTool = useFloorplanStore((state) => state.activeTool);
  const setActiveTool = useFloorplanStore((state) => state.setActiveTool);
  const saveProject = useFloorplanStore((state) => state.saveProject);
  const exportProjectToFile = useFloorplanStore((state) => state.exportProjectToFile);
  const isSaving = useFloorplanStore((state) => state.isSaving);

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useUndo();
  const redo = useRedo();
  const displayUnit = useFloorplanStore((state) => state.displayUnit);
  const toggleDisplayUnit = useFloorplanStore((state) => state.toggleDisplayUnit);

  // Dialog states
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isProjectListDialogOpen, setIsProjectListDialogOpen] = useState(false);

  const handleSave = async () => {
    await saveProject();
  };

  const handleExport = () => {
    exportProjectToFile();
  };

  return (
    <>
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
        {/* Project buttons */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
          <button
            onClick={() => setIsNewProjectDialogOpen(true)}
            className="px-3 py-1.5 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1.5"
            title="New Project (Ctrl+N)"
          >
            <NewProjectIcon />
            New
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5
              ${
                isSaving
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
            title="Save (Ctrl+S)"
          >
            <SaveIcon />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setIsProjectListDialogOpen(true)}
            className="px-3 py-1.5 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1.5"
            title="Load (Ctrl+O)"
          >
            <LoadIcon />
            Load
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1.5"
            title="Export (Ctrl+E)"
          >
            <ExportIcon />
            Export
          </button>
        </div>

        {/* Tool buttons */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`
                px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${
                  activeTool === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <span className="mr-1">{tool.icon}</span>
              {tool.label}
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className={`
              px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-1
              ${
                canUndo
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon />
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            className={`
              px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-1
              ${
                canRedo
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
            title="Redo (Ctrl+Shift+Z)"
          >
            <RedoIcon />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDisplayUnit}
            className="px-3 py-1.5 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1.5"
            title="Toggle between Meters and Feet (U)"
          >
            <span className="text-xs">📏</span>
            {getUnitName(displayUnit)}
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
      />
      <ProjectListDialog
        isOpen={isProjectListDialogOpen}
        onClose={() => setIsProjectListDialogOpen(false)}
      />
    </>
  );
}
