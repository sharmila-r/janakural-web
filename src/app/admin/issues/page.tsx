'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllIssues, updateIssueStatus } from '@/services/admin';
import { Issue, IssueStatus } from '@/types';
import { CATEGORIES } from '@/lib/constants';

const statusColors: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusOptions: { value: IssueStatus; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminIssuesPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    async function fetchIssues() {
      try {
        const data = await getAllIssues();
        setIssues(data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setIssuesLoading(false);
      }
    }
    if (isAdmin) {
      fetchIssues();
    }
  }, [isAdmin]);

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdating(true);
    try {
      await updateIssueStatus(issueId, newStatus);
      setIssues(issues.map(issue =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
      if (selectedIssue?.id === issueId) {
        setSelectedIssue({ ...selectedIssue, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['submitted', 'assigned', 'in_progress'].includes(issue.status);
    return issue.status === filter;
  });

  const getCategoryName = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.nameEn || categoryId;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="font-bold text-gray-900">Manage Issues</h1>
          </div>
          <span className="text-sm text-gray-500">{filteredIssues.length} issues</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'submitted', 'in_progress', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                filter === f
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {issuesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No issues found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Issues List */}
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedIssue?.id === issue.id ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{issue.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[issue.status]}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{getCategoryName(issue.category)}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{issue.submitterPhone}</span>
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Issue Detail */}
            {selectedIssue && (
              <div className="bg-white rounded-xl shadow p-6 sticky top-6 h-fit">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedIssue.title}</h2>
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Photos */}
                {selectedIssue.beforePhotos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Photos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIssue.beforePhotos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Issue photo ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-gray-600">{selectedIssue.description || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <p className="text-gray-600">{getCategoryName(selectedIssue.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{selectedIssue.location.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Submitted By</p>
                    <p className="text-gray-600">{selectedIssue.submitterPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Submitted On</p>
                    <p className="text-gray-600">{formatDate(selectedIssue.createdAt)}</p>
                  </div>
                </div>

                {/* Status Update */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(selectedIssue.id, option.value)}
                        disabled={updating || selectedIssue.status === option.value}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedIssue.status === option.value
                            ? statusColors[option.value]
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
