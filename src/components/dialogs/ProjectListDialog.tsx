import { useState, useEffect, useCallback, useRef } from 'react';
import { useFloorplanStore } from '@store/index';
import {
  listProjects,
  loadFromIDB,
  deleteFromIDB,
  importProjectFromJSON,
} from '@lib/storage';

interface ProjectListDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectInfo {
  id: string;
  name: string;
  modified: string;
}

export function ProjectListDialog({ isOpen, onClose }: ProjectListDialogProps) {
  const loadProject = useFloorplanStore((state) => state.loadProject);

  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects when dialog opens
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const projectList = await listProjects();
      setProjects(projectList);
    } catch {
      setError('Failed to load projects list.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen, fetchProjects]);

  const handleLoadProject = useCallback(
    async (projectId: string) => {
      setLoadingProjectId(projectId);
      setError(null);

      try {
        const project = await loadFromIDB(projectId);
        if (project) {
          loadProject(project);
          onClose();
        } else {
          setError('Project not found.');
        }
      } catch {
        setError('Failed to load project.');
      }

      setLoadingProjectId(null);
    },
    [loadProject, onClose]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      setDeletingProjectId(projectId);
      setError(null);

      try {
        await deleteFromIDB(projectId);
        await fetchProjects();
      } catch {
        setError('Failed to delete project.');
      }

      setDeletingProjectId(null);
    },
    [fetchProjects]
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      try {
        const project = await importProjectFromJSON(file);
        loadProject(project);
        onClose();
      } catch {
        setError('Failed to import project. Please check the file format.');
      }

      setLoading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [loadProject, onClose]
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-[500px] max-w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Saved Projects</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
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

        {/* Body */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full"></div>
              <p className="text-gray-400 mt-2">Loading...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && projects.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-400">No saved projects</p>
              <p className="text-gray-500 text-sm mt-1">
                Create a new project or import an existing one.
              </p>
            </div>
          )}

          {/* Project List */}
          {!loading && projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-700 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {project.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Modified: {formatDate(project.modified)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadProject(project.id)}
                      disabled={loadingProjectId === project.id}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        loadingProjectId === project.id
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {loadingProjectId === project.id ? 'Loading...' : 'Load'}
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deletingProjectId === project.id}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        deletingProjectId === project.id
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {deletingProjectId === project.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".floorplan,.json"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={loading}
            className={`px-4 py-2 rounded transition-colors ${
              loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Import
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
