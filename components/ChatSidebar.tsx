'use client';

interface Chat {
  id: string;
  title: string;
  timestamp: number;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ chats, activeChat, onSelectChat, onNewChat }: ChatSidebarProps) {
  return (
    <div className="h-full bg-[#f9f9f9] dark:bg-[#1e1e1e] flex flex-col">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New chat</span>
        </button>
      </div>

      {/* Chats Section */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>Chats</span>
        </div>
      </div>

      {/* Recents */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-500 px-2 py-1 mb-1">
            Recents
          </div>
          {chats.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-gray-400">
              No chats yet
            </div>
          ) : (
            <div className="space-y-0.5">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeChat === chat.id
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="truncate text-gray-800 dark:text-gray-200">{chat.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
