import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Pill, FlaskConical, Scan } from 'lucide-react';
import { visitApi, pharmacyApi, labApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import type { Visit, Drug, LabTest } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

export default function VisitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Visit>>({});

  // Prescription modal
  const [showRxModal, setShowRxModal] = useState(false);
  const [drugSearch, setDrugSearch] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [rxForm, setRxForm] = useState({ drugId: 0, drugName: '', dosage: '', frequency: '', duration: '', quantityPrescribed: 1, instructions: '' });

  // Lab order modal
  const [showLabModal, setShowLabModal] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');

  const loadVisit = useCallback(async () => {
    if (!id) return;
    try {
      const r = await visitApi.getById(Number(id));
      setVisit(r.data.data);
      setForm(r.data.data);
    } catch {
      navigate('/visits');
    }
  }, [id, navigate]);

  useEffect(() => { loadVisit(); }, [loadVisit]);

  const handleSave = async () => {
    if (!id) return;
    const { data } = await visitApi.update(Number(id), form);
    setVisit(data.data);
    setForm(data.data);
    setEditing(false);
  };

  const handleComplete = async () => {
    if (!id) return;
    const { data } = await visitApi.complete(Number(id));
    setVisit(data.data);
  };

  // Drug search with debounce
  useEffect(() => {
    if (drugSearch.trim().length < 2) { setDrugs([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await pharmacyApi.searchDrugs(drugSearch.trim());
        setDrugs(res.data.data.content);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [drugSearch]);

  const openRxModal = () => {
    setDrugSearch('');
    setDrugs([]);
    setRxForm({ drugId: 0, drugName: '', dosage: '', frequency: '', duration: '', quantityPrescribed: 1, instructions: '' });
    setShowRxModal(true);
  };

  const handleCreateRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rxForm.drugId) return;
    await pharmacyApi.createPrescription({
      visitId: Number(id),
      drugId: rxForm.drugId,
      dosage: rxForm.dosage,
      frequency: rxForm.frequency,
      duration: rxForm.duration,
      quantityPrescribed: rxForm.quantityPrescribed,
      instructions: rxForm.instructions,
    });
    setShowRxModal(false);
    loadVisit();
  };

  const openLabModal = async () => {
    try {
      const res = await labApi.getTests();
      setLabTests(res.data.data);
    } catch { /* ignore */ }
    setSelectedTestId('');
    setShowLabModal(true);
  };

  const handleCreateLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedTestId || !userId) return;
    await labApi.createOrder(Number(id), Number(selectedTestId), userId);
    setShowLabModal(false);
    loadVisit();
  };

  if (!visit) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const Field = ({ label, field, textarea }: { label: string; field: keyof Visit; textarea?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      {editing ? (
        textarea ? (
          <textarea value={(form[field] as string) || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} />
        ) : (
          <input value={(form[field] as string) || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        )
      ) : (
        <p className="text-sm text-gray-900">{(visit[field] as string) || '-'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Patient Info Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/visits')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
              {visit.patientName?.[0]}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{visit.patientName}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{visit.patientNo}</span>
                <span>|</span>
                <StatusBadge status={visit.visitType} />
                <span>|</span>
                <span>Dr. {visit.doctorName || 'Unassigned'}</span>
                <span>|</span>
                <span>{visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!visit.completed && (
              <>
                {editing ? (
                  <button onClick={handleSave} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Save className="w-4 h-4" /> Save
                  </button>
                ) : (
                  <button onClick={() => setEditing(true)} className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Edit
                  </button>
                )}
                <button onClick={handleComplete} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  Complete Visit
                </button>
              </>
            )}
            <StatusBadge status={visit.completed ? 'COMPLETED' : 'IN_PROGRESS'} />
          </div>
        </div>
      </div>

      {/* Clinical Notes + Vitals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Clinical Notes</h2>
          <Field label="Chief Complaint" field="chiefComplaint" textarea />
          <Field label="Presenting Illness" field="presentingIllness" textarea />
          <Field label="Examination" field="examination" textarea />
          <Field label="Diagnosis" field="diagnosis" textarea />
          <Field label="ICD-10 Code" field="diagnosisCode" />
          <Field label="Treatment Plan" field="treatmentPlan" textarea />
          <Field label="Doctor Notes" field="doctorNotes" textarea />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Vital Signs</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Blood Pressure', field: 'bloodPressure' as keyof Visit },
                { label: 'Temperature (°C)', field: 'temperature' as keyof Visit },
                { label: 'Pulse Rate', field: 'pulseRate' as keyof Visit },
                { label: 'Respiratory Rate', field: 'respiratoryRate' as keyof Visit },
                { label: 'Weight (kg)', field: 'weight' as keyof Visit },
                { label: 'Height (cm)', field: 'height' as keyof Visit },
                { label: 'O₂ Saturation (%)', field: 'oxygenSaturation' as keyof Visit },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  {editing ? (
                    <input value={(form[field] as string) || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{(visit[field] as string) || '-'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Visit Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><StatusBadge status={visit.visitType} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Doctor</span><span className="text-gray-900">{visit.doctorName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-900">{visit.createdAt ? new Date(visit.createdAt).toLocaleString() : '-'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescriptions | Lab Orders | Imaging Orders */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Prescriptions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Prescriptions</h2>
            </div>
            {!visit.completed && (
              <button onClick={openRxModal} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Prescribe
              </button>
            )}
          </div>
          {visit.prescriptions && visit.prescriptions.length > 0 ? (
            <div className="space-y-3">
              {visit.prescriptions.map((rx) => (
                <div key={rx.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{rx.drugName}</p>
                    <StatusBadge status={rx.dispensed ? 'DISPENSED' : 'PENDING'} />
                  </div>
                  <p className="text-xs text-gray-600">{rx.dosage} | {rx.frequency} | {rx.duration}</p>
                  {rx.instructions && <p className="text-xs text-gray-400 mt-1">{rx.instructions}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No prescriptions</p>
          )}
        </div>

        {/* Lab Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Lab Orders</h2>
            </div>
            {!visit.completed && (
              <button onClick={openLabModal} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Order Lab
              </button>
            )}
          </div>
          {visit.labOrders && visit.labOrders.length > 0 ? (
            <div className="space-y-3">
              {visit.labOrders.map((lo) => (
                <div key={lo.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{lo.testName}</p>
                    <StatusBadge status={lo.status} />
                  </div>
                  <p className="text-xs text-gray-500">{lo.testCode} | {lo.category}</p>
                  {lo.result && (
                    <p className={`text-xs mt-1 ${lo.abnormal ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                      Result: {lo.result} {lo.abnormal ? '(Abnormal)' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No lab orders</p>
          )}
        </div>

        {/* Imaging Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Imaging Orders</h2>
            </div>
          </div>
          {visit.imagingOrders && visit.imagingOrders.length > 0 ? (
            <div className="space-y-3">
              {visit.imagingOrders.map((io) => (
                <div key={io.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{io.imagingType}</p>
                    <StatusBadge status={io.status} />
                  </div>
                  <p className="text-xs text-gray-500">{io.bodyPart}</p>
                  {io.findings && <p className="text-xs text-gray-600 mt-1">Findings: {io.findings}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No imaging orders</p>
          )}
        </div>
      </div>

      {/* Prescription Modal */}
      <Modal open={showRxModal} onClose={() => setShowRxModal(false)} title="New Prescription">
        <form onSubmit={handleCreateRx} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drug</label>
            <input
              type="text"
              placeholder="Search drug by name..."
              value={drugSearch}
              onChange={(e) => {
                setDrugSearch(e.target.value);
                setRxForm({ ...rxForm, drugId: 0, drugName: '' });
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {drugs.length > 0 && !rxForm.drugId && (
              <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
                {drugs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setRxForm({ ...rxForm, drugId: d.id, drugName: `${d.genericName} (${d.brandName})` });
                      setDrugSearch(`${d.genericName} (${d.brandName}) - ${d.strength}`);
                      setDrugs([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                  >
                    <span className="font-medium">{d.genericName}</span>{' '}
                    <span className="text-gray-500">{d.brandName} - {d.strength}</span>
                    <span className="text-xs text-gray-400 ml-2">(Stock: {d.quantityInStock})</span>
                  </button>
                ))}
              </div>
            )}
            {rxForm.drugId > 0 && <p className="text-xs text-green-600 mt-1">Drug selected: {rxForm.drugName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
              <input value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 500mg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <input value={rxForm.frequency} onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 3x daily" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input value={rxForm.duration} onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 7 days" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min={1} value={rxForm.quantityPrescribed} onChange={(e) => setRxForm({ ...rxForm, quantityPrescribed: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="e.g. Take after meals" />
          </div>
          <button type="submit" disabled={!rxForm.drugId} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Create Prescription
          </button>
        </form>
      </Modal>

      {/* Lab Order Modal */}
      <Modal open={showLabModal} onClose={() => setShowLabModal(false)} title="New Lab Order">
        <form onSubmit={handleCreateLabOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Test</label>
            <select value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select test</option>
              {labTests.map((t) => (
                <option key={t.id} value={t.id}>{t.testName} ({t.testCode}) - {t.category}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={!selectedTestId} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Create Lab Order
          </button>
        </form>
      </Modal>
    </div>
  );
}
