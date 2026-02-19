import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, CreditCard, Filter, Search, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { billingApi, patientApi } from '../../api/services';
import type { Billing, Patient, PaymentStatus, PaymentMethod } from '../../types';

const paymentStatuses: PaymentStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'WAIVED'];
const paymentMethods: PaymentMethod[] = ['CASH', 'MPESA', 'CARD', 'BANK_TRANSFER', 'INSURANCE'];
const serviceTypes = [
  'Consultation', 'Laboratory', 'Pharmacy', 'Imaging', 'Procedure',
  'Bed Charges', 'Nursing', 'Surgical', 'Dental', 'Physiotherapy', 'Other',
];

const emptyItemForm = { serviceType: '', description: '', quantity: 1, unitPrice: 0 };
const emptyPaymentForm = { amount: 0, paymentMethod: 'CASH' as PaymentMethod, referenceNumber: '' };

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Billing[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Create invoice
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [visitId, setVisitId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Billing | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add item
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  // Payment
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = statusFilter
        ? await billingApi.getByStatus(statusFilter, page)
        : await billingApi.getAll(page);
      setInvoices(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(0); }, [statusFilter]);

  // Patient search with debounce
  const handlePatientSearch = (query: string) => {
    setPatientSearch(query);
    setSelectedPatient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setPatientResults([]); setShowPatientDropdown(false); return; }
    setSearchingPatient(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await patientApi.search(query, 0);
        setPatientResults(res.data.data.content);
        setShowPatientDropdown(true);
      } catch { /* handled */ } finally { setSearchingPatient(false); }
    }, 300);
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.fullName} (${patient.patientNo})`);
    setShowPatientDropdown(false);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      const res = await billingApi.create({
        patientId: selectedPatient.id,
        visitId: visitId ? Number(visitId) : null,
      });
      setCreateModalOpen(false);
      setSelectedPatient(null);
      setPatientSearch('');
      setVisitId('');
      // Open the new invoice detail immediately so user can add items
      const newInvoice = res.data.data;
      fetchInvoices();
      openDetail(newInvoice);
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const openDetail = async (invoice: Billing) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await billingApi.getById(invoice.id);
      setSelectedInvoice(res.data.data);
    } catch { setSelectedInvoice(invoice); } finally { setDetailLoading(false); }
  };

  const refreshDetail = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await billingApi.getById(selectedInvoice.id);
      setSelectedInvoice(res.data.data);
      fetchInvoices();
    } catch { /* */ }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      await billingApi.addItem(selectedInvoice.id, {
        serviceType: itemForm.serviceType,
        description: itemForm.description,
        quantity: itemForm.quantity,
        unitPrice: itemForm.unitPrice,
      });
      setAddItemOpen(false);
      setItemForm(emptyItemForm);
      await refreshDetail();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      await billingApi.processPayment({
        billingId: selectedInvoice.id,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
      });
      setPaymentOpen(false);
      setPaymentForm(emptyPaymentForm);
      await refreshDetail();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    {
      key: 'patientName', label: 'Patient',
      render: (b: Billing) => (
        <div>
          <div className="font-medium text-gray-900">{b.patientName}</div>
          <div className="text-xs text-gray-500">{b.patientNo}</div>
        </div>
      ),
    },
    { key: 'totalAmount', label: 'Total', render: (b: Billing) => <span className="font-medium">{formatCurrency(b.totalAmount)}</span> },
    { key: 'paidAmount', label: 'Paid', render: (b: Billing) => <span className="text-green-700">{formatCurrency(b.paidAmount)}</span> },
    {
      key: 'balance', label: 'Balance',
      render: (b: Billing) => {
        const balance = (b.totalAmount || 0) - (b.paidAmount || 0) - (b.insuranceCoveredAmount || 0);
        return <span className={balance > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>{formatCurrency(Math.max(0, balance))}</span>;
      },
    },
    { key: 'status', label: 'Status', render: (b: Billing) => <StatusBadge status={b.status} /> },
    { key: 'createdAt', label: 'Date', render: (b: Billing) => new Date(b.createdAt).toLocaleDateString() },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  const itemTotal = itemForm.quantity * itemForm.unitPrice;
  const invoiceBalance = selectedInvoice
    ? (selectedInvoice.totalAmount || 0) - (selectedInvoice.paidAmount || 0) - (selectedInvoice.insuranceCoveredAmount || 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); setVisitId(''); setCreateModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </button>
          {paymentStatuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={invoices} page={page} totalPages={totalPages} onPageChange={setPage} onRowClick={openDetail} loading={loading} />

      {/* Create Invoice Modal */}
      <Modal open={createModalOpen} onClose={() => { setCreateModalOpen(false); setShowPatientDropdown(false); }} title="Create Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <label className={labelClass}>Patient *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => handlePatientSearch(e.target.value)}
                onFocus={() => patientResults.length > 0 && setShowPatientDropdown(true)}
                placeholder="Search by name, phone, or patient number..."
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedPatient && (
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); setPatientResults([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchingPatient && <p className="text-xs text-gray-400 mt-1">Searching...</p>}

            {/* Dropdown */}
            {showPatientDropdown && patientResults.length > 0 && !selectedPatient && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {patientResults.map((p) => (
                  <button key={p.id} type="button" onClick={() => selectPatient(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                    <div className="font-medium text-sm text-gray-900">{p.fullName}</div>
                    <div className="text-xs text-gray-500">{p.patientNo} {p.phone ? `| ${p.phone}` : ''}</div>
                  </button>
                ))}
              </div>
            )}
            {showPatientDropdown && patientResults.length === 0 && patientSearch.length >= 2 && !searchingPatient && !selectedPatient && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500 text-center">
                No patients found
              </div>
            )}
          </div>

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-blue-900">{selectedPatient.fullName}</div>
              <div className="text-blue-700 text-xs mt-0.5">
                {selectedPatient.patientNo} | {selectedPatient.gender} | {selectedPatient.phone || 'No phone'}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Visit ID (optional)</label>
            <input type="number" value={visitId} onChange={(e) => setVisitId(e.target.value)}
              className={inputClass} placeholder="Link to a visit" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submitting || !selectedPatient}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create & Add Services'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setAddItemOpen(false); setPaymentOpen(false); }}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice Details'}
        size="xl">
        {detailLoading ? (
          <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}</div>
        ) : selectedInvoice ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Patient</p>
                <p className="text-sm font-semibold text-gray-900">{selectedInvoice.patientName}</p>
                <p className="text-xs text-gray-500">{selectedInvoice.patientNo}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-sm font-semibold text-green-700">{formatCurrency(selectedInvoice.paidAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`text-sm font-semibold ${invoiceBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatCurrency(Math.max(0, invoiceBalance))}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-0.5"><StatusBadge status={selectedInvoice.status} /></div>
              </div>
            </div>

            {/* Services / Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Services</h3>
                <button onClick={() => { setItemForm(emptyItemForm); setAddItemOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                  <Plus className="w-3.5 h-3.5" /> Add Service
                </button>
              </div>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Service</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Unit Price</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700">{item.serviceType}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{item.description}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">Total</td>
                        <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(selectedInvoice.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No services added yet. Click "Add Service" to begin.</p>
              )}
            </div>

            {/* Add Item Form */}
            {addItemOpen && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Service</h4>
                <form onSubmit={handleAddItem} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Service Type *</label>
                      <select required value={itemForm.serviceType}
                        onChange={(e) => setItemForm((p) => ({ ...p, serviceType: e.target.value }))}
                        className={inputClass}>
                        <option value="">Select service type</option>
                        {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Description *</label>
                      <input required type="text" value={itemForm.description}
                        onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                        className={inputClass} placeholder="e.g. Full Blood Count, Paracetamol 500mg" />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity *</label>
                      <input required type="number" min={1} value={itemForm.quantity}
                        onChange={(e) => setItemForm((p) => ({ ...p, quantity: Number(e.target.value) || 1 }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Unit Price (KES) *</label>
                      <input required type="number" min={0} step="0.01" value={itemForm.unitPrice || ''}
                        onChange={(e) => setItemForm((p) => ({ ...p, unitPrice: Number(e.target.value) || 0 }))}
                        className={inputClass} placeholder="0.00" />
                    </div>
                  </div>
                  {/* Auto-calculated subtotal */}
                  {itemTotal > 0 && (
                    <div className="bg-white rounded-lg p-2 text-right">
                      <span className="text-sm text-gray-500">Subtotal: </span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(itemTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setAddItemOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {submitting ? 'Adding...' : 'Add Service'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Payments</h3>
                {selectedInvoice.status !== 'PAID' && (
                  <button onClick={() => { setPaymentForm({ ...emptyPaymentForm, amount: Math.max(0, invoiceBalance) }); setPaymentOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                    <CreditCard className="w-3.5 h-3.5" /> Record Payment
                  </button>
                )}
              </div>
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Receipt</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Amount</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Method</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Reference</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700">{payment.receiptNumber}</td>
                          <td className="px-3 py-2 text-sm font-medium text-green-700 text-right">{formatCurrency(payment.amount)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{payment.paymentMethod.replace(/_/g, ' ')}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{payment.referenceNumber || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No payments recorded</p>
              )}
            </div>

            {/* Record Payment Form */}
            {paymentOpen && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Record Payment</h4>
                <p className="text-xs text-gray-500 mb-3">Outstanding balance: <span className="font-semibold text-red-600">{formatCurrency(Math.max(0, invoiceBalance))}</span></p>
                <form onSubmit={handleRecordPayment} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Amount (KES) *</label>
                      <input required type="number" min={0} step="0.01" value={paymentForm.amount || ''}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, amount: Number(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Payment Method *</label>
                      <select required value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                        className={inputClass}>
                        {paymentMethods.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Reference Number</label>
                      <input type="text" value={paymentForm.referenceNumber}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, referenceNumber: e.target.value }))}
                        className={inputClass} placeholder={paymentForm.paymentMethod === 'MPESA' ? 'M-Pesa code' : 'Reference'} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setPaymentOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={submitting || !paymentForm.amount}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                      {submitting ? 'Processing...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
