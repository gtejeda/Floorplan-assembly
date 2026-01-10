/**
 * ZIP fallback export for browsers without File System Access API support
 * Uses JSZip to create a ZIP archive with the same directory structure
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { InvestmentProject, ImageReference } from '../models/types';
import { get as idbGet } from 'idb-keyval';
import { sanitizeFileName, getISOTimestamp } from './fileSystemAccess';
import { FileSystemAccessError, FileSystemErrorType } from './fileSystemErrors';

/**
 * Export progress callback type
 */
export type ZipExportProgressCallback = (progress: {
  stage: string;
  current: number;
  total: number;
  message: string;
}) => void;

/**
 * ZIP export result
 */
export interface ZipExportResult {
  success: boolean;
  filename: string;
  sizeBytes: number;
  timestamp: string;
  error?: FileSystemAccessError;
}

/**
 * Add image blob to ZIP archive
 */
async function addImageToZip(
  zip: JSZip,
  folderPath: string,
  image: ImageReference,
  prefix: string = ''
): Promise<boolean> {
  try {
    // Use blobData directly if available, otherwise get from IndexedDB
    const blob = image.blobData || await idbGet<Blob>(image.id);
    if (!blob) {
      console.warn(`Image blob not found for ${image.originalFilename}`);
      return false;
    }

    // Create sanitized filename with optional prefix
    const sanitizedFilename = sanitizeFileName(image.originalFilename);
    const filename = prefix ? `${prefix}_${sanitizedFilename}` : sanitizedFilename;
    const fullPath = `${folderPath}/${filename}`;

    // Add blob to ZIP
    zip.file(fullPath, blob);
    return true;
  } catch (error) {
    console.error(`Failed to add image ${image.originalFilename} to ZIP:`, error);
    return false;
  }
}

/**
 * Create project.json content with image references
 */
function createProjectJSON(project: InvestmentProject): string {
  // Create export data with version info
  const exportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    exportMethod: 'zip',
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

  return JSON.stringify(exportData, null, 2);
}

/**
 * Main ZIP export function - creates ZIP archive with project data and images
 */
export async function exportProjectAsZip(
  project: InvestmentProject,
  onProgress?: ZipExportProgressCallback
): Promise<ZipExportResult> {
  const startTime = Date.now();

  try {
    onProgress?.({
      stage: 'Initializing ZIP export',
      current: 0,
      total: 5,
      message: 'Creating ZIP archive...',
    });

    // Create new ZIP instance
    const zip = new JSZip();

    // Create base project folder
    const sanitizedName = sanitizeFileName(project.name || 'MicroVillasProject');
    const timestamp = getISOTimestamp();
    const projectFolderName = `${sanitizedName}_${timestamp}`;

    onProgress?.({
      stage: 'Adding project data',
      current: 1,
      total: 5,
      message: 'Writing project.json...',
    });

    // Add project.json
    const projectJSON = createProjectJSON(project);
    zip.file(`${projectFolderName}/project.json`, projectJSON);

    onProgress?.({
      stage: 'Creating directory structure',
      current: 2,
      total: 5,
      message: 'Creating asset folders...',
    });

    // Create assets directory structure
    const assetsPath = `${projectFolderName}/assets`;
    const landParcelPath = `${assetsPath}/land-parcel`;
    const lotsPath = `${assetsPath}/lots`;

    // Create empty directories (JSZip needs at least one file in a folder)
    zip.folder(assetsPath);
    zip.folder(landParcelPath);
    zip.folder(lotsPath);

    onProgress?.({
      stage: 'Adding land parcel images',
      current: 3,
      total: 5,
      message: 'Exporting land images...',
    });

    // Add land parcel images
    let imagesAdded = 0;
    if (project.landParcel.images && project.landParcel.images.length > 0) {
      const totalLandImages = project.landParcel.images.length;
      for (let i = 0; i < project.landParcel.images.length; i++) {
        const image = project.landParcel.images[i];
        onProgress?.({
          stage: 'Adding land parcel images',
          current: i + 1,
          total: totalLandImages,
          message: `Adding ${image.originalFilename}...`,
        });

        const added = await addImageToZip(zip, landParcelPath, image);
        if (added) imagesAdded++;
      }
    }

    onProgress?.({
      stage: 'Adding lot images',
      current: 4,
      total: 5,
      message: 'Exporting lot images...',
    });

    // Add lot images from selected scenario
    const selectedScenario = project.subdivisionScenarios.find(
      s => s.id === project.selectedScenarioId
    );

    if (selectedScenario) {
      const lotsWithImages = selectedScenario.lots.filter(lot => lot.images && lot.images.length > 0);
      const totalLotImages = lotsWithImages.reduce((sum, l) => sum + (l.images?.length || 0), 0);
      let processedImages = 0;

      for (const lot of lotsWithImages) {
        if (!lot.images) continue;

        for (let i = 0; i < lot.images.length; i++) {
          const image = lot.images[i];
          processedImages++;

          onProgress?.({
            stage: 'Adding lot images',
            current: processedImages,
            total: totalLotImages,
            message: `Adding ${image.originalFilename} for Lot ${lot.lotNumber}...`,
          });

          const added = await addImageToZip(zip, lotsPath, image, `lot${lot.lotNumber}`);
          if (added) imagesAdded++;
        }
      }
    }

    onProgress?.({
      stage: 'Generating ZIP file',
      current: 5,
      total: 5,
      message: 'Compressing and downloading...',
    });

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        // Progress during ZIP generation
        onProgress?.({
          stage: 'Generating ZIP file',
          current: metadata.percent,
          total: 100,
          message: `Compressing... ${metadata.percent.toFixed(0)}%`,
        });
      }
    );

    // Trigger download
    const zipFilename = `${projectFolderName}.zip`;
    saveAs(zipBlob, zipFilename);

    // Calculate total time
    const duration = (Date.now() - startTime) / 1000;

    onProgress?.({
      stage: 'Complete',
      current: 100,
      total: 100,
      message: `ZIP export completed in ${duration.toFixed(2)} seconds`,
    });

    return {
      success: true,
      filename: zipFilename,
      sizeBytes: zipBlob.size,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const fsError = new FileSystemAccessError(
      FileSystemErrorType.UNKNOWN,
      `ZIP export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error as Error
    );

    return {
      success: false,
      filename: '',
      sizeBytes: 0,
      timestamp: new Date().toISOString(),
      error: fsError,
    };
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
