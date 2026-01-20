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
export type AdminRole = 'booth_agent' | 'panchayat_leader' | 'constituency_head' | 'district_leader' | 'state_admin' | 'super_admin';

export interface AdminUser {
  id: string;
  phone: string;
  name: string;
  role: AdminRole;
  assignedArea?: {
    district?: string;
    panchayatUnion?: string;
    constituency?: string;
  };
  fcmToken?: string;
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

// Update issue status with optional assignment and notes
export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  options?: {
    notes?: string;
    assignedTo?: string;
    assignedBy?: string;
    resolvedBy?: string;
  }
): Promise<void> {
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'resolved') {
    updateData.resolvedAt = serverTimestamp();
    if (options?.resolvedBy) {
      updateData.resolvedBy = options.resolvedBy;
    }
  }

  if (options?.notes) {
    updateData.resolutionNotes = options.notes;
  }

  if (options?.assignedTo) {
    updateData.assignedTo = options.assignedTo;
    updateData.assignedBy = options.assignedBy;
  }

  await updateDoc(issueRef, updateData);
}

// Assign issue to agent
export async function assignIssue(
  issueId: string,
  assignedTo: string,
  assignedBy: string
): Promise<void> {
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);

  await updateDoc(issueRef, {
    assignedTo,
    assignedBy,
    status: 'assigned',
    updatedAt: serverTimestamp(),
  });
}

// Add resolution notes
export async function addResolutionNotes(
  issueId: string,
  notes: string
): Promise<void> {
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);

  await updateDoc(issueRef, {
    resolutionNotes: notes,
    updatedAt: serverTimestamp(),
  });
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
      assignedArea: data.assignedArea,
      fcmToken: data.fcmToken,
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
    assignedArea: data.assignedArea,
    fcmToken: data.fcmToken,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

// Create admin user
export async function createAdminUser(
  phone: string,
  name: string,
  role: AdminRole,
  assignedArea?: { district?: string; panchayatUnion?: string; constituency?: string }
): Promise<string> {
  // Use phone number (without +) as document ID
  const userId = phone.replace(/\+/g, '');
  const userRef = doc(db, COLLECTIONS.USERS, userId);

  // Check if user already exists
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    throw new Error('User with this phone number already exists');
  }

  const userData: Record<string, unknown> = {
    phone,
    name,
    role,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (assignedArea) {
    userData.assignedArea = assignedArea;
  }

  await setDoc(userRef, userData);

  return userId;
}

// Update admin user
export async function updateAdminUser(
  userId: string,
  updates: Partial<Pick<AdminUser, 'name' | 'role' | 'isActive' | 'assignedArea' | 'fcmToken'>>
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

// Get active agents (for assignment dropdown)
export async function getActiveAgents(): Promise<AdminUser[]> {
  const users = await getAllAdminUsers();
  return users.filter(u => u.isActive);
}

// ============ Analytics ============

export interface AnalyticsData {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  rejectedIssues: number;
  avgResolutionDays: number;
  resolutionRate: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byDistrict: Record<string, number>;
  byMonth: { month: string; submitted: number; resolved: number }[];
  recentActivity: { date: string; count: number }[];
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const issues = await getAllIssues();

  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  const pendingIssues = issues.filter(i => ['submitted', 'assigned', 'in_progress'].includes(i.status)).length;
  const rejectedIssues = issues.filter(i => i.status === 'rejected').length;

  // Calculate average resolution time
  const resolvedWithDates = issues.filter(i => i.resolvedAt && i.createdAt);
  const avgResolutionDays = resolvedWithDates.length > 0
    ? resolvedWithDates.reduce((acc, i) => {
        const days = (i.resolvedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return acc + days;
      }, 0) / resolvedWithDates.length
    : 0;

  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  // Group by category
  const byCategory: Record<string, number> = {};
  issues.forEach(i => {
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
  });

  // Group by status
  const byStatus: Record<string, number> = {};
  issues.forEach(i => {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  });

  // Group by district
  const byDistrict: Record<string, number> = {};
  issues.forEach(i => {
    const district = i.location?.district || 'Unknown';
    byDistrict[district] = (byDistrict[district] || 0) + 1;
  });

  // Group by month (last 6 months)
  const byMonth: { month: string; submitted: number; resolved: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleString('en', { month: 'short', year: '2-digit' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const submitted = issues.filter(issue =>
      issue.createdAt >= monthStart && issue.createdAt <= monthEnd
    ).length;

    const resolved = issues.filter(issue =>
      issue.resolvedAt && issue.resolvedAt >= monthStart && issue.resolvedAt <= monthEnd
    ).length;

    byMonth.push({ month: monthKey, submitted, resolved });
  }

  // Recent activity (last 7 days)
  const recentActivity: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toLocaleDateString('en', { weekday: 'short' });
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const count = issues.filter(issue =>
      issue.createdAt >= dayStart && issue.createdAt < dayEnd
    ).length;

    recentActivity.push({ date: dateKey, count });
  }

  return {
    totalIssues,
    resolvedIssues,
    pendingIssues,
    rejectedIssues,
    avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    resolutionRate,
    byCategory,
    byStatus,
    byDistrict,
    byMonth,
    recentActivity,
  };
}

// Export issues to CSV
export function exportIssuesToCSV(issues: Issue[]): string {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Status',
    'Priority',
    'District',
    'Constituency',
    'Address',
    'Submitter Phone',
    'Assigned To',
    'Resolution Notes',
    'Created At',
    'Resolved At',
  ];

  const rows = issues.map(issue => [
    issue.id,
    `"${(issue.title || '').replace(/"/g, '""')}"`,
    `"${(issue.description || '').replace(/"/g, '""')}"`,
    issue.category,
    issue.status,
    issue.priority || '',
    issue.location?.district || '',
    issue.location?.constituency || '',
    `"${(issue.location?.address || '').replace(/"/g, '""')}"`,
    issue.submitterPhone || '',
    issue.assignedTo || '',
    `"${(issue.resolutionNotes || '').replace(/"/g, '""')}"`,
    issue.createdAt.toISOString(),
    issue.resolvedAt?.toISOString() || '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ============ Location-based Admin Functions ============

// Find admins by district
export async function getAdminsByDistrict(district: string): Promise<AdminUser[]> {
  const users = await getAllAdminUsers();
  return users.filter(u =>
    u.isActive &&
    u.role === 'district_leader' &&
    u.assignedArea?.district === district
  );
}

// Find admins by panchayat union
export async function getAdminsByPanchayatUnion(district: string, panchayatUnion: string): Promise<AdminUser[]> {
  const users = await getAllAdminUsers();
  return users.filter(u =>
    u.isActive &&
    u.role === 'panchayat_leader' &&
    u.assignedArea?.district === district &&
    u.assignedArea?.panchayatUnion === panchayatUnion
  );
}

// Get admins to notify for a new issue based on location
export async function getAdminsForNotification(
  district: string,
  panchayatUnion: string
): Promise<AdminUser[]> {
  const users = await getAllAdminUsers();

  // Find panchayat leader for this area
  const panchayatLeaders = users.filter(u =>
    u.isActive &&
    u.role === 'panchayat_leader' &&
    u.assignedArea?.district === district &&
    u.assignedArea?.panchayatUnion === panchayatUnion
  );

  // Find district leader for this area
  const districtLeaders = users.filter(u =>
    u.isActive &&
    u.role === 'district_leader' &&
    u.assignedArea?.district === district
  );

  // Also include state admins and super admins
  const stateAdmins = users.filter(u =>
    u.isActive &&
    (u.role === 'state_admin' || u.role === 'super_admin')
  );

  return [...panchayatLeaders, ...districtLeaders, ...stateAdmins];
}

// Save FCM token for admin
export async function saveFcmToken(userId: string, fcmToken: string): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    fcmToken,
    updatedAt: serverTimestamp(),
  });
}

// Get FCM tokens for admins
export async function getFcmTokensForAdmins(adminIds: string[]): Promise<string[]> {
  const users = await getAllAdminUsers();
  return users
    .filter(u => adminIds.includes(u.id) && u.fcmToken)
    .map(u => u.fcmToken!)
    .filter(Boolean);
}
