export type UserRole =
  | 'citizen'
  | 'booth_agent'
  | 'constituency_head'
  | 'district_leader'
  | 'state_admin'
  | 'super_admin';

export type IssueStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  uid: string;
  phone: string;
  name: string;
  role: UserRole;
  assignedArea?: {
    state: string;
    district?: string;
    constituency?: string;
    booth?: string;
  };
  profilePhoto?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueLocation {
  latitude: number;
  longitude: number;
  address: string;
  state: string;
  district: string;
  constituency: string;
  booth: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  location: IssueLocation;
  beforePhotos: string[];
  afterPhotos: string[];
  status: IssueStatus;
  priority: IssuePriority;
  submittedBy: string;
  submitterPhone?: string;
  assignedTo?: string;
  assignedBy?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueHistory {
  id: string;
  issueId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy: string;
  notes?: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  avgResolutionDays: number;
  resolutionRate: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ResolvedIssue extends Issue {
  beforePhotos: string[];
  afterPhotos: string[];
  resolvedAt: Date;
}
