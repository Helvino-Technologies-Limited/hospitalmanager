import { useState, useEffect, useCallback } from 'react';
import { Plus, FlaskConical, ListOrdered } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { labApi } from '../../api/services';
import type { LabTest, LabOrder, LabOrderStatus } from '../../types';

type Tab = 'orders' | 'catalog';

const ORDER_STATUSES: LabOrderStatus[] = ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'RELEASED'];
const TEST_CATEGORIES = ['Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Urinalysis', 'Parasitology', 'Serology', 'Other'];
const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'CSF', 'Tissue', 'Other'];

const emptyTest: Partial<LabTest> = {
  testName: '',
  testCode: '',
  category: '',
  sampleType: '',
  price: 0,
  referenceRange: '',
  unit: '',
};

export default function LabPage() {
  const [tab, setTab] = useState<Tab>('orders');

  // Orders state
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus>('ORDERED');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Process result modal
  const [processModal, setProcessModal] = useState<LabOrder | null>(null);
  const [resultForm, setResultForm] = useState({ result: '', abnormal: false, remarks: '' });

  // Catalog state
  const [tests, setTests] = useState<LabTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [addTestModal, setAddTestModal] = useState(false);
  const [testForm, setTestForm] = useState<Partial<LabTest>>(emptyTest);
  const [saving, setSaving] = useState(false);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await labApi.getOrdersByStatus(statusFilter, ordersPage);
      setOrders(res.data.data.content);
      setOrdersTotalPages(res.data.data.totalPages);
    } catch {
      /* handled */
    } finally {
      setOrdersLoading(false);
    }
  }, [statusFilter, ordersPage]);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const res = await labApi.getTests();
      setTests(res.data.data);
    } catch {
      /* handled */
    } finally {
      setTestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'orders') fetchOrders();
    else fetchTests();
  }, [tab, fetchOrders, fetchTests]);

  useEffect(() => {
    setOrdersPage(0);
  }, [statusFilter]);

  // Order actions
  const handleCollectSample = async (order: LabOrder) => {
    setActionLoading(order.id);
    try {
      await labApi.collectSample(order.id);
      fetchOrders();
    } catch {
      /* handled */
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenProcess = (order: LabOrder) => {
    setProcessModal(order);
    setResultForm({ result: '', abnormal: false, remarks: '' });
  };

  const handleProcessResult = async () => {
    if (!processModal) return;
    setActionLoading(processModal.id);
    try {
      const processedById = Number(localStorage.getItem('userId') || 0);
      await labApi.processResult(processModal.id, { ...resultForm, processedById });
      setProcessModal(null);
      fetchOrders();
    } catch {
      /* handled */
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (order: LabOrder) => {
    setActionLoading(order.id);
    try {
      const verifiedById = Number(localStorage.getItem('userId') || 0);
      await labApi.verify(order.id, verifiedById);
      fetchOrders();
    } catch {
      /* handled */
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelease = async (order: LabOrder) => {
    setActionLoading(order.id);
    try {
      await labApi.release(order.id);
      fetchOrders();
    } catch {
      /* handled */
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddTest = async () => {
    setSaving(true);
    try {
      await labApi.createTest(testForm);
      setAddTestModal(false);
      setTestForm(emptyTest);
      fetchTests();
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  };

  const getActionButton = (order: LabOrder) => {
    const isLoading = actionLoading === order.id;
    const base = 'px-3 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-50';

    switch (order.status) {
      case 'ORDERED':
        return (
          <button onClick={() => handleCollectSample(order)} disabled={isLoading} className={`${base} bg-indigo-600 hover:bg-indigo-700`}>
            {isLoading ? 'Collecting...' : 'Collect Sample'}
          </button>
        );
      case 'SAMPLE_COLLECTED':
        return (
          <button onClick={() => handleOpenProcess(order)} disabled={isLoading} className={`${base} bg-purple-600 hover:bg-purple-700`}>
            Process
          </button>
        );
      case 'COMPLETED':
        return (
          <button onClick={() => handleVerify(order)} disabled={isLoading} className={`${base} bg-teal-600 hover:bg-teal-700`}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        );
      case 'VERIFIED':
        return (
          <button onClick={() => handleRelease(order)} disabled={isLoading} className={`${base} bg-green-600 hover:bg-green-700`}>
            {isLoading ? 'Releasing...' : 'Release'}
          </button>
        );
      default:
        return null;
    }
  };

  const orderColumns = [
    { key: 'testName', label: 'Test' },
    { key: 'testCode', label: 'Code' },
    { key: 'category', label: 'Category' },
    { key: 'orderedByName', label: 'Ordered By' },
    {
      key: 'status',
      label: 'Status',
      render: (o: LabOrder) => <StatusBadge status={o.status} />,
    },
    {
      key: 'result',
      label: 'Result',
      render: (o: LabOrder) => o.result ? (
        <span className={o.abnormal ? 'text-red-600 font-semibold' : ''}>
          {o.result} {o.abnormal && '(Abnormal)'}
        </span>
      ) : <span className="text-gray-400">--</span>,
    },
    {
      key: 'createdAt',
      label: 'Ordered At',
      render: (o: LabOrder) => new Date(o.createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (o: LabOrder) => getActionButton(o),
    },
  ];

  const testColumns = [
    { key: 'testName', label: 'Test Name' },
    { key: 'testCode', label: 'Code' },
    { key: 'category', label: 'Category' },
    { key: 'sampleType', label: 'Sample Type' },
    {
      key: 'price',
      label: 'Price',
      render: (t: LabTest) => `KES ${t.price.toLocaleString()}`,
    },
    { key: 'referenceRange', label: 'Reference Range' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'active',
      label: 'Status',
      render: (t: LabTest) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {t.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'orders', label: 'Orders Queue', icon: <ListOrdered className="w-4 h-4" /> },
    { key: 'catalog', label: 'Test Catalog', icon: <FlaskConical className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Laboratory</h1>
        {tab === 'catalog' && (
          <button
            onClick={() => setAddTestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Test
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders Queue Tab */}
      {tab === 'orders' && (
        <>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => (
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
          <DataTable
            columns={orderColumns}
            data={orders}
            page={ordersPage}
            totalPages={ordersTotalPages}
            onPageChange={setOrdersPage}
            loading={ordersLoading}
          />
        </>
      )}

      {/* Test Catalog Tab */}
      {tab === 'catalog' && (
        <DataTable columns={testColumns} data={tests} loading={testsLoading} />
      )}

      {/* Process Result Modal */}
      <Modal
        open={processModal !== null}
        onClose={() => setProcessModal(null)}
        title={`Process Result - ${processModal?.testName || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
            <textarea
              value={resultForm.result}
              onChange={(e) => setResultForm((prev) => ({ ...prev, result: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="abnormal"
              checked={resultForm.abnormal}
              onChange={(e) => setResultForm((prev) => ({ ...prev, abnormal: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="abnormal" className="text-sm font-medium text-gray-700">Mark as Abnormal</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={resultForm.remarks}
              onChange={(e) => setResultForm((prev) => ({ ...prev, remarks: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setProcessModal(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessResult}
              disabled={!resultForm.result || actionLoading !== null}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading !== null ? 'Saving...' : 'Submit Result'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Test Modal */}
      <Modal open={addTestModal} onClose={() => setAddTestModal(false)} title="Add Lab Test" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
            <input
              type="text"
              value={testForm.testName || ''}
              onChange={(e) => setTestForm((prev) => ({ ...prev, testName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Code</label>
            <input
              type="text"
              value={testForm.testCode || ''}
              onChange={(e) => setTestForm((prev) => ({ ...prev, testCode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={testForm.category || ''}
              onChange={(e) => setTestForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {TEST_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
            <select
              value={testForm.sampleType || ''}
              onChange={(e) => setTestForm((prev) => ({ ...prev, sampleType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select sample type</option>
              {SAMPLE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
            <input
              type="number"
              value={testForm.price || 0}
              onChange={(e) => setTestForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              value={testForm.unit || ''}
              onChange={(e) => setTestForm((prev) => ({ ...prev, unit: e.target.value }))}
              placeholder="e.g. mg/dL, mmol/L"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Range</label>
            <input
              type="text"
              value={testForm.referenceRange || ''}
              onChange={(e) => setTestForm((prev) => ({ ...prev, referenceRange: e.target.value }))}
              placeholder="e.g. 70-100 mg/dL"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setAddTestModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAddTest}
            disabled={saving || !testForm.testName || !testForm.testCode}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Test'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
