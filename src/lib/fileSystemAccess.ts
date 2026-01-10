/**
 * File System Access API wrapper with error handling and polyfill support
 */

import { showDirectoryPicker as polyfillShowDirectoryPicker } from 'file-system-access';
import { FileSystemAccessError, FileSystemErrorType } from './fileSystemErrors';

/**
 * Check if File System Access API is natively supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Wrapper for showDirectoryPicker with error handling and polyfill fallback
 */
export async function showDirectoryPicker(
  options?: DirectoryPickerOptions
): Promise<FileSystemDirectoryHandle> {
  try {
    // Try native API first
    if (isFileSystemAccessSupported()) {
      return await window.showDirectoryPicker(options);
    }

    // Fallback to polyfill (uses input[type="file"] with webkitdirectory)
    return await polyfillShowDirectoryPicker(options);
  } catch (error) {
    if (error instanceof DOMException) {
      throw FileSystemAccessError.fromDOMException(error);
    }
    throw FileSystemAccessError.fromError(error as Error);
  }
}

/**
 * Check if a directory handle has write permission
 */
export async function verifyDirectoryWritePermission(
  directoryHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const opts: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };

    // Query current permission
    if ((await directoryHandle.queryPermission(opts)) === 'granted') {
      return true;
    }

    // Request permission if not granted
    if ((await directoryHandle.requestPermission(opts)) === 'granted') {
      return true;
    }

    return false;
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.PERMISSION_DENIED,
      'Failed to verify write permissions',
      error as Error
    );
  }
}

/**
 * Check if a directory handle has read permission
 */
export async function verifyDirectoryReadPermission(
  directoryHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const opts: FileSystemHandlePermissionDescriptor = { mode: 'read' };

    // Query current permission
    if ((await directoryHandle.queryPermission(opts)) === 'granted') {
      return true;
    }

    // Request permission if not granted
    if ((await directoryHandle.requestPermission(opts)) === 'granted') {
      return true;
    }

    return false;
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.PERMISSION_DENIED,
      'Failed to verify read permissions',
      error as Error
    );
  }
}

/**
 * Get or create a file handle in a directory
 */
export async function getOrCreateFileHandle(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<FileSystemFileHandle> {
  try {
    return await directoryHandle.getFileHandle(fileName, { create: true });
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.NOT_WRITABLE,
      `Failed to create file: ${fileName}`,
      error as Error
    );
  }
}

/**
 * Get an existing file handle in a directory (read-only, no creation)
 */
export async function getFileHandle(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<FileSystemFileHandle> {
  try {
    return await directoryHandle.getFileHandle(fileName, { create: false });
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.FILE_NOT_FOUND,
      `File not found: ${fileName}`,
      error as Error
    );
  }
}

/**
 * Get or create a subdirectory handle
 */
export async function getOrCreateDirectoryHandle(
  parentHandle: FileSystemDirectoryHandle,
  directoryName: string
): Promise<FileSystemDirectoryHandle> {
  try {
    return await parentHandle.getDirectoryHandle(directoryName, { create: true });
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.NOT_WRITABLE,
      `Failed to create directory: ${directoryName}`,
      error as Error
    );
  }
}

/**
 * Get an existing subdirectory handle (read-only, no creation)
 */
export async function getDirectoryHandle(
  parentHandle: FileSystemDirectoryHandle,
  directoryName: string
): Promise<FileSystemDirectoryHandle> {
  try {
    return await parentHandle.getDirectoryHandle(directoryName, { create: false });
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.DIRECTORY_NOT_FOUND,
      `Directory not found: ${directoryName}`,
      error as Error
    );
  }
}

/**
 * Write text content to a file
 */
export async function writeTextFile(
  fileHandle: FileSystemFileHandle,
  content: string
): Promise<void> {
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.NOT_WRITABLE,
      `Failed to write file: ${fileHandle.name}`,
      error as Error
    );
  }
}

/**
 * Write blob content to a file
 */
export async function writeBlobFile(
  fileHandle: FileSystemFileHandle,
  blob: Blob
): Promise<void> {
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.NOT_WRITABLE,
      `Failed to write file: ${fileHandle.name}`,
      error as Error
    );
  }
}

/**
 * Read text content from a file handle
 */
export async function readTextFile(fileHandle: FileSystemFileHandle): Promise<string> {
  try {
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.NOT_READABLE,
      `Failed to read file: ${fileHandle.name}`,
      error as Error
    );
  }
}

/**
 * Read blob from a file handle
 */
export async function readBlobFile(fileHandle: FileSystemFileHandle): Promise<Blob> {
  try {
    return await fileHandle.getFile();
  } catch (error) {
    throw new FileSystemAccessError(
      FileSystemErrorType.NOT_READABLE,
      `Failed to read file: ${fileHandle.name}`,
      error as Error
    );
  }
}

/**
 * Sanitize filename for safe file system usage
 */
export function sanitizeFileName(name: string): string {
  // Remove or replace invalid characters
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^\.+/, '')
    .substring(0, 255); // Limit filename length
}

/**
 * Get ISO timestamp for file naming
 */
export function getISOTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
}
