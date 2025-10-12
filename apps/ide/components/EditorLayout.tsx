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
import { useCollaborativeFileSystem } from '../hooks/useCollaborativeFileSystem';
import { useMemo } from 'react';

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
    </div>
  );
}
