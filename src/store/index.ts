import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice';
import { createViewerSlice, type ViewerSlice } from './slices/viewerSlice';
import { createAreasSlice, type AreasSlice } from './slices/areasSlice';
import { createAssetsSlice, type AssetsSlice } from './slices/assetsSlice';
import { createLandSlice, type LandSlice } from './slices/landSlice';
import { createSubdivisionSlice, type SubdivisionSlice } from './slices/subdivisionSlice';
import { createSocialClubSlice, type SocialClubSlice } from './slices/socialClubSlice';
import { createFinancialSlice, type FinancialSlice } from './slices/financialSlice';
import { saveToIDB } from '@lib/storage';
import type { InvestmentProject } from '@/models/types';

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
export type FloorplanStore = ProjectSlice & ViewerSlice & AreasSlice & AssetsSlice & LandSlice & SubdivisionSlice & SocialClubSlice & FinancialSlice;

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
      ...createLandSlice(...args),
      ...createSubdivisionSlice(...args),
      ...createSocialClubSlice(...args),
      ...createFinancialSlice(...args),
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
    saveToIDB(project)
      .then(() => {
        // Update lastSaved timestamp after successful save
        useFloorplanStore.setState({ lastSaved: new Date() });
      })
      .catch((error) => {
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

// T058: Subscribe to land parcel changes for automatic subdivision regeneration
useFloorplanStore.subscribe(
  (state, prevState) => {
    // Only regenerate if land parcel dimensions change
    const landChanged = state.landParcel && prevState.landParcel && (
      state.landParcel.width !== prevState.landParcel.width ||
      state.landParcel.height !== prevState.landParcel.height
    );

    // Or if land parcel was just created
    const landCreated = state.landParcel && !prevState.landParcel;

    if ((landChanged || landCreated) && state.landParcel) {
      state.regenerateSubdivisionScenarios(state.landParcel);
    }
  }
);

// T069: Sync investment data (land, subdivision, social club, financial) to project object
// This ensures that changes to investment slices trigger auto-save
useFloorplanStore.subscribe(
  (state, prevState) => {
    const project = state.project;

    // Only sync if we have a project
    if (!project) return;

    // Check if any investment data changed
    const landChanged = state.landParcel !== prevState.landParcel;
    const subdivisionChanged = state.subdivisionScenarios !== prevState.subdivisionScenarios ||
                               state.selectedScenarioId !== prevState.selectedScenarioId;
    const socialClubChanged = state.selectedAmenities !== prevState.selectedAmenities ||
                              state.storageType !== prevState.storageType ||
                              state.customAmenityCosts !== prevState.customAmenityCosts;
    const financialChanged = state.financialAnalysis !== prevState.financialAnalysis ||
                             state.targetProfitMargins !== prevState.targetProfitMargins;

    // If any investment data changed, update the project object
    if (landChanged || subdivisionChanged || socialClubChanged || financialChanged) {
      const investmentProject: InvestmentProject = {
        ...project,
        landParcel: state.landParcel!,
        subdivisionScenarios: state.subdivisionScenarios || [],
        selectedScenarioId: state.selectedScenarioId,
        socialClub: {
          selectedAmenities: state.selectedAmenities,
          storageType: state.storageType,
          customAmenityCosts: state.customAmenityCosts,
        },
        financialAnalysis: state.financialAnalysis!,
        targetProfitMargins: state.targetProfitMargins || [15, 20, 25, 30],
        modified: new Date().toISOString(),
      };

      // Update the project (this will trigger auto-save)
      state.loadProject(investmentProject);
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
export type { LandSlice } from './slices/landSlice';
export type { SubdivisionSlice } from './slices/subdivisionSlice';
export type { SocialClubSlice } from './slices/socialClubSlice';
export type { FinancialSlice } from './slices/financialSlice';

// Expose store on window for E2E testing
if (typeof window !== 'undefined') {
  (window as unknown as { __FLOORPLAN_STORE__: typeof useFloorplanStore }).__FLOORPLAN_STORE__ = useFloorplanStore;
}
