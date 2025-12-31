import { useState, useCallback, useEffect, type ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
  position?: 'left' | 'right';
  defaultCollapsed?: boolean;
  collapsedWidth?: number;
  expandedWidth?: number;
  breakpoint?: number;
}

export function Sidebar({
  children,
  position = 'right',
  defaultCollapsed = false,
  collapsedWidth = 0,
  expandedWidth = 320,
  breakpoint = 768,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < breakpoint;
      setIsMobile(mobile);
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint, isCollapsed]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const width = isCollapsed ? collapsedWidth : expandedWidth;

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleCollapse}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          flex flex-col bg-gray-800 border-gray-700
          transition-all duration-300 ease-in-out
          ${position === 'left' ? 'border-r' : 'border-l'}
          ${isMobile ? 'fixed top-0 bottom-0 z-50' : 'relative'}
          ${isMobile && position === 'left' ? 'left-0' : ''}
          ${isMobile && position === 'right' ? 'right-0' : ''}
          ${isCollapsed && isMobile ? (position === 'left' ? '-translate-x-full' : 'translate-x-full') : ''}
        `}
        style={{ width: isMobile && isCollapsed ? 0 : width }}
      >
        {/* Toggle button */}
        <button
          onClick={toggleCollapse}
          className={`
            absolute top-1/2 -translate-y-1/2 z-10
            w-6 h-16 bg-gray-700 hover:bg-gray-600
            flex items-center justify-center
            rounded transition-colors
            ${position === 'left' ? '-right-6 rounded-l-none' : '-left-6 rounded-r-none'}
          `}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-gray-300 text-sm">
            {position === 'left'
              ? (isCollapsed ? '\u25B6' : '\u25C0')
              : (isCollapsed ? '\u25C0' : '\u25B6')
            }
          </span>
        </button>

        {/* Content */}
        <div
          className={`
            flex-1 overflow-y-auto overflow-x-hidden
            transition-opacity duration-200
            ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        >
          {children}
        </div>
      </div>
    </>
  );
}

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function SidebarSection({
  title,
  children,
  defaultExpanded = true,
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-750 transition-colors"
      >
        <span className="text-sm font-medium text-gray-200">{title}</span>
        <span className="text-gray-400 text-xs">
          {isExpanded ? '\u25BC' : '\u25B6'}
        </span>
      </button>
      <div
        className={`
          overflow-hidden transition-all duration-200
          ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
