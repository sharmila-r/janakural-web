import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS, getIssuePhotoPath } from '@/lib/constants';
import { Issue, IssueStatus, DashboardStats, ResolvedIssue } from '@/types';

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const issuesRef = collection(db, COLLECTIONS.ISSUES);
  const snapshot = await getDocs(issuesRef);

  let totalIssues = 0;
  let resolvedIssues = 0;
  let totalResolutionDays = 0;
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    totalIssues++;

    // Count by category
    byCategory[data.category] = (byCategory[data.category] || 0) + 1;

    // Count by status
    byStatus[data.status] = (byStatus[data.status] || 0) + 1;

    if (data.status === 'resolved' || data.status === 'closed') {
      resolvedIssues++;
      if (data.resolvedAt && data.createdAt) {
        const created = data.createdAt.toDate();
        const resolved = data.resolvedAt.toDate();
        const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        totalResolutionDays += days;
      }
    }
  });

  const avgResolutionDays = resolvedIssues > 0 ? totalResolutionDays / resolvedIssues : 0;
  const pendingIssues = totalIssues - resolvedIssues;
  const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

  return {
    totalIssues,
    resolvedIssues,
    pendingIssues,
    avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    resolutionRate: Math.round(resolutionRate),
    byCategory,
    byStatus,
  };
}

// Get recently resolved issues for showcase
export async function getResolvedIssues(limitCount: number = 10): Promise<ResolvedIssue[]> {
  const issuesRef = collection(db, COLLECTIONS.ISSUES);
  const q = query(
    issuesRef,
    where('status', 'in', ['resolved', 'closed']),
    orderBy('resolvedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const issues: ResolvedIssue[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    issues.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      resolvedAt: data.resolvedAt?.toDate() || new Date(),
    } as ResolvedIssue);
  });

  return issues;
}

// Get issues by user phone
export async function getIssuesByPhone(phone: string): Promise<Issue[]> {
  const issuesRef = collection(db, COLLECTIONS.ISSUES);
  const q = query(
    issuesRef,
    where('submitterPhone', '==', phone),
    orderBy('createdAt', 'desc')
  );

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

// Get single issue by ID
export async function getIssueById(issueId: string): Promise<Issue | null> {
  const docRef = doc(db, COLLECTIONS.ISSUES, issueId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    resolvedAt: data.resolvedAt?.toDate(),
  } as Issue;
}

// Upload photo to storage
export async function uploadIssuePhoto(
  issueId: string,
  file: File,
  index: number
): Promise<string> {
  const fileName = `before_${index}_${Date.now()}.jpg`;
  const path = getIssuePhotoPath(issueId, fileName);
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}

// Submit new issue
export async function submitIssue(issueData: {
  title: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    state: string;
    district: string;
    constituency: string;
    booth: string;
  };
  submitterPhone: string;
  photos: File[];
}): Promise<string> {
  // First create the issue document to get ID
  const issueRef = await addDoc(collection(db, COLLECTIONS.ISSUES), {
    title: issueData.title,
    description: issueData.description,
    category: issueData.category,
    location: issueData.location,
    submitterPhone: issueData.submitterPhone,
    submittedBy: issueData.submitterPhone,
    status: 'submitted' as IssueStatus,
    priority: 'medium',
    beforePhotos: [],
    afterPhotos: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Upload photos
  const photoUrls: string[] = [];
  for (let i = 0; i < issueData.photos.length; i++) {
    const url = await uploadIssuePhoto(issueRef.id, issueData.photos[i], i);
    photoUrls.push(url);
  }

  // Update issue with photo URLs
  await updateDoc(issueRef, {
    beforePhotos: photoUrls,
  });

  return issueRef.id;
}
