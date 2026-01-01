import type { StateCreator } from 'zustand';
import type { Asset, Area } from '@models/types';
import { generateId } from '@lib/uuid';

// Slice needs access to project state
interface ProjectState {
  project: {
    assets: Asset[];
    areas: Area[];
    modified: string;
  } | null;
}

export interface AssetsSlice {
  // Project-level asset actions
  addAsset: (asset: Omit<Asset, 'id'>) => string;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Area-specific asset actions
  addAssetToArea: (areaId: string, asset: Omit<Asset, 'id'>) => string;
  updateAssetInArea: (areaId: string, assetId: string, updates: Partial<Asset>) => void;
  deleteAssetFromArea: (areaId: string, assetId: string) => void;
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

  // Area-specific asset methods
  addAssetToArea: (areaId, asset) => {
    const id = generateId();

    set((state) => {
      if (!state.project) return state;

      const area = state.project.areas.find((a) => a.id === areaId);
      if (!area) return state;

      const maxZIndex = (area.assets ?? []).reduce(
        (max, a) => Math.max(max, a.zIndex),
        0
      );

      const newAsset: Asset = {
        ...asset,
        id,
        zIndex: asset.zIndex ?? maxZIndex + 1,
      };

      return {
        project: {
          ...state.project,
          areas: state.project.areas.map((a) =>
            a.id === areaId
              ? { ...a, assets: [...(a.assets ?? []), newAsset] }
              : a
          ),
          modified: new Date().toISOString(),
        },
      };
    });

    return id;
  },

  updateAssetInArea: (areaId, assetId, updates) => {
    set((state) => {
      if (!state.project) return state;

      const area = state.project.areas.find((a) => a.id === areaId);
      if (!area) return state;

      const asset = (area.assets ?? []).find((a) => a.id === assetId);
      if (!asset) return state;

      // Don't allow updates on locked assets unless we're unlocking
      if (asset.locked && !('locked' in updates && updates.locked === false)) {
        return state;
      }

      return {
        project: {
          ...state.project,
          areas: state.project.areas.map((a) =>
            a.id === areaId
              ? {
                  ...a,
                  assets: (a.assets ?? []).map((ast) =>
                    ast.id === assetId ? { ...ast, ...updates } : ast
                  ),
                }
              : a
          ),
          modified: new Date().toISOString(),
        },
      };
    });
  },

  deleteAssetFromArea: (areaId, assetId) => {
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,
          areas: state.project.areas.map((a) =>
            a.id === areaId
              ? { ...a, assets: (a.assets ?? []).filter((ast) => ast.id !== assetId) }
              : a
          ),
          modified: new Date().toISOString(),
        },
      };
    });
  },
});
