import type { FloorplanStore } from './index';
import type { Area, Asset } from '@models/types';
import { findOverlappingAreas, calculateTotalArea } from '@lib/geometry';

/**
 * Selectors for derived state from the floorplan store
 *
 * IMPORTANT: Selectors that may return empty arrays use stable references
 * to prevent infinite re-render loops in React components.
 */

// Stable empty array references to prevent infinite loops
const EMPTY_AREAS: Area[] = [];
const EMPTY_ASSETS: Asset[] = [];
const EMPTY_OVERLAPS: Array<[string, string, number]> = [];

// Project selectors
export const selectProject = (state: FloorplanStore) => state.project;
export const selectLot = (state: FloorplanStore) => state.project?.lot ?? null;
export const selectAreas = (state: FloorplanStore) => state.project?.areas ?? EMPTY_AREAS;
export const selectAssets = (state: FloorplanStore) => state.project?.assets ?? EMPTY_ASSETS;

// Area statistics selectors
export const selectUsedArea = (state: FloorplanStore): number => {
  const areas = state.project?.areas ?? EMPTY_AREAS;
  return calculateTotalArea(areas);
};

export const selectTotalLotArea = (state: FloorplanStore): number => {
  const lot = state.project?.lot;
  if (!lot) return 0;
  return lot.width * lot.height;
};

export const selectRemainingArea = (state: FloorplanStore): number => {
  return selectTotalLotArea(state) - selectUsedArea(state);
};

export const selectAreaUsagePercentage = (state: FloorplanStore): number => {
  const total = selectTotalLotArea(state);
  if (total === 0) return 0;
  return (selectUsedArea(state) / total) * 100;
};

// Area grouping selectors
export const selectAreasByType = (state: FloorplanStore): Record<string, Area[]> => {
  const areas = state.project?.areas ?? EMPTY_AREAS;
  return areas.reduce<Record<string, Area[]>>((groups, area) => {
    const type = area.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(area);
    return groups;
  }, {});
};

// Overlap detection selector
export const selectOverlappingAreas = (
  state: FloorplanStore
): Array<[string, string, number]> => {
  const areas = state.project?.areas;
  if (!areas || areas.length === 0) return EMPTY_OVERLAPS;
  return findOverlappingAreas(areas);
};

export const selectHasOverlaps = (state: FloorplanStore): boolean => {
  return selectOverlappingAreas(state).length > 0;
};

// Selection selectors
export const selectSelectedIds = (state: FloorplanStore) => state.selectedIds;

export const selectSelectedAreas = (state: FloorplanStore): Area[] => {
  const areas = state.project?.areas;
  if (!areas || areas.length === 0 || state.selectedIds.length === 0) return EMPTY_AREAS;
  return areas.filter((area) => state.selectedIds.includes(area.id));
};

export const selectSelectedAssets = (state: FloorplanStore): Asset[] => {
  const assets = state.project?.assets;
  if (!assets || assets.length === 0 || state.selectedIds.length === 0) return EMPTY_ASSETS;
  return assets.filter((asset) => state.selectedIds.includes(asset.id));
};

export const selectIsSelected = (id: string) => (state: FloorplanStore): boolean => {
  return state.selectedIds.includes(id);
};

// Single entity selectors
export const selectAreaById = (id: string) => (state: FloorplanStore): Area | undefined => {
  return state.project?.areas.find((area) => area.id === id);
};

export const selectAssetById = (id: string) => (state: FloorplanStore): Asset | undefined => {
  return state.project?.assets.find((asset) => asset.id === id);
};

// View state selectors
export const selectActiveView = (state: FloorplanStore) => state.activeView;
export const selectActiveTool = (state: FloorplanStore) => state.activeTool;
export const selectHoveredId = (state: FloorplanStore) => state.hoveredId;
export const selectShowGrid = (state: FloorplanStore) => state.showGrid;
export const selectShowLabels = (state: FloorplanStore) => state.showLabels;

// Canvas state selectors
export const selectCanvas2d = (state: FloorplanStore) => state.canvas2d;
export const selectZoom = (state: FloorplanStore) => state.canvas2d.zoom;
export const selectPan = (state: FloorplanStore) => ({
  x: state.canvas2d.panX,
  y: state.canvas2d.panY,
});

// Camera state selectors
export const selectCamera3d = (state: FloorplanStore) => state.camera3d;
export const selectCameraPosition = (state: FloorplanStore) => state.camera3d.position;
export const selectCameraTarget = (state: FloorplanStore) => state.camera3d.target;

// Sorted areas selector (by zIndex for rendering)
export const selectSortedAreas = (state: FloorplanStore): Area[] => {
  const areas = state.project?.areas;
  if (!areas || areas.length === 0) return EMPTY_AREAS;
  return [...areas].sort((a, b) => a.zIndex - b.zIndex);
};

export const selectSortedAssets = (state: FloorplanStore): Asset[] => {
  const assets = state.project?.assets;
  if (!assets || assets.length === 0) return EMPTY_ASSETS;
  return [...assets].sort((a, b) => a.zIndex - b.zIndex);
};
