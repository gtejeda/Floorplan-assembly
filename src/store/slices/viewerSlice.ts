import type { StateCreator } from 'zustand';
import type {
  ViewMode,
  Tool,
  Canvas2DState,
  Camera3DState,
  Vector3,
  DisplayUnit,
} from '@models/types';
import { clamp } from '@lib/coordinates';

// Stable empty array to prevent infinite re-render loops
const EMPTY_SELECTION: string[] = [];

export interface ViewerSlice {
  // View state
  activeView: ViewMode;
  selectedIds: string[];
  hoveredId: string | null;
  activeTool: Tool;

  // Canvas 2D state
  canvas2d: Canvas2DState;

  // Camera 3D state
  camera3d: Camera3DState;

  // UI state
  showGrid: boolean;
  showLabels: boolean;
  showTooltips: boolean;
  displayUnit: DisplayUnit;

  // View actions
  setActiveView: (view: ViewMode) => void;
  setActiveTool: (tool: Tool) => void;
  setHoveredId: (id: string | null) => void;

  // Selection actions
  select: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;

  // Canvas 2D actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;

  // Camera 3D actions
  setCameraPosition: (position: Vector3) => void;
  setCameraTarget: (target: Vector3) => void;

  // UI actions
  toggleGrid: () => void;
  toggleLabels: () => void;
  toggleTooltips: () => void;
  setDisplayUnit: (unit: DisplayUnit) => void;
  toggleDisplayUnit: () => void;
}

const defaultCanvas2d: Canvas2DState = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
};

const defaultCamera3d: Camera3DState = {
  position: { x: 0, y: 50, z: -50 },
  target: { x: 0, y: 0, z: 0 },
  fov: 45,
};

export const createViewerSlice: StateCreator<
  ViewerSlice,
  [],
  [],
  ViewerSlice
> = (set) => ({
  activeView: '2d',
  selectedIds: EMPTY_SELECTION,
  hoveredId: null,
  activeTool: 'select',
  canvas2d: defaultCanvas2d,
  camera3d: defaultCamera3d,
  showGrid: true,
  showLabels: true,
  showTooltips: true,
  displayUnit: 'meters',

  // View actions
  setActiveView: (view) => set({ activeView: view }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setHoveredId: (id) => set({ hoveredId: id }),

  // Selection actions
  select: (ids) => set({ selectedIds: ids }),

  addToSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds
        : [...state.selectedIds, id],
    })),

  removeFromSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((existingId) => existingId !== id),
    })),

  clearSelection: () => set({ selectedIds: EMPTY_SELECTION }),

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((existingId) => existingId !== id)
        : [...state.selectedIds, id],
    })),

  // Canvas 2D actions
  setZoom: (zoom) =>
    set((state) => ({
      canvas2d: {
        ...state.canvas2d,
        zoom: clamp(zoom, 0.1, 10.0),
      },
    })),

  setPan: (x, y) =>
    set((state) => ({
      canvas2d: {
        ...state.canvas2d,
        panX: x,
        panY: y,
      },
    })),

  resetView: () =>
    set({
      canvas2d: defaultCanvas2d,
    }),

  // Camera 3D actions
  setCameraPosition: (position) =>
    set((state) => ({
      camera3d: {
        ...state.camera3d,
        position,
      },
    })),

  setCameraTarget: (target) =>
    set((state) => ({
      camera3d: {
        ...state.camera3d,
        target,
      },
    })),

  // UI actions
  toggleGrid: () =>
    set((state) => ({
      showGrid: !state.showGrid,
    })),

  toggleLabels: () =>
    set((state) => ({
      showLabels: !state.showLabels,
    })),

  toggleTooltips: () =>
    set((state) => ({
      showTooltips: !state.showTooltips,
    })),

  setDisplayUnit: (unit) => set({ displayUnit: unit }),

  toggleDisplayUnit: () =>
    set((state) => ({
      displayUnit: state.displayUnit === 'meters' ? 'feet' : 'meters',
    })),
});
