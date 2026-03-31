import React, { useState, useEffect, useCallback } from 'react';
import { visitAPI, clientAPI, contractAPI, userAPI } from '../api';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, statusBadgeClass } from '../utils';
import toast from 'react-hot-toast';

const EMPTY = { clientId:'', contractId:'', engineerId:'', visitType:'PM', status:'scheduled', scheduledDate:'', problemDescription:'', workDone:'', reportNotes:'' };

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status:'', visitType:'' });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, cRes, uRes] = await Promise.all([
        visitAPI.getAll({ page, limit:10, ...filters }),
        clientAPI.getAllSimple(),
        userAPI.getAll()
      ]);
      setVisits(vRes.data.data);
      setMeta(vRes.data.meta);
      setClients(cRes.data.data);
      setEngineers(uRes.data.data.filter(u => u.role === 'engineer' || u.role === 'admin'));
    } catch { toast.error('Failed to load visits'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'create') { await visitAPI.create(form); toast.success('Visit scheduled!'); }
      else { await visitAPI.update(modal.data._id, form); toast.success('Visit updated!'); }
      setModal({open:false,mode:'create',data:null});
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const openCreate = () => { setForm(EMPTY); setModal({open:true,mode:'create',data:null}); };
  const openEdit = (v) => {
    setForm({ ...EMPTY, ...v, clientId: v.clientId?._id||v.clientId, engineerId: v.engineerId?._id||v.engineerId, contractId: v.contractId?._id||v.contractId, scheduledDate: v.scheduledDate?.split('T')[0]||'' });
    setModal({open:true,mode:'edit',data:v});
  };
  const fld = (f) => ({ value: form[f]||'', onChange: e => setForm({...form,[f]:e.target.value}) });

  const statusColor = (s) => ({ scheduled:'bg-blue-100 text-blue-700', pending:'bg-yellow-100 text-yellow-700', completed:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700', 'in-progress':'bg-purple-100 text-purple-700' }[s] || 'badge-gray');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Service Visits</h1>
        <button className="btn-primary" onClick={openCreate}>+ Schedule Visit</button>
      </div>
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <select className="input w-auto" value={filters.status} onChange={e => setFilters({...filters,status:e.target.value})}>
            <option value="">All Status</option>
            {['scheduled','pending','in-progress','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input w-auto" value={filters.visitType} onChange={e => setFilters({...filters,visitType:e.target.value})}>
            <option value="">All Types</option>
            {['PM','Breakdown','Installation','Demo','Other'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
        : visits.length === 0 ? <EmptyState icon="🔧" title="No visits scheduled" action={<button className="btn-primary" onClick={openCreate}>+ Schedule Visit</button>} />
        : <>
          <Table>
            <Thead><tr><Th>Client</Th><Th>Type</Th><Th>Engineer</Th><Th>Scheduled</Th><Th>Status</Th><Th>Actions</Th></tr></Thead>
            <Tbody>
              {visits.map(v => (
                <Tr key={v._id}>
                  <Td><div className="font-medium">{v.clientId?.companyName}</div><div className="text-xs text-gray-400">{v.clientId?.city}</div></Td>
                  <Td><span className="badge-blue badge">{v.visitType}</span></Td>
                  <Td>{v.engineerId?.name || <span className="text-gray-400">Unassigned</span>}</Td>
                  <Td>{formatDate(v.scheduledDate)}</Td>
                  <Td><span className={`badge ${statusColor(v.status)}`}>{v.status}</span></Td>
                  <Td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)}>Edit</button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination meta={meta} onPageChange={setPage} />
        </>}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({open:false,mode:'create',data:null})} title={modal.mode==='create'?'Schedule Visit':'Update Visit'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Client <span className="text-red-500">*</span></label>
              <select className="input" {...fld('clientId')} required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Visit Type</label>
              <select className="input" {...fld('visitType')}>
                {['PM','Breakdown','Installation','Demo','Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" {...fld('status')}>
                {['scheduled','pending','in-progress','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assign Engineer</label>
              <select className="input" {...fld('engineerId')}>
                <option value="">Select engineer...</option>
                {engineers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Scheduled Date <span className="text-red-500">*</span></label>
              <input type="date" className="input" {...fld('scheduledDate')} required />
            </div>
          </div>
          <div>
            <label className="label">Problem Description</label>
            <textarea className="input" rows={2} {...fld('problemDescription')} />
          </div>
          <div>
            <label className="label">Work Done / Report Notes</label>
            <textarea className="input" rows={3} {...fld('reportNotes')} />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving...':modal.mode==='create'?'Schedule Visit':'Update Visit'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModal({open:false,mode:'create',data:null})}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
