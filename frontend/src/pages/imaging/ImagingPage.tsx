import { useState, useEffect, useCallback } from 'react';
import { Plus, FileImage } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { imagingApi } from '../../api/services';
import type { ImagingOrder, ImagingType, LabOrderStatus } from '../../types';

const IMAGING_TYPES: ImagingType[] = ['XRAY', 'ULTRASOUND', 'CT_SCAN', 'MRI'];
const STATUS_FILTERS: LabOrderStatus[] = ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'RELEASED'];

const IMAGING_TYPE_LABELS: Record<ImagingType, string> = {
  XRAY: 'X-Ray',
  ULTRASOUND: 'Ultrasound',
  CT_SCAN: 'CT Scan',
  MRI: 'MRI',
};

const emptyOrder: Partial<ImagingOrder> = {
  visitId: undefined,
  imagingType: undefined,
  bodyPart: '',
  clinicalIndication: '',
  price: 0,
};

export default function ImagingPage() {
  const [orders, setOrders] = useState<ImagingOrder[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | 'ALL'>('ALL');

  // New order modal
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState<Partial<ImagingOrder>>(emptyOrder);
  const [saving, setSaving] = useState(false);

  // Complete order modal
  const [completeModal, setCompleteModal] = useState<ImagingOrder | null>(null);
  const [completeForm, setCompleteForm] = useState({ findings: '', impression: '', radiologistId: 0 });
  const [completing, setCompleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = statusFilter === 'ALL'
        ? await imagingApi.getAll(page)
        : await imagingApi.getByStatus(statusFilter, page);
      setOrders(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const handleCreateOrder = async () => {
    setSaving(true);
    try {
      await imagingApi.create(orderForm);
      setNewOrderModal(false);
      setOrderForm(emptyOrder);
      fetchOrders();
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!completeModal) return;
    setCompleting(true);
    try {
      await imagingApi.complete(completeModal.id, completeForm);
      setCompleteModal(null);
      setCompleteForm({ findings: '', impression: '', radiologistId: 0 });
      fetchOrders();
    } catch {
      /* handled */
    } finally {
      setCompleting(false);
    }
  };

  const openCompleteModal = (order: ImagingOrder) => {
    const radiologistId = Number(localStorage.getItem('userId') || 0);
    setCompleteModal(order);
    setCompleteForm({ findings: '', impression: '', radiologistId });
  };

  const columns = [
    {
      key: 'imagingType',
      label: 'Type',
      render: (o: ImagingOrder) => (
        <div className="flex items-center gap-2">
          <FileImage className="w-4 h-4 text-gray-400" />
          <span>{IMAGING_TYPE_LABELS[o.imagingType] || o.imagingType}</span>
        </div>
      ),
    },
    { key: 'bodyPart', label: 'Body Part' },
    { key: 'clinicalIndication', label: 'Clinical Indication' },
    {
      key: 'status',
      label: 'Status',
      render: (o: ImagingOrder) => <StatusBadge status={o.status} />,
    },
    {
      key: 'price',
      label: 'Price',
      render: (o: ImagingOrder) => `KES ${o.price.toLocaleString()}`,
    },
    {
      key: 'findings',
      label: 'Findings',
      render: (o: ImagingOrder) => o.findings ? (
        <span className="text-sm">{o.findings.length > 60 ? `${o.findings.slice(0, 60)}...` : o.findings}</span>
      ) : <span className="text-gray-400">--</span>,
    },
    { key: 'radiologistName', label: 'Radiologist' },
    {
      key: 'createdAt',
      label: 'Ordered',
      render: (o: ImagingOrder) => new Date(o.createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (o: ImagingOrder) => {
        if (o.status === 'ORDERED' || o.status === 'PROCESSING') {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); openCompleteModal(o); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Complete
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Imaging / Radiology</h1>
        <button
          onClick={() => setNewOrderModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
      />

      {/* New Order Modal */}
      <Modal open={newOrderModal} onClose={() => setNewOrderModal(false)} title="New Imaging Order">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit ID</label>
            <input
              type="number"
              value={orderForm.visitId || ''}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, visitId: parseInt(e.target.value) || undefined }))}
              placeholder="Enter visit ID"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imaging Type</label>
            <select
              value={orderForm.imagingType || ''}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, imagingType: e.target.value as ImagingType }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              {IMAGING_TYPES.map((t) => (
                <option key={t} value={t}>{IMAGING_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
            <input
              type="text"
              value={orderForm.bodyPart || ''}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, bodyPart: e.target.value }))}
              placeholder="e.g. Chest, Left Knee, Abdomen"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Indication</label>
            <textarea
              value={orderForm.clinicalIndication || ''}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, clinicalIndication: e.target.value }))}
              rows={3}
              placeholder="Reason for imaging request"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
            <input
              type="number"
              value={orderForm.price || 0}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setNewOrderModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={saving || !orderForm.visitId || !orderForm.imagingType || !orderForm.bodyPart}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Complete Order Modal */}
      <Modal
        open={completeModal !== null}
        onClose={() => setCompleteModal(null)}
        title={`Complete Order - ${completeModal ? IMAGING_TYPE_LABELS[completeModal.imagingType] : ''} (${completeModal?.bodyPart || ''})`}
        size="lg"
      >
        <div className="space-y-4">
          {completeModal && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p><span className="font-medium">Clinical Indication:</span> {completeModal.clinicalIndication}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <textarea
              value={completeForm.findings}
              onChange={(e) => setCompleteForm((prev) => ({ ...prev, findings: e.target.value }))}
              rows={4}
              placeholder="Describe the imaging findings"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impression</label>
            <textarea
              value={completeForm.impression}
              onChange={(e) => setCompleteForm((prev) => ({ ...prev, impression: e.target.value }))}
              rows={3}
              placeholder="Overall impression / diagnosis"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radiologist ID</label>
            <input
              type="number"
              value={completeForm.radiologistId || ''}
              onChange={(e) => setCompleteForm((prev) => ({ ...prev, radiologistId: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCompleteModal(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteOrder}
              disabled={completing || !completeForm.findings || !completeForm.impression}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {completing ? 'Completing...' : 'Complete Order'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
