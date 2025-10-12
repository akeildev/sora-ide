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
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
  } | null>(null);

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

  const handleRunCode = async () => {
    if (!activeFile) {
      alert('Please select a file to run');
      return;
    }

    setIsExecuting(true);
    setExecutionOutput(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Map file language to Piston language
      const languageMap: Record<string, string> = {
        javascript: 'javascript',
        python: 'python',
        java: 'java',
        cpp: 'c++',
        c: 'c',
        rust: 'rust',
        go: 'go',
        typescript: 'typescript',
      };

      const pistonLanguage = languageMap[activeFile.language];
      if (!pistonLanguage) {
        alert(`Code execution not supported for ${activeFile.language} yet`);
        return;
      }

      const response = await fetch(`${apiUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLanguage,
          files: [
            {
              name: activeFile.name,
              content: activeFile.content,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Execution failed');
      }

      const result = await response.json();

      setExecutionOutput({
        stdout: result.run.stdout,
        stderr: result.run.stderr,
        exitCode: result.run.code,
      });
    } catch (error: any) {
      console.error('Failed to execute code:', error);
      setExecutionOutput({
        stdout: '',
        stderr: error.message || 'Failed to execute code',
        exitCode: 1,
      });
    } finally {
      setIsExecuting(false);
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

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={isExecuting || !activeFile}
            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
            title="Run current file with Piston"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>

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

        {/* Preview / Output Panel */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          {executionOutput ? (
            <div className="h-full flex flex-col bg-[#1e1e1e]">
              {/* Output Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
                <span className="text-sm font-semibold text-gray-300">Execution Output</span>
                <button
                  onClick={() => setExecutionOutput(null)}
                  className="text-gray-400 hover:text-white"
                  title="Clear output"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Output Content */}
              <div className="flex-1 overflow-auto p-3 font-mono text-sm">
                {executionOutput.stdout && (
                  <div className="mb-3">
                    <div className="text-xs text-green-400 mb-1">STDOUT:</div>
                    <pre className="text-gray-300 whitespace-pre-wrap">{executionOutput.stdout}</pre>
                  </div>
                )}

                {executionOutput.stderr && (
                  <div className="mb-3">
                    <div className="text-xs text-red-400 mb-1">STDERR:</div>
                    <pre className="text-red-300 whitespace-pre-wrap">{executionOutput.stderr}</pre>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-3">
                  Exit Code: {executionOutput.exitCode}
                </div>
              </div>
            </div>
          ) : (
            <Preview
              html={previewContent.html}
              css={previewContent.css}
              javascript={previewContent.javascript}
            />
          )}
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
