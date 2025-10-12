/**
 * EditorLayout Component
 * Resizable three-panel layout: FileTree | Editor | Output
 * Phase 1: FileTree + Editor only (Output is placeholder)
 */

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FileTree } from './FileTree';
import { TabBar } from './TabBar';
import { Editor } from './Editor';
import { PresenceAvatars } from './PresenceAvatars';
import { Preview } from './Preview';
import { ShareProjectModal } from './ShareProjectModal';
import { Console } from './Console';
import { useCollaborativeFileSystem } from '../hooks/useCollaborativeFileSystem';
import { useMemo, useState, useEffect } from 'react';

export function EditorLayout({ projectId, projectName }: { projectId?: string; projectName?: string } = {}) {
  const {
    files,
    activeFileId,
    activeFile,
    createFile,
    updateFile,
    renameFile,
    deleteFile,
    setActiveFile,
  } = useCollaborativeFileSystem();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Extract HTML, CSS, and JavaScript files for preview
  const previewContent = useMemo(() => {
    const htmlFile = files.find(f => f.language === 'html');
    const cssFile = files.find(f => f.language === 'css');
    const jsFile = files.find(f => f.language === 'javascript');

    return {
      html: htmlFile?.content || '',
      css: cssFile?.content || '',
      javascript: jsFile?.content || '',
    };
  }, [files]);

  const handleSave = async () => {
    if (!activeFile) return;

    setSaveStatus('saving');

    try {
      // Force update the file (this triggers Yjs sync)
      updateFile(activeFile.id, activeFile.content);

      // Show saved status
      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('idle');
    }
  };

  // Add keyboard shortcut for Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]); // Re-attach when active file changes

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">{projectName || 'SoraIDE'}</h1>
          <span className="text-xs text-gray-500">Phase 2: Collaboration</span>
        </div>
        <div className="flex items-center gap-4">
          <PresenceAvatars />

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!activeFile || saveStatus === 'saving'}
            className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
              saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-800 disabled:cursor-not-allowed'
            }`}
            title="Save current file (Ctrl/Cmd+S)"
          >
            {saveStatus === 'saving' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </>
            )}
          </button>

          {/* Share Project Button */}
          <button
            onClick={() => setShowShareModal(true)}
            disabled={!projectId}
            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
            title="Share project with collaborators"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Share Project
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* File Tree Panel */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <FileTree
            files={files}
            activeFileId={activeFileId}
            onFileSelect={setActiveFile}
            onFileCreate={createFile}
            onFileRename={renameFile}
            onFileDelete={deleteFile}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

        {/* Editor Panel */}
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col">
            <TabBar
              files={files}
              activeFileId={activeFileId}
              onTabSelect={setActiveFile}
              onTabClose={deleteFile}
            />
            <div className="flex-1">
              <Editor file={activeFile} onFileChange={updateFile} />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

        {/* Preview Panel */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <Preview
            html={previewContent.html}
            css={previewContent.css}
            javascript={previewContent.javascript}
          />
        </Panel>
      </PanelGroup>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#007acc] text-white text-xs">
        <div className="flex items-center gap-4">
          <span>
            {activeFile ? activeFile.name : 'No file selected'}
          </span>
          {activeFile && (
            <span className="text-blue-200">
              {activeFile.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Ln 1, Col 1</span>
        </div>
      </div>

      {/* Console Panel */}
      <Console isOpen={isConsoleOpen} onToggle={() => setIsConsoleOpen(!isConsoleOpen)} />

      {/* Share Project Modal */}
      {showShareModal && projectId && projectName && (
        <ShareProjectModal
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
