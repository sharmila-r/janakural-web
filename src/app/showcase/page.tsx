'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { getResolvedIssues } from '@/services/issues';
import { ResolvedIssue } from '@/types';
import { CATEGORIES } from '@/lib/constants';

export default function ShowcasePage() {
  const { lang, t } = useLanguage();
  const [issues, setIssues] = useState<ResolvedIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getResolvedIssues(20);
        setIssues(data);
      } catch (error) {
        console.error('Error fetching resolved issues:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

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
            <div>
              <h1 className="font-bold text-gray-900">{t('நாங்கள் சரி செய்தோம்', 'We Fixed This')}</h1>
              <p className="text-xs text-gray-500">{t('தீர்க்கப்பட்ட பிரச்சனைகள்', 'Resolved Issues')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/submit"
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 font-medium"
            >
              {t('புகார்', 'Report')}
            </Link>
            <Link
              href="/my-issues"
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 font-medium"
            >
              {t('என் புகார்', 'My Issues')}
            </Link>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-gray-500">{t('ஏற்றுகிறது...', 'Loading...')}</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-gray-500">
              {t('தீர்க்கப்பட்ட பிரச்சனைகள் இல்லை', 'No resolved issues yet')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {issues.map((issue) => {
              const category = getCategoryInfo(issue.category);
              return (
                <div key={issue.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* Before/After Photos */}
                  {issue.beforePhotos.length > 0 && issue.afterPhotos.length > 0 && (
                    <div className="relative">
                      <div className="grid grid-cols-2">
                        <div className="relative">
                          <img
                            src={issue.beforePhotos[0]}
                            alt="Before"
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                            {t('முன்பு', 'Before')}
                          </div>
                        </div>
                        <div className="relative">
                          <img
                            src={issue.afterPhotos[0]}
                            alt="After"
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                            {t('இப்போது', 'After')}
                          </div>
                        </div>
                      </div>
                      {/* Resolved Badge */}
                      <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('தீர்வு', 'Resolved')}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{issue.title}</h3>
                      {category && (
                        <span className={`${category.color} px-2 py-1 rounded-full text-xs flex items-center`}>
                          <span className="mr-1">{category.icon}</span>
                          {lang === 'ta' ? category.name : category.nameEn}
                        </span>
                      )}
                    </div>

                    {issue.description && (
                      <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {issue.location.address || issue.location.district || 'Tamil Nadu'}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(issue.resolvedAt)}
                      </div>
                    </div>

                    {issue.resolutionNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">{t('தீர்வு குறிப்பு:', 'Resolution:')} </span>
                          {issue.resolutionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
          <Link href="/my-issues" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1">{t('என் புகார்', 'My Issues')}</span>
          </Link>
          <Link href="/showcase" className="flex flex-col items-center py-2 px-4 text-red-600">
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
