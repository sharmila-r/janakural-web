'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getDashboardStats } from '@/services/issues';
import { DashboardStats } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, adminUser, loading, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">ஜ</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Janakural Admin</h1>
              <p className="text-xs text-gray-500">{adminUser?.name || adminUser?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Total Issues</p>
            <p className="text-3xl font-bold text-gray-900">
              {statsLoading ? '-' : stats?.totalIssues || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-3xl font-bold text-green-600">
              {statsLoading ? '-' : stats?.resolvedIssues || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {statsLoading ? '-' : stats?.pendingIssues || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Resolution Rate</p>
            <p className="text-3xl font-bold text-blue-600">
              {statsLoading ? '-' : `${stats?.resolutionRate || 0}%`}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link
            href="/admin/issues"
            className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Issues</h3>
              <p className="text-sm text-gray-500">View and update all reported issues</p>
            </div>
          </Link>

          <Link
            href="/"
            className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Public Site</h3>
              <p className="text-sm text-gray-500">View the citizen-facing website</p>
            </div>
          </Link>
        </div>

        {/* Category Breakdown */}
        {stats && stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Issues by Category</h3>
            <div className="space-y-3">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">{category}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
