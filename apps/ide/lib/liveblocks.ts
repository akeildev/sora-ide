/**
 * Liveblocks Client Configuration
 * Phase 2: Real-time collaboration setup
 */

import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,

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
