/**
 * Storage utilities for IndexedDB operations and file handling
 */
import { get, set, del, keys, type UseStore } from 'idb-keyval';
import type { Project } from '@models/types';

// Database configuration
const DB_NAME = 'floorplan-assembly';
const PROJECTS_STORE = 'projects';
const ASSETS_STORE = 'assets';

// Custom store for projects
let projectStore: UseStore | null = null;
let assetStore: UseStore | null = null;

// Lazy initialization of stores
async function getProjectStore(): Promise<UseStore> {
  if (!projectStore) {
    const { createStore } = await import('idb-keyval');
    projectStore = createStore(DB_NAME, PROJECTS_STORE);
  }
  return projectStore;
}

async function getAssetStore(): Promise<UseStore> {
  if (!assetStore) {
    const { createStore } = await import('idb-keyval');
    assetStore = createStore(DB_NAME, ASSETS_STORE);
  }
  return assetStore;
}

// ==================== Project Storage ====================

/**
 * Save a project to IndexedDB
 */
export async function saveToIDB(project: Project): Promise<void> {
  const store = await getProjectStore();
  await set(project.id, project, store);
}

/**
 * Load a project from IndexedDB by ID
 */
export async function loadFromIDB(id: string): Promise<Project | undefined> {
  const store = await getProjectStore();
  return get<Project>(id, store);
}

/**
 * Delete a project from IndexedDB
 */
export async function deleteFromIDB(id: string): Promise<void> {
  const store = await getProjectStore();
  await del(id, store);

  // Also delete associated asset blobs
  await deleteProjectAssets(id);
}

/**
 * List all project IDs and names
 */
export async function listProjects(): Promise<{ id: string; name: string; modified: string }[]> {
  const store = await getProjectStore();
  const allKeys = await keys<string>(store);

  const projects: { id: string; name: string; modified: string }[] = [];

  for (const key of allKeys) {
    const project = await get<Project>(key, store);
    if (project) {
      projects.push({
        id: project.id,
        name: project.name,
        modified: project.modified,
      });
    }
  }

  // Sort by modified date, newest first
  return projects.sort((a, b) =>
    new Date(b.modified).getTime() - new Date(a.modified).getTime()
  );
}

/**
 * Get the most recently modified project
 */
export async function getLastProject(): Promise<Project | undefined> {
  const projects = await listProjects();
  if (projects.length === 0) return undefined;

  return loadFromIDB(projects[0].id);
}

// ==================== Asset Blob Storage ====================

/**
 * Save an asset blob to IndexedDB
 */
export async function saveAssetBlob(assetId: string, projectId: string, blob: Blob): Promise<void> {
  const store = await getAssetStore();
  await set(`${projectId}:${assetId}`, blob, store);
}

/**
 * Load an asset blob from IndexedDB
 */
export async function loadAssetBlob(assetId: string, projectId: string): Promise<Blob | undefined> {
  const store = await getAssetStore();
  return get<Blob>(`${projectId}:${assetId}`, store);
}

/**
 * Delete an asset blob from IndexedDB
 */
export async function deleteAssetBlob(assetId: string, projectId: string): Promise<void> {
  const store = await getAssetStore();
  await del(`${projectId}:${assetId}`, store);
}

/**
 * Delete all asset blobs for a project
 */
async function deleteProjectAssets(projectId: string): Promise<void> {
  const store = await getAssetStore();
  const allKeys = await keys<string>(store);

  for (const key of allKeys) {
    if (key.startsWith(`${projectId}:`)) {
      await del(key, store);
    }
  }
}

// ==================== File Reading ====================

/**
 * Read a file as a data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a file as an ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Create object URL from a blob
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL to free memory
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// ==================== Export/Import ====================

/**
 * Export project as JSON file download
 */
export function exportProjectAsJSON(project: Project, filename?: string): void {
  const json = JSON.stringify(
    {
      version: project.version,
      project: {
        id: project.id,
        name: project.name,
        created: project.created,
        modified: project.modified,
      },
      lot: project.lot,
      areas: project.areas,
      assets: project.assets.map(asset => ({
        ...asset,
        // Don't include sourceUrl in export - assets should be re-imported
        sourceUrl: undefined,
      })),
    },
    null,
    2
  );

  const blob = new Blob([json], { type: 'application/json' });
  const url = createBlobUrl(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${project.name}.floorplan`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  revokeBlobUrl(url);
}

/**
 * Import project from JSON file
 */
export async function importProjectFromJSON(file: File): Promise<Project> {
  const text = await readFileAsText(file);
  const data = JSON.parse(text);

  // Validate basic structure
  if (!data.project || !data.lot) {
    throw new Error('Invalid project file format');
  }

  // Reconstruct project
  const project: Project = {
    id: data.project.id,
    name: data.project.name,
    version: data.version || '1.0.0',
    created: data.project.created,
    modified: new Date().toISOString(),
    lot: data.lot,
    areas: data.areas || [],
    assets: (data.assets || []).map((asset: Record<string, unknown>) => ({
      ...asset,
      sourceUrl: '', // Will need to be re-imported
    })),
  };

  return project;
}

// ==================== Image Utilities ====================

/**
 * Load an image and get its natural dimensions
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/**
 * Check if a file is a supported image type
 */
export function isSupportedImage(file: File): boolean {
  const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  return supportedTypes.includes(file.type);
}

/**
 * Check if a file is a supported 3D model type
 */
export function isSupportedModel(file: File): boolean {
  const supportedTypes = ['model/gltf+json', 'model/gltf-binary'];
  const supportedExtensions = ['.gltf', '.glb'];

  return (
    supportedTypes.includes(file.type) ||
    supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  );
}

/**
 * Get asset type from file
 */
export function getAssetTypeFromFile(file: File): 'image' | 'model' | null {
  if (isSupportedImage(file)) return 'image';
  if (isSupportedModel(file)) return 'model';
  return null;
}
