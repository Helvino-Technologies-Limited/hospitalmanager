import { useState } from 'react';
import { Heart, Settings, Lock, Eye, EyeOff, FileText, Printer } from 'lucide-react';
import { userApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { useHospitalStore } from '../../store/hospitalStore';

export default function SettingsPage() {
  const userId = useAuthStore((s) => s.userId);
  const hospital = useHospitalStore();
  const [profileForm, setProfileForm] = useState({
    name: hospital.name,
    tagline: hospital.tagline,
    address: hospital.address,
    phone: hospital.phone,
    email: hospital.email,
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (!userId) return;

    setPwLoading(true);
    try {
      await userApi.changePassword(userId, pwForm.currentPassword, pwForm.newPassword);
      setPwMessage({ type: 'success', text: 'Password changed successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setPwMessage({ type: 'error', text: 'Failed to change password. Check your current password.' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            {pwMessage && (
              <div className={`text-sm px-3 py-2 rounded-lg ${pwMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {pwMessage.text}
              </div>
            )}
            <button type="submit" disabled={pwLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">System Version</span>
              <span className="text-sm font-medium text-gray-900">HMS v1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">License</span>
              <span className="text-sm font-medium text-gray-900">Enterprise</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Database</span>
              <span className="text-sm font-medium text-gray-900">PostgreSQL</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Java Version</span>
              <span className="text-sm font-medium text-gray-900">21</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
              <Heart className="w-8 h-8 text-primary-600" fill="currentColor" />
              <div>
                <p className="text-sm font-semibold text-primary-900">Helvino Technologies Limited</p>
                <p className="text-xs text-primary-600">helvinotechltd@gmail.com | +254 703 445 756</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt / Invoice Settings — full width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">Receipt / Invoice Settings</h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">Edit the details that appear on printed receipts and invoices.</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Edit form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            hospital.update(profileForm);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 3000);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Facility Name</label>
              <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input value={profileForm.tagline} onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Quality Healthcare Services" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. P.O. Box 00000, Nairobi, Kenya" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            {profileSaved && (
              <div className="text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700">
                Receipt settings saved successfully
              </div>
            )}
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
              Save Receipt Settings
            </button>
          </form>

          {/* Live preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Printer className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Receipt Preview</span>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
              <div className="bg-white rounded-lg p-6 shadow-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{profileForm.name || 'Hospital Name'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{profileForm.tagline || 'Tagline'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profileForm.address || 'Address'} | Tel: {profileForm.phone || 'Phone'} | {profileForm.email || 'Email'}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mt-2">Receipt / Invoice</p>
                </div>
                {/* Sample body */}
                <div className="flex justify-between text-xs text-gray-600 mb-3">
                  <div>
                    <p><span className="font-semibold">Patient:</span> John Doe</p>
                    <p><span className="font-semibold">Patient No:</span> PT-001</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold">Invoice:</span> INV-001</p>
                    <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <table className="w-full text-xs mb-3">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-1.5 font-semibold text-gray-600">Description</th>
                      <th className="text-right p-1.5 font-semibold text-gray-600">Qty</th>
                      <th className="text-right p-1.5 font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-1.5 text-gray-600">Consultation</td>
                      <td className="p-1.5 text-gray-600 text-right">1</td>
                      <td className="p-1.5 text-gray-600 text-right">KES 1,500</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-1.5 text-gray-600">Lab - Full Blood Count</td>
                      <td className="p-1.5 text-gray-600 text-right">1</td>
                      <td className="p-1.5 text-gray-600 text-right">KES 800</td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-right text-xs mb-3">
                  <p className="font-bold text-gray-900">Total: KES 2,300</p>
                </div>
                {/* Footer */}
                <div className="border-t border-gray-200 pt-2 text-center">
                  <p className="text-[10px] text-gray-400">Thank you for choosing {profileForm.name || 'Hospital Name'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
