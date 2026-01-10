/**
 * Custom error types for File System Access API operations
 */

export const FileSystemErrorType = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  USER_CANCELLED: 'USER_CANCELLED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_READABLE: 'NOT_READABLE',
  NOT_WRITABLE: 'NOT_WRITABLE',
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_STATE: 'INVALID_STATE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  UNKNOWN: 'UNKNOWN'
} as const;

export type FileSystemErrorTypeValue = typeof FileSystemErrorType[keyof typeof FileSystemErrorType];

export class FileSystemAccessError extends Error {
  public readonly type: FileSystemErrorTypeValue;
  public readonly originalError?: Error;

  constructor(
    type: FileSystemErrorTypeValue,
    message: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'FileSystemAccessError';
    this.type = type;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileSystemAccessError);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case FileSystemErrorType.NOT_SUPPORTED:
        return 'Your browser does not support file system access. Please use Chrome, Edge, or a modern browser. A ZIP download will be provided instead.';
      case FileSystemErrorType.USER_CANCELLED:
        return 'Operation cancelled by user.';
      case FileSystemErrorType.PERMISSION_DENIED:
        return 'Permission denied. Please grant access to the selected directory.';
      case FileSystemErrorType.NOT_READABLE:
        return 'Cannot read from the selected directory. Please check permissions.';
      case FileSystemErrorType.NOT_WRITABLE:
        return 'Cannot write to the selected directory. Please select a writable location.';
      case FileSystemErrorType.DIRECTORY_NOT_FOUND:
        return 'Directory not found. Please select a valid directory.';
      case FileSystemErrorType.FILE_NOT_FOUND:
        return 'File not found in the selected directory.';
      case FileSystemErrorType.INVALID_STATE:
        return 'Invalid operation state. Please try again.';
      case FileSystemErrorType.QUOTA_EXCEEDED:
        return 'Storage quota exceeded. Please free up space and try again.';
      case FileSystemErrorType.UNKNOWN:
      default:
        return `An unexpected error occurred: ${this.message}`;
    }
  }

  /**
   * Create FileSystemAccessError from DOMException
   */
  static fromDOMException(error: DOMException): FileSystemAccessError {
    let type: FileSystemErrorTypeValue;
    let message: string = error.message;

    switch (error.name) {
      case 'AbortError':
        type = FileSystemErrorType.USER_CANCELLED;
        message = 'User cancelled the operation';
        break;
      case 'NotAllowedError':
        type = FileSystemErrorType.PERMISSION_DENIED;
        message = 'Permission denied to access file system';
        break;
      case 'NotFoundError':
        type = FileSystemErrorType.DIRECTORY_NOT_FOUND;
        message = 'Directory or file not found';
        break;
      case 'NotReadableError':
        type = FileSystemErrorType.NOT_READABLE;
        message = 'Cannot read from directory';
        break;
      case 'SecurityError':
        type = FileSystemErrorType.PERMISSION_DENIED;
        message = 'Security error accessing file system';
        break;
      case 'InvalidStateError':
        type = FileSystemErrorType.INVALID_STATE;
        message = 'Invalid state for operation';
        break;
      case 'QuotaExceededError':
        type = FileSystemErrorType.QUOTA_EXCEEDED;
        message = 'Storage quota exceeded';
        break;
      default:
        type = FileSystemErrorType.UNKNOWN;
        message = error.message || 'Unknown error occurred';
    }

    return new FileSystemAccessError(type, message, error as unknown as Error);
  }

  /**
   * Create FileSystemAccessError from generic Error
   */
  static fromError(error: Error): FileSystemAccessError {
    if (error instanceof FileSystemAccessError) {
      return error;
    }

    if (error.name === 'DOMException' || error instanceof DOMException) {
      return FileSystemAccessError.fromDOMException(error as DOMException);
    }

    return new FileSystemAccessError(
      FileSystemErrorType.UNKNOWN,
      error.message || 'Unknown error occurred',
      error
    );
  }
}
