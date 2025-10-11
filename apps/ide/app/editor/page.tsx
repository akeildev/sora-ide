/**
 * Editor Page
 * Main IDE interface
 * Phase 2: Added Liveblocks collaboration
 */

'use client';

import { Suspense } from 'react';
import { EditorLayout } from '@/components/EditorLayout';
import { RoomProvider } from '@/lib/liveblocks';
import { ClientSideSuspense } from '@liveblocks/react';
import { useSearchParams } from 'next/navigation';

function EditorContent() {
  const searchParams = useSearchParams();

  // Get room ID from URL or generate default
  // Format: /editor?room=abc123
  const roomId = searchParams.get('room') || 'default-room';

  // TODO Phase 3: Get user info from Firebase Auth
  const userId = 'anonymous-' + Math.random().toString(36).substring(7);
  const userName = 'Anonymous User';
  const userColor = generateUserColor(userId);

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        activeFileId: null,
        user: {
          name: userName,
          color: userColor,
        },
      }}
    >
      <ClientSideSuspense fallback={<div className="h-screen flex items-center justify-center bg-[#1e1e1e] text-gray-400">Loading collaboration...</div>}>
        <EditorLayout />
      </ClientSideSuspense>
    </RoomProvider>
  );
}

function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorContent />
    </Suspense>
  );
}

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading editor...</p>
      </div>
    </div>
  );
}
