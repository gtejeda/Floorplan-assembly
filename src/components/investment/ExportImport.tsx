/**
 * ExportImport Component
 * Provides UI controls for exporting and importing project data
 * US7: Project Export to Disk
 * US8: Project Import from Disk
 */

import { useState, useRef } from 'react';
import { useFloorplanStore } from '../../store';
import { exportProject, shouldUseZipFallback, type ExportResult } from '../../lib/export';
import { exportProjectAsZip, formatFileSize, type ZipExportResult } from '../../lib/zipExport';
import { importProject, restoreProjectState, type ImportResult, type FieldValidationError } from '../../lib/import';
import { importProjectFromZip, type ZipImportResult } from '../../lib/zipImport';
import { FileSystemErrorType } from '../../lib/fileSystemErrors';

interface ExportProgress {
  stage: string;
  current: number;
  total: number;
  message: string;
}

export function ExportImport() {
  const project = useFloorplanStore(state => state.project);
  const store = useFloorplanStore();
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | ZipExportResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ExportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | ZipImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const [showPartialRecoveryDialog, setShowPartialRecoveryDialog] = useState(false);
  const [partialRecoveryErrors, setPartialRecoveryErrors] = useState<FieldValidationError[]>([]);

  /**
   * Handle export button click
   */
  const handleExport = async () => {
    if (!project) {
      alert('No project to export. Please configure your project first.');
      return;
    }

    setIsExporting(true);
    setExportProgress(null);
    setExportResult(null);
    setShowResult(false);

    try {
      const useZipFallback = shouldUseZipFallback();

      let result: ExportResult | ZipExportResult;

      if (useZipFallback) {
        // Use ZIP export for browsers without File System Access API
        result = await exportProjectAsZip(project as any, (progress) => {
          setExportProgress(progress);
        });
      } else {
        // Use File System Access API
        result = await exportProject(project as any, (progress) => {
          setExportProgress(progress);
        });
      }

      setExportResult(result);
      setShowResult(true);

      // Note: Project metadata (lastExportDate, exportPath) will be stored in the exported JSON
      // We don't update the in-memory project here to avoid unnecessary state changes
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({
        success: false,
        directoryName: '',
        filesCreated: 0,
        timestamp: new Date().toISOString(),
        error: error as any,
      });
      setShowResult(true);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  /**
   * Close result modal
   */
  const handleCloseResult = () => {
    setShowResult(false);
    setExportResult(null);
  };

  /**
   * Handle import button click
   */
  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress(null);
    setImportResult(null);
    setShowImportResult(false);

    try {
      const useZipFallback = shouldUseZipFallback();

      let result: ImportResult | ZipImportResult;

      if (useZipFallback) {
        // Use ZIP import for browsers without File System Access API
        // Trigger file input click
        zipInputRef.current?.click();
        setIsImporting(false);
        return;
      } else {
        // Use File System Access API
        result = await importProject((progress) => {
          setImportProgress(progress);
        });
      }

      handleImportResult(result);
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        directoryName: '',
        filesLoaded: 0,
        timestamp: new Date().toISOString(),
        error: error as any,
      });
      setShowImportResult(true);
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  /**
   * Handle ZIP file selection
   */
  const handleZipFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(null);
    setImportResult(null);
    setShowImportResult(false);

    try {
      const result = await importProjectFromZip(file, (progress) => {
        setImportProgress(progress);
      });

      handleImportResult(result);
    } catch (error) {
      console.error('ZIP import failed:', error);
      setImportResult({
        success: false,
        filename: file.name,
        filesLoaded: 0,
        timestamp: new Date().toISOString(),
        error: error as any,
      });
      setShowImportResult(true);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
      // Reset file input
      if (zipInputRef.current) {
        zipInputRef.current.value = '';
      }
    }
  };

  /**
   * Handle import result (both File System Access API and ZIP)
   */
  const handleImportResult = (result: ImportResult | ZipImportResult) => {
    if (!result.success) {
      // Check if validation errors require partial recovery dialog
      if (result.validationErrors && result.validationErrors.length > 0) {
        setPartialRecoveryErrors(result.validationErrors);
        setShowPartialRecoveryDialog(true);
        setImportResult(result);
      } else {
        setImportResult(result);
        setShowImportResult(true);
      }
      setIsImporting(false);
      setImportProgress(null);
      return;
    }

    // Success - restore project state
    if (result.project) {
      restoreProjectState(result.project, store);
    }

    setImportResult(result);
    setShowImportResult(true);
    setIsImporting(false);
    setImportProgress(null);
  };

  /**
   * Handle partial recovery acceptance
   */
  const handleAcceptPartialRecovery = async () => {
    setShowPartialRecoveryDialog(false);
    setIsImporting(true);

    try {
      const useZipFallback = shouldUseZipFallback();
      let result: ImportResult | ZipImportResult;

      if (useZipFallback) {
        // Re-import ZIP with partial recovery
        // Note: We'd need to store the file reference, for now just show error
        setImportResult({
          success: false,
          filename: '',
          filesLoaded: 0,
          timestamp: new Date().toISOString(),
          error: { message: 'Please re-import the file to apply partial recovery' } as any,
        });
        setShowImportResult(true);
        setIsImporting(false);
        return;
      } else {
        // Re-import with partial recovery option
        result = await importProject(
          (progress) => setImportProgress(progress),
          { acceptPartialRecovery: true, skipInvalidFields: true }
        );
      }

      handleImportResult(result);
    } catch (error) {
      console.error('Partial recovery import failed:', error);
      setImportResult({
        success: false,
        directoryName: '',
        filesLoaded: 0,
        timestamp: new Date().toISOString(),
        error: error as any,
      });
      setShowImportResult(true);
      setIsImporting(false);
    }
  };

  /**
   * Handle partial recovery rejection
   */
  const handleRejectPartialRecovery = () => {
    setShowPartialRecoveryDialog(false);
    setPartialRecoveryErrors([]);
    setImportResult(null);
  };

  /**
   * Close import result modal
   */
  const handleCloseImportResult = () => {
    setShowImportResult(false);
    setImportResult(null);
  };

  /**
   * Get export info text
   */
  const getExportInfoText = () => {
    if (!project) return 'No project loaded';

    const useZip = shouldUseZipFallback();
    const investmentProject = project as any; // Cast to check for lastExportDate
    const exportDate = investmentProject?.lastExportDate
      ? new Date(investmentProject.lastExportDate).toLocaleString()
      : 'Never exported';

    return `Last exported: ${exportDate}${useZip ? ' (ZIP format)' : ''}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Export & Import</h2>

      {/* Export Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Export Project</h3>
        <p className="text-sm text-gray-600 mb-4">
          Export your project to disk for backup, sharing, or version control. All configuration
          data, financials, and images will be included.
        </p>

        <div className="mb-4">
          <p className="text-xs text-gray-500">{getExportInfoText()}</p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || !project}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export Project'}
        </button>

        {/* Progress Indicator */}
        {isExporting && exportProgress && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
            <div className="mb-2">
              <p className="text-sm font-medium text-blue-900">{exportProgress.stage}</p>
              <p className="text-xs text-blue-700">{exportProgress.message}</p>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(exportProgress.current / exportProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {exportProgress.current} / {exportProgress.total}
            </p>
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-2">Import Project</h3>
        <p className="text-sm text-gray-600 mb-4">
          Load a previously exported project from disk to continue work or review past projects.
        </p>

        <button
          onClick={handleImport}
          disabled={isImporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isImporting ? 'Importing...' : 'Import Project'}
        </button>

        {/* Hidden file input for ZIP import */}
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          onChange={handleZipFileSelect}
          className="hidden"
        />

        {/* Progress Indicator */}
        {isImporting && importProgress && (
          <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
            <div className="mb-2">
              <p className="text-sm font-medium text-green-900">{importProgress.stage}</p>
              <p className="text-xs text-green-700">{importProgress.message}</p>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-green-600 mt-1">
              {importProgress.current} / {importProgress.total}
            </p>
          </div>
        )}
      </div>

      {/* Export Result Modal */}
      {showResult && exportResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold mb-4">
              {exportResult.success ? 'Export Successful' : 'Export Failed'}
            </h3>

            {exportResult.success ? (
              <div>
                <div className="mb-4 p-4 bg-green-50 rounded-md border border-green-200">
                  <p className="text-sm text-green-900 mb-2">
                    ✓ Your project has been exported successfully!
                  </p>
                  <div className="text-xs text-green-700 space-y-1">
                    {'directoryName' in exportResult && exportResult.directoryName && (
                      <p>Location: {exportResult.directoryName}</p>
                    )}
                    {'filename' in exportResult && exportResult.filename && (
                      <p>File: {exportResult.filename}</p>
                    )}
                    {'filesCreated' in exportResult && exportResult.filesCreated > 0 && (
                      <p>Files created: {exportResult.filesCreated}</p>
                    )}
                    {'sizeBytes' in exportResult && exportResult.sizeBytes > 0 && (
                      <p>Size: {formatFileSize(exportResult.sizeBytes)}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Your project data and images have been saved to the selected location.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-4 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm text-red-900 mb-2">✗ Export failed</p>
                  <p className="text-xs text-red-700">
                    {exportResult.error?.getUserMessage() || 'An unknown error occurred'}
                  </p>
                </div>

                {exportResult.error?.type === FileSystemErrorType.USER_CANCELLED ? (
                  <p className="text-sm text-gray-600 mb-4">
                    You cancelled the export operation. No files were created.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">
                    Please check your browser permissions and try again. If the problem persists,
                    try using a different browser.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleCloseResult}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Modal */}
      {showImportResult && importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold mb-4">
              {importResult.success ? 'Import Successful' : 'Import Failed'}
            </h3>

            {importResult.success ? (
              <div>
                <div className="mb-4 p-4 bg-green-50 rounded-md border border-green-200">
                  <p className="text-sm text-green-900 mb-2">
                    ✓ Your project has been imported successfully!
                  </p>
                  <div className="text-xs text-green-700 space-y-1">
                    {'directoryName' in importResult && importResult.directoryName && (
                      <p>From: {importResult.directoryName}</p>
                    )}
                    {'filename' in importResult && importResult.filename && (
                      <p>File: {importResult.filename}</p>
                    )}
                    {importResult.filesLoaded > 0 && (
                      <p>Files loaded: {importResult.filesLoaded}</p>
                    )}
                    {importResult.partialRecovery && (
                      <p className="text-yellow-700 font-medium">
                        ⚠ Partial recovery applied - some fields may be reset
                      </p>
                    )}
                    {'missingImages' in importResult && importResult.missingImages && importResult.missingImages.length > 0 && (
                      <p className="text-yellow-700">
                        ⚠ {importResult.missingImages.length} images could not be loaded
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Your project data has been restored. All configuration and images are now loaded.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-4 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm text-red-900 mb-2">✗ Import failed</p>
                  <p className="text-xs text-red-700">
                    {importResult.error?.getUserMessage?.() || importResult.error?.message || 'An unknown error occurred'}
                  </p>
                </div>

                {importResult.error?.type === FileSystemErrorType.USER_CANCELLED ? (
                  <p className="text-sm text-gray-600 mb-4">
                    You cancelled the import operation.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">
                    Please check that the selected directory contains a valid exported project and try again.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleCloseImportResult}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partial Recovery Dialog */}
      {showPartialRecoveryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-yellow-900">
              ⚠ Corrupted Project Data Detected
            </h3>

            <div className="mb-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-900 mb-2">
                The project file contains some invalid or corrupted fields. You can:
              </p>
              <ul className="text-xs text-yellow-800 list-disc list-inside space-y-1">
                <li>Accept partial recovery to load valid data and reset invalid fields to defaults</li>
                <li>Cancel and fix the project file manually</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2 text-gray-900">
                Validation Errors ({partialRecoveryErrors.length}):
              </h4>
              <div className="bg-gray-50 rounded-md border border-gray-200 p-3 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {partialRecoveryErrors.map((error, index) => (
                    <div key={index} className="text-xs border-l-2 border-red-400 pl-2">
                      <p className="font-medium text-red-900">{error.path}</p>
                      <p className="text-red-700">{error.error}</p>
                      {error.value !== undefined && (
                        <p className="text-gray-600">Value: {JSON.stringify(error.value)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleRejectPartialRecovery}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptPartialRecovery}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Accept Partial Recovery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
