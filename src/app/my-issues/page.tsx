'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { getIssuesByPhone } from '@/services/issues';
import { Issue } from '@/types';

const statusColors: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, { ta: string; en: string }> = {
  submitted: { ta: 'சமர்ப்பிக்கப்பட்டது', en: 'Submitted' },
  assigned: { ta: 'ஒதுக்கப்பட்டது', en: 'Assigned' },
  in_progress: { ta: 'நடவடிக்கையில்', en: 'In Progress' },
  resolved: { ta: 'தீர்க்கப்பட்டது', en: 'Resolved' },
  closed: { ta: 'முடிவு', en: 'Closed' },
  rejected: { ta: 'நிராகரிக்கப்பட்டது', en: 'Rejected' },
};

export default function MyIssuesPage() {
  const { lang, t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const handleSearch = async () => {
    if (!phone) return;

    setLoading(true);
    try {
      const data = await getIssuesByPhone(phone);
      setIssues(data);
      setSearched(true);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['resolved', 'closed', 'rejected'].includes(issue.status);
    if (filter === 'resolved') return ['resolved', 'closed'].includes(issue.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="font-bold text-gray-900">{t('என் புகார்கள்', 'My Issues')}</h1>
          </div>
          <Link
            href="/submit"
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 font-medium"
          >
            {t('புகார்', 'Report')}
          </Link>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Phone Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('தொலைபேசி எண்', 'Phone Number')}
          </label>
          <div className="flex space-x-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !phone}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-300"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                t('தேடு', 'Search')
              )}
            </button>
          </div>
        </div>

        {searched && (
          <>
            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-4">
              {(['all', 'active', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    filter === f
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {f === 'all' && t('அனைத்தும்', 'All')}
                  {f === 'active' && t('நடப்பு', 'Active')}
                  {f === 'resolved' && t('தீர்வு', 'Resolved')}
                  <span className="ml-1">
                    ({f === 'all' ? issues.length : filteredIssues.length})
                  </span>
                </button>
              ))}
            </div>

            {/* Issues List */}
            {filteredIssues.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">
                  {t('புகார்கள் இல்லை', 'No issues found')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <div key={issue.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    {issue.beforePhotos.length > 0 && (
                      <img
                        src={issue.beforePhotos[0]}
                        alt={issue.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[issue.status]}`}>
                          {statusLabels[issue.status]?.[lang] || issue.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{issue.description}</p>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {issue.createdAt?.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500">
              {t('உங்கள் புகார்களை பார்க்க தொலைபேசி எண்ணை உள்ளிடவும்', 'Enter your phone number to view your issues')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-7xl mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">{t('முகப்பு', 'Home')}</span>
          </Link>
          <Link href="/submit" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">{t('புகார்', 'Report')}</span>
          </Link>
          <Link href="/my-issues" className="flex flex-col items-center py-2 px-4 text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1">{t('என் புகார்', 'My Issues')}</span>
          </Link>
          <Link href="/showcase" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-xs mt-1">{t('தீர்வுகள்', 'Showcase')}</span>
          </Link>
        </div>
      </nav>

      <div className="h-16"></div>
    </div>
  );
}
