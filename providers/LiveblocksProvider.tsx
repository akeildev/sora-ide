/**
 * CollaborativeRoom Component
 * Wraps editor with Liveblocks room context
 * Phase 2: Enables real-time collaboration
 * Based on: https://liveblocks.io/docs/get-started/yjs-monaco-react
 */

'use client';

import { ReactNode } from 'react';
import { RoomProvider } from '@/lib/liveblocks';
import { ClientSideSuspense } from '@liveblocks/react/suspense';

interface CollaborativeRoomProps {
  children: ReactNode;
  roomId: string;
  userId?: string;
  userName?: string;
}

export function CollaborativeRoom({
  children,
  roomId,
  userId = 'anonymous',
  userName = 'Anonymous User',
}: CollaborativeRoomProps) {
  // Generate random color for user
  const userColor = generateUserColor(userId);

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        activeFileId: null,
        agentEditing: false,
        user: {
          name: userName,
          color: userColor,
        },
      }}
    >
      <ClientSideSuspense fallback={<LoadingCollaboration />}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

/**
 * Loading state while connecting to Liveblocks
 */
function LoadingCollaboration() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Connecting to collaboration room...</p>
      </div>
    </div>
  );
}

/**
 * Generate deterministic color from user ID
 */
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52B788', // Green
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
