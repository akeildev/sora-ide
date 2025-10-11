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
import { useCollaborativeFileSystem } from '../hooks/useCollaborativeFileSystem';

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

        {/* Output Panel (Placeholder for Phase 4) */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <div className="h-full bg-[#1e1e1e] border-l border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <span className="text-sm font-semibold text-gray-400 uppercase">Output</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">Output panel</p>
                <p className="text-xs text-gray-700 mt-1">Coming in Phase 4</p>
              </div>
            </div>
          </div>
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
