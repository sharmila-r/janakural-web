'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getAllIssues,
  updateIssueStatus,
  assignIssue,
  addResolutionNotes,
  uploadAfterPhoto,
  addAfterPhotos,
  getActiveAgents,
  exportIssuesToCSV,
  AdminUser,
} from '@/services/admin';
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
  const { user, adminUser, isAdmin, loading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [agents, setAgents] = useState<AdminUser[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique districts from issues
  const districts = Array.from(new Set(issues.map(i => i.location?.district).filter(Boolean)));

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [issuesData, agentsData] = await Promise.all([
          getAllIssues(),
          getActiveAgents(),
        ]);
        setIssues(issuesData);
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIssuesLoading(false);
      }
    }
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Update notes when selecting a new issue
  useEffect(() => {
    if (selectedIssue) {
      setNotes(selectedIssue.resolutionNotes || '');
      setSelectedAgent(selectedIssue.assignedTo || '');
    }
  }, [selectedIssue]);

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdating(true);
    try {
      await updateIssueStatus(issueId, newStatus, {
        notes: notes || undefined,
        resolvedBy: newStatus === 'resolved' ? adminUser?.phone : undefined,
      });
      const updatedIssue = {
        ...issues.find(i => i.id === issueId)!,
        status: newStatus,
        resolutionNotes: notes || undefined,
        resolvedAt: newStatus === 'resolved' ? new Date() : undefined,
      };
      setIssues(issues.map(issue =>
        issue.id === issueId ? updatedIssue : issue
      ));
      if (selectedIssue?.id === issueId) {
        setSelectedIssue(updatedIssue);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedIssue || !selectedAgent) return;
    setUpdating(true);
    try {
      await assignIssue(selectedIssue.id, selectedAgent, adminUser?.phone || '');
      const updatedIssue = {
        ...selectedIssue,
        assignedTo: selectedAgent,
        assignedBy: adminUser?.phone,
        status: 'assigned' as IssueStatus,
      };
      setIssues(issues.map(issue =>
        issue.id === selectedIssue.id ? updatedIssue : issue
      ));
      setSelectedIssue(updatedIssue);
    } catch (error) {
      console.error('Error assigning issue:', error);
      alert('Failed to assign issue');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedIssue) return;
    setUpdating(true);
    try {
      await addResolutionNotes(selectedIssue.id, notes);
      const updatedIssue = { ...selectedIssue, resolutionNotes: notes };
      setIssues(issues.map(issue =>
        issue.id === selectedIssue.id ? updatedIssue : issue
      ));
      setSelectedIssue(updatedIssue);
      alert('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIssue || !e.target.files?.length) return;
    setUploadingPhotos(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [...(selectedIssue.afterPhotos || [])];

      for (let i = 0; i < files.length; i++) {
        const url = await uploadAfterPhoto(selectedIssue.id, files[i], uploadedUrls.length + i);
        uploadedUrls.push(url);
      }

      await addAfterPhotos(selectedIssue.id, uploadedUrls);
      const updatedIssue = { ...selectedIssue, afterPhotos: uploadedUrls };
      setIssues(issues.map(issue =>
        issue.id === selectedIssue.id ? updatedIssue : issue
      ));
      setSelectedIssue(updatedIssue);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportCSV = () => {
    const csv = exportIssuesToCSV(filteredIssues);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `janakural-issues-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredIssues = issues.filter(issue => {
    // Status filter
    if (filter !== 'all') {
      if (filter === 'pending' && !['submitted', 'assigned', 'in_progress'].includes(issue.status)) {
        return false;
      } else if (filter !== 'pending' && issue.status !== filter) {
        return false;
      }
    }
    // District filter
    if (districtFilter !== 'all' && issue.location?.district !== districtFilter) {
      return false;
    }
    return true;
  });

  const getCategoryName = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.nameEn || categoryId;
  };

  const getAgentName = (phone: string) => {
    const agent = agents.find(a => a.phone === phone);
    return agent?.name || phone;
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
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">{filteredIssues.length} issues</span>
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
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

          {/* District Filter */}
          {districts.length > 0 && (
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            >
              <option value="all">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
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
            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                  {issue.assignedTo && (
                    <p className="text-xs text-blue-600 mb-2">
                      Assigned to: {getAgentName(issue.assignedTo)}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{issue.location?.district || issue.submitterPhone}</span>
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Issue Detail */}
            {selectedIssue && (
              <div className="bg-white rounded-xl shadow p-6 sticky top-6 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
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

                {/* Before Photos */}
                {selectedIssue.beforePhotos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Before Photos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIssue.beforePhotos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Before photo ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* After Photos */}
                {(selectedIssue.afterPhotos?.length > 0 || selectedIssue.status === 'resolved') && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">After Photos (Proof of Resolution)</p>
                    {selectedIssue.afterPhotos?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {selectedIssue.afterPhotos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`After photo ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer"
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">No after photos uploaded</p>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhotos}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {uploadingPhotos ? 'Uploading...' : '+ Upload After Photos'}
                    </button>
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
                    {selectedIssue.location.district && (
                      <p className="text-sm text-gray-500">
                        {selectedIssue.location.district}
                        {selectedIssue.location.constituency && ` • ${selectedIssue.location.constituency}`}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Submitted By</p>
                    <p className="text-gray-600">{selectedIssue.submitterPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Submitted On</p>
                    <p className="text-gray-600">{formatDate(selectedIssue.createdAt)}</p>
                  </div>
                  {selectedIssue.resolvedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Resolved On</p>
                      <p className="text-gray-600">{formatDate(selectedIssue.resolvedAt)}</p>
                    </div>
                  )}
                </div>

                {/* Assign Agent */}
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Assign to Agent</p>
                  <div className="flex space-x-2">
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select agent...</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.phone}>
                          {agent.name} ({agent.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={updating || !selectedAgent || selectedAgent === selectedIssue.assignedTo}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                  {selectedIssue.assignedTo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Currently assigned to: {getAgentName(selectedIssue.assignedTo)}
                    </p>
                  )}
                </div>

                {/* Resolution Notes */}
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Resolution Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about the resolution..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={updating}
                    className="mt-2 px-4 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    Save Notes
                  </button>
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
