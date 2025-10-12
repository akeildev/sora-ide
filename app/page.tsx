'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';

export default function Home() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-white">SoraIDE</h1>
        <p className="text-2xl text-gray-300 mb-8">
          Collaborative Code Editor
        </p>
        <div className="flex flex-col items-center gap-4">
          {user ? (
            <>
              <p className="text-gray-400">Welcome, {user.email}</p>
              <Link
                href="/projects"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors"
              >
                My Projects
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors"
              >
                Sign In to Start
              </button>
              <div className="flex items-center gap-4">
                <div className="h-px bg-gray-700 w-12" />
                <span className="text-gray-500 text-sm">or</span>
                <div className="h-px bg-gray-700 w-12" />
              </div>
              <Link
                href="/guest-join"
                className="px-8 py-3 border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-lg font-semibold rounded-lg transition-colors"
              >
                Join as Guest
              </Link>
            </>
          )}
        </div>
        <div className="mt-12 text-sm text-gray-600 space-y-2">
          <p>✅ Multi-file editing</p>
          <p>✅ Monaco Editor with syntax highlighting</p>
          <p>✅ Resizable panels</p>
          <p>✅ Real-time collaboration</p>
          <p>🚧 Code execution (Phase 4)</p>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
