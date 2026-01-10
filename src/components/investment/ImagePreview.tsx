import { useEffect, useState } from 'react';
import type { ImageReference } from '@/models/types';

interface ImagePreviewProps {
  image: ImageReference | null;
  onClose: () => void;
}

/**
 * Modal component for displaying full-size image preview
 * Closes on escape key, background click, or close button
 */
export function ImagePreview({ image, onClose }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Create object URL for full-size preview
  useEffect(() => {
    if (image?.blobData) {
      const url = URL.createObjectURL(image.blobData);
      setImageUrl(url);

      // Cleanup function
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
      return undefined;
    }
  }, [image]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (image) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-screen p-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-opacity z-10"
          aria-label="Close preview"
        >
          ×
        </button>

        {/* Image */}
        {imageUrl ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative"
          >
            <img
              src={imageUrl}
              alt={image.originalFilename}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-3">
              <p className="text-sm font-medium">{image.originalFilename}</p>
              <p className="text-xs text-gray-300">
                {formatFileSize(image.sizeBytes)} • {formatDate(image.uploadedAt)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-white text-center py-20">
            <p>Loading image...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch {
    return isoString;
  }
}
