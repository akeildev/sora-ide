import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-white">SoraIDE</h1>
        <p className="text-2xl text-gray-300 mb-8">
          Collaborative Code Editor
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/editor"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Open Editor
          </Link>
          <p className="text-sm text-gray-500">
            Phase 1: Core IDE ✅
          </p>
        </div>
        <div className="mt-12 text-sm text-gray-600 space-y-2">
          <p>✅ Multi-file editing</p>
          <p>✅ Monaco Editor with syntax highlighting</p>
          <p>✅ Resizable panels</p>
          <p>🚧 Real-time collaboration (Phase 2)</p>
          <p>🚧 Code execution (Phase 4)</p>
        </div>
      </div>
    </div>
  );
}
