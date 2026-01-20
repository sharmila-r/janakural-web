'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAnalytics, AnalyticsData } from '@/services/admin';
import { CATEGORIES } from '@/lib/constants';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const getCategoryName = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.nameEn || categoryId;
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
            <h1 className="font-bold text-gray-900">Analytics & Reports</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {analyticsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalIssues}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{analytics.resolvedIssues}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics.pendingIssues}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Resolution Rate</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.resolutionRate}%</p>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{analytics.rejectedIssues}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Avg. Resolution Time</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.avgResolutionDays} days</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold text-gray-600">{Object.keys(analytics.byCategory).length}</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Monthly Trend (Last 6 Months)</h3>
                <div className="space-y-3">
                  {analytics.byMonth.map((item) => (
                    <div key={item.month} className="flex items-center">
                      <span className="w-16 text-sm text-gray-500">{item.month}</span>
                      <div className="flex-1 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-yellow-500 h-full"
                            style={{ width: `${Math.min((item.submitted / Math.max(...analytics.byMonth.map(m => m.submitted), 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="w-8 text-xs text-yellow-600">{item.submitted}</span>
                      </div>
                      <div className="flex-1 flex items-center space-x-2 ml-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-green-500 h-full"
                            style={{ width: `${Math.min((item.resolved / Math.max(...analytics.byMonth.map(m => m.resolved), 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="w-8 text-xs text-green-600">{item.resolved}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded" />
                      <span className="text-xs text-gray-500">Submitted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-xs text-gray-500">Resolved</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
                <div className="flex items-end justify-between h-40">
                  {analytics.recentActivity.map((item) => (
                    <div key={item.date} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-red-500 rounded-t"
                        style={{
                          height: `${Math.max((item.count / Math.max(...analytics.recentActivity.map(a => a.count), 1)) * 100, 5)}%`,
                          minHeight: item.count > 0 ? '8px' : '2px',
                        }}
                      />
                      <span className="text-xs text-gray-500 mt-2">{item.date}</span>
                      <span className="text-xs font-medium text-gray-700">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category & Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Category */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Issues by Category</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center">
                        <span className="w-32 text-sm text-gray-600 truncate">{getCategoryName(category)}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden mx-3">
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${(count / analytics.totalIssues) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-sm font-medium text-gray-700 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* By Status */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Issues by Status</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.byStatus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => {
                      const colors: Record<string, string> = {
                        submitted: 'bg-yellow-500',
                        assigned: 'bg-blue-500',
                        in_progress: 'bg-purple-500',
                        resolved: 'bg-green-500',
                        closed: 'bg-gray-500',
                        rejected: 'bg-red-500',
                      };
                      return (
                        <div key={status} className="flex items-center">
                          <span className="w-28 text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden mx-3">
                            <div
                              className={`${colors[status] || 'bg-gray-500'} h-full`}
                              style={{ width: `${(count / analytics.totalIssues) * 100}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm font-medium text-gray-700 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* By District */}
            {Object.keys(analytics.byDistrict).length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Issues by District</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(analytics.byDistrict)
                    .sort(([, a], [, b]) => b - a)
                    .map(([district, count]) => (
                      <div key={district} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 truncate">{district}</p>
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
