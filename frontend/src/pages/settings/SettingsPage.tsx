import { Heart, Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Hospital Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
              <input defaultValue="Helvino Hospital" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input defaultValue="Nairobi, Kenya" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input defaultValue="+254 703 445 756" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input defaultValue="helvinotechltd@gmail.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
              Save Changes
            </button>
          </div>
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
    </div>
  );
}
