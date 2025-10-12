/**
 * TabBar Component
 * File tabs for multi-file editing
 * Phase 1: Basic tabs with close buttons
 */

'use client';

import { ProjectFile } from '@/types';

interface TabBarProps {
  files: ProjectFile[];
  activeFileId: string | null;
  onTabSelect: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
}

export function TabBar({ files, activeFileId, onTabSelect, onTabClose }: TabBarProps) {
  const handleTabClose = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    onTabClose(fileId);
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-[#252526] border-b border-gray-700 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {files.map((file) => (
        <div
          key={file.id}
          onClick={() => onTabSelect(file.id)}
          className={`
            group flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer
            hover:bg-gray-700 transition-colors min-w-fit max-w-xs
            ${activeFileId === file.id ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d30] text-gray-400'}
          `}
        >
          <FileIcon filename={file.name} />
          <span className="text-sm truncate">{file.name}</span>
          {file.content !== getInitialContent(file.name) && (
            <span className="w-2 h-2 rounded-full bg-blue-500" title="Unsaved changes" />
          )}
          <button
            onClick={(e) => handleTabClose(e, file.id)}
            className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded p-0.5 transition-opacity"
            title="Close"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * File Icon Component
 */
function FileIcon({ filename }: { filename: string }) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  const iconMap: Record<string, string> = {
    '.js': '🟨',
    '.jsx': '⚛️',
    '.ts': '🔷',
    '.tsx': '⚛️',
    '.py': '🐍',
    '.java': '☕',
    '.cpp': '⚙️',
    '.c': '📘',
    '.go': '🐹',
    '.rs': '🦀',
    '.rb': '💎',
    '.php': '🐘',
    '.html': '🌐',
    '.css': '🎨',
    '.json': '📋',
    '.md': '📝',
  };

  return <span className="text-base">{iconMap[ext] || '📄'}</span>;
}

/**
 * Get initial content for a file (helper for detecting changes)
 * TODO: In Phase 3, this will check against Firestore
 */
function getInitialContent(filename: string): string {
  // For now, assume empty files
  return '';
}
