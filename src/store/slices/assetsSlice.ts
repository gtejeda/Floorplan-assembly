import type { StateCreator } from 'zustand';
import type { Asset } from '@models/types';
import { generateId } from '@lib/uuid';

// Slice needs access to project state
interface ProjectState {
  project: {
    assets: Asset[];
    modified: string;
  } | null;
}

export interface AssetsSlice {
  // Actions
  addAsset: (asset: Omit<Asset, 'id'>) => string;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
}

export const createAssetsSlice: StateCreator<
  AssetsSlice & ProjectState,
  [],
  [],
  AssetsSlice
> = (set, get) => ({
  addAsset: (asset) => {
    const id = generateId();
    const maxZIndex = get().project?.assets.reduce(
      (max, a) => Math.max(max, a.zIndex),
      0
    ) ?? 0;

    set((state) => {
      if (!state.project) return state;

      const newAsset: Asset = {
        ...asset,
        id,
        zIndex: asset.zIndex ?? maxZIndex + 1,
      };

      return {
        project: {
          ...state.project,
          assets: [...state.project.assets, newAsset],
          modified: new Date().toISOString(),
        },
      };
    });

    return id;
  },

  updateAsset: (id, updates) => {
    set((state) => {
      if (!state.project) return state;

      const asset = state.project.assets.find((a) => a.id === id);
      if (!asset) return state;

      // Don't allow updates on locked assets unless we're unlocking
      if (asset.locked && !('locked' in updates && updates.locked === false)) {
        return state;
      }

      return {
        project: {
          ...state.project,
          assets: state.project.assets.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
          modified: new Date().toISOString(),
        },
      };
    });
  },

  deleteAsset: (id) => {
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,
          assets: state.project.assets.filter((a) => a.id !== id),
          modified: new Date().toISOString(),
        },
      };
    });
  },
});
