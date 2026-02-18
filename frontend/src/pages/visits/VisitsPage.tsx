import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Stethoscope } from 'lucide-react';
import { visitApi, patientApi, userApi } from '../../api/services';
import type { Visit, Patient, User } from '../../types';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [form, setForm] = useState({ patientId: '', doctorId: '', visitType: 'OPD', chiefComplaint: '' });
  const navigate = useNavigate();

  const loadVisits = (p = 0) => {
    setLoading(true);
    visitApi.getAll(p).then((r) => {
      setVisits(r.data.data.content);
      setTotalPages(r.data.data.totalPages);
      setPage(p);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadVisits(); }, []);

  const openModal = () => {
    patientApi.getAll(0, 100).then((r) => setPatients(r.data.data.content)).catch(() => {});
    userApi.getByRole('DOCTOR').then((r) => setDoctors(r.data.data)).catch(() => {});
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await visitApi.create({
      patientId: Number(form.patientId), doctorId: form.doctorId ? Number(form.doctorId) : undefined,
      visitType: form.visitType as Visit['visitType'], chiefComplaint: form.chiefComplaint,
    });
    setShowModal(false);
    setForm({ patientId: '', doctorId: '', visitType: 'OPD', chiefComplaint: '' });
    loadVisits();
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patientName', label: 'Patient', render: (v: Visit) => (
      <div><div className="font-medium text-gray-900">{v.patientName}</div><div className="text-xs text-gray-500">{v.patientNo}</div></div>
    )},
    { key: 'doctorName', label: 'Doctor', render: (v: Visit) => v.doctorName || '-' },
    { key: 'visitType', label: 'Type', render: (v: Visit) => <StatusBadge status={v.visitType} /> },
    { key: 'chiefComplaint', label: 'Complaint', render: (v: Visit) => <span className="truncate max-w-[200px] block">{v.chiefComplaint || '-'}</span> },
    { key: 'completed', label: 'Status', render: (v: Visit) => <StatusBadge status={v.completed ? 'COMPLETED' : 'IN_PROGRESS'} /> },
    { key: 'createdAt', label: 'Date', render: (v: Visit) => v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
        </div>
        <button onClick={openModal} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> New Visit
        </button>
      </div>

      <DataTable columns={columns} data={visits} page={page} totalPages={totalPages} onPageChange={loadVisits}
        onRowClick={(v) => navigate(`/visits/${v.id}`)} loading={loading} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Visit">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName} ({p.patientNo})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
            <select value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="OPD">OPD</option><option value="IPD">IPD</option><option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
            <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Create Visit
          </button>
        </form>
      </Modal>
    </div>
  );
}
