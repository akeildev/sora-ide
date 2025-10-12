/**
 * Shared TypeScript types for SoraIDE
 */

// ============= Project Types =============

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  collaborators: string[]; // User IDs who can access this project
  liveblocksRoom: string; // Liveblocks room ID (format: "project:{projectId}")
  roomCode?: string; // 5-letter code for easy project sharing
  createdAt: number;
  updatedAt: number;
}

export interface ProjectFile {
  id: string;
  name: string; // e.g., "main.py", "utils.js", "README.md"
  content: string;
  language: string; // Monaco language ID: "python", "javascript", etc.
}

export interface ProjectMetadata {
  id: string;
  name: string;
  ownerId: string;
  public: boolean;
  fileCount: number;
  createdAt: number;
  updatedAt: number;
}

// ============= Code Execution Types =============

export interface RunRequest {
  language: string; // e.g., "python", "javascript"
  version?: string; // e.g., "3.10", "latest"
  files: Array<{
    name: string;
    content: string;
  }>;
  stdin?: string;
  args?: string[];
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  time?: number; // milliseconds
  memory?: number; // bytes
  error?: string;
}

// ============= User Types =============

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: number;
}

export interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
}

// ============= Comment Types (Liveblocks) =============

export interface CommentThread {
  id: string;
  fileId: string;
  lineStart: number;
  lineEnd: number;
  code: string; // Snippet of code being commented on
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: number;
  editedAt?: number;
}

// ============= File System Types =============

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  parent?: string;
}

// ============= Language Support =============

export interface LanguageConfig {
  id: string;
  name: string;
  extensions: string[]; // [".py", ".python"]
  monacoLanguage: string; // "python"
  pistonLanguage: string; // "python"
  pistonVersion?: string; // "3.10"
  icon: string; // emoji or icon name
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 'python',
    name: 'Python',
    extensions: ['.py'],
    monacoLanguage: 'python',
    pistonLanguage: 'python',
    pistonVersion: '3.10',
    icon: '🐍'
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['.js', '.mjs'],
    monacoLanguage: 'javascript',
    pistonLanguage: 'javascript',
    pistonVersion: 'latest',
    icon: '🟨'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['.ts'],
    monacoLanguage: 'typescript',
    pistonLanguage: 'typescript',
    pistonVersion: 'latest',
    icon: '🔷'
  },
  {
    id: 'java',
    name: 'Java',
    extensions: ['.java'],
    monacoLanguage: 'java',
    pistonLanguage: 'java',
    icon: '☕'
  },
  {
    id: 'cpp',
    name: 'C++',
    extensions: ['.cpp', '.cc', '.cxx'],
    monacoLanguage: 'cpp',
    pistonLanguage: 'c++',
    icon: '⚙️'
  },
  {
    id: 'c',
    name: 'C',
    extensions: ['.c'],
    monacoLanguage: 'c',
    pistonLanguage: 'c',
    icon: '📘'
  },
  {
    id: 'go',
    name: 'Go',
    extensions: ['.go'],
    monacoLanguage: 'go',
    pistonLanguage: 'go',
    icon: '🐹'
  },
  {
    id: 'rust',
    name: 'Rust',
    extensions: ['.rs'],
    monacoLanguage: 'rust',
    pistonLanguage: 'rust',
    icon: '🦀'
  },
  {
    id: 'ruby',
    name: 'Ruby',
    extensions: ['.rb'],
    monacoLanguage: 'ruby',
    pistonLanguage: 'ruby',
    icon: '💎'
  },
  {
    id: 'php',
    name: 'PHP',
    extensions: ['.php'],
    monacoLanguage: 'php',
    pistonLanguage: 'php',
    icon: '🐘'
  },
  {
    id: 'html',
    name: 'HTML',
    extensions: ['.html', '.htm'],
    monacoLanguage: 'html',
    pistonLanguage: 'html',
    icon: '🌐'
  },
  {
    id: 'css',
    name: 'CSS',
    extensions: ['.css'],
    monacoLanguage: 'css',
    pistonLanguage: 'css',
    icon: '🎨'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extensions: ['.md', '.markdown'],
    monacoLanguage: 'markdown',
    pistonLanguage: 'markdown',
    icon: '📝'
  }
];

// ============= Utility Functions =============

export function getLanguageFromExtension(filename: string): LanguageConfig | undefined {
  const ext = filename.substring(filename.lastIndexOf('.'));
  return SUPPORTED_LANGUAGES.find(lang => lang.extensions.includes(ext));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
