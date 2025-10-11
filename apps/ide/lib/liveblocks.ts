/**
 * Liveblocks Client Configuration
 * Phase 2: Real-time collaboration setup
 */

import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
import { auth } from './firebase';

const client = createClient({
  authEndpoint: async (room) => {
    // Get the current user's ID token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const idToken = await user.getIdToken();

    // Call our auth API route
    const response = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ room }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Liveblocks');
    }

    return await response.json();
  },

  // Throttle updates to reduce bandwidth
  throttle: 100,
});

// Define Liveblocks types for presence and storage
type Presence = {
  cursor: { x: number; y: number } | null;
  activeFileId: string | null;
  user: {
    name: string;
    color: string;
  };
};

type Storage = {
  // Yjs document for collaborative editing
  // Will be managed by Yjs provider
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    email?: string;
    avatar?: string;
  };
};

type RoomEvent = {
  // Custom events (e.g., file created, deleted)
  type: 'FILE_CREATED' | 'FILE_DELETED' | 'FILE_RENAMED';
  data: any;
};

// Create typed hooks for Liveblocks
const roomContext = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useSelf,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useErrorListener,
  useStorage,
  useBatch,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStatus,
  useLostConnectionListener,
} = roomContext.suspense;

export { client };
