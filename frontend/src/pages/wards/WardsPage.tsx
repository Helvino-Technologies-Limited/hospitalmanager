import { useEffect, useState } from 'react';
import { BedDouble, Plus } from 'lucide-react';
import { wardApi } from '../../api/services';
import type { Ward, Bed, Admission } from '../../types';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';

export default function WardsPage() {
  const [tab, setTab] = useState<'wards' | 'beds' | 'admissions'>('wards');
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [admPage, setAdmPage] = useState(0);
  const [admTotalPages, setAdmTotalPages] = useState(1);
  const [showWardModal, setShowWardModal] = useState(false);
  const [wardForm, setWardForm] = useState({ name: '', type: '', totalBeds: '' });

  useEffect(() => {
    wardApi.getWards().then((r) => setWards(r.data.data)).catch(() => {});
    wardApi.getAvailableBeds().then((r) => setBeds(r.data.data)).catch(() => {});
    loadAdmissions(0);
  }, []);

  const loadAdmissions = (p: number) => {
    wardApi.getAdmissions('ADMITTED', p).then((r) => { setAdmissions(r.data.data.content); setAdmTotalPages(r.data.data.totalPages); setAdmPage(p); }).catch(() => {});
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    await wardApi.createWard({ name: wardForm.name, type: wardForm.type, totalBeds: Number(wardForm.totalBeds), active: true });
    setShowWardModal(false);
    setWardForm({ name: '', type: '', totalBeds: '' });
    wardApi.getWards().then((r) => setWards(r.data.data));
  };

  const tabs = [
    { id: 'wards' as const, label: 'Wards' },
    { id: 'beds' as const, label: 'Available Beds' },
    { id: 'admissions' as const, label: 'Current Admissions' },
  ];

  const admissionCols = [
    { key: 'patientName', label: 'Patient', render: (a: Admission) => <div><div className="font-medium">{a.patientName}</div><div className="text-xs text-gray-500">{a.patientNo}</div></div> },
    { key: 'wardName', label: 'Ward' },
    { key: 'roomNumber', label: 'Room' },
    { key: 'bedNumber', label: 'Bed' },
    { key: 'admittingDoctorName', label: 'Doctor', render: (a: Admission) => a.admittingDoctorName || '-' },
    { key: 'status', label: 'Status', render: (a: Admission) => <StatusBadge status={a.status} /> },
    { key: 'admittedAt', label: 'Admitted', render: (a: Admission) => a.admittedAt ? new Date(a.admittedAt).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BedDouble className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Wards & Beds</h1>
        </div>
        <button onClick={() => setShowWardModal(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Ward
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'wards' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wards.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{w.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{w.type}</span>
              </div>
              <div className="text-sm text-gray-500">Total Beds: {w.totalBeds || 0}</div>
            </div>
          ))}
          {wards.length === 0 && <p className="col-span-3 text-center text-gray-400 py-8">No wards created yet</p>}
        </div>
      )}

      {tab === 'beds' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {beds.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Bed {b.bedNumber}</span>
                <StatusBadge status={b.status} />
              </div>
              <p className="text-xs text-gray-500">{b.wardName} - Room {b.roomNumber}</p>
              {b.dailyCharge && <p className="text-xs text-gray-500 mt-1">KES {b.dailyCharge}/day</p>}
            </div>
          ))}
          {beds.length === 0 && <p className="col-span-4 text-center text-gray-400 py-8">No available beds</p>}
        </div>
      )}

      {tab === 'admissions' && (
        <DataTable columns={admissionCols} data={admissions} page={admPage} totalPages={admTotalPages} onPageChange={loadAdmissions} />
      )}

      <Modal open={showWardModal} onClose={() => setShowWardModal(false)} title="Add Ward">
        <form onSubmit={handleCreateWard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name</label>
            <input value={wardForm.name} onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={wardForm.type} onChange={(e) => setWardForm({ ...wardForm, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select type</option>
              <option value="General">General</option><option value="ICU">ICU</option>
              <option value="Maternity">Maternity</option><option value="Pediatric">Pediatric</option>
              <option value="Surgical">Surgical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds</label>
            <input type="number" value={wardForm.totalBeds} onChange={(e) => setWardForm({ ...wardForm, totalBeds: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Create Ward</button>
        </form>
      </Modal>
    </div>
  );
}
