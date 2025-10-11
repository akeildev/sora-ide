/**
 * PresenceAvatars Component
 * Shows active collaborators with their cursors
 * Phase 2: Real-time presence indicators
 */

'use client';

import { useOthers, useSelf } from '@/lib/liveblocks';

export function PresenceAvatars() {
  const others = useOthers();
  const self = useSelf();

  return (
    <div className="flex items-center gap-2">
      {/* Current user */}
      {self && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
          style={{ backgroundColor: self.presence.user.color }}
          title={`${self.presence.user.name} (You)`}
        >
          {getInitials(self.presence.user.name)}
        </div>
      )}

      {/* Other users */}
      {others.map((other) => (
        <div
          key={other.connectionId}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-gray-700"
          style={{ backgroundColor: other.presence.user.color }}
          title={other.presence.user.name}
        >
          {getInitials(other.presence.user.name)}
        </div>
      ))}

      {/* Total count */}
      {others.length > 0 && (
        <span className="text-xs text-gray-400 ml-1">
          +{others.length} online
        </span>
      )}
    </div>
  );
}

/**
 * Get user initials from name
 */
function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
