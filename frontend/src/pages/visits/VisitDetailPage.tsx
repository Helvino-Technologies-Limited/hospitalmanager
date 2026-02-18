import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { visitApi } from '../../api/services';
import type { Visit } from '../../types';
import StatusBadge from '../../components/StatusBadge';

export default function VisitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Visit>>({});

  useEffect(() => {
    if (id) visitApi.getById(Number(id)).then((r) => { setVisit(r.data.data); setForm(r.data.data); }).catch(() => navigate('/visits'));
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id) return;
    const { data } = await visitApi.update(Number(id), form);
    setVisit(data.data);
    setEditing(false);
  };

  const handleComplete = async () => {
    if (!id) return;
    const { data } = await visitApi.complete(Number(id));
    setVisit(data.data);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/visits')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Visit #{visit.id}</h1>
            <p className="text-sm text-gray-500">{visit.patientName} ({visit.patientNo})</p>
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clinical Notes */}
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

        {/* Vitals */}
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
    </div>
  );
}
