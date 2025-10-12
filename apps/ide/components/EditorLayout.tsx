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
import { useMemo, useState } from 'react';

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

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

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

  const handleSharePreview = async () => {
    setIsSharing(true);
    setShareUrl(null);

    try {
      const previewUrl = process.env.NEXT_PUBLIC_PREVIEW_URL || 'http://localhost:5000';
      const response = await fetch(`${previewUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: previewContent.html,
          css: previewContent.css,
          javascript: previewContent.javascript,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create preview session');
      }

      const data = await response.json();
      setShareUrl(data.url);

      // Copy URL to clipboard
      await navigator.clipboard.writeText(data.url);
    } catch (error) {
      console.error('Failed to share preview:', error);
      alert('Failed to create shareable preview URL');
    } finally {
      setIsSharing(false);
    }
  };

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

          {/* Share Preview Button */}
          <button
            onClick={handleSharePreview}
            disabled={isSharing || (!previewContent.html && !previewContent.css && !previewContent.javascript)}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
            title="Create shareable preview URL (60 min expiry)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {isSharing ? 'Sharing...' : 'Share Preview'}
          </button>

          {shareUrl && (
            <div className="text-xs text-green-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              URL copied!
            </div>
          )}

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
