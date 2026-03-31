import React, { useState, useEffect, useCallback } from 'react';
import { poAPI, clientAPI, quotationAPI } from '../api';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate, statusBadgeClass } from '../utils';
import toast from 'react-hot-toast';

const EMPTY = { clientId:'', quotationId:'', poNumber:'', poDate:'', poValue:'', dispatchStatus:'pending', dispatchDate:'', courierName:'', trackingNo:'', deliveryDate:'', notes:'' };

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, qRes] = await Promise.all([
        poAPI.getAll({ page, limit:10, dispatchStatus: filterStatus }),
        clientAPI.getAllSimple(),
        quotationAPI.getAll({ limit:100, status:'accepted' })
      ]);
      setPos(pRes.data.data); setMeta(pRes.data.meta);
      setClients(cRes.data.data); setQuotations(qRes.data.data);
    } catch { toast.error('Failed to load purchase orders'); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'create') { await poAPI.create(form); toast.success('PO created!'); }
      else { await poAPI.update(modal.data._id, form); toast.success('PO updated!'); }
      setModal({open:false,mode:'create',data:null}); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const openCreate = () => { setForm({...EMPTY, poDate: new Date().toISOString().split('T')[0]}); setModal({open:true,mode:'create',data:null}); };
  const openEdit = (po) => {
    setForm({ ...EMPTY, ...po, clientId: po.clientId?._id||po.clientId, quotationId: po.quotationId?._id||po.quotationId||'',
      poDate: po.poDate?.split('T')[0]||'', dispatchDate: po.dispatchDate?.split('T')[0]||'', deliveryDate: po.deliveryDate?.split('T')[0]||'' });
    setModal({open:true,mode:'edit',data:po});
  };
  const fld = (f) => ({ value: form[f]||'', onChange: e => setForm({...form,[f]:e.target.value}) });

  const statusColors = { pending:'badge-yellow', processing:'badge-blue', dispatched:'badge-purple', delivered:'badge-green', cancelled:'badge-red' };

  const dispatchSteps = ['pending','processing','dispatched','delivered'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Purchase Orders</h1><p className="text-sm text-gray-500">{meta?.total||0} POs</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Record PO</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex gap-2 flex-wrap">
          {['','pending','processing','dispatched','delivered'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus===s?'bg-primary-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
        : pos.length===0 ? <EmptyState icon="📦" title="No purchase orders" description="Record received POs to track dispatch and delivery" action={<button className="btn-primary" onClick={openCreate}>+ Record PO</button>} />
        : <>
          <Table>
            <Thead><tr><Th>PO Number</Th><Th>Client</Th><Th>Quotation Ref</Th><Th>PO Value</Th><Th>Received</Th><Th>Dispatch Status</Th><Th>Courier / Tracking</Th><Th>Actions</Th></tr></Thead>
            <Tbody>
              {pos.map(po => (
                <Tr key={po._id}>
                  <Td><span className="font-mono font-bold text-sm text-gray-800">{po.poNumber}</span></Td>
                  <Td><div className="font-medium">{po.clientId?.companyName}</div><div className="text-xs text-gray-400">{po.clientId?.city}</div></Td>
                  <Td><span className="text-xs text-primary-600 font-mono">{po.quotationId?.quotationNo || '-'}</span></Td>
                  <Td>{po.poValue ? formatCurrency(po.poValue) : '-'}</Td>
                  <Td>{formatDate(po.receivedDate)}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <span className={`badge ${statusColors[po.dispatchStatus]||'badge-gray'}`}>{po.dispatchStatus}</span>
                      {/* Progress bar */}
                      <div className="flex gap-0.5 mt-1">
                        {dispatchSteps.map((s,i) => (
                          <div key={s} className={`h-1 flex-1 rounded-full ${dispatchSteps.indexOf(po.dispatchStatus) >= i ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
                        ))}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {po.courierName ? <div className="text-xs"><div className="font-medium">{po.courierName}</div><div className="text-gray-400">{po.trackingNo || '-'}</div></div> : <span className="text-gray-400 text-xs">-</span>}
                  </Td>
                  <Td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(po)}>Edit</button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination meta={meta} onPageChange={setPage} />
        </>}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({open:false,mode:'create',data:null})} title={modal.mode==='create'?'Record Purchase Order':'Update Purchase Order'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client <span className="text-red-500">*</span></label>
              <select className="input" {...fld('clientId')} required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Link to Quotation</label>
              <select className="input" {...fld('quotationId')}>
                <option value="">No quotation</option>
                {quotations.map(q => <option key={q._id} value={q._id}>{q.quotationNo} – {q.clientId?.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">PO Number <span className="text-red-500">*</span></label>
              <input className="input" {...fld('poNumber')} placeholder="e.g. PO-2024-001" required />
            </div>
            <div>
              <label className="label">PO Date</label>
              <input type="date" className="input" {...fld('poDate')} />
            </div>
            <div>
              <label className="label">PO Value (₹)</label>
              <input type="number" className="input" {...fld('poValue')} placeholder="0" />
            </div>
            <div>
              <label className="label">Dispatch Status</label>
              <select className="input" {...fld('dispatchStatus')}>
                {['pending','processing','dispatched','delivered','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dispatch Date</label>
              <input type="date" className="input" {...fld('dispatchDate')} />
            </div>
            <div>
              <label className="label">Expected Delivery</label>
              <input type="date" className="input" {...fld('deliveryDate')} />
            </div>
            <div>
              <label className="label">Courier Name</label>
              <input className="input" {...fld('courierName')} placeholder="e.g. Blue Dart, FedEx" />
            </div>
            <div>
              <label className="label">Tracking Number</label>
              <input className="input" {...fld('trackingNo')} placeholder="Docket / AWB number" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} {...fld('notes')} />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving...':modal.mode==='create'?'Record PO':'Save Changes'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModal({open:false,mode:'create',data:null})}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
