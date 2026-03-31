import React, { useState, useEffect, useCallback } from 'react';
import { quotationAPI, clientAPI } from '../api';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate, statusBadgeClass } from '../utils';
import toast from 'react-hot-toast';

const EMPTY_ITEM = { description: '', quantity: 1, unit: 'Nos', unitPrice: 0, discount: 0, amount: 0, modelNo: '', hsnCode: '' };
const EMPTY_FORM = { clientId: '', subject: '', items: [{ ...EMPTY_ITEM }], gstPercent: 18, validityDays: 30, notes: '', terms: '' };

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, cRes] = await Promise.all([
        quotationAPI.getAll({ page, limit: 10, status: filterStatus }),
        clientAPI.getAllSimple()
      ]);
      setQuotations(qRes.data.data);
      setMeta(qRes.data.meta);
      setClients(cRes.data.data);
    } catch { toast.error('Failed to load quotations'); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calcItem = (item) => {
    const base = item.quantity * item.unitPrice;
    const discounted = base - (base * (item.discount || 0) / 100);
    return { ...item, amount: Math.round(discounted * 100) / 100 };
  };

  const updateItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = calcItem({ ...items[idx], [field]: parseFloat(val) || val });
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const subtotal = form.items.reduce((s, i) => s + (i.amount || 0), 0);
  const gstAmount = subtotal * (form.gstPercent / 100);
  const total = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, subtotal, gstAmount, totalAmount: total };
      if (modal.mode === 'create') { await quotationAPI.create(payload); toast.success('Quotation created!'); }
      else { await quotationAPI.update(modal.data._id, payload); toast.success('Quotation updated!'); }
      setModal({ open: false, mode: 'create', data: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleGeneratePDF = async (id) => {
    setPdfLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await quotationAPI.generatePDF(id);
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';
      const url = `${baseUrl}${res.data.data.downloadUrl}`;
      window.open(url, '_blank');
      toast.success('PDF generated!');
    } catch { toast.error('PDF generation failed'); }
    finally { setPdfLoading(prev => ({ ...prev, [id]: false })); }
  };

  const handleSendEmail = async (id) => {
    try {
      await quotationAPI.sendEmail(id);
      toast.success('Quotation sent via email!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Email failed'); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit = (q) => {
    setForm({ ...EMPTY_FORM, ...q, clientId: q.clientId?._id || q.clientId });
    setModal({ open: true, mode: 'edit', data: q });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} quotations</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Quotation</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          {['','draft','sent','accepted','rejected','converted'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : quotations.length === 0 ? (
          <EmptyState icon="📄" title="No quotations yet" action={<button className="btn-primary" onClick={openCreate}>+ New Quotation</button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Quotation No</Th>
                  <Th>Client</Th>
                  <Th>Subject</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {quotations.map(q => (
                  <Tr key={q._id}>
                    <Td><span className="font-mono text-xs font-bold text-primary-700">{q.quotationNo}</span></Td>
                    <Td><div className="font-medium">{q.clientId?.companyName}</div><div className="text-xs text-gray-400">{q.clientId?.city}</div></Td>
                    <Td><span className="text-sm text-gray-600">{q.subject || '-'}</span></Td>
                    <Td><span className="font-semibold text-gray-900">{formatCurrency(q.totalAmount)}</span></Td>
                    <Td>{formatDate(q.createdAt)}</Td>
                    <Td><span className={statusBadgeClass(q.status)}>{q.status}</span></Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(q)}>Edit</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleGeneratePDF(q._id)} disabled={pdfLoading[q._id]}>
                          {pdfLoading[q._id] ? '...' : '⬇ PDF'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleSendEmail(q._id)}>📧</button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({open:false,mode:'create',data:null})} title={modal.mode === 'create' ? 'New Quotation' : 'Edit Quotation'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client <span className="text-red-500">*</span></label>
              <select className="input" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject / Reference</label>
              <input className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g. Supply of HPLC Column" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Line Items</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Row</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-24">Model No</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-20">HSN Code</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-16">Qty</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-20">Unit</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-28">Unit Price</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-16">Disc%</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-28">Amount</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{i+1}</td>
                      <td className="px-3 py-2"><input className="input py-1" value={item.description} onChange={e => updateItem(i,'description',e.target.value)} placeholder="Description" required /></td>
                      <td className="px-3 py-2"><input className="input py-1" value={item.modelNo||''} onChange={e => updateItem(i,'modelNo',e.target.value)} placeholder="e.g. Waters e2695" /></td>
                      <td className="px-3 py-2"><input className="input py-1" value={item.hsnCode||''} onChange={e => updateItem(i,'hsnCode',e.target.value)} placeholder="90279090" /></td>
                      <td className="px-3 py-2"><input type="number" className="input py-1" min="1" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} /></td>
                      <td className="px-3 py-2"><input className="input py-1" value={item.unit} onChange={e => updateItem(i,'unit',e.target.value)} /></td>
                      <td className="px-3 py-2"><input type="number" className="input py-1" min="0" value={item.unitPrice} onChange={e => updateItem(i,'unitPrice',e.target.value)} /></td>
                      <td className="px-3 py-2"><input type="number" className="input py-1" min="0" max="100" value={item.discount} onChange={e => updateItem(i,'discount',e.target.value)} /></td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatCurrency(item.amount)}</td>
                      <td className="px-3 py-2"><button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">GST</span>
                <div className="flex items-center gap-2">
                  <select className="input py-1 w-20 text-xs" value={form.gstPercent} onChange={e => setForm({...form, gstPercent: parseInt(e.target.value)})}>
                    <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option>
                  </select>
                  <span className="font-medium">{formatCurrency(gstAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Validity (days)</label>
              <input type="number" className="input" value={form.validityDays} onChange={e => setForm({...form, validityDays: parseInt(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div>
            <label className="label">Terms & Conditions</label>
            <textarea className="input" rows={3} value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'create' ? 'Create Quotation' : 'Save Changes'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModal({open:false,mode:'create',data:null})}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
