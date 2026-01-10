import { useEffect, useRef, useState } from 'react';
import type { ImageReference } from '@/models/types';
import { ImagePreview } from './ImagePreview';

interface ImageUploadProps {
  images: ImageReference[];
  onImageAdd: (image: ImageReference) => void;
  onImageRemove: (imageId: string) => void;
  onImageClick: (image: ImageReference) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

/**
 * Component for uploading, displaying, and managing images
 * Supports JPEG, PNG, WebP formats with size validation
 * Per FR-056: 10MB size limit per file
 * Per FR-052: Store blobs (not file paths) in IndexedDB
 */
export function ImageUpload({
  images,
  onImageAdd,
  onImageRemove,
  onImageClick,
  maxSizeMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageReference | null>(null);

  const handleImageClick = (image: ImageReference) => {
    setPreviewImage(image);
    onImageClick(image);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);

    for (const file of Array.from(files)) {
      // Validate file format
      if (!acceptedFormats.includes(file.type)) {
        setUploadError(
          `Invalid format: ${file.name}. Accepted formats: JPEG, PNG, WebP`
        );
        continue;
      }

      // Validate file size (convert MB to bytes)
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setUploadError(
          `File too large: ${file.name}. Maximum size: ${maxSizeMB}MB`
        );
        continue;
      }

      // Create ImageReference with blob data
      const imageRef: ImageReference = {
        id: crypto.randomUUID(),
        originalFilename: file.name,
        blobData: file, // Store the File object (which extends Blob)
        uploadedAt: new Date().toISOString(),
        sizeBytes: file.size,
        mimeType: file.type,
      };

      onImageAdd(imageRef);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveClick = (imageId: string) => {
    setShowDeleteConfirm(imageId);
  };

  const confirmRemove = () => {
    if (showDeleteConfirm) {
      onImageRemove(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const cancelRemove = () => {
    setShowDeleteConfirm(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div>
        <button
          type="button"
          onClick={handleUploadClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Upload Images
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
          {uploadError}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <ImageThumbnail
              key={image.id}
              image={image}
              onClick={() => handleImageClick(image)}
              onRemove={() => handleRemoveClick(image.id)}
              showDeleteConfirm={showDeleteConfirm === image.id}
              onConfirmDelete={confirmRemove}
              onCancelDelete={cancelRemove}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500 text-sm">No images uploaded</p>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreview image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

interface ImageThumbnailProps {
  image: ImageReference;
  onClick: () => void;
  onRemove: () => void;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function ImageThumbnail({
  image,
  onClick,
  onRemove,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: ImageThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Create object URL for thumbnail
  useEffect(() => {
    if (image.blobData) {
      const url = URL.createObjectURL(image.blobData);
      setThumbnailUrl(url);

      // Cleanup function
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [image.blobData]);

  if (!thumbnailUrl) {
    return (
      <div className="aspect-square bg-gray-200 rounded flex items-center justify-center">
        <span className="text-gray-400 text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Thumbnail Image */}
      <div
        className="aspect-square rounded overflow-hidden cursor-pointer border-2 border-gray-300 hover:border-blue-500 transition-colors"
        onClick={onClick}
      >
        <img
          src={thumbnailUrl}
          alt={image.originalFilename}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Filename */}
      <p className="text-xs text-gray-600 mt-1 truncate" title={image.originalFilename}>
        {image.originalFilename}
      </p>

      {/* Delete Button */}
      {!showDeleteConfirm && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
          aria-label="Delete image"
        >
          ×
        </button>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-75 rounded flex flex-col items-center justify-center gap-2 p-2">
          <p className="text-white text-xs text-center">Delete image?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmDelete();
              }}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancelDelete();
              }}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
