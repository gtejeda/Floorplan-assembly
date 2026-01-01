import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice';
import { createViewerSlice, type ViewerSlice } from './slices/viewerSlice';
import { createAreasSlice, type AreasSlice } from './slices/areasSlice';
import { createAssetsSlice, type AssetsSlice } from './slices/assetsSlice';
import { saveToIDB } from '@lib/storage';

// Simple debounce implementation
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// Combined store type
export type FloorplanStore = ProjectSlice & ViewerSlice & AreasSlice & AssetsSlice;

// Partialized state type for temporal
type PartializedState = {
  project: FloorplanStore['project'];
};

// Create the store with temporal middleware for undo/redo
export const useFloorplanStore = create<FloorplanStore>()(
  temporal(
    (...args) => ({
      ...createProjectSlice(...args),
      ...createViewerSlice(...args),
      ...createAreasSlice(...args),
      ...createAssetsSlice(...args),
    }),
    {
      // Only track project-related state for undo/redo
      partialize: (state): PartializedState => ({
        project: state.project,
      }),
      // Limit history to 50 states
      limit: 50,
    }
  )
);

// Auto-save functionality with 500ms debounce
const debouncedSave = debounce((project: FloorplanStore['project']) => {
  if (project) {
    saveToIDB(project).catch((error) => {
      console.error('Auto-save failed:', error);
    });
  }
}, 500);

// Subscribe to project changes for auto-save
useFloorplanStore.subscribe(
  (state, prevState) => {
    // Only trigger auto-save when project data changes
    if (state.project !== prevState.project && state.project) {
      debouncedSave(state.project);
    }
  }
);

// Get temporal store for undo/redo
const temporalStore = useFloorplanStore.temporal;

// Convenience hooks for undo/redo
export const useUndo = () => {
  const undo = temporalStore.getState().undo;
  return undo;
};

export const useRedo = () => {
  const redo = temporalStore.getState().redo;
  return redo;
};

export const useCanUndo = () => {
  return useStoreWithEqualityFn(
    temporalStore,
    (state: TemporalState<PartializedState>) => state.pastStates.length > 0
  );
};

export const useCanRedo = () => {
  return useStoreWithEqualityFn(
    temporalStore,
    (state: TemporalState<PartializedState>) => state.futureStates.length > 0
  );
};

// Re-export types
export type { ProjectSlice } from './slices/projectSlice';
export type { ViewerSlice } from './slices/viewerSlice';
export type { AreasSlice } from './slices/areasSlice';
export type { AssetsSlice } from './slices/assetsSlice';

// Expose store on window for E2E testing
if (typeof window !== 'undefined') {
  (window as unknown as { __FLOORPLAN_STORE__: typeof useFloorplanStore }).__FLOORPLAN_STORE__ = useFloorplanStore;
}
