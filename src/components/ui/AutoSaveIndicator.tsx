import { useEffect, useState } from 'react';

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
}

export function AutoSaveIndicator({ lastSaved }: AutoSaveIndicatorProps) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (lastSaved) {
      // Show the indicator
      setShow(true);
      setFadeOut(false);

      // Start fade out after 2 seconds
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 2000);

      // Hide completely after 3 seconds
      const hideTimer = setTimeout(() => {
        setShow(false);
      }, 3000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
    return undefined;
  }, [lastSaved]);

  if (!show || !lastSaved) {
    return null;
  }

  const timeString = lastSaved.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>Saved at {timeString}</span>
    </div>
  );
}
