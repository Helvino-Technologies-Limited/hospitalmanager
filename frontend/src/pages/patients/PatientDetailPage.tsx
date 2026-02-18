import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Shield, Droplets, AlertTriangle, Calendar, User } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { patientApi, visitApi, billingApi } from '../../api/services';
import type { Patient, Visit, Billing } from '../../types';

type Tab = 'overview' | 'visits' | 'billing';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [visitsPage, setVisitsPage] = useState(0);
  const [visitsTotalPages, setVisitsTotalPages] = useState(1);
  const [billingsPage, setBillingsPage] = useState(0);
  const [billingsTotalPages, setBillingsTotalPages] = useState(1);

  const patientId = Number(id);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const res = await patientApi.getById(patientId);
        setPatient(res.data.data);
      } catch {
        // Error
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    if (activeTab === 'visits') {
      visitApi.getByPatient(patientId, visitsPage).then((res) => {
        setVisits(res.data.data.content);
        setVisitsTotalPages(res.data.data.totalPages);
      }).catch(() => {});
    }
  }, [patientId, activeTab, visitsPage]);

  useEffect(() => {
    if (activeTab === 'billing') {
      billingApi.getByPatient(patientId, billingsPage).then((res) => {
        setBillings(res.data.data.content);
        setBillingsTotalPages(res.data.data.totalPages);
      }).catch(() => {});
    }
  }, [patientId, activeTab, billingsPage]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20 text-gray-500">
        Patient not found.
        <button onClick={() => navigate('/patients')} className="block mx-auto mt-4 text-blue-600 hover:underline">
          Back to patients
        </button>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'visits', label: 'Visits' },
    { key: 'billing', label: 'Billing' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
          <p className="text-sm text-gray-500">{patient.patientNo}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem icon={<User className="w-4 h-4" />} label="Gender" value={patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()} />
          <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={`${patient.dateOfBirth}${age !== null ? ` (${age} yrs)` : ''}`} />
          <InfoItem icon={<Phone className="w-4 h-4" />} label="Phone" value={patient.phone} />
          <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={patient.email || '-'} />
          <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={patient.address || '-'} />
          <InfoItem icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={patient.bloodGroup || '-'} />
          <InfoItem icon={<AlertTriangle className="w-4 h-4" />} label="Allergies" value={patient.allergies || 'None'} />
          <InfoItem icon={<Shield className="w-4 h-4" />} label="Insurance" value={patient.insuranceCompanyName || 'None'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab patient={patient} />}
      {activeTab === 'visits' && (
        <VisitsTab visits={visits} page={visitsPage} totalPages={visitsTotalPages} onPageChange={setVisitsPage} />
      )}
      {activeTab === 'billing' && (
        <BillingTab billings={billings} page={billingsPage} totalPages={billingsTotalPages} onPageChange={setBillingsPage} />
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function OverviewTab({ patient }: { patient: Patient }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Demographics */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Demographics</h3>
        <dl className="space-y-3">
          <DetailRow label="Full Name" value={patient.fullName} />
          <DetailRow label="ID Number" value={patient.idNumber || '-'} />
          <DetailRow label="Gender" value={patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()} />
          <DetailRow label="Date of Birth" value={patient.dateOfBirth} />
          <DetailRow label="Phone" value={patient.phone} />
          <DetailRow label="Email" value={patient.email || '-'} />
          <DetailRow label="Address" value={patient.address || '-'} />
        </dl>
      </div>

      {/* Next of Kin */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Next of Kin</h3>
          <dl className="space-y-3">
            <DetailRow label="Name" value={patient.nextOfKinName || '-'} />
            <DetailRow label="Phone" value={patient.nextOfKinPhone || '-'} />
            <DetailRow label="Relationship" value={patient.nextOfKinRelationship || '-'} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Medical & Insurance</h3>
          <dl className="space-y-3">
            <DetailRow label="Blood Group" value={patient.bloodGroup || '-'} />
            <DetailRow label="Allergies" value={patient.allergies || 'None'} />
            <DetailRow label="Insurance Company" value={patient.insuranceCompanyName || 'None'} />
            <DetailRow label="Member Number" value={patient.insuranceMemberNumber || '-'} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
    </div>
  );
}

function VisitsTab({
  visits,
  page,
  totalPages,
  onPageChange,
}: {
  visits: Visit[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (visits.length === 0 && page === 0) {
    return <p className="text-center py-12 text-gray-400">No visits recorded.</p>;
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <div key={visit.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={visit.visitType} />
              {visit.completed && <StatusBadge status="COMPLETED" />}
            </div>
            <span className="text-xs text-gray-500">{new Date(visit.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Doctor:</span>{' '}
              <span className="font-medium text-gray-900">{visit.doctorName || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-gray-500">Chief Complaint:</span>{' '}
              <span className="font-medium text-gray-900">{visit.chiefComplaint || '-'}</span>
            </div>
            {visit.diagnosis && (
              <div className="md:col-span-2">
                <span className="text-gray-500">Diagnosis:</span>{' '}
                <span className="font-medium text-gray-900">{visit.diagnosis}</span>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            {visit.prescriptions.length > 0 && <span>{visit.prescriptions.length} prescription(s)</span>}
            {visit.labOrders.length > 0 && <span>{visit.labOrders.length} lab order(s)</span>}
            {visit.imagingOrders.length > 0 && <span>{visit.imagingOrders.length} imaging order(s)</span>}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BillingTab({
  billings,
  page,
  totalPages,
  onPageChange,
}: {
  billings: Billing[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (billings.length === 0 && page === 0) {
    return <p className="text-center py-12 text-gray-400">No billing records.</p>;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  return (
    <div className="space-y-4">
      {billings.map((bill) => (
        <div key={bill.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">{bill.invoiceNumber}</span>
              <StatusBadge status={bill.status} />
            </div>
            <span className="text-xs text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-semibold text-gray-900">{formatCurrency(bill.totalAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Paid</p>
              <p className="font-semibold text-green-700">{formatCurrency(bill.paidAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Insurance</p>
              <p className="font-semibold text-blue-700">{formatCurrency(bill.insuranceCoveredAmount)}</p>
            </div>
          </div>
          {bill.items.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Items</p>
              <div className="space-y-1">
                {bill.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-700">
                    <span>{item.description} (x{item.quantity})</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
