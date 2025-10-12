'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserProjects, createProject, deleteProject, joinProjectByRoomCode } from '@/lib/projects';
import type { Project } from '@/types';

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadProjects();
    }
  }, [user, loading, router]);

  const loadProjects = async () => {
    if (!user) return;
    const userProjects = await getUserProjects(user.uid);
    setProjects(userProjects);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      const project = await createProject({
        name: projectName,
        description: projectDescription,
        ownerId: user.uid,
      });

      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Delete this project? This cannot be undone.')) {
      try {
        await deleteProject(projectId);
        await loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project');
      }
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roomCode.trim()) return;

    setIsJoining(true);
    setJoinMessage(null);

    try {
      const project = await joinProjectByRoomCode(roomCode.trim(), user.uid);
      setJoinMessage({
        type: 'success',
        text: `Successfully joined "${project.name}"!`
      });

      // Navigate to the project after a brief delay
      setTimeout(() => {
        router.push(`/editor/${project.id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to join project:', error);
      setJoinMessage({
        type: 'error',
        text: error.message || 'Invalid room code or project not found'
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">My Projects</h1>
            <p className="text-gray-400 mt-2">Welcome, {user?.email}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            + New Project
          </button>
        </div>

        {/* Join Room Code Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Join Project by Room Code</h2>
          <form onSubmit={handleJoinRoom} className="flex gap-3">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 5-letter code (e.g., ABC12)"
              maxLength={5}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-center text-xl font-bold tracking-widest"
              disabled={isJoining}
            />
            <button
              type="submit"
              disabled={isJoining || roomCode.length !== 5}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </form>

          {/* Join Message */}
          {joinMessage && (
            <div className={`mt-3 text-sm p-3 rounded ${
              joinMessage.type === 'success'
                ? 'bg-green-900 text-green-200 border border-green-700'
                : 'bg-red-900 text-red-200 border border-red-700'
            }`}>
              {joinMessage.text}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-colors">
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {project.description || 'No description'}
              </p>
              <p className="text-gray-500 text-xs mb-4">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/editor/${project.id}`)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Open
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">No projects yet</p>
            <p className="text-sm mt-2">Create your first project to get started!</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  placeholder="My Awesome Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  placeholder="What are you building?"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
