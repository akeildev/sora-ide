'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { joinProjectByRoomCode } from '@/lib/projects';

function GuestJoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInAsGuest, user } = useAuth();

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill room code from URL if provided
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/projects');
    }
  }, [user, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Please enter your name');
      }
      if (!roomCode.trim()) {
        throw new Error('Please enter a room code');
      }

      // Sign in anonymously with display name
      const guestUser = await signInAsGuest(name.trim());

      // Join the project using room code
      const project = await joinProjectByRoomCode(roomCode.trim(), guestUser.uid);

      // Navigate to the project editor
      router.push(`/editor/${project.id}`);
    } catch (err: any) {
      console.error('Guest join error:', err);
      setError(err.message || 'Failed to join project. Please check the room code and try again.');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Join as Guest
            </h1>
            <p className="text-gray-400">
              Enter your name and room code to get started
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                disabled={isJoining}
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                placeholder="Enter 5-letter code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition uppercase tracking-wider text-center text-xl font-mono"
                required
                disabled={isJoining}
                maxLength={5}
                pattern="[A-Za-z]{5}"
                title="Room code must be 5 letters"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                'Join Project'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              Have an account?{' '}
              <button
                onClick={() => router.push('/')}
                className="text-blue-400 hover:text-blue-300 font-medium transition"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Guest sessions are temporary and will be cleared when you close your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GuestJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <GuestJoinForm />
    </Suspense>
  );
}
