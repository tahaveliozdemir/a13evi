import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Child } from '../types';

const CHILDREN_DOC = 'score_tracker_data/main_data_document';

/**
 * Get all children data from Firestore
 * NO WEBSOCKET - Uses regular get()
 */
export async function getChildren(): Promise<Child[]> {
  try {
    const docRef = doc(db, CHILDREN_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.children || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
}

/**
 * Save children data to Firestore
 * NO WEBSOCKET - Uses regular setDoc()
 */
export async function saveChildren(children: Child[]): Promise<void> {
  try {
    const docRef = doc(db, CHILDREN_DOC);
    await setDoc(docRef, { children }, { merge: true });
  } catch (error) {
    console.error('Error saving children:', error);
    throw error;
  }
}

/**
 * Add a new child
 */
export async function addChild(name: string): Promise<Child> {
  const children = await getChildren();

  const newChild: Child = {
    id: crypto.randomUUID(),
    name,
    scores: [],
    createdAt: new Date().toISOString()
  };

  children.push(newChild);
  await saveChildren(children);

  return newChild;
}

/**
 * Update a child
 */
export async function updateChild(childId: string, updates: Partial<Child>): Promise<void> {
  const children = await getChildren();
  const index = children.findIndex(c => c.id === childId);

  if (index !== -1) {
    children[index] = { ...children[index], ...updates };
    await saveChildren(children);
  } else {
    throw new Error('Child not found');
  }
}

/**
 * Archive (soft delete) a child
 */
export async function archiveChild(childId: string): Promise<void> {
  await updateChild(childId, { archived: true });
}

/**
 * Delete a child permanently
 */
export async function deleteChild(childId: string): Promise<void> {
  const children = await getChildren();
  const filtered = children.filter(c => c.id !== childId);
  await saveChildren(filtered);
}
