import { useEffect, useState } from 'react';
import { UserCog, Plus, KeyRound } from 'lucide-react';
import { userApi } from '../../api/services';
import type { User, UserRole } from '../../types';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const roles: UserRole[] = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST', 'RECEPTIONIST', 'ACCOUNTANT'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: 'DOCTOR' as UserRole, department: '', specialization: '', licenseNumber: '' });

  const loadUsers = () => {
    setLoading(true);
    userApi.getAll().then((r) => setUsers(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await userApi.create({ ...form, active: true });
    setShowModal(false);
    setForm({ fullName: '', email: '', password: '', phone: '', role: 'DOCTOR', department: '', specialization: '', licenseNumber: '' });
    loadUsers();
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    try {
      await userApi.changePassword(selectedUser!.id, passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch {
      setPasswordError('Current password is incorrect');
    }
  };

  const columns = [
    { key: 'fullName', label: 'Name', render: (u: User) => <div className="font-medium text-gray-900">{u.fullName}</div> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (u: User) => u.phone || '-' },
    { key: 'role', label: 'Role', render: (u: User) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">{u.role.replace(/_/g, ' ')}</span> },
    { key: 'department', label: 'Department', render: (u: User) => u.department || '-' },
    { key: 'active', label: 'Status', render: (u: User) => <StatusBadge status={u.active ? 'AVAILABLE' : 'MAINTENANCE'} /> },
    { key: 'actions', label: '', render: (u: User) => (
      <button onClick={(e) => { e.stopPropagation(); openPasswordModal(u); }}
        className="text-gray-400 hover:text-primary-600 p-1" title="Change Password">
        <KeyRound className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Staff Member" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {roles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Create Staff Member</button>
        </form>
      </Modal>

      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title={`Change Password — ${selectedUser?.fullName || ''}`}>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{passwordSuccess}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Change Password
          </button>
        </form>
      </Modal>
    </div>
  );
}
