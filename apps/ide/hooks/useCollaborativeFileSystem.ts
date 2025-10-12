/**
 * useCollaborativeFileSystem Hook
 * Manages collaborative file system with Yjs
 * Phase 2: Real-time file tree synchronization
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectFile } from '@repo/types';
import { sanitizeFilename, generateId } from '@repo/utils';
import { useCollaboration, getOrCreateYjsText, setYjsFileMetadata } from './useCollaboration';
import type * as Y from 'yjs';

export interface FileSystemState {
  files: ProjectFile[];
  activeFileId: string | null;
}

/**
 * Collaborative file system using Yjs
 * Files metadata are stored in a Y.Map and content in separate Y.Text
 */
export function useCollaborativeFileSystem() {
  const { filesMetadata, yDoc, yProvider } = useCollaboration();
  const [state, setState] = useState<FileSystemState>({
    files: [],
    activeFileId: null,
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync Yjs map to local React state
  useEffect(() => {
    if (!filesMetadata || !yDoc || !yProvider) return;

    const textObservers = new Map<string, () => void>();

    // Initial sync - convert Y.Map to array
    const syncFromYjs = () => {
      const files: ProjectFile[] = [];
      filesMetadata.forEach((metadata, fileId) => {
        // Get the Y.Text for this file
        const yText = getOrCreateYjsText(yDoc, fileId);
        files.push({
          id: fileId,
          name: metadata.name,
          content: yText ? yText.toString() : '',
          language: metadata.language,
        });

        // Add observer to Y.Text for content changes (if not already added)
        if (yText && !textObservers.has(fileId)) {
          const contentObserver = () => {
            // Re-sync when content changes
            syncFromYjs();
          };
          yText.observe(contentObserver);
          textObservers.set(fileId, contentObserver);
        }
      });

      // Sort by name for consistent ordering
      files.sort((a, b) => a.name.localeCompare(b.name));

      setState(prev => ({
        ...prev,
        files,
        // Keep active file if it still exists
        activeFileId: prev.activeFileId && files.some(f => f.id === prev.activeFileId)
          ? prev.activeFileId
          : files[0]?.id || null
      }));
    };

    // Initial load
    syncFromYjs();

    // Listen for metadata changes (file create/rename/delete)
    const observer = () => {
      syncFromYjs();
    };

    filesMetadata.observe(observer);

    // Wait for initial sync before creating default file
    // This prevents multiple clients from creating duplicate defaults
    const syncHandler = () => {
      if (!hasInitialized && yProvider.synced && filesMetadata.size === 0) {
        setHasInitialized(true);

        const defaultFileId = generateId();
        const yText = getOrCreateYjsText(yDoc, defaultFileId);
        if (yText) {
          yText.insert(0, '// Welcome to SoraIDE!\nconsole.log("Hello, World!");');
        }

        setYjsFileMetadata(filesMetadata, defaultFileId, {
          name: 'index.js',
          language: 'javascript',
        });
      }
    };

    // Check immediately if already synced
    syncHandler();

    // Listen for sync event
    yProvider.on('synced', syncHandler);

    return () => {
      filesMetadata.unobserve(observer);
      yProvider.off('synced', syncHandler);

      // Cleanup text observers
      textObservers.forEach((observerFn, fileId) => {
        const yText = getOrCreateYjsText(yDoc, fileId);
        if (yText) {
          yText.unobserve(observerFn);
        }
      });
      textObservers.clear();
    };
  }, [filesMetadata, yDoc, yProvider, hasInitialized]);

  // Create new file
  const createFile = useCallback((filename: string, content: string = '') => {
    if (!filesMetadata || !yDoc) return;

    try {
      const sanitized = sanitizeFilename(filename);

      // Check if file already exists
      const exists = Array.from(filesMetadata.keys()).some(key => {
        const metadata = filesMetadata.get(key);
        return metadata && metadata.name === sanitized;
      });

      if (exists) {
        throw new Error(`File "${sanitized}" already exists`);
      }

      const newFileId = generateId();

      // Create Y.Text for file content
      const yText = getOrCreateYjsText(yDoc, newFileId);
      if (yText && content) {
        yText.insert(0, content);
      }

      // Set metadata
      setYjsFileMetadata(filesMetadata, newFileId, {
        name: sanitized,
        language: inferLanguage(sanitized),
      });

      // Set as active file
      setState(prev => ({ ...prev, activeFileId: newFileId }));
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }, [filesMetadata, yDoc]);

  // Update file content (handled by Yjs binding in Editor)
  const updateFile = useCallback((fileId: string, content: string) => {
    if (!yDoc) return;

    const yText = getOrCreateYjsText(yDoc, fileId);
    if (yText) {
      // Clear existing content and insert new
      yText.delete(0, yText.length);
      yText.insert(0, content);
    }
  }, [yDoc]);

  // Rename file
  const renameFile = useCallback((fileId: string, newName: string) => {
    if (!filesMetadata) return;

    try {
      const sanitized = sanitizeFilename(newName);

      // Check if new name already exists
      const exists = Array.from(filesMetadata.keys()).some(key => {
        const metadata = filesMetadata.get(key);
        return metadata && metadata.name === sanitized && key !== fileId;
      });

      if (exists) {
        throw new Error(`File "${sanitized}" already exists`);
      }

      const metadata = filesMetadata.get(fileId);
      if (metadata) {
        setYjsFileMetadata(filesMetadata, fileId, {
          ...metadata,
          name: sanitized,
          language: inferLanguage(sanitized),
        });
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
      throw error;
    }
  }, [filesMetadata]);

  // Delete file
  const deleteFile = useCallback((fileId: string) => {
    if (!filesMetadata || !yDoc) return;

    // Delete metadata
    filesMetadata.delete(fileId);

    // Clear Y.Text content
    const yText = getOrCreateYjsText(yDoc, fileId);
    if (yText) {
      yText.delete(0, yText.length);
    }

    // If we deleted the active file, switch to another
    setState(prev => {
      if (prev.activeFileId === fileId) {
        const remainingFiles = prev.files.filter(f => f.id !== fileId);
        return {
          ...prev,
          activeFileId: remainingFiles[0]?.id || null,
        };
      }
      return prev;
    });
  }, [filesMetadata, yDoc]);

  // Set active file
  const setActiveFile = useCallback((fileId: string | null) => {
    setState(prev => ({ ...prev, activeFileId: fileId }));
  }, []);

  // Get active file
  const activeFile = state.files.find(f => f.id === state.activeFileId) || null;

  // Get file by ID
  const getFileById = useCallback((fileId: string) => {
    return state.files.find(f => f.id === fileId) || null;
  }, [state.files]);

  return {
    files: state.files,
    activeFileId: state.activeFileId,
    activeFile,
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
