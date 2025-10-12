'use client';

import { useState } from 'react';
import { addCollaborator, getUserByEmail } from '@/lib/projects';

interface ShareProjectModalProps {
  projectId: string;
  projectName: string;
  roomCode?: string;
  onClose: () => void;
}

export function ShareProjectModal({ projectId, projectName, roomCode, onClose }: ShareProjectModalProps) {
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);

  const projectUrl = `${window.location.origin}/editor/${projectId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setRoomCodeCopied(true);
      setTimeout(() => setRoomCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setIsAdding(true);
    setMessage(null);

    try {
      // Look up user by email
      const user = await getUserByEmail(email.trim());

      if (!user) {
        setMessage({
          type: 'error',
          text: 'User not found. They need to sign up first.'
        });
        setIsAdding(false);
        return;
      }

      // Add as collaborator
      await addCollaborator(projectId, user.uid);

      setMessage({
        type: 'success',
        text: `${email} can now access this project!`
      });
      setEmail('');
    } catch (error: any) {
      console.error('Failed to add collaborator:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to add collaborator'
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#252526] rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Share &quot;{projectName}&quot;</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Room Code Section */}
          {roomCode && (
            <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded p-4">
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Room Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-[#1e1e1e] border border-blue-500 rounded text-center">
                  <span className="text-2xl font-bold tracking-widest text-white">
                    {roomCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyRoomCode}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    roomCodeCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {roomCodeCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-blue-200 mt-2">
                Share this code for quick access to your project
              </p>
            </div>
          )}

          {/* Copy Link Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={projectUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-gray-700 rounded text-gray-300 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Anyone with access can view and edit this project
            </p>
          </div>

          {/* Add Collaborator Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add Collaborator by Email
            </label>
            <form onSubmit={handleAddCollaborator} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-gray-700 rounded text-gray-300 text-sm"
                disabled={isAdding}
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </form>

            {/* Message */}
            {message && (
              <div className={`mt-2 text-sm p-2 rounded ${
                message.type === 'success'
                  ? 'bg-green-900 text-green-200 border border-green-700'
                  : 'bg-red-900 text-red-200 border border-red-700'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded p-3">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Collaborators can:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>View and edit all files</li>
                  <li>See real-time changes from others</li>
                  <li>Share the preview</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
