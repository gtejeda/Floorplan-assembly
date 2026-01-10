/**
 * Project import functionality using File System Access API
 * Imports InvestmentProject data from a directory structure with JSON and image files
 */

import type { InvestmentProject, ImageReference, SubdivisionScenario } from '../models/types';
import {
  showDirectoryPicker,
  getDirectoryHandle,
  getFileHandle,
  readTextFile,
  readBlobFile,
} from './fileSystemAccess';
import { FileSystemAccessError, FileSystemErrorType } from './fileSystemErrors';
import { set as idbSet } from 'idb-keyval';

/**
 * Import progress callback type
 */
export type ImportProgressCallback = (progress: {
  stage: string;
  current: number;
  total: number;
  message: string;
}) => void;

/**
 * Field validation error
 */
export interface FieldValidationError {
  field: string;
  path: string;
  error: string;
  value?: any;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  directoryName: string;
  filesLoaded: number;
  timestamp: string;
  project?: InvestmentProject;
  validationErrors?: FieldValidationError[];
  partialRecovery?: boolean;
  error?: FileSystemAccessError;
}

/**
 * Partial recovery options
 */
export interface PartialRecoveryOptions {
  acceptPartialRecovery: boolean;
  skipInvalidFields: boolean;
}

/**
 * Exported project data structure (from export.ts)
 */
interface ExportedProjectData {
  version: string;
  exportDate: string;
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
 * Detect corrupted or invalid fields in project data
 * Returns list of validation errors found
 */
export function detectCorruptedFields(data: any): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  try {
    // Check top-level structure
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'root',
        path: '',
        error: 'Invalid project data: not an object',
        value: data,
      });
      return errors;
    }

    if (!data.version || typeof data.version !== 'string') {
      errors.push({
        field: 'version',
        path: 'version',
        error: 'Missing or invalid version field',
        value: data.version,
      });
    }

    if (!data.project || typeof data.project !== 'object') {
      errors.push({
        field: 'project',
        path: 'project',
        error: 'Missing or invalid project object',
        value: data.project,
      });
      return errors; // Can't continue without project object
    }

    const project = data.project;

    // Validate required project fields
    if (typeof project.id !== 'string' || !project.id) {
      errors.push({
        field: 'id',
        path: 'project.id',
        error: 'Missing or invalid project ID',
        value: project.id,
      });
    }

    if (typeof project.name !== 'string') {
      errors.push({
        field: 'name',
        path: 'project.name',
        error: 'Missing or invalid project name',
        value: project.name,
      });
    }

    // Validate landParcel
    if (!project.landParcel || typeof project.landParcel !== 'object') {
      errors.push({
        field: 'landParcel',
        path: 'project.landParcel',
        error: 'Missing or invalid land parcel data',
        value: project.landParcel,
      });
    } else {
      const land = project.landParcel;

      // Check width and height (could be stored as either width/height or lengthMeters/widthMeters for backwards compatibility)
      const width = (land as any).width || (land as any).lengthMeters;
      const height = (land as any).height || (land as any).widthMeters;

      if (typeof width !== 'number' || width <= 0) {
        errors.push({
          field: 'width',
          path: 'project.landParcel.width',
          error: 'Invalid land width (must be positive number)',
          value: width,
        });
      }

      if (typeof height !== 'number' || height <= 0) {
        errors.push({
          field: 'height',
          path: 'project.landParcel.height',
          error: 'Invalid land height (must be positive number)',
          value: height,
        });
      }

      if (typeof land.acquisitionCost !== 'number' || land.acquisitionCost < 0) {
        errors.push({
          field: 'acquisitionCost',
          path: 'project.landParcel.acquisitionCost',
          error: 'Invalid acquisition cost (must be non-negative number)',
          value: land.acquisitionCost,
        });
      }

      if (!Array.isArray(land.images)) {
        errors.push({
          field: 'images',
          path: 'project.landParcel.images',
          error: 'Invalid images array',
          value: land.images,
        });
      }
    }

    // Validate subdivisionScenarios
    if (!Array.isArray(project.subdivisionScenarios)) {
      errors.push({
        field: 'subdivisionScenarios',
        path: 'project.subdivisionScenarios',
        error: 'Missing or invalid subdivision scenarios array',
        value: project.subdivisionScenarios,
      });
    } else {
      project.subdivisionScenarios.forEach((scenario: any, index: number) => {
        if (!scenario.id || typeof scenario.id !== 'string') {
          errors.push({
            field: 'id',
            path: `project.subdivisionScenarios[${index}].id`,
            error: 'Invalid scenario ID',
            value: scenario.id,
          });
        }

        if (typeof scenario.socialClubPercentage !== 'number' ||
            scenario.socialClubPercentage < 10 ||
            scenario.socialClubPercentage > 30) {
          errors.push({
            field: 'socialClubPercentage',
            path: `project.subdivisionScenarios[${index}].socialClubPercentage`,
            error: 'Invalid social club percentage (must be 10-30)',
            value: scenario.socialClubPercentage,
          });
        }

        if (!Array.isArray(scenario.lots)) {
          errors.push({
            field: 'lots',
            path: `project.subdivisionScenarios[${index}].lots`,
            error: 'Invalid lots array',
            value: scenario.lots,
          });
        }
      });
    }

    // Validate financial analysis
    if (project.financialAnalysis && typeof project.financialAnalysis !== 'object') {
      errors.push({
        field: 'financialAnalysis',
        path: 'project.financialAnalysis',
        error: 'Invalid financial analysis data',
        value: project.financialAnalysis,
      });
    }

    // Validate social club configuration
    if (project.socialClubConfig && typeof project.socialClubConfig !== 'object') {
      errors.push({
        field: 'socialClubConfig',
        path: 'project.socialClubConfig',
        error: 'Invalid social club configuration',
        value: project.socialClubConfig,
      });
    }

  } catch (error) {
    errors.push({
      field: 'unknown',
      path: '',
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return errors;
}

/**
 * Perform partial recovery on corrupted project data
 * Loads valid fields and provides defaults for invalid ones
 */
export function partialRecovery(
  data: any,
  validationErrors: FieldValidationError[]
): { recovered: InvestmentProject; warnings: string[] } {
  const warnings: string[] = [];
  const errorPaths = new Set(validationErrors.map(e => e.path));

  // Start with minimal valid project structure
  const recovered: Partial<InvestmentProject> = {
    id: data.project?.id || `recovered-${Date.now()}`,
    name: data.project?.name || 'Recovered Project',
    created: data.project?.created || new Date().toISOString(),
  };

  warnings.push('Performing partial data recovery - some fields may be reset to defaults');

  // Try to recover land parcel
  if (data.project?.landParcel && !errorPaths.has('project.landParcel')) {
    const land = data.project.landParcel;
    const width = errorPaths.has('project.landParcel.width') ? 50 : (land.width || 50);
    const height = errorPaths.has('project.landParcel.height') ? 30 : (land.height || 30);

    recovered.landParcel = {
      width,
      height,
      totalArea: width * height,
      acquisitionCost: errorPaths.has('project.landParcel.acquisitionCost') ? 0 : (land.acquisitionCost || 0),
      acquisitionCurrency: (land.acquisitionCurrency as any) || 'USD',
      province: land.province || 'Santo Domingo',
      isUrbanized: land.isUrbanized ?? true,
      landmarks: Array.isArray(land.landmarks) ? land.landmarks : [],
      images: Array.isArray(land.images) ? land.images : [],
      unit: (land.unit as any) || 'meters',
    };

    if (errorPaths.has('project.landParcel.width')) {
      warnings.push('Land width reset to default: 50m');
    }
    if (errorPaths.has('project.landParcel.height')) {
      warnings.push('Land height reset to default: 30m');
    }
    if (errorPaths.has('project.landParcel.acquisitionCost')) {
      warnings.push('Acquisition cost reset to 0 - please update');
    }
  } else {
    // Create default land parcel
    recovered.landParcel = {
      width: 50,
      height: 30,
      totalArea: 1500,
      acquisitionCost: 0,
      acquisitionCurrency: 'USD',
      province: 'Santo Domingo',
      isUrbanized: true,
      landmarks: [],
      images: [],
      unit: 'meters',
    };
    warnings.push('Land parcel data corrupted - using defaults');
  }

  // Try to recover subdivision scenarios
  if (Array.isArray(data.project?.subdivisionScenarios)) {
    const validScenarios = data.project.subdivisionScenarios.filter((_: any, index: number) => {
      const scenarioPath = `project.subdivisionScenarios[${index}]`;
      const hasError = validationErrors.some(e => e.path.startsWith(scenarioPath));
      return !hasError;
    });

    if (validScenarios.length > 0) {
      recovered.subdivisionScenarios = validScenarios as SubdivisionScenario[];
      if (validScenarios.length < data.project.subdivisionScenarios.length) {
        warnings.push(`Recovered ${validScenarios.length} valid scenarios out of ${data.project.subdivisionScenarios.length}`);
      }
    } else {
      recovered.subdivisionScenarios = [];
      warnings.push('All subdivision scenarios corrupted - will regenerate on land parcel change');
    }
  } else {
    recovered.subdivisionScenarios = [];
    warnings.push('Subdivision scenarios missing - will regenerate on land parcel change');
  }

  // Try to recover selected scenario ID
  if (typeof data.project?.selectedScenarioId === 'string') {
    recovered.selectedScenarioId = data.project.selectedScenarioId;
  } else if (recovered.subdivisionScenarios && recovered.subdivisionScenarios.length > 0) {
    recovered.selectedScenarioId = recovered.subdivisionScenarios[0].id;
    warnings.push('Selected scenario ID missing - defaulted to first scenario');
  }

  // Try to recover financial analysis
  if (data.project?.financialAnalysis && !errorPaths.has('project.financialAnalysis')) {
    recovered.financialAnalysis = data.project.financialAnalysis;
  } else {
    // Provide default financial analysis structure
    recovered.financialAnalysis = {
      totalProjectCost: 0,
      costPerSqm: 0,
      baseCostPerLot: 0,
      pricingScenarios: [],
    } as any;
    warnings.push('Financial analysis data corrupted - will recalculate');
  }

  // Try to recover social club configuration
  if (data.project?.socialClub && !errorPaths.has('project.socialClub')) {
    recovered.socialClub = data.project.socialClub;
  } else {
    // Provide default social club configuration
    recovered.socialClub = {
      selectedAmenities: [],
      storageType: 'dedicated',
      customAmenityCosts: {},
    };
    warnings.push('Social club configuration corrupted - will need to be reconfigured');
  }

  // Provide default target profit margins if missing
  if (!data.project?.targetProfitMargins) {
    recovered.targetProfitMargins = [15, 20, 25, 30];
  } else {
    recovered.targetProfitMargins = data.project.targetProfitMargins;
  }

  // Try to recover AI description
  if (typeof data.project?.aiDescription === 'string') {
    recovered.aiDescription = data.project.aiDescription;
  }

  // Recover export metadata if available
  if (data.project?.exportPath) {
    recovered.exportPath = data.project.exportPath;
  }
  if (data.project?.lastExportDate) {
    recovered.lastExportDate = data.project.lastExportDate;
  }

  return {
    recovered: recovered as InvestmentProject,
    warnings
  };
}

/**
 * Read and parse project.json file
 */
export async function readProjectJSON(
  projectHandle: FileSystemDirectoryHandle
): Promise<ExportedProjectData> {
  try {
    const fileHandle = await getFileHandle(projectHandle, 'project.json');
    const jsonText = await readTextFile(fileHandle);
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
 * Load images from assets directories
 */
export async function loadImagesFromDirectory(
  assetsHandle: FileSystemDirectoryHandle,
  subdirectory: 'land-parcel' | 'lots',
  imageReferences: ImageReference[]
): Promise<{ loaded: ImageReference[]; missing: string[] }> {
  const loaded: ImageReference[] = [];
  const missing: string[] = [];

  try {
    const dirHandle = await getDirectoryHandle(assetsHandle, subdirectory);

    for (const imageRef of imageReferences) {
      try {
        // Try to find the file (may have prefix for lots)
        let fileHandle: FileSystemFileHandle | null = null;

        // Try exact filename first
        try {
          fileHandle = await getFileHandle(dirHandle, imageRef.originalFilename);
        } catch {
          // Try with lot prefix pattern (lot{N}_{filename})
          if (subdirectory === 'lots') {
            // Scan directory for matching file with any lot prefix
            for await (const entry of (dirHandle as any).values()) {
              if (entry.kind === 'file' && entry.name.endsWith(imageRef.originalFilename)) {
                fileHandle = entry as FileSystemFileHandle;
                break;
              }
            }
          }
        }

        if (!fileHandle) {
          missing.push(imageRef.originalFilename);
          // Create placeholder reference
          loaded.push({
            ...imageRef,
            blobData: null,
            _isMissing: true,
          } as any);
          continue;
        }

        // Read the file as blob
        const blob = await readBlobFile(fileHandle);

        // Store blob in IndexedDB
        await idbSet(imageRef.id, blob);

        // Add to loaded references with blob data
        loaded.push({
          ...imageRef,
          blobData: blob,
        });
      } catch (error) {
        console.error(`Failed to load image ${imageRef.originalFilename}:`, error);
        missing.push(imageRef.originalFilename);
        // Create placeholder reference
        loaded.push({
          ...imageRef,
          blobData: null,
          _isMissing: true,
        } as any);
      }
    }
  } catch (error) {
    console.error(`Failed to access ${subdirectory} directory:`, error);
    // All images are missing
    imageReferences.forEach(ref => {
      missing.push(ref.originalFilename);
      loaded.push({
        ...ref,
        blobData: null,
        _isMissing: true,
      } as any);
    });
  }

  return { loaded, missing };
}

/**
 * Import all assets (images) from assets directory
 */
export async function importAssets(
  projectHandle: FileSystemDirectoryHandle,
  project: InvestmentProject,
  onProgress?: ImportProgressCallback
): Promise<{ project: InvestmentProject; missingImages: string[] }> {
  const missingImages: string[] = [];

  try {
    const assetsHandle = await getDirectoryHandle(projectHandle, 'assets');

    // Load land parcel images
    if (project.landParcel.images && project.landParcel.images.length > 0) {
      onProgress?.({
        stage: 'Loading land parcel images',
        current: 1,
        total: 2,
        message: `Loading ${project.landParcel.images.length} land parcel images...`,
      });

      const landResult = await loadImagesFromDirectory(
        assetsHandle,
        'land-parcel',
        project.landParcel.images
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
            const lotResult = await loadImagesFromDirectory(
              assetsHandle,
              'lots',
              lot.images
            );

            lot.images = lotResult.loaded;
            missingImages.push(...lotResult.missing);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to import assets:', error);
    // Continue with import even if assets fail
  }

  return { project, missingImages };
}

/**
 * Restore project state to Zustand store
 * This function will be called by the UI component with access to the store
 */
export function restoreProjectState(
  project: InvestmentProject,
  store: any // FloorplanStore type
): void {
  // Update land parcel
  if (project.landParcel) {
    store.getState().updateLandParcel(project.landParcel);
  }

  // Update subdivision scenarios
  if (project.subdivisionScenarios && project.subdivisionScenarios.length > 0) {
    store.getState().setSubdivisionScenarios(project.subdivisionScenarios);

    if (project.selectedScenarioId) {
      store.getState().selectScenario(project.selectedScenarioId);
    }
  }

  // Update financial analysis
  if (project.financialAnalysis) {
    store.getState().setFinancialAnalysis(project.financialAnalysis);
  }

  // Update social club configuration
  if (project.socialClub) {
    store.getState().setSocialClubConfig(project.socialClub);
  }

  // Update project metadata
  store.getState().updateProject({
    id: project.id,
    name: project.name,
    created: project.created,
    aiDescription: project.aiDescription,
    exportPath: project.exportPath,
    lastExportDate: project.lastExportDate,
  });
}

/**
 * Validate directory structure before import
 */
export async function validateImportDirectory(
  directoryHandle: FileSystemDirectoryHandle
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Check for project.json
    try {
      await getFileHandle(directoryHandle, 'project.json');
    } catch {
      errors.push('Missing project.json file in selected directory');
    }

    // Check for assets directory
    try {
      const assetsHandle = await getDirectoryHandle(directoryHandle, 'assets');

      // Check for subdirectories
      try {
        await getDirectoryHandle(assetsHandle, 'land-parcel');
      } catch {
        errors.push('Missing assets/land-parcel directory');
      }

      try {
        await getDirectoryHandle(assetsHandle, 'lots');
      } catch {
        errors.push('Missing assets/lots directory');
      }
    } catch {
      errors.push('Missing assets directory - images will not be imported');
    }

  } catch (error) {
    errors.push('Failed to validate directory structure');
  }

  return {
    valid: errors.length === 0 || errors.every(e => e.includes('images will not be imported')),
    errors,
  };
}

/**
 * Main import function - coordinates all import steps
 */
export async function importProject(
  onProgress?: ImportProgressCallback,
  partialRecoveryOptions?: PartialRecoveryOptions
): Promise<ImportResult> {

  try {
    onProgress?.({
      stage: 'Initializing import',
      current: 0,
      total: 6,
      message: 'Opening directory picker...',
    });

    // Step 1: Show directory picker
    const projectHandle = await showDirectoryPicker({
      mode: 'read',
    } as DirectoryPickerOptions);

    onProgress?.({
      stage: 'Validating directory',
      current: 1,
      total: 6,
      message: 'Checking directory structure...',
    });

    // Step 2: Validate directory structure
    const validation = await validateImportDirectory(projectHandle);
    if (!validation.valid) {
      throw new FileSystemAccessError(
        FileSystemErrorType.DIRECTORY_NOT_FOUND,
        `Invalid project directory structure:\n${validation.errors.join('\n')}`
      );
    }

    onProgress?.({
      stage: 'Reading project data',
      current: 2,
      total: 6,
      message: 'Reading project.json...',
    });

    // Step 3: Read and parse project.json
    const exportedData = await readProjectJSON(projectHandle);

    onProgress?.({
      stage: 'Validating data',
      current: 3,
      total: 6,
      message: 'Validating project data...',
    });

    // Step 4: Detect corrupted fields
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
          directoryName: projectHandle.name,
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
      message: 'Loading project images...',
    });

    // Step 5: Import assets (images)
    const { project: projectWithAssets, missingImages } = await importAssets(
      projectHandle,
      project,
      onProgress
    );

    if (missingImages.length > 0) {
      warnings.push(`${missingImages.length} images could not be loaded: ${missingImages.join(', ')}`);
    }

    onProgress?.({
      stage: 'Complete',
      current: 6,
      total: 6,
      message: 'Import completed successfully',
    });

    return {
      success: true,
      directoryName: projectHandle.name,
      filesLoaded: 1 + (projectWithAssets.landParcel.images?.length || 0) +
        projectWithAssets.subdivisionScenarios.reduce((sum, s) =>
          sum + s.lots.reduce((lotSum, l) => lotSum + (l.images?.length || 0), 0), 0
        ),
      timestamp: new Date().toISOString(),
      project: projectWithAssets,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      partialRecovery: isPartialRecovery,
    };
  } catch (error) {
    const fsError = FileSystemAccessError.fromError(error as Error);

    return {
      success: false,
      directoryName: '',
      filesLoaded: 0,
      timestamp: new Date().toISOString(),
      error: fsError,
    };
  }
}
