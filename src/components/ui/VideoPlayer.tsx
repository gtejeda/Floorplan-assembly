import { useCallback, useEffect } from 'react';
import { getYouTubeEmbedUrl } from '@lib/youtube';

interface VideoPlayerProps {
  videoId: string;
  videoName?: string;
  onClose: () => void;
}

export function VideoPlayer({ videoId, videoName, onClose }: VideoPlayerProps) {
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

  const embedUrl = getYouTubeEmbedUrl(videoId, true);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
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

      {/* Video name */}
      {videoName && (
        <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 rounded text-white/80 text-sm z-10">
          {videoName}
        </div>
      )}

      {/* YouTube iframe */}
      <div className="w-full max-w-5xl aspect-video mx-4">
        <iframe
          src={embedUrl}
          title={videoName || 'YouTube video'}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded text-white/60 text-sm">
        Press Escape or click outside to close
      </div>
    </div>
  );
}
