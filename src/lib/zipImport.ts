/**
 * ZIP fallback import for browsers without File System Access API support
 * Uses JSZip to extract project data and images from ZIP archive
 */

import JSZip from 'jszip';
import type { InvestmentProject, ImageReference } from '../models/types';
import { set as idbSet } from 'idb-keyval';
import { FileSystemAccessError, FileSystemErrorType } from './fileSystemErrors';
import {
  detectCorruptedFields,
  partialRecovery,
  type FieldValidationError,
  type ImportProgressCallback,
  type PartialRecoveryOptions,
} from './import';

/**
 * ZIP import result
 */
export interface ZipImportResult {
  success: boolean;
  filename: string;
  filesLoaded: number;
  timestamp: string;
  project?: InvestmentProject;
  validationErrors?: FieldValidationError[];
  partialRecovery?: boolean;
  missingImages?: string[];
  error?: FileSystemAccessError;
}

/**
 * Exported project data structure (from zipExport.ts)
 */
interface ExportedProjectData {
  version: string;
  exportDate: string;
  exportMethod?: string;
  project: InvestmentProject;
}

/**
 * Validate project.json version compatibility
 */
function validateVersion(version: string): boolean {
  // Currently only version 1.0.0 is supported
  return version === '1.0.0';
}

/**
 * Extract and parse project.json from ZIP
 */
async function extractProjectJSON(
  zip: JSZip,
  projectFolderName: string
): Promise<ExportedProjectData> {
  try {
    const projectJSONPath = `${projectFolderName}/project.json`;
    const file = zip.file(projectJSONPath);

    if (!file) {
      throw new FileSystemAccessError(
        FileSystemErrorType.FILE_NOT_FOUND,
        'project.json not found in ZIP archive'
      );
    }

    const jsonText = await file.async('text');
    const data = JSON.parse(jsonText) as ExportedProjectData;

    // Validate version
    if (!validateVersion(data.version)) {
      throw new FileSystemAccessError(
        FileSystemErrorType.NOT_SUPPORTED,
        `Unsupported project version: ${data.version}. Only version 1.0.0 is supported.`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new FileSystemAccessError(
        FileSystemErrorType.NOT_SUPPORTED,
        'Invalid JSON in project.json file',
        error
      );
    }
    throw error;
  }
}

/**
 * Load images from ZIP archive
 */
async function loadImagesFromZip(
  zip: JSZip,
  projectFolderName: string,
  subdirectory: 'land-parcel' | 'lots',
  imageReferences: ImageReference[],
  onProgress?: ImportProgressCallback
): Promise<{ loaded: ImageReference[]; missing: string[] }> {
  const loaded: ImageReference[] = [];
  const missing: string[] = [];

  const assetsPath = `${projectFolderName}/assets/${subdirectory}`;

  for (let i = 0; i < imageReferences.length; i++) {
    const imageRef = imageReferences[i];

    onProgress?.({
      stage: `Loading ${subdirectory} images`,
      current: i + 1,
      total: imageReferences.length,
      message: `Loading ${imageRef.originalFilename}...`,
    });

    try {
      // Try to find the file in ZIP
      let zipFile: JSZip.JSZipObject | null = null;

      // Try exact filename first
      const exactPath = `${assetsPath}/${imageRef.originalFilename}`;
      zipFile = zip.file(exactPath);

      // If not found and this is lots directory, try with lot prefix pattern
      if (!zipFile && subdirectory === 'lots') {
        // Search all files in the lots directory
        const lotsFiles = zip.folder(assetsPath);
        if (lotsFiles) {
          lotsFiles.forEach((relativePath, file) => {
            if (relativePath.endsWith(imageRef.originalFilename)) {
              zipFile = file;
            }
          });
        }
      }

      if (!zipFile) {
        missing.push(imageRef.originalFilename);
        // Create placeholder reference
        loaded.push({
          ...imageRef,
          blobData: null,
          _isMissing: true,
        } as any);
        continue;
      }

      // Extract blob from ZIP
      const blob = await zipFile.async('blob');

      // Store blob in IndexedDB
      await idbSet(imageRef.id, blob);

      // Add to loaded references with blob data
      loaded.push({
        ...imageRef,
        blobData: blob,
      });
    } catch (error) {
      console.error(`Failed to load image ${imageRef.originalFilename} from ZIP:`, error);
      missing.push(imageRef.originalFilename);
      // Create placeholder reference
      loaded.push({
        ...imageRef,
        blobData: null,
        _isMissing: true,
      } as any);
    }
  }

  return { loaded, missing };
}

/**
 * Import all assets (images) from ZIP archive
 */
async function importAssetsFromZip(
  zip: JSZip,
  projectFolderName: string,
  project: InvestmentProject,
  onProgress?: ImportProgressCallback
): Promise<{ project: InvestmentProject; missingImages: string[] }> {
  const missingImages: string[] = [];

  // Load land parcel images
  if (project.landParcel.images && project.landParcel.images.length > 0) {
    onProgress?.({
      stage: 'Loading land parcel images',
      current: 1,
      total: 2,
      message: `Loading ${project.landParcel.images.length} land parcel images...`,
    });

    const landResult = await loadImagesFromZip(
      zip,
      projectFolderName,
      'land-parcel',
      project.landParcel.images,
      onProgress
    );

    project.landParcel.images = landResult.loaded;
    missingImages.push(...landResult.missing);
  }

  // Load lot images from all scenarios
  let totalLotImages = 0;
  for (const scenario of project.subdivisionScenarios) {
    for (const lot of scenario.lots) {
      if (lot.images) {
        totalLotImages += lot.images.length;
      }
    }
  }

  if (totalLotImages > 0) {
    onProgress?.({
      stage: 'Loading lot images',
      current: 2,
      total: 2,
      message: `Loading ${totalLotImages} lot images...`,
    });

    for (const scenario of project.subdivisionScenarios) {
      for (const lot of scenario.lots) {
        if (lot.images && lot.images.length > 0) {
          const lotResult = await loadImagesFromZip(
            zip,
            projectFolderName,
            'lots',
            lot.images,
            onProgress
          );

          lot.images = lotResult.loaded;
          missingImages.push(...lotResult.missing);
        }
      }
    }
  }

  return { project, missingImages };
}

/**
 * Find the project folder name in ZIP archive
 * The ZIP structure is: {projectName}_{timestamp}/project.json
 */
async function findProjectFolderInZip(zip: JSZip): Promise<string> {
  const files = Object.keys(zip.files);

  // Look for project.json in any top-level folder
  for (const path of files) {
    if (path.endsWith('/project.json')) {
      // Extract folder name (everything before /project.json)
      const folderName = path.substring(0, path.lastIndexOf('/'));
      if (folderName && !folderName.includes('/')) {
        return folderName;
      }
    }
  }

  throw new FileSystemAccessError(
    FileSystemErrorType.DIRECTORY_NOT_FOUND,
    'Could not find project folder in ZIP archive. Expected structure: {projectName}/project.json'
  );
}

/**
 * Main ZIP import function - extracts project data and images from ZIP archive
 */
export async function importProjectFromZip(
  zipFile: File,
  onProgress?: ImportProgressCallback,
  partialRecoveryOptions?: PartialRecoveryOptions
): Promise<ZipImportResult> {

  try {
    onProgress?.({
      stage: 'Reading ZIP file',
      current: 0,
      total: 6,
      message: 'Loading ZIP archive...',
    });

    // Load ZIP file
    const zip = await JSZip.loadAsync(zipFile);

    onProgress?.({
      stage: 'Analyzing ZIP structure',
      current: 1,
      total: 6,
      message: 'Finding project folder...',
    });

    // Find project folder in ZIP
    const projectFolderName = await findProjectFolderInZip(zip);

    onProgress?.({
      stage: 'Reading project data',
      current: 2,
      total: 6,
      message: 'Reading project.json...',
    });

    // Extract and parse project.json
    const exportedData = await extractProjectJSON(zip, projectFolderName);

    onProgress?.({
      stage: 'Validating data',
      current: 3,
      total: 6,
      message: 'Validating project data...',
    });

    // Detect corrupted fields
    const validationErrors = detectCorruptedFields(exportedData);

    let project: InvestmentProject;
    let isPartialRecovery = false;
    const warnings: string[] = [];

    if (validationErrors.length > 0) {
      // Data has validation errors
      if (partialRecoveryOptions?.acceptPartialRecovery) {
        // User has already accepted partial recovery
        const recovery = partialRecovery(exportedData, validationErrors);
        project = recovery.recovered;
        warnings.push(...recovery.warnings);
        isPartialRecovery = true;
      } else {
        // Return validation errors for UI to handle
        return {
          success: false,
          filename: zipFile.name,
          filesLoaded: 0,
          timestamp: new Date().toISOString(),
          validationErrors,
        };
      }
    } else {
      // Data is valid
      project = exportedData.project;
    }

    onProgress?.({
      stage: 'Loading images',
      current: 4,
      total: 6,
      message: 'Extracting project images...',
    });

    // Import assets (images)
    const { project: projectWithAssets, missingImages } = await importAssetsFromZip(
      zip,
      projectFolderName,
      project,
      onProgress
    );

    onProgress?.({
      stage: 'Complete',
      current: 6,
      total: 6,
      message: 'ZIP import completed successfully',
    });

    return {
      success: true,
      filename: zipFile.name,
      filesLoaded: 1 + (project.landParcel.images?.length || 0) +
        project.subdivisionScenarios.reduce((sum, s) =>
          sum + s.lots.reduce((lotSum, l) => lotSum + (l.images?.length || 0), 0), 0
        ),
      timestamp: new Date().toISOString(),
      project: projectWithAssets,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      partialRecovery: isPartialRecovery,
      missingImages: missingImages.length > 0 ? missingImages : undefined,
    };
  } catch (error) {
    const fsError = FileSystemAccessError.fromError(error as Error);

    return {
      success: false,
      filename: zipFile.name,
      filesLoaded: 0,
      timestamp: new Date().toISOString(),
      error: fsError,
    };
  }
}
