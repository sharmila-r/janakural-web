export const COLLECTIONS = {
  USERS: 'janakural_users',
  ISSUES: 'janakural_issues',
  ISSUE_HISTORY: 'janakural_issue_history',
  STATES: 'janakural_states',
  CATEGORIES: 'janakural_categories',
  ANALYTICS: 'janakural_analytics',
  NOTIFICATIONS: 'janakural_notifications',
} as const;

export const STORAGE_PATHS = {
  ROOT: 'janakural',
  ISSUES: 'janakural/issues',
  PROFILES: 'janakural/profiles',
  TEMP: 'janakural/temp',
} as const;

export const CATEGORIES = [
  { id: 'road', name: 'சாலை பிரச்சனைகள்', nameEn: 'Road Issues', icon: '🛣️', color: 'bg-orange-100 text-orange-600' },
  { id: 'water', name: 'குடிநீர்', nameEn: 'Water Supply', icon: '💧', color: 'bg-blue-100 text-blue-600' },
  { id: 'electricity', name: 'மின்சாரம்', nameEn: 'Electricity', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'sanitation', name: 'சுகாதாரம்', nameEn: 'Sanitation', icon: '🧹', color: 'bg-green-100 text-green-600' },
  { id: 'drainage', name: 'வடிகால்', nameEn: 'Drainage', icon: '🌊', color: 'bg-purple-100 text-purple-600' },
  { id: 'streetlight', name: 'தெரு விளக்கு', nameEn: 'Street Light', icon: '💡', color: 'bg-amber-100 text-amber-600' },
];

export const getIssuePhotoPath = (issueId: string, fileName: string) =>
  `${STORAGE_PATHS.ISSUES}/${issueId}/${fileName}`;

export const getProfilePhotoPath = (userId: string, fileName: string) =>
  `${STORAGE_PATHS.PROFILES}/${userId}/${fileName}`;
