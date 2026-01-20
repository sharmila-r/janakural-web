'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getDashboardStats, getResolvedIssues } from '@/services/issues';
import { CATEGORIES } from '@/lib/constants';
import { DashboardStats, ResolvedIssue } from '@/types';

export default function HomePage() {
  const { lang, setLang, t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [resolvedIssues, setResolvedIssues] = useState<ResolvedIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, issuesData] = await Promise.all([
          getDashboardStats(),
          getResolvedIssues(4),
        ]);
        setStats(statsData);
        setResolvedIssues(issuesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/icon-192.png" alt="Janakural" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="font-bold text-gray-900">{t('சனகுரல்', 'Janakural')}</h1>
              <p className="text-xs text-gray-500">{t('உங்கள் குரல்', 'Your Voice')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
          >
            {lang === 'ta' ? 'EN' : 'தமிழ்'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-500 to-red-400 text-white px-4 pt-8 pb-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">{t('சனகுரல்', 'Janakural')}</h2>
          <p className="text-red-100 text-lg mb-8">{t('உங்கள் குரல், எங்கள் செயல்', 'Your Voice, Our Action')}</p>

          <Link
            href="/submit"
            className="inline-block bg-white text-red-600 rounded-2xl px-8 py-4 shadow-xl font-bold text-lg hover:scale-105 transition-transform"
          >
            {t('புகார் அளிக்க', 'Report an Issue')}
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-4 text-gray-500">
                {t('தகவல்கள் ஏற்றுகிறது...', 'Loading...')}
              </div>
            ) : (
              <>
                <div className="text-center p-3">
                  <p className="text-3xl font-bold text-red-600">{stats?.totalIssues.toLocaleString() || 0}</p>
                  <p className="text-gray-500 text-sm">{t('மொத்த புகார்கள்', 'Total Issues')}</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-3xl font-bold text-green-600">{stats?.resolvedIssues || 0}</p>
                  <p className="text-gray-500 text-sm">{t('தீர்வு செய்யப்பட்டது', 'Resolved')}</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-3xl font-bold text-blue-600">{stats?.avgResolutionDays || 0}</p>
                  <p className="text-gray-500 text-sm">{t('நாட்கள் சராசரி', 'Avg. Days')}</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-3xl font-bold text-purple-600">{stats?.resolutionRate || 0}%</p>
                  <p className="text-gray-500 text-sm">{t('தீர்வு விகிதம்', 'Resolution Rate')}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="px-4 mt-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('புகார் வகைகள்', 'Issue Categories')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((category) => (
              <Link
                key={category.id}
                href={`/submit?category=${category.id}`}
                className={`${category.color} rounded-xl p-4 text-center hover:shadow-md transition-shadow`}
              >
                <span className="text-3xl mb-2 block">{category.icon}</span>
                <p className="text-sm font-medium">{lang === 'ta' ? category.name : category.nameEn}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Resolutions */}
      {resolvedIssues.length > 0 && (
        <section className="px-4 mt-8 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('சமீபத்திய தீர்வுகள்', 'Recent Resolutions')}</h3>
              <Link href="/showcase" className="text-red-500 text-sm font-medium">
                {t('அனைத்தும்', 'View All')} &rarr;
              </Link>
            </div>

            <div className="space-y-4">
              {resolvedIssues.map((issue) => (
                <div key={issue.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  {issue.beforePhotos.length > 0 && issue.afterPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-1">
                      <div className="relative">
                        <img
                          src={issue.beforePhotos[0]}
                          alt="Before"
                          className="w-full h-32 object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {t('முன்பு', 'Before')}
                        </span>
                      </div>
                      <div className="relative">
                        <img
                          src={issue.afterPhotos[0]}
                          alt="After"
                          className="w-full h-32 object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          {t('இப்போது', 'After')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {issue.location.address || issue.location.district}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="px-4 py-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-6">{t('எப்படி வேலை செய்கிறது?', 'How It Works')}</h3>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xl shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t('புகார் அளியுங்கள்', 'Report Issue')}</h4>
                <p className="text-sm text-gray-500">{t('புகைப்படம் மற்றும் இடத்துடன்', 'With Photo & Location')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xl shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t('TVK குழு செயல்படும்', 'TVK Team Takes Action')}</h4>
                <p className="text-sm text-gray-500">{t('உடனடி நடவடிக்கை', 'Immediate Response')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t('பிரச்சனை தீர்க்கப்படும்', 'Issue Gets Resolved')}</h4>
                <p className="text-sm text-gray-500">{t('விரைவான தீர்வு', 'Quick Resolution')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-red-600 text-white text-center py-8">
        <p className="text-red-100 text-sm">{t('இயக்குவோர்', 'Powered by')}</p>
        <h3 className="text-xl font-bold mt-1">{t('தமிழக வெற்றிக் கழகம்', 'Tamilaga Vettri Kazhagam')}</h3>
      </footer>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-7xl mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 px-4 text-red-600">
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
          <Link href="/showcase" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-xs mt-1">{t('தீர்வுகள்', 'Showcase')}</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-16"></div>
    </div>
  );
}
