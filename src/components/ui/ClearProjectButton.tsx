import { useState, useCallback } from 'react';
import { useFloorplanStore } from '@store/index';
import { clearAllProjects } from '@lib/storage';

/**
 * Clear Project Button with Confirmation Dialog
 * Allows users to clear all project data from IndexedDB and reset to a fresh state
 * Per spec FR-025
 */
export function ClearProjectButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const createProject = useFloorplanStore((state) => state.createProject);

  const handleClearProject = useCallback(async () => {
    setIsClearing(true);
    try {
      // Clear all data from IndexedDB
      await clearAllProjects();

      // Create a fresh project
      createProject('New Floorplan', {
        width: 50,
        height: 30,
        gridSize: 1.0,
        unit: 'meters',
        description: '',
      });

      // Close dialog
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Failed to clear project:', error);
      alert('Failed to clear project data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  }, [createProject]);

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        title="Clear all project data and start fresh"
      >
        Clear Project
      </button>

      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => !isClearing && setIsConfirmOpen(false)}
        >
          <div
            className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Clear Project Data?</h2>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              This will permanently delete all project data, including:
            </p>

            <ul className="list-disc list-inside text-gray-400 space-y-1 mb-6 ml-2">
              <li>All saved projects</li>
              <li>Land parcel configurations</li>
              <li>Subdivision scenarios</li>
              <li>Financial analysis data</li>
              <li>Uploaded images</li>
            </ul>

            <p className="text-red-400 text-sm mb-6 font-semibold">
              ⚠️ This action cannot be undone. Make sure you have exported any important data before proceeding.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isClearing}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleClearProject}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear All Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
