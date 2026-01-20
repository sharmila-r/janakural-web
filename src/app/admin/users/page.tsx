'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  AdminUser,
  AdminRole,
} from '@/services/admin';
import { DISTRICTS, getPanchayatUnions } from '@/lib/constants';

const roleLabels: Record<AdminRole, string> = {
  booth_agent: 'Booth Agent',
  panchayat_leader: 'Panchayat Union Leader',
  constituency_head: 'Constituency Head',
  district_leader: 'District Leader',
  state_admin: 'State Admin',
  super_admin: 'Super Admin',
};

const roleColors: Record<AdminRole, string> = {
  booth_agent: 'bg-gray-100 text-gray-700',
  panchayat_leader: 'bg-green-100 text-green-700',
  constituency_head: 'bg-blue-100 text-blue-700',
  district_leader: 'bg-purple-100 text-purple-700',
  state_admin: 'bg-orange-100 text-orange-700',
  super_admin: 'bg-red-100 text-red-700',
};

const roles: AdminRole[] = [
  'booth_agent',
  'panchayat_leader',
  'constituency_head',
  'district_leader',
  'state_admin',
  'super_admin',
];

// Roles that require geographic assignment
const rolesRequiringArea: AdminRole[] = ['panchayat_leader', 'district_leader'];

export default function AdminUsersPage() {
  const router = useRouter();
  const { adminUser, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    role: 'booth_agent' as AdminRole,
    district: '',
    panchayatUnion: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Only super_admin can access this page
  const isSuperAdmin = adminUser?.role === 'super_admin';

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push('/admin');
    }
  }, [loading, isSuperAdmin, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAllAdminUsers();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setUsersLoading(false);
      }
    }
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const handleAdd = () => {
    setFormData({ phone: '', name: '', role: 'booth_agent', district: '', panchayatUnion: '' });
    setError('');
    setShowAddModal(true);
  };

  const handleEdit = (user: AdminUser) => {
    setFormData({
      phone: user.phone,
      name: user.name,
      role: user.role,
      district: user.assignedArea?.district || '',
      panchayatUnion: user.assignedArea?.panchayatUnion || '',
    });
    setError('');
    setEditingUser(user);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);

    // Validate area assignment for roles that require it
    if (rolesRequiringArea.includes(formData.role)) {
      if (!formData.district) {
        setError('District is required for this role');
        setSaving(false);
        return;
      }
      if (formData.role === 'panchayat_leader' && !formData.panchayatUnion) {
        setError('Panchayat Union is required for Panchayat Leader role');
        setSaving(false);
        return;
      }
    }

    const assignedArea = rolesRequiringArea.includes(formData.role)
      ? {
          district: formData.district,
          ...(formData.role === 'panchayat_leader' && { panchayatUnion: formData.panchayatUnion }),
        }
      : undefined;

    try {
      if (editingUser) {
        // Update existing user
        await updateAdminUser(editingUser.id, {
          name: formData.name,
          role: formData.role,
          assignedArea,
        });
        setUsers(users.map(u =>
          u.id === editingUser.id
            ? { ...u, name: formData.name, role: formData.role, assignedArea }
            : u
        ));
        setEditingUser(null);
      } else {
        // Create new user
        if (!formData.phone.startsWith('+')) {
          setError('Phone number must start with country code (e.g., +91)');
          setSaving(false);
          return;
        }
        const userId = await createAdminUser(formData.phone, formData.name, formData.role, assignedArea);
        setUsers([{
          id: userId,
          phone: formData.phone,
          name: formData.name,
          role: formData.role,
          assignedArea,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }, ...users]);
        setShowAddModal(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    // Prevent deactivating yourself
    if (user.phone === adminUser?.phone) {
      alert('You cannot deactivate yourself');
      return;
    }

    try {
      await updateAdminUser(user.id, { isActive: !user.isActive });
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      ));
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    // Prevent deleting yourself
    if (user.phone === adminUser?.phone) {
      alert('You cannot delete yourself');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      await deleteAdminUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  if (loading || !isSuperAdmin) {
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
            <h1 className="font-bold text-gray-900">Manage Admins</h1>
          </div>
          <button
            onClick={handleAdd}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Admin</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No admin users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={!user.isActive ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.assignedArea ? (
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {DISTRICTS.find(d => d.id === user.assignedArea?.district)?.nameEn || user.assignedArea?.district || '-'}
                          </div>
                          {user.assignedArea?.panchayatUnion && (
                            <div className="text-gray-500 text-xs">
                              {getPanchayatUnions(user.assignedArea.district || '').find(
                                p => p.id === user.assignedArea?.panchayatUnion
                              )?.nameEn || user.assignedArea.panchayatUnion}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Edit Admin' : 'Add Admin'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!!editingUser}
                  placeholder="+919876543210"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
                {!editingUser && (
                  <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +91)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Admin Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({
                    ...formData,
                    role: e.target.value as AdminRole,
                    // Reset area when role changes
                    district: '',
                    panchayatUnion: '',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Selection - shown for panchayat_leader and district_leader */}
              {rolesRequiringArea.includes(formData.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({
                      ...formData,
                      district: e.target.value,
                      panchayatUnion: '', // Reset panchayat when district changes
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Panchayat Union Selection - only for panchayat_leader */}
              {formData.role === 'panchayat_leader' && formData.district && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Panchayat Union *
                  </label>
                  <select
                    value={formData.panchayatUnion}
                    onChange={(e) => setFormData({ ...formData, panchayatUnion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select Panchayat Union</option>
                    {getPanchayatUnions(formData.district).map((union) => (
                      <option key={union.id} value={union.id}>
                        {union.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.phone || !formData.name}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingUser ? 'Update' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
