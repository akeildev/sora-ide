/**
 * useCollaboration Hook
 * Manages Yjs document for collaborative editing
 * Phase 2: Sync editor state with Liveblocks via Yjs
 * Based on official Liveblocks guide: https://liveblocks.io/docs/get-started/yjs-monaco-react
 */

'use client';

import { useRoom } from '@/lib/liveblocks';
import { getYjsProviderForRoom } from '@liveblocks/yjs';
import * as Y from 'yjs';

export interface YjsFileMetadata {
  language: string;
  name: string;
}

/**
 * Get Yjs provider and document from Liveblocks room
 * This hook is SSR-safe (no browser-only imports)
 */
export function useCollaboration() {
  const room = useRoom();
  const yProvider = getYjsProviderForRoom(room);
  const yDoc = yProvider.getYDoc();

  // Get or create files map in Yjs document
  // This stores metadata only, not the content
  const filesMetadata = yDoc.getMap<YjsFileMetadata>('filesMetadata');

  return {
    yDoc,
    yProvider,
    filesMetadata,
    isConnected: yProvider.synced || false,
  };
}

/**
 * Get or create Y.Text for a file
 * Each file gets its own Y.Text bound to the document
 */
export function getOrCreateYjsText(
  yDoc: Y.Doc | null,
  fileId: string
): Y.Text | null {
  if (!yDoc) return null;

  // Use a unique key for each file's content
  const textKey = `file:${fileId}`;
  return yDoc.getText(textKey);
}

/**
 * Get file metadata
 */
export function getYjsFileMetadata(
  filesMetadata: Y.Map<YjsFileMetadata> | null,
  fileId: string
): YjsFileMetadata | null {
  if (!filesMetadata) return null;
  return filesMetadata.get(fileId) || null;
}

/**
 * Set file metadata
 */
export function setYjsFileMetadata(
  filesMetadata: Y.Map<YjsFileMetadata> | null,
  fileId: string,
  metadata: YjsFileMetadata
) {
  if (!filesMetadata) return;
  filesMetadata.set(fileId, metadata);
}

/**
 * Update file metadata (name, language) in Yjs
 */
export function updateYjsFileMetadata(
  filesMetadata: Y.Map<YjsFileMetadata> | null,
  fileId: string,
  updates: Partial<YjsFileMetadata>
) {
  if (!filesMetadata) return;

  const existing = filesMetadata.get(fileId);
  if (!existing) return;

  filesMetadata.set(fileId, {
    ...existing,
    ...updates,
  });
}

/**
 * Delete file from Yjs document
 */
export function deleteYjsFile(
  yDoc: Y.Doc | null,
  filesMetadata: Y.Map<YjsFileMetadata> | null,
  fileId: string
) {
  if (!filesMetadata) return;

  // Delete metadata
  filesMetadata.delete(fileId);

  // Clear the Y.Text content for this file
  if (yDoc) {
    const textKey = `file:${fileId}`;
    const yText = yDoc.getText(textKey);
    yText.delete(0, yText.length);
  }
}
