import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Project } from '@/types';

const PROJECTS_COLLECTION = 'projects';

// Generate a random 5-letter room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createProject(data: {
  name: string;
  description?: string;
  ownerId: string;
}): Promise<Project> {
  const projectId = crypto.randomUUID();
  const liveblocksRoom = `project:${projectId}`;
  const roomCode = generateRoomCode();

  const project: Project = {
    id: projectId,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    collaborators: [],
    liveblocksRoom,
    roomCode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, PROJECTS_COLLECTION, projectId), project);
  return project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const docSnap = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
  return docSnap.exists() ? docSnap.data() as Project : null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('ownerId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Project);
}

export async function getProjectByRoomCode(roomCode: string): Promise<Project | null> {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('roomCode', '==', roomCode.toUpperCase())
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Project;
}

export async function joinProjectByRoomCode(roomCode: string, userId: string): Promise<Project> {
  const project = await getProjectByRoomCode(roomCode);

  if (!project) {
    throw new Error('Project not found with this room code');
  }

  // Add user as collaborator if not already
  if (!project.collaborators.includes(userId) && project.ownerId !== userId) {
    await addCollaborator(project.id, userId);
  }

  return project;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
}

export async function addCollaborator(projectId: string, userId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  if (!project.collaborators.includes(userId)) {
    await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
      collaborators: [...project.collaborators, userId],
      updatedAt: Date.now(),
    });
  }
}

export async function removeCollaborator(projectId: string, userId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    collaborators: project.collaborators.filter(id => id !== userId),
    updatedAt: Date.now(),
  });
}

export async function getUserByEmail(email: string): Promise<{ uid: string; email: string } | null> {
  try {
    // Query users collection by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const userData = snapshot.docs[0].data();
    return {
      uid: snapshot.docs[0].id,
      email: userData.email,
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Chat persistence functions
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  operations?: any[];
}

export interface Chat {
  id: string;
  title: string;
  projectId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export async function saveChat(chat: Chat): Promise<void> {
  const chatRef = doc(db, 'chats', chat.id);
  await setDoc(chatRef, chat);
}

export async function getProjectChats(projectId: string, userId: string): Promise<Chat[]> {
  const q = query(
    collection(db, 'chats'),
    where('projectId', '==', projectId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Chat);
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const docSnap = await getDoc(doc(db, 'chats', chatId));
  return docSnap.exists() ? docSnap.data() as Chat : null;
}

export async function updateChatMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), {
    messages,
    updatedAt: Date.now(),
  });
}

export async function deleteChatById(chatId: string): Promise<void> {
  await deleteDoc(doc(db, 'chats', chatId));
}
