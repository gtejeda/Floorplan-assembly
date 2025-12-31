import type { StateCreator } from 'zustand';
import type { Area } from '@models/types';
import { generateId } from '@lib/uuid';

// Slice needs access to project state, so we'll type it with a combined interface
interface ProjectState {
  project: {
    areas: Area[];
    modified: string;
  } | null;
}

export interface AreasSlice {
  // Actions
  addArea: (area: Omit<Area, 'id'>) => string;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (id: string) => void;
  duplicateArea: (id: string) => string | null;
  reorderArea: (id: string, newZIndex: number) => void;
}

export const createAreasSlice: StateCreator<
  AreasSlice & ProjectState,
  [],
  [],
  AreasSlice
> = (set, get) => ({
  addArea: (area) => {
    const id = generateId();
    const maxZIndex = get().project?.areas.reduce(
      (max, a) => Math.max(max, a.zIndex),
      0
    ) ?? 0;

    set((state) => {
      if (!state.project) return state;

      const newArea: Area = {
        ...area,
        id,
        zIndex: area.zIndex ?? maxZIndex + 1,
      };

      return {
        project: {
          ...state.project,
          areas: [...state.project.areas, newArea],
          modified: new Date().toISOString(),
        },
      };
    });

    return id;
  },

  updateArea: (id, updates) => {
    set((state) => {
      if (!state.project) return state;

      const area = state.project.areas.find((a) => a.id === id);
      if (!area) return state;

      // Don't allow updates on locked areas unless we're unlocking
      if (area.locked && !('locked' in updates && updates.locked === false)) {
        return state;
      }

      return {
        project: {
          ...state.project,
          areas: state.project.areas.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
          modified: new Date().toISOString(),
        },
      };
    });
  },

  deleteArea: (id) => {
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,
          areas: state.project.areas.filter((a) => a.id !== id),
          modified: new Date().toISOString(),
        },
      };
    });
  },

  duplicateArea: (id) => {
    const state = get();
    if (!state.project) return null;

    const area = state.project.areas.find((a) => a.id === id);
    if (!area) return null;

    const newId = generateId();
    const maxZIndex = state.project.areas.reduce(
      (max, a) => Math.max(max, a.zIndex),
      0
    );

    set((s) => {
      if (!s.project) return s;

      const duplicatedArea: Area = {
        ...area,
        id: newId,
        name: `${area.name} (copy)`,
        x: area.x + 1, // Offset by 1 meter
        y: area.y + 1,
        zIndex: maxZIndex + 1,
        locked: false, // Unlock duplicated area
      };

      return {
        project: {
          ...s.project,
          areas: [...s.project.areas, duplicatedArea],
          modified: new Date().toISOString(),
        },
      };
    });

    return newId;
  },

  reorderArea: (id, newZIndex) => {
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,
          areas: state.project.areas.map((a) =>
            a.id === id ? { ...a, zIndex: newZIndex } : a
          ),
          modified: new Date().toISOString(),
        },
      };
    });
  },
});
