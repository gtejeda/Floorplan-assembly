import { useState, useRef, useEffect, useCallback } from 'react';
import { useFloorplanStore } from '@store/index';
import { useShallow } from 'zustand/shallow';

export function ProjectName() {
  const { projectName, updateProjectName } = useFloorplanStore(
    useShallow((state) => ({
      projectName: state.project?.name ?? null,
      updateProjectName: state.updateProjectName,
    }))
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = projectName ?? 'Untitled Project';

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = useCallback(() => {
    if (projectName === null) return; // No project loaded
    setEditValue(projectName);
    setIsEditing(true);
  }, [projectName]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== projectName) {
      updateProjectName(trimmedValue);
    }
    setIsEditing(false);
  }, [editValue, projectName, updateProjectName]);

  const handleCancel = useCallback(() => {
    setEditValue(projectName ?? '');
    setIsEditing(false);
  }, [projectName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // No project loaded state
  if (projectName === null) {
    return (
      <span className="text-gray-400 text-sm font-medium">
        Untitled Project
      </span>
    );
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="
          bg-transparent text-gray-100 text-sm font-medium
          border border-blue-500 rounded px-2 py-0.5
          focus:outline-none focus:ring-1 focus:ring-blue-500
          min-w-[120px] max-w-[300px]
        "
        placeholder="Project name"
      />
    );
  }

  return (
    <button
      onClick={handleStartEditing}
      className="
        group flex items-center gap-1.5
        text-gray-100 text-sm font-medium
        px-2 py-0.5 rounded
        border border-transparent
        hover:bg-gray-700 hover:border-gray-600
        transition-colors cursor-pointer
      "
      title="Click to edit project name"
    >
      <span>{displayName}</span>
      <svg
        className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </button>
  );
}
