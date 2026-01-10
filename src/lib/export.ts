/**
 * Project export functionality using File System Access API
 * Exports InvestmentProject data to a directory structure with JSON and image files
 */

import type { InvestmentProject, ImageReference } from '../models/types';
import {
  showDirectoryPicker,
  verifyDirectoryWritePermission,
  getOrCreateDirectoryHandle,
  getOrCreateFileHandle,
  writeTextFile,
  writeBlobFile,
  sanitizeFileName,
  getISOTimestamp,
  isFileSystemAccessSupported,
} from './fileSystemAccess';
import { FileSystemAccessError, FileSystemErrorType } from './fileSystemErrors';
import { get as idbGet } from 'idb-keyval';

/**
 * Export progress callback type
 */
export type ExportProgressCallback = (progress: {
  stage: string;
  current: number;
  total: number;
  message: string;
}) => void;

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  directoryName: string;
  filesCreated: number;
  timestamp: string;
  error?: FileSystemAccessError;
}

/**
 * Check if browser supports File System Access API
 * Returns false for Firefox/Safari which need ZIP fallback
 */
export function shouldUseZipFallback(): boolean {
  // Check if API is supported
  if (!isFileSystemAccessSupported()) {
    return true;
  }

  // Additional browser detection for Firefox/Safari
  const userAgent = navigator.userAgent.toLowerCase();
  const isFirefox = userAgent.includes('firefox');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');

  return isFirefox || isSafari;
}

/**
 * Create project directory with sanitized name
 */
async function createProjectDirectory(
  parentHandle: FileSystemDirectoryHandle,
  projectName: string
): Promise<FileSystemDirectoryHandle> {
  const sanitizedName = sanitizeFileName(projectName || 'MicroVillasProject');
  const timestamp = getISOTimestamp();
  const directoryName = `${sanitizedName}_${timestamp}`;

  return await getOrCreateDirectoryHandle(parentHandle, directoryName);
}

/**
 * Write project.json file with complete project data
 */
async function writeProjectJSON(
  projectHandle: FileSystemDirectoryHandle,
  project: InvestmentProject
): Promise<void> {
  const fileHandle = await getOrCreateFileHandle(projectHandle, 'project.json');

  // Create export data with version info
  const exportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    project: {
      ...project,
      // Remove blob data from images - we'll export these as separate files
      landParcel: {
        ...project.landParcel,
        images: project.landParcel.images.map(img => ({
          id: img.id,
          originalFilename: img.originalFilename,
          blobData: null, // Remove blob data from export
          uploadedAt: img.uploadedAt,
          sizeBytes: img.sizeBytes,
          mimeType: img.mimeType,
        })),
      },
      subdivisionScenarios: project.subdivisionScenarios.map(scenario => ({
        ...scenario,
        lots: scenario.lots.map(lot => ({
          ...lot,
          images: lot.images?.map(img => ({
            id: img.id,
            originalFilename: img.originalFilename,
            blobData: null,
            uploadedAt: img.uploadedAt,
            sizeBytes: img.sizeBytes,
            mimeType: img.mimeType,
          })) || [],
        })),
      })),
    },
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  await writeTextFile(fileHandle, jsonContent);
}

/**
 * Create assets directory structure (assets/land-parcel/ and assets/lots/)
 */
async function createAssetsDirectories(
  projectHandle: FileSystemDirectoryHandle
): Promise<{
  assetsHandle: FileSystemDirectoryHandle;
  landParcelHandle: FileSystemDirectoryHandle;
  lotsHandle: FileSystemDirectoryHandle;
}> {
  const assetsHandle = await getOrCreateDirectoryHandle(projectHandle, 'assets');
  const landParcelHandle = await getOrCreateDirectoryHandle(assetsHandle, 'land-parcel');
  const lotsHandle = await getOrCreateDirectoryHandle(assetsHandle, 'lots');

  return { assetsHandle, landParcelHandle, lotsHandle };
}

/**
 * Extract and write a single image blob to file
 */
async function writeImageToFile(
  directoryHandle: FileSystemDirectoryHandle,
  image: ImageReference,
  prefix: string = ''
): Promise<void> {
  // Use blobData directly if available, otherwise get from IndexedDB
  const blob = image.blobData || await idbGet<Blob>(image.id);
  if (!blob) {
    console.warn(`Image blob not found for ${image.originalFilename}`);
    return;
  }

  // Create sanitized filename with optional prefix
  const sanitizedFilename = sanitizeFileName(image.originalFilename);
  const filename = prefix ? `${prefix}_${sanitizedFilename}` : sanitizedFilename;

  // Write blob to file
  const fileHandle = await getOrCreateFileHandle(directoryHandle, filename);
  await writeBlobFile(fileHandle, blob);
}

/**
 * Extract all image blobs from IndexedDB and write as files
 */
async function extractBlobsToFiles(
  project: InvestmentProject,
  landParcelHandle: FileSystemDirectoryHandle,
  lotsHandle: FileSystemDirectoryHandle,
  onProgress?: ExportProgressCallback
): Promise<number> {
  let filesWritten = 0;

  // Export land parcel images
  if (project.landParcel.images && project.landParcel.images.length > 0) {
    const totalLandImages = project.landParcel.images.length;
    for (let i = 0; i < project.landParcel.images.length; i++) {
      const image = project.landParcel.images[i];
      onProgress?.({
        stage: 'Exporting land parcel images',
        current: i + 1,
        total: totalLandImages,
        message: `Exporting ${image.originalFilename}...`,
      });

      try {
        await writeImageToFile(landParcelHandle, image);
        filesWritten++;
      } catch (error) {
        console.error(`Failed to export land image ${image.originalFilename}:`, error);
      }
    }
  }

  // Export lot images from all scenarios
  const selectedScenario = project.subdivisionScenarios.find(
    s => s.id === project.selectedScenarioId
  );

  if (selectedScenario) {
    const lotsWithImages = selectedScenario.lots.filter(lot => lot.images && lot.images.length > 0);
    let processedLots = 0;

    for (const lot of lotsWithImages) {
      if (!lot.images) continue;

      for (let i = 0; i < lot.images.length; i++) {
        const image = lot.images[i];
        onProgress?.({
          stage: 'Exporting lot images',
          current: processedLots + i + 1,
          total: lotsWithImages.reduce((sum, l) => sum + (l.images?.length || 0), 0),
          message: `Exporting ${image.originalFilename} for Lot ${lot.lotNumber}...`,
        });

        try {
          await writeImageToFile(lotsHandle, image, `lot${lot.lotNumber}`);
          filesWritten++;
        } catch (error) {
          console.error(`Failed to export lot image ${image.originalFilename}:`, error);
        }
      }

      processedLots++;
    }
  }

  return filesWritten;
}

/**
 * Main export function - coordinates all export steps
 */
export async function exportProject(
  project: InvestmentProject,
  onProgress?: ExportProgressCallback
): Promise<ExportResult> {
  const startTime = Date.now();

  try {
    onProgress?.({
      stage: 'Initializing export',
      current: 0,
      total: 5,
      message: 'Opening directory picker...',
    });

    // Step 1: Show directory picker
    const parentDirectoryHandle = await showDirectoryPicker({
      mode: 'readwrite',
    } as DirectoryPickerOptions);

    onProgress?.({
      stage: 'Verifying permissions',
      current: 1,
      total: 5,
      message: 'Checking write permissions...',
    });

    // Step 2: Verify write permission
    const hasPermission = await verifyDirectoryWritePermission(parentDirectoryHandle);
    if (!hasPermission) {
      throw new FileSystemAccessError(
        FileSystemErrorType.PERMISSION_DENIED,
        'Write permission denied for selected directory'
      );
    }

    onProgress?.({
      stage: 'Creating project directory',
      current: 2,
      total: 5,
      message: 'Creating project folder...',
    });

    // Step 3: Create project directory
    const projectHandle = await createProjectDirectory(
      parentDirectoryHandle,
      project.name || 'MicroVillasProject'
    );

    onProgress?.({
      stage: 'Writing project data',
      current: 3,
      total: 5,
      message: 'Writing project.json...',
    });

    // Step 4: Write project.json
    await writeProjectJSON(projectHandle, project);

    onProgress?.({
      stage: 'Creating asset directories',
      current: 4,
      total: 5,
      message: 'Creating asset folders...',
    });

    // Step 5: Create assets directories
    const { landParcelHandle, lotsHandle } = await createAssetsDirectories(projectHandle);

    onProgress?.({
      stage: 'Exporting images',
      current: 5,
      total: 5,
      message: 'Exporting images...',
    });

    // Step 6: Extract and write image blobs
    const imageFilesWritten = await extractBlobsToFiles(
      project,
      landParcelHandle,
      lotsHandle,
      onProgress
    );

    // Calculate total time
    const duration = (Date.now() - startTime) / 1000;

    onProgress?.({
      stage: 'Complete',
      current: 5,
      total: 5,
      message: `Export completed in ${duration.toFixed(2)} seconds`,
    });

    return {
      success: true,
      directoryName: projectHandle.name,
      filesCreated: 1 + imageFilesWritten, // 1 for project.json + images
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const fsError = FileSystemAccessError.fromError(error as Error);

    return {
      success: false,
      directoryName: '',
      filesCreated: 0,
      timestamp: new Date().toISOString(),
      error: fsError,
    };
  }
}

/**
 * Validate export directory structure before proceeding
 */
export async function validateExportDirectory(
  directoryHandle: FileSystemDirectoryHandle
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Check if we can write to directory
    const hasPermission = await verifyDirectoryWritePermission(directoryHandle);
    if (!hasPermission) {
      errors.push('No write permission for selected directory');
    }
  } catch (error) {
    errors.push('Failed to verify directory permissions');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
