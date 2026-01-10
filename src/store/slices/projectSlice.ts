import type { StateCreator } from 'zustand';
import type { Project, InvestmentProject, Lot } from '@models/types';
import { generateId } from '@lib/uuid';
import { saveToIDB, exportProjectAsJSON, importProjectFromJSON } from '@lib/storage';

export interface ProjectSlice {
  project: Project | InvestmentProject | null;
  isSaving: boolean;
  lastSaveError: string | null;
  lastSaved: Date | null;

  // Actions
  createProject: (name: string, lot?: Partial<Lot>) => void;
  loadProject: (project: Project | InvestmentProject) => void;
  updateLot: (updates: Partial<Lot>) => void;
  updateProjectName: (name: string) => void;
  saveProject: () => Promise<void>;
  exportProject: () => string;
  exportProjectToFile: (filename?: string) => void;
  importProject: (json: string) => void;
  importProjectFromFile: (file: File) => Promise<void>;
}

export const createProjectSlice: StateCreator<
  ProjectSlice,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  project: null,
  isSaving: false,
  lastSaveError: null,
  lastSaved: null,

  createProject: (name, lotOverrides) => {
    const now = new Date().toISOString();
    const defaultLot: Lot = {
      width: 50,
      height: 30,
      gridSize: 1.0,
      unit: 'meters',
      description: '',
    };

    set({
      project: {
        id: generateId(),
        name,
        version: '1.0.0',
        created: now,
        modified: now,
        lot: { ...defaultLot, ...lotOverrides },
        areas: [],
        assets: [],
      },
    });
  },

  loadProject: (project) => {
    set({ project });
  },

  updateLot: (updates) => {
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,
          lot: { ...state.project.lot, ...updates },
          modified: new Date().toISOString(),
        },
      };
    });
  },

  updateProjectName: (name) => {
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,
          name,
          modified: new Date().toISOString(),
        },
      };
    });
  },

  saveProject: async () => {
    const project = get().project;
    if (!project) return;

    set({ isSaving: true, lastSaveError: null });

    try {
      const updatedProject = {
        ...project,
        modified: new Date().toISOString(),
      };
      await saveToIDB(updatedProject);
      set({ project: updatedProject, isSaving: false, lastSaved: new Date() });
    } catch (error) {
      set({
        isSaving: false,
        lastSaveError: error instanceof Error ? error.message : 'Failed to save project',
      });
    }
  },

  exportProject: () => {
    const project = get().project;
    if (!project) return '{}';

    return JSON.stringify({
      id: project.id,
      name: project.name,
      version: project.version,
      created: project.created,
      modified: project.modified,
      lot: project.lot,
      areas: project.areas,
      assets: project.assets,
    });
  },

  exportProjectToFile: (filename?: string) => {
    const project = get().project;
    if (!project) return;

    exportProjectAsJSON(project, filename);
  },

  importProject: (json: string) => {
    const parsed = JSON.parse(json) as Project;
    const now = new Date().toISOString();

    const newProject: Project = {
      ...parsed,
      id: generateId(),
      created: now,
      modified: now,
      areas: parsed.areas.map((area) => ({
        ...area,
        id: generateId(),
      })),
      assets: parsed.assets.map((asset) => ({
        ...asset,
        id: generateId(),
      })),
    };

    set({ project: newProject });
  },

  importProjectFromFile: async (file: File) => {
    const imported = await importProjectFromJSON(file);
    const now = new Date().toISOString();

    const newProject: Project = {
      ...imported,
      id: generateId(),
      created: now,
      modified: now,
      areas: imported.areas.map((area) => ({
        ...area,
        id: generateId(),
      })),
      assets: imported.assets.map((asset) => ({
        ...asset,
        id: generateId(),
      })),
    };

    set({ project: newProject });
  },
});
