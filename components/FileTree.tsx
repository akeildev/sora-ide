/**
 * FileTree Component
 * Displays file list with CRUD operations
 * Phase 1: Simple flat list (no folders yet)
 */

'use client';

import { useState } from 'react';
import { ProjectFile } from '@/types';

interface FileTreeProps {
  files: ProjectFile[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (filename: string) => void;
  onFileRename: (fileId: string, newName: string) => void;
  onFileDelete: (fileId: string) => void;
}

export function FileTree({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
}: FileTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      try {
        onFileCreate(newFileName.trim());
        setNewFileName('');
        setIsCreating(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create file');
      }
    }
  };

  const handleRename = (fileId: string) => {
    if (renameValue.trim()) {
      try {
        onFileRename(fileId, renameValue.trim());
        setRenamingFileId(null);
        setRenameValue('');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to rename file');
      }
    }
  };

  const handleDelete = (fileId: string, filename: string) => {
    if (confirm(`Delete "${filename}"?`)) {
      onFileDelete(fileId);
    }
  };

  const startRename = (file: ProjectFile) => {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
  };

  return (
    <div className="h-full bg-[#1e1e1e] text-gray-300 flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-400 uppercase">Files</span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-gray-700 rounded"
          title="New File"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {/* New File Input */}
        {isCreating && (
          <div className="p-2 bg-gray-800">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              onBlur={handleCreateFile}
              placeholder="filename.js"
              className="w-full px-2 py-1 text-sm bg-gray-900 border border-blue-500 rounded outline-none"
              autoFocus
            />
          </div>
        )}

        {/* Files */}
        {files.map((file) => (
          <div
            key={file.id}
            className={`group flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-800 ${
              activeFileId === file.id ? 'bg-gray-700' : ''
            }`}
          >
            {renamingFileId === file.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(file.id);
                  if (e.key === 'Escape') {
                    setRenamingFileId(null);
                    setRenameValue('');
                  }
                }}
                onBlur={() => handleRename(file.id)}
                className="flex-1 px-2 py-1 text-sm bg-gray-900 border border-blue-500 rounded outline-none"
                autoFocus
              />
            ) : (
              <>
                <div
                  onClick={() => onFileSelect(file.id)}
                  className="flex items-center flex-1 gap-2"
                >
                  <FileIcon filename={file.name} />
                  <span className="text-sm">{file.name}</span>
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(file);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    title="Rename"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id, file.name);
                    }}
                    className="p-1 hover:bg-red-600 rounded"
                    title="Delete"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {files.length === 0 && !isCreating && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No files yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * File Icon Component
 * Shows icon based on file extension
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

  return <span className="text-lg">{iconMap[ext] || '📄'}</span>;
}
