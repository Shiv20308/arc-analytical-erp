import React, { useState, useEffect, useCallback } from 'react';
import { followupAPI, clientAPI, quotationAPI, userAPI } from '../api';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, statusBadgeClass, daysFromNow } from '../utils';
import toast from 'react-hot-toast';

const EMPTY = { clientId:'', quotationId:'', assignedTo:'', type:'call', status:'pending', followUpDate:'', notes:'' };

export default function FollowUps() {
  const [followups, setFollowups] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status:'pending', upcoming:'' });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open:false, mode:'create', data:null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, cRes, qRes, uRes] = await Promise.all([
        followupAPI.getAll({ page, limit:10, ...filters }),
        clientAPI.getAllSimple(),
        quotationAPI.getAll({ limit:100 }),
        userAPI.getAll()
      ]);
      setFollowups(fRes.data.data); setMeta(fRes.data.meta);
      setClients(cRes.data.data); setQuotations(qRes.data.data); setUsers(uRes.data.data);
    } catch { toast.error('Failed to load follow-ups'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'create') { await followupAPI.create(form); toast.success('Follow-up created!'); }
      else { await followupAPI.update(modal.data._id, form); toast.success('Follow-up updated!'); }
      setModal({open:false,mode:'create',data:null}); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const markDone = async (id) => {
    try {
      await followupAPI.update(id, { status: 'done', completedAt: new Date() });
      toast.success('Marked as done!');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const openCreate = () => { setForm({...EMPTY, followUpDate: new Date().toISOString().split('T')[0]}); setModal({open:true,mode:'create',data:null}); };
  const openEdit = (f) => {
    setForm({...EMPTY,...f, clientId:f.clientId?._id||f.clientId, quotationId:f.quotationId?._id||f.quotationId||'', assignedTo:f.assignedTo?._id||f.assignedTo||'', followUpDate:f.followUpDate?.split('T')[0]||''});
    setModal({open:true,mode:'edit',data:f});
  };
  const fld = (field) => ({ value: form[field]||'', onChange: e => setForm({...form,[field]:e.target.value}) });

  const typeIcon = { call:'📞', email:'📧', visit:'🚗', whatsapp:'💬', other:'📝' };
  const urgencyColor = (date) => {
    const d = daysFromNow(date);
    if (d < 0) return 'bg-red-50 border-l-4 border-red-400';
    if (d === 0) return 'bg-orange-50 border-l-4 border-orange-400';
    if (d <= 2) return 'bg-yellow-50 border-l-4 border-yellow-400';
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Follow-up Management</h1><p className="text-sm text-gray-500">{meta?.total||0} follow-ups</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Add Follow-up</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          {['','pending','done','rescheduled'].map(s => (
            <button key={s} onClick={() => setFilters({...filters, status:s})} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filters.status===s?'bg-primary-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-2">
            <input type="checkbox" checked={filters.upcoming==='true'} onChange={e => setFilters({...filters, upcoming:e.target.checked?'true':''})} className="rounded" />
            Next 7 days
          </label>
        </div>

        {loading ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
        : followups.length===0 ? <EmptyState icon="📞" title="No follow-ups" description="Track your pending quotation follow-ups" action={<button className="btn-primary" onClick={openCreate}>+ Add Follow-up</button>} />
        : <>
          <Table>
            <Thead><tr><Th>Type</Th><Th>Client</Th><Th>Quotation</Th><Th>Assigned To</Th><Th>Due Date</Th><Th>Status</Th><Th>Actions</Th></tr></Thead>
            <Tbody>
              {followups.map(f => (
                <Tr key={f._id} className={urgencyColor(f.followUpDate)}>
                  <Td><span className="text-xl">{typeIcon[f.type]||'📝'}</span><div className="text-xs text-gray-500 mt-0.5 capitalize">{f.type}</div></Td>
                  <Td>
                    <div className="font-medium">{f.clientId?.companyName}</div>
                    <div className="text-xs text-gray-400">{f.clientId?.contactPerson} · {f.clientId?.phone}</div>
                  </Td>
                  <Td><span className="text-xs font-mono text-primary-600">{f.quotationId?.quotationNo || '-'}</span></Td>
                  <Td>{f.assignedTo?.name || '-'}</Td>
                  <Td>
                    <div>{formatDate(f.followUpDate)}</div>
                    {f.status === 'pending' && <div className="text-xs text-gray-400 mt-0.5">
                      {daysFromNow(f.followUpDate) < 0 ? <span className="text-red-600 font-medium">Overdue by {Math.abs(daysFromNow(f.followUpDate))}d</span>
                       : daysFromNow(f.followUpDate) === 0 ? <span className="text-orange-600 font-medium">Today!</span>
                       : <span>{daysFromNow(f.followUpDate)} days left</span>}
                    </div>}
                  </Td>
                  <Td><span className={statusBadgeClass(f.status)}>{f.status}</span></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      {f.status === 'pending' && <button className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200" onClick={() => markDone(f._id)}>✓ Done</button>}
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>Edit</button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination meta={meta} onPageChange={setPage} />
        </>}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({open:false,mode:'create',data:null})} title={modal.mode==='create'?'New Follow-up':'Edit Follow-up'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              {quotations.filter(q => !form.clientId || q.clientId?._id===form.clientId || q.clientId===form.clientId).map(q => <option key={q._id} value={q._id}>{q.quotationNo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" {...fld('type')}>
                {['call','email','visit','whatsapp','other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" {...fld('status')}>
                {['pending','done','rescheduled','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date <span className="text-red-500">*</span></label>
              <input type="date" className="input" {...fld('followUpDate')} required />
            </div>
            <div>
              <label className="label">Assigned To</label>
              <select className="input" {...fld('assignedTo')}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} {...fld('notes')} placeholder="What to discuss, outcome expected..." />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving...':modal.mode==='create'?'Create Follow-up':'Save Changes'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModal({open:false,mode:'create',data:null})}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
