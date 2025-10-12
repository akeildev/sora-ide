/**
 * Cursors Component
 * Displays collaborative cursors for Monaco editor
 * Based on official Liveblocks pattern
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelf } from '@/lib/liveblocks';
import type { LiveblocksYjsProvider } from '@liveblocks/yjs';

type UserAwareness = {
  user?: {
    name: string;
    color: string;
  };
};

type AwarenessList = [number, UserAwareness][];

type Props = {
  yProvider: LiveblocksYjsProvider;
};

export function Cursors({ yProvider }: Props) {
  // Get user info from Liveblocks
  const userInfo = useSelf((me) => me.info);

  const [awarenessUsers, setAwarenessUsers] = useState<AwarenessList>([]);

  useEffect(() => {
    // Set local user info in Yjs awareness
    const localUser = userInfo || {
      name: 'Anonymous',
      color: '#4ECDC4',
    };

    yProvider.awareness.setLocalStateField('user', localUser);

    // Update awareness users when changes occur
    function setUsers() {
      setAwarenessUsers([...yProvider.awareness.getStates()] as AwarenessList);
    }

    yProvider.awareness.on('change', setUsers);
    setUsers();

    return () => {
      yProvider.awareness.off('change', setUsers);
    };
  }, [yProvider, userInfo]);

  // Generate dynamic CSS for cursor colors and names
  const styleSheet = useMemo(() => {
    let cursorStyles = '';

    for (const [clientId, client] of awarenessUsers) {
      if (client?.user) {
        cursorStyles += `
          .yRemoteSelection-${clientId},
          .yRemoteSelectionHead-${clientId} {
            --user-color: ${client.user.color || '#4ECDC4'};
          }

          .yRemoteSelectionHead-${clientId}::after {
            content: "${client.user.name}";
          }
        `;
      }
    }

    return { __html: cursorStyles };
  }, [awarenessUsers]);

  return <style dangerouslySetInnerHTML={styleSheet} />;
}
