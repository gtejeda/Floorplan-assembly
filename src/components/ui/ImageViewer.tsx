import { useCallback, useEffect } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
}

export function ImageViewer({ imageUrl, imageName, onClose }: ImageViewerProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        aria-label="Close"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Image name */}
      {imageName && (
        <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 rounded text-white/80 text-sm">
          {imageName}
        </div>
      )}

      {/* Full-size image */}
      <img
        src={imageUrl}
        alt={imageName || 'Full size image'}
        className="max-w-[95vw] max-h-[95vh] object-contain select-none"
        draggable={false}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded text-white/60 text-sm">
        Press Escape or click outside to close
      </div>
    </div>
  );
}
