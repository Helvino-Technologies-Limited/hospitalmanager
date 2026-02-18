import { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, CreditCard, Filter } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { billingApi } from '../../api/services';
import type { Billing, PaymentStatus, PaymentMethod } from '../../types';

const paymentStatuses: PaymentStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'WAIVED'];
const paymentMethods: PaymentMethod[] = ['CASH', 'MPESA', 'CARD', 'BANK_TRANSFER', 'INSURANCE'];

const emptyInvoiceForm = {
  patientId: '',
  visitId: '',
};

const emptyItemForm = {
  serviceType: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
};

const emptyPaymentForm = {
  amount: 0,
  paymentMethod: 'CASH' as PaymentMethod,
  referenceNumber: '',
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Billing[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [submitting, setSubmitting] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Billing | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = statusFilter
        ? await billingApi.getByStatus(statusFilter, page)
        : await billingApi.getAll(page);
      const data = res.data.data;
      setInvoices(data.content);
      setTotalPages(data.totalPages);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await billingApi.create({
        patientId: Number(invoiceForm.patientId),
        visitId: invoiceForm.visitId ? Number(invoiceForm.visitId) : null,
      });
      setCreateModalOpen(false);
      setInvoiceForm(emptyInvoiceForm);
      fetchInvoices();
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (invoice: Billing) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await billingApi.getById(invoice.id);
      setSelectedInvoice(res.data.data);
    } catch {
      setSelectedInvoice(invoice);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await billingApi.getById(selectedInvoice.id);
      setSelectedInvoice(res.data.data);
      fetchInvoices();
    } catch {
      // Ignore
    }
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
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
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
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'patientName', label: 'Patient' },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (b: Billing) => <span className="font-medium">{formatCurrency(b.totalAmount)}</span>,
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (b: Billing) => <span className="text-green-700">{formatCurrency(b.paidAmount)}</span>,
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (b: Billing) => {
        const balance = b.totalAmount - b.paidAmount - b.insuranceCoveredAmount;
        return <span className={balance > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>{formatCurrency(Math.max(0, balance))}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (b: Billing) => <StatusBadge status={b.status} />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (b: Billing) => new Date(b.createdAt).toLocaleDateString(),
    },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <button
          onClick={() => { setInvoiceForm(emptyInvoiceForm); setCreateModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {paymentStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={openDetail}
        loading={loading}
      />

      {/* Create Invoice Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className={labelClass}>Patient ID *</label>
            <input
              required
              type="number"
              value={invoiceForm.patientId}
              onChange={(e) => setInvoiceForm((p) => ({ ...p, patientId: e.target.value }))}
              className={inputClass}
              placeholder="Enter patient ID"
            />
          </div>
          <div>
            <label className={labelClass}>Visit ID</label>
            <input
              type="number"
              value={invoiceForm.visitId}
              onChange={(e) => setInvoiceForm((p) => ({ ...p, visitId: e.target.value }))}
              className={inputClass}
              placeholder="Enter visit ID (optional)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setAddItemOpen(false); setPaymentOpen(false); }}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice Details'}
        size="xl"
      >
        {detailLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
          </div>
        ) : selectedInvoice ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Patient</p>
                <p className="text-sm font-semibold text-gray-900">{selectedInvoice.patientName}</p>
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
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-0.5"><StatusBadge status={selectedInvoice.status} /></div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Invoice Items</h3>
                <button
                  onClick={() => { setItemForm(emptyItemForm); setAddItemOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
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
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No items added yet</p>
              )}
            </div>

            {/* Add Item Form (inline) */}
            {addItemOpen && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Item</h4>
                <form onSubmit={handleAddItem} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Service Type *</label>
                      <input
                        required
                        type="text"
                        value={itemForm.serviceType}
                        onChange={(e) => setItemForm((p) => ({ ...p, serviceType: e.target.value }))}
                        className={inputClass}
                        placeholder="e.g. CONSULTATION, LAB, PHARMACY"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Description *</label>
                      <input
                        required
                        type="text"
                        value={itemForm.description}
                        onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity *</label>
                      <input
                        required
                        type="number"
                        min={1}
                        value={itemForm.quantity}
                        onChange={(e) => setItemForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Unit Price *</label>
                      <input
                        required
                        type="number"
                        min={0}
                        step="0.01"
                        value={itemForm.unitPrice}
                        onChange={(e) => setItemForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddItemOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Adding...' : 'Add Item'}
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
                  <button
                    onClick={() => { setPaymentForm(emptyPaymentForm); setPaymentOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Record Payment
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

            {/* Record Payment Form (inline) */}
            {paymentOpen && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Record Payment</h4>
                <form onSubmit={handleRecordPayment} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Amount *</label>
                      <input
                        required
                        type="number"
                        min={0}
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Payment Method *</label>
                      <select
                        required
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                        className={inputClass}
                      >
                        {paymentMethods.map((m) => (
                          <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Reference Number</label>
                      <input
                        type="text"
                        value={paymentForm.referenceNumber}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, referenceNumber: e.target.value }))}
                        className={inputClass}
                        placeholder="e.g. MPESA code"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
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
