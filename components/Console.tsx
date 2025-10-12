'use client';

import { useState, useEffect } from 'react';

interface ConsoleMessage {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

interface ConsoleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Console({ isOpen, onToggle }: ConsoleProps) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (event.data.type === 'console') {
        const newMessage: ConsoleMessage = {
          id: crypto.randomUUID(),
          type: event.data.method,
          message: event.data.args.join(' '),
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const clearConsole = () => {
    setMessages([]);
  };

  const getIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warn':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTextColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-300';
      case 'warn':
        return 'text-yellow-300';
      case 'info':
        return 'text-blue-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className={`bg-[#1e1e1e] border-t border-gray-700 transition-all duration-300 ${
      isOpen ? 'h-64' : 'h-10'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
            title={isOpen ? 'Collapse console' : 'Expand console'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-300">Console</span>
          {messages.length > 0 && (
            <span className="text-xs text-gray-500">({messages.length})</span>
          )}
        </div>
        {isOpen && (
          <button
            onClick={clearConsole}
            className="text-xs text-gray-400 hover:text-white transition-colors"
            title="Clear console"
          >
            Clear
          </button>
        )}
      </div>

      {/* Console Output */}
      {isOpen && (
        <div className="h-[calc(100%-40px)] overflow-y-auto p-2 font-mono text-xs">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Console is empty. Messages from your code will appear here.
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-start gap-2 px-2 py-1 hover:bg-gray-800 rounded"
                >
                  {getIcon(msg.type)}
                  <span className={`flex-1 whitespace-pre-wrap ${getTextColor(msg.type)}`}>
                    {msg.message}
                  </span>
                  <span className="text-gray-600 text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
