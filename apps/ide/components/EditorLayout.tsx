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
import { ChatSidebar } from './ChatSidebar';
import { ChatPanel } from './ChatPanel';
import { useCollaborativeFileSystem } from '../hooks/useCollaborativeFileSystem';
import { useMyPresence, useOthers } from '../lib/liveblocks';
import { useAuth } from '../hooks/useAuth';
import { getProjectChats, saveChat, updateChatMessages, type Chat as FirestoreChat, type ChatMessage } from '../lib/projects';
import { useMemo, useState, useEffect } from 'react';

interface Chat {
  id: string;
  title: string;
  timestamp: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: boolean;
}

export function EditorLayout({ projectId, projectName }: { projectId?: string; projectName?: string } = {}) {
  const { user } = useAuth();
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

  // Liveblocks presence for agent locking
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Chat/Code mode toggle
  const [mode, setMode] = useState<'code' | 'chat'>('code');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);

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

  // Load chats from Firestore on mount
  useEffect(() => {
    if (!projectId || !user) return;

    async function loadChats() {
      try {
        const loadedChats = await getProjectChats(projectId!, user!.uid);
        setChats(loadedChats.map(c => ({
          id: c.id,
          title: c.title,
          timestamp: c.createdAt,
        })));
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    }

    loadChats();
  }, [projectId, user]);

  // Chat handlers
  const handleNewChat = async () => {
    if (!projectId || !user) return;

    const newChat: FirestoreChat = {
      id: crypto.randomUUID(),
      title: 'Untitled',
      projectId,
      userId: user.uid,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveChat(newChat);
    setChats(prev => [{ id: newChat.id, title: newChat.title, timestamp: newChat.createdAt }, ...prev]);
    setActiveChat(newChat.id);
    setMessages([]);
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChat(chatId);

    // Load messages from Firestore
    try {
      const chat = await getProjectChats(projectId!, user!.uid);
      const selectedChat = chat.find(c => c.id === chatId);
      if (selectedChat) {
        setMessages(selectedChat.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })));
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!activeChat || !projectId || !user) return;

    // Check if another agent is currently editing
    const otherAgentEditing = others.find(other => other.presence.agentEditing);
    if (otherAgentEditing) {
      const waitingMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⏳ Waiting for ${otherAgentEditing.presence.user.name}'s agent to finish editing code...`,
        timestamp: Date.now(),
        error: false,
      };
      setMessages(prev => [...prev, waitingMessage]);

      // Poll until agent is done
      const pollInterval = setInterval(() => {
        const stillEditing = others.find(other => other.presence.agentEditing);
        if (!stillEditing) {
          clearInterval(pollInterval);
          // Remove waiting message and retry
          setMessages(prev => prev.filter(m => m.id !== waitingMessage.id));
          handleSendMessage(message);
        }
      }, 1000);

      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Update chat title if this is the first message
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage) {
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChat) {
          return { ...chat, title: message.slice(0, 50) };
        }
        return chat;
      }));
    }

    // Set agent editing lock
    updateMyPresence({ agentEditing: true });
    setIsAILoading(true);

    try {
      // Call AI API with full conversation history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          projectId,
          userId: user.uid,
          files: files.map(f => ({ id: f.id, name: f.name, language: f.language, content: f.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'I apologize, I could not process that request.',
        timestamp: Date.now(),
        operations: data.operations,
      };

      // Execute file operations if any
      if (data.operations && data.operations.length > 0) {
        for (const op of data.operations) {
          if (op.type === 'CREATE_FILE') {
            createFile(op.name, op.content, op.language);
          } else if (op.type === 'UPDATE_FILE') {
            updateFile(op.fileId, op.content);
          } else if (op.type === 'DELETE_FILE') {
            deleteFile(op.fileId);
          }
        }
      }

      setMessages(prev => [...prev, aiMessage]);

      // Save chat to Firestore
      await updateChatMessages(activeChat, [...messages, userMessage, aiMessage]);

      // Update chat title in Firestore if first message
      if (isFirstMessage) {
        const chatData = await getProjectChats(projectId, user.uid);
        const currentChat = chatData.find(c => c.id === activeChat);
        if (currentChat) {
          await saveChat({
            ...currentChat,
            title: message.slice(0, 50),
            updatedAt: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Release agent editing lock
      updateMyPresence({ agentEditing: false });
      setIsAILoading(false);
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

          {/* Chat/Code Toggle */}
          <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-lg p-1">
            <button
              onClick={() => setMode('code')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mode === 'code'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mode === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Chat
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <PresenceAvatars />

          {/* Save Button - Only in Code mode */}
          {mode === 'code' && (
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
          )}

          {/* Share Project Button - Only in Code mode */}
          {mode === 'code' && (
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
          )}

          {mode === 'code' && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {mode === 'chat' && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{chats.length} chat{chats.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <PanelGroup direction="horizontal" className="flex-1">
        {mode === 'code' ? (
          <>
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
          </>
        ) : (
          <>
            {/* Chat Sidebar Panel */}
            <Panel defaultSize={20} minSize={15} maxSize={40}>
              <ChatSidebar
                chats={chats}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
              />
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

            {/* Chat Panel */}
            <Panel defaultSize={60} minSize={30}>
              <ChatPanel
                chatTitle={chats.find(c => c.id === activeChat)?.title || 'Untitled'}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isAILoading}
              />
            </Panel>
          </>
        )}

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

        {/* Preview Panel - Always visible */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <Preview files={files} />
        </Panel>
      </PanelGroup>

      {/* Status Bar - Only in Code mode */}
      {mode === 'code' && (
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
      )}

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
