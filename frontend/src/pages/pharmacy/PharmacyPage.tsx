import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, AlertTriangle, Pill, ClipboardList } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { pharmacyApi } from '../../api/services';
import type { Drug, Prescription } from '../../types';

type Tab = 'inventory' | 'prescriptions';

const DRUG_CATEGORIES = ['Antibiotics', 'Analgesics', 'Antihistamines', 'Antihypertensives', 'Antidiabetics', 'Vitamins', 'Antacids', 'Other'];
const FORMULATIONS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Suspension'];

const emptyDrug: Partial<Drug> = {
  genericName: '',
  brandName: '',
  category: '',
  formulation: '',
  strength: '',
  quantityInStock: 0,
  reorderLevel: 10,
  batchNumber: '',
  expiryDate: '',
  supplier: '',
  costPrice: 0,
  sellingPrice: 0,
};

export default function PharmacyPage() {
  const [tab, setTab] = useState<Tab>('inventory');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Drug>>(emptyDrug);
  const [saving, setSaving] = useState(false);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [rxLoading, setRxLoading] = useState(false);
  const [dispensing, setDispensing] = useState<number | null>(null);

  const [lowStock, setLowStock] = useState<Drug[]>([]);

  // Fetch drugs
  const fetchDrugs = useCallback(async () => {
    setLoading(true);
    try {
      const res = search
        ? await pharmacyApi.searchDrugs(search, page)
        : await pharmacyApi.getDrugs(page);
      setDrugs(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Fetch pending prescriptions
  const fetchPrescriptions = useCallback(async () => {
    setRxLoading(true);
    try {
      const res = await pharmacyApi.getPendingRx();
      setPrescriptions(res.data.data);
    } catch {
      /* handled */
    } finally {
      setRxLoading(false);
    }
  }, []);

  // Fetch low stock drugs
  const fetchLowStock = useCallback(async () => {
    try {
      const res = await pharmacyApi.getLowStock();
      setLowStock(res.data.data);
    } catch {
      /* handled */
    }
  }, []);

  useEffect(() => {
    if (tab === 'inventory') {
      fetchDrugs();
    } else {
      fetchPrescriptions();
    }
  }, [tab, fetchDrugs, fetchPrescriptions]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleAddDrug = async () => {
    setSaving(true);
    try {
      await pharmacyApi.createDrug(form);
      setAddModalOpen(false);
      setForm(emptyDrug);
      fetchDrugs();
      fetchLowStock();
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  };

  const handleDispense = async (rx: Prescription) => {
    setDispensing(rx.id);
    try {
      // pharmacistId would normally come from auth context
      const pharmacistId = Number(localStorage.getItem('userId') || 0);
      await pharmacyApi.dispense(rx.id, pharmacistId);
      fetchPrescriptions();
    } catch {
      /* handled */
    } finally {
      setDispensing(null);
    }
  };

  const updateForm = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const drugColumns = [
    { key: 'genericName', label: 'Generic Name' },
    { key: 'brandName', label: 'Brand Name' },
    { key: 'category', label: 'Category' },
    {
      key: 'formulation',
      label: 'Form / Strength',
      render: (d: Drug) => `${d.formulation} ${d.strength}`,
    },
    {
      key: 'quantityInStock',
      label: 'Stock',
      render: (d: Drug) => (
        <span className={d.quantityInStock <= d.reorderLevel ? 'text-red-600 font-semibold' : ''}>
          {d.quantityInStock}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      label: 'Expiry',
      render: (d: Drug) => new Date(d.expiryDate).toLocaleDateString(),
    },
    {
      key: 'sellingPrice',
      label: 'Price',
      render: (d: Drug) => `KES ${d.sellingPrice.toLocaleString()}`,
    },
  ];

  const rxColumns = [
    { key: 'drugName', label: 'Drug' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'duration', label: 'Duration' },
    { key: 'quantityPrescribed', label: 'Qty' },
    { key: 'instructions', label: 'Instructions' },
    {
      key: 'createdAt',
      label: 'Ordered',
      render: (rx: Prescription) => new Date(rx.createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (rx: Prescription) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDispense(rx); }}
          disabled={dispensing === rx.id}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {dispensing === rx.id ? 'Dispensing...' : 'Dispense'}
        </button>
      ),
    },
  ];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Drug Inventory', icon: <Pill className="w-4 h-4" /> },
    { key: 'prescriptions', label: 'Pending Prescriptions', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy</h1>
        {tab === 'inventory' && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Drug
          </button>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Low Stock Alert ({lowStock.length} items)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"
              >
                {d.genericName} ({d.brandName}) &mdash; {d.quantityInStock} left
              </span>
            ))}
          </div>
        </div>
      )}

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

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <DataTable
            columns={drugColumns}
            data={drugs}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            loading={loading}
          />
        </>
      )}

      {/* Prescriptions Tab */}
      {tab === 'prescriptions' && (
        <DataTable
          columns={rxColumns}
          data={prescriptions}
          loading={rxLoading}
        />
      )}

      {/* Add Drug Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Drug" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
            <input
              type="text"
              value={form.genericName || ''}
              onChange={(e) => updateForm('genericName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input
              type="text"
              value={form.brandName || ''}
              onChange={(e) => updateForm('brandName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category || ''}
              onChange={(e) => updateForm('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {DRUG_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formulation</label>
            <select
              value={form.formulation || ''}
              onChange={(e) => updateForm('formulation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select formulation</option>
              {FORMULATIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
            <input
              type="text"
              value={form.strength || ''}
              onChange={(e) => updateForm('strength', e.target.value)}
              placeholder="e.g. 500mg"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock</label>
            <input
              type="number"
              value={form.quantityInStock || 0}
              onChange={(e) => updateForm('quantityInStock', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
            <input
              type="number"
              value={form.reorderLevel || 0}
              onChange={(e) => updateForm('reorderLevel', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input
              type="text"
              value={form.batchNumber || ''}
              onChange={(e) => updateForm('batchNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={form.expiryDate || ''}
              onChange={(e) => updateForm('expiryDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              value={form.supplier || ''}
              onChange={(e) => updateForm('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (KES)</label>
            <input
              type="number"
              value={form.costPrice || 0}
              onChange={(e) => updateForm('costPrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KES)</label>
            <input
              type="number"
              value={form.sellingPrice || 0}
              onChange={(e) => updateForm('sellingPrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setAddModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAddDrug}
            disabled={saving || !form.genericName || !form.category}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Drug'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
