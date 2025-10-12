/**
 * useFileSystem Hook
 * Manages in-memory file system state for SoraIDE
 * Phase 1: No persistence, just in-memory CRUD
 */

'use client';

import { useState, useCallback } from 'react';
import { ProjectFile } from '@repo/types';
import { sanitizeFilename, generateId} from '../lib/utils';

export interface FileSystemState {
  files: ProjectFile[];
  activeFileId: string | null;
}

export function useFileSystem() {
  const [state, setState] = useState<FileSystemState>({
    files: [
      // Default starter file
      {
        id: generateId(),
        name: 'index.js',
        content: '// Welcome to SoraIDE!\nconsole.log("Hello, World!");',
        language: 'javascript',
      },
    ],
    activeFileId: null,
  });

  // Create new file
  const createFile = useCallback((filename: string, content: string = '') => {
    try {
      const sanitized = sanitizeFilename(filename);

      // Check if file already exists
      const exists = state.files.some(f => f.name === sanitized);
      if (exists) {
        throw new Error(`File "${sanitized}" already exists`);
      }

      const newFile: ProjectFile = {
        id: generateId(),
        name: sanitized,
        content,
        language: inferLanguage(sanitized),
      };

      setState(prev => ({
        ...prev,
        files: [...prev.files, newFile],
        activeFileId: newFile.id,
      }));

      return newFile;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }, [state.files]);

  // Update file content
  const updateFile = useCallback((fileId: string, content: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId ? { ...f, content } : f
      ),
    }));
  }, []);

  // Rename file
  const renameFile = useCallback((fileId: string, newName: string) => {
    try {
      const sanitized = sanitizeFilename(newName);

      // Check if new name already exists (except for current file)
      const exists = state.files.some(f => f.name === sanitized && f.id !== fileId);
      if (exists) {
        throw new Error(`File "${sanitized}" already exists`);
      }

      setState(prev => ({
        ...prev,
        files: prev.files.map(f =>
          f.id === fileId
            ? { ...f, name: sanitized, language: inferLanguage(sanitized) }
            : f
        ),
      }));
    } catch (error) {
      console.error('Failed to rename file:', error);
      throw error;
    }
  }, [state.files]);

  // Delete file
  const deleteFile = useCallback((fileId: string) => {
    setState(prev => {
      const newFiles = prev.files.filter(f => f.id !== fileId);

      // If we deleted the active file, switch to another file
      let newActiveFileId = prev.activeFileId;
      if (prev.activeFileId === fileId) {
        newActiveFileId = newFiles.length > 0 ? newFiles[0].id : null;
      }

      return {
        ...prev,
        files: newFiles,
        activeFileId: newActiveFileId,
      };
    });
  }, []);

  // Set active file
  const setActiveFile = useCallback((fileId: string | null) => {
    setState(prev => ({ ...prev, activeFileId: fileId }));
  }, []);

  // Get active file
  const getActiveFile = useCallback(() => {
    if (!state.activeFileId) return null;
    return state.files.find(f => f.id === state.activeFileId) || null;
  }, [state.files, state.activeFileId]);

  // Get file by ID
  const getFileById = useCallback((fileId: string) => {
    return state.files.find(f => f.id === fileId) || null;
  }, [state.files]);

  return {
    files: state.files,
    activeFileId: state.activeFileId,
    activeFile: getActiveFile(),
    createFile,
    updateFile,
    renameFile,
    deleteFile,
    setActiveFile,
    getFileById,
  };
}

/**
 * Infer language from filename extension
 */
function inferLanguage(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.txt': 'plaintext',
  };

  return languageMap[ext] || 'plaintext';
}
