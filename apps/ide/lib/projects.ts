import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Project } from '@repo/types';

const PROJECTS_COLLECTION = 'projects';

export async function createProject(data: {
  name: string;
  description?: string;
  ownerId: string;
}): Promise<Project> {
  const projectId = crypto.randomUUID();
  const liveblocksRoom = `project:${projectId}`;

  const project: Project = {
    id: projectId,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    collaborators: [],
    liveblocksRoom,
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
