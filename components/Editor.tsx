/**
 * Editor Component
 * Monaco Editor wrapper with collaborative editing
 * Phase 2: Yjs integration for real-time collaboration
 */

'use client';

import { Editor as MonacoEditor } from '@monaco-editor/react';
import { ProjectFile } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { useCollaboration, getOrCreateYjsText } from '@/hooks/useCollaboration';
import { Cursors } from './Cursors';
import type { Awareness } from 'y-protocols/awareness';

interface EditorProps {
  file: ProjectFile | null;
  onFileChange: (fileId: string, content: string) => void;
}

export function Editor({ file, onFileChange }: EditorProps) {
  const editorRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bindingRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Get Yjs collaboration hooks
  const { yDoc, yProvider, isConnected } = useCollaboration();

  // Get Yjs text for current file
  const yjsText = file && yDoc
    ? getOrCreateYjsText(yDoc, file.id)
    : null;

  // Handle Monaco binding with Yjs (client-side only)
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !yjsText || !yProvider || !file) {
      return;
    }

    const editor = editorRef.current;
    const model = editor.getModel();

    if (!model) {
      return;
    }

    // Dynamically import y-monaco (browser-only)
    import('y-monaco').then(({ MonacoBinding }) => {
      if (editorRef.current && yjsText && yProvider) {
        // Create Monaco binding with awareness for collaborative cursors
        bindingRef.current = new MonacoBinding(
          yjsText,
          model,
          new Set([editor]),
          yProvider.awareness as unknown as Awareness
        );
      }
    });

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [isEditorReady, file?.id, yjsText, yProvider]);

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
    });

    // Focus editor
    editor.focus();

    // Mark editor as ready
    setIsEditorReady(true);
  };

  // Handle content changes with debounced auto-save
  // Note: With Yjs, changes are automatically synced
  // This is kept for backward compatibility when not connected
  const handleEditorChange = (value: string | undefined) => {
    if (!file || value === undefined) return;

    // If not using Yjs, use local state
    if (!isConnected) {
      setAutoSaveStatus('saving');

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce save for 500ms
      timeoutRef.current = setTimeout(() => {
        onFileChange(file.id, value);
        setAutoSaveStatus('saved');

        // Reset to idle after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      }, 500);
    } else {
      // When connected, Yjs auto-syncs - show brief confirmation
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 1500);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // No file selected
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg">No file selected</p>
          <p className="text-sm text-gray-600 mt-2">Select a file from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Collaborative cursors */}
      {yProvider && <Cursors yProvider={yProvider} />}

      {/* Status indicators */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {/* Collaboration status */}
        {isConnected && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-xs rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        )}

        {/* Autosave status */}
        {autoSaveStatus !== 'idle' && (
          <div className={`flex items-center gap-2 px-3 py-1 text-xs rounded-full transition-all ${
            autoSaveStatus === 'saved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}>
            {autoSaveStatus === 'saving' ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Saved</span>
              </>
            )}
          </div>
        )}
      </div>

      <MonacoEditor
        height="100%"
        language={file.language}
        value={isConnected ? undefined : file.content}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly: false,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'inline',
        }}
      />
    </div>
  );
}
