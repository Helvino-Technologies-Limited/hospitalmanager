import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Pill, FlaskConical, Scan, Printer, Share2 } from 'lucide-react';
import { visitApi, pharmacyApi, labApi, patientApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { useHospitalStore } from '../../store/hospitalStore';
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

  const hospital = useHospitalStore();

  const printDiagnosisReport = () => {
    if (!visit) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const vitals = [
      visit.bloodPressure && `Blood Pressure: ${visit.bloodPressure}`,
      visit.temperature && `Temperature: ${visit.temperature}°C`,
      visit.pulseRate && `Pulse Rate: ${visit.pulseRate} bpm`,
      visit.respiratoryRate && `Respiratory Rate: ${visit.respiratoryRate}/min`,
      visit.oxygenSaturation && `O₂ Saturation: ${visit.oxygenSaturation}%`,
      visit.weight && `Weight: ${visit.weight} kg`,
      visit.height && `Height: ${visit.height} cm`,
    ].filter(Boolean);

    const prescriptions = visit.prescriptions || [];
    const labOrders = visit.labOrders || [];
    const imagingOrders = visit.imagingOrders || [];

    win.document.write(`<!DOCTYPE html><html><head><title>Diagnosis Report - ${visit.patientName}</title>
<style>
body{font-family:Arial,sans-serif;max-width:750px;margin:0 auto;padding:20px;color:#333;font-size:13px}
.header{text-align:center;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:16px}
.header h1{margin:0;font-size:20px} .header p{margin:2px 0;font-size:11px;color:#666}
.header .doc-title{font-weight:700;font-size:13px;margin-top:8px;text-transform:uppercase;letter-spacing:1px}
.patient-info{display:flex;justify-content:space-between;background:#f9f9f9;padding:10px 14px;border-radius:6px;margin-bottom:16px}
.patient-info div{font-size:12px;line-height:1.6}
.section{margin-bottom:14px}
.section h3{font-size:13px;font-weight:700;text-transform:uppercase;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin:0 0 8px 0;letter-spacing:0.5px}
.section p{margin:4px 0;line-height:1.5}
.section .label{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.vitals-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px 12px}
.vitals-grid span{font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:6px}
th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #eee;font-size:12px}
th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase;color:#666}
.signature{margin-top:40px;display:flex;justify-content:space-between}
.signature div{text-align:center;width:200px}
.signature .line{border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:11px;color:#666}
.footer{text-align:center;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:8px;margin-top:30px}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
.badge-abnormal{background:#fee;color:#c00} .badge-normal{background:#efe;color:#060}
@media print{body{padding:0;margin:0}}
</style></head><body>
<div class="header">
<h1>${hospital.name}</h1>
<p>${hospital.tagline}</p>
<p>${hospital.address} | Tel: ${hospital.phone} | ${hospital.email}</p>
<div class="doc-title">Medical Diagnosis Report</div>
</div>

<div class="patient-info">
<div>
<strong>Patient:</strong> ${visit.patientName}<br/>
<strong>Patient No:</strong> ${visit.patientNo}<br/>
<strong>Visit Type:</strong> ${visit.visitType}
</div>
<div style="text-align:right">
<strong>Doctor:</strong> Dr. ${visit.doctorName || 'N/A'}<br/>
<strong>Date:</strong> ${visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : '-'}<br/>
<strong>Visit #:</strong> ${visit.id}
</div>
</div>

${vitals.length > 0 ? `<div class="section">
<h3>Vital Signs</h3>
<div class="vitals-grid">${vitals.map(v => `<span>${v}</span>`).join('')}</div>
</div>` : ''}

${visit.chiefComplaint ? `<div class="section">
<h3>Chief Complaint</h3>
<p>${visit.chiefComplaint}</p>
</div>` : ''}

${visit.presentingIllness ? `<div class="section">
<h3>History of Presenting Illness</h3>
<p>${visit.presentingIllness}</p>
</div>` : ''}

${visit.examination ? `<div class="section">
<h3>Examination Findings</h3>
<p>${visit.examination}</p>
</div>` : ''}

${visit.diagnosis ? `<div class="section">
<h3>Diagnosis</h3>
<p><strong>${visit.diagnosis}</strong>${visit.diagnosisCode ? ` <span style="color:#888">(ICD-10: ${visit.diagnosisCode})</span>` : ''}</p>
</div>` : ''}

${visit.treatmentPlan ? `<div class="section">
<h3>Treatment Plan</h3>
<p>${visit.treatmentPlan}</p>
</div>` : ''}

${visit.doctorNotes ? `<div class="section">
<h3>Doctor's Notes</h3>
<p>${visit.doctorNotes}</p>
</div>` : ''}

${prescriptions.length > 0 ? `<div class="section">
<h3>Prescriptions</h3>
<table>
<thead><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
<tbody>
${prescriptions.map(rx => `<tr>
<td>${rx.drugName}</td><td>${rx.dosage}</td><td>${rx.frequency}</td><td>${rx.duration}</td><td>${rx.instructions || '-'}</td>
</tr>`).join('')}
</tbody></table>
</div>` : ''}

${labOrders.length > 0 ? `<div class="section">
<h3>Laboratory Results</h3>
<table>
<thead><tr><th>Test</th><th>Category</th><th>Status</th><th>Result</th></tr></thead>
<tbody>
${labOrders.map(lo => `<tr>
<td>${lo.testName} (${lo.testCode})</td><td>${lo.category}</td><td>${lo.status.replace(/_/g, ' ')}</td>
<td>${lo.result ? `${lo.result} ${lo.abnormal ? '<span class="badge badge-abnormal">Abnormal</span>' : '<span class="badge badge-normal">Normal</span>'}` : '-'}</td>
</tr>`).join('')}
</tbody></table>
</div>` : ''}

${imagingOrders.length > 0 ? `<div class="section">
<h3>Imaging Reports</h3>
<table>
<thead><tr><th>Type</th><th>Body Part</th><th>Status</th><th>Findings</th></tr></thead>
<tbody>
${imagingOrders.map(io => `<tr>
<td>${io.imagingType}</td><td>${io.bodyPart}</td><td>${io.status.replace(/_/g, ' ')}</td><td>${io.findings || '-'}</td>
</tr>`).join('')}
</tbody></table>
</div>` : ''}

<div class="signature">
<div><div class="line">Doctor's Signature</div></div>
<div><div class="line">Date & Stamp</div></div>
</div>

<div class="footer">
<p>This is a computer-generated medical report from ${hospital.name}.</p>
<p>Printed on ${new Date().toLocaleString()}</p>
<p style="margin-top:4px;font-size:9px;color:#ccc">Powered by Helvino Technologies | www.helvino.com</p>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const shareReportWhatsApp = async () => {
    if (!visit) return;
    let phone = '';
    try {
      const res = await patientApi.getById(visit.patientId);
      phone = res.data.data.phone || '';
    } catch { /* ignore */ }

    const prescriptions = visit.prescriptions || [];
    const labOrders = visit.labOrders || [];

    const lines = [
      `*${hospital.name}*`,
      `_${hospital.tagline}_`,
      `${hospital.address} | Tel: ${hospital.phone}`,
      '',
      `*MEDICAL DIAGNOSIS REPORT*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Patient:* ${visit.patientName}`,
      `*Patient No:* ${visit.patientNo}`,
      `*Doctor:* Dr. ${visit.doctorName || 'N/A'}`,
      `*Date:* ${visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : '-'}`,
      `*Visit Type:* ${visit.visitType}`,
    ];

    const vitals = [
      visit.bloodPressure && `BP: ${visit.bloodPressure}`,
      visit.temperature && `Temp: ${visit.temperature}°C`,
      visit.pulseRate && `Pulse: ${visit.pulseRate} bpm`,
      visit.respiratoryRate && `RR: ${visit.respiratoryRate}/min`,
      visit.oxygenSaturation && `SpO₂: ${visit.oxygenSaturation}%`,
      visit.weight && `Weight: ${visit.weight} kg`,
    ].filter(Boolean);

    if (vitals.length > 0) {
      lines.push('', `*Vitals:* ${vitals.join(' | ')}`);
    }

    if (visit.chiefComplaint) lines.push('', `*Chief Complaint:*`, visit.chiefComplaint);
    if (visit.diagnosis) {
      lines.push('', `*Diagnosis:*`, `${visit.diagnosis}${visit.diagnosisCode ? ` (ICD-10: ${visit.diagnosisCode})` : ''}`);
    }
    if (visit.treatmentPlan) lines.push('', `*Treatment Plan:*`, visit.treatmentPlan);

    if (prescriptions.length > 0) {
      lines.push('', `*Prescriptions:*`);
      prescriptions.forEach((rx, i) => {
        lines.push(`${i + 1}. ${rx.drugName} — ${rx.dosage}, ${rx.frequency}, ${rx.duration}${rx.instructions ? ` (${rx.instructions})` : ''}`);
      });
    }

    if (labOrders.length > 0) {
      lines.push('', `*Lab Results:*`);
      labOrders.forEach((lo) => {
        lines.push(`• ${lo.testName}: ${lo.result ? `${lo.result}${lo.abnormal ? ' ⚠️ Abnormal' : ' ✓ Normal'}` : lo.status.replace(/_/g, ' ')}`);
      });
    }

    if (visit.doctorNotes) lines.push('', `*Doctor's Notes:*`, visit.doctorNotes);

    lines.push('', `━━━━━━━━━━━━━━━━━━━━`, `_Report from ${hospital.name}_`);

    const text = encodeURIComponent(lines.join('\n'));
    const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^0/, '254');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
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
            <button onClick={printDiagnosisReport} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
              <Printer className="w-4 h-4" /> Print Report
            </button>
            <button onClick={shareReportWhatsApp} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
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
