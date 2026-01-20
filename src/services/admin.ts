import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS, getIssuePhotoPath } from '@/lib/constants';
import { Issue, IssueStatus } from '@/types';

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
