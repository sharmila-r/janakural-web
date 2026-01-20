import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS, getIssuePhotoPath } from '@/lib/constants';
import { Issue, IssueStatus } from '@/types';

// Admin user types
export type AdminRole = 'booth_agent' | 'constituency_head' | 'district_leader' | 'state_admin' | 'super_admin';

export interface AdminUser {
  id: string;
  phone: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get all issues for admin
export async function getAllIssues(): Promise<Issue[]> {
  const issuesRef = collection(db, COLLECTIONS.ISSUES);
  const q = query(issuesRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  const issues: Issue[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    issues.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      resolvedAt: data.resolvedAt?.toDate(),
    } as Issue);
  });

  return issues;
}

// Update issue status
export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  notes?: string
): Promise<void> {
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'resolved') {
    updateData.resolvedAt = serverTimestamp();
  }

  if (notes) {
    updateData.resolutionNotes = notes;
  }

  await updateDoc(issueRef, updateData);
}

// Upload after photo
export async function uploadAfterPhoto(
  issueId: string,
  file: File,
  index: number
): Promise<string> {
  const fileName = `after_${index}_${Date.now()}.jpg`;
  const path = getIssuePhotoPath(issueId, fileName);
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}

// Add after photos to issue
export async function addAfterPhotos(
  issueId: string,
  photoUrls: string[]
): Promise<void> {
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);

  await updateDoc(issueRef, {
    afterPhotos: photoUrls,
    updatedAt: serverTimestamp(),
  });
}

// ============ Admin User Management ============

// Get all admin users
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  const users: AdminUser[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      id: doc.id,
      phone: data.phone,
      name: data.name,
      role: data.role,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });

  return users;
}

// Get single admin user
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    phone: data.phone,
    name: data.name,
    role: data.role,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

// Create admin user
export async function createAdminUser(
  phone: string,
  name: string,
  role: AdminRole
): Promise<string> {
  // Use phone number (without +) as document ID
  const userId = phone.replace(/\+/g, '');
  const userRef = doc(db, COLLECTIONS.USERS, userId);

  // Check if user already exists
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    throw new Error('User with this phone number already exists');
  }

  await setDoc(userRef, {
    phone,
    name,
    role,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return userId;
}

// Update admin user
export async function updateAdminUser(
  userId: string,
  updates: Partial<Pick<AdminUser, 'name' | 'role' | 'isActive'>>
): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);

  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Delete admin user
export async function deleteAdminUser(userId: string): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await deleteDoc(userRef);
}
