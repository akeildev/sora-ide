'use client';

import { use, useEffect, useState } from 'react';
import { EditorLayout } from '@/components/EditorLayout';
import { RoomProvider } from '@/lib/liveblocks';
import { ClientSideSuspense } from '@liveblocks/react';
import { useAuth } from '@/hooks/useAuth';
import { getProject } from '@/lib/projects';
import { useRouter } from 'next/navigation';
import type { Project } from '@repo/types';

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      // Wait for auth to finish loading
      if (authLoading) return;

      // Redirect if not authenticated
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const proj = await getProject(projectId);

        if (!proj) {
          setError('Project not found');
          return;
        }

        // Check if user has access
        const hasAccess = proj.ownerId === user.uid || proj.collaborators.includes(user.uid);
        if (!hasAccess) {
          setError('You do not have access to this project');
          return;
        }

        setProject(proj);
      } catch (err) {
        console.error('Failed to load project:', err);
        setError('Failed to load project');
      } finally {
        setLoadingProject(false);
      }
    }

    loadProject();
  }, [user, authLoading, projectId, router]);

  if (authLoading || loadingProject) {
    return <EditorLoading />;
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-xl text-gray-400 mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const userColor = generateUserColor(user!.uid);
  const userName = user!.displayName || user!.email || 'Anonymous';

  return (
    <RoomProvider
      id={project.liveblocksRoom}
      initialPresence={{
        cursor: null,
        activeFileId: null,
        user: {
          name: userName,
          color: userColor,
        },
      }}
    >
      <ClientSideSuspense fallback={<EditorLoading />}>
        <EditorLayout projectId={projectId} projectName={project.name} />
      </ClientSideSuspense>
    </RoomProvider>
  );
}

function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading editor...</p>
      </div>
    </div>
  );
}
