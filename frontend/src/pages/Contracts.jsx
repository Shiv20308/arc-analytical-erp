import React, { useState, useEffect, useCallback } from 'react';
import { contractAPI, clientAPI } from '../api';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, statusBadgeClass, daysFromNow } from '../utils';
import toast from 'react-hot-toast';

const INSTRUMENTS = ['HPLC','GC','GC-MS','LC-MS','UV-Vis Spectrophotometer','FTIR','Atomic Absorption','ICP-OES','Karl Fischer Titrator','Dissolution Tester','Polarimeter','Refractometer','pH Meter','Other'];
const EMPTY = { clientId:'', contractType:'AMC', instrumentType:'', instrumentModel:'', instrumentSerial:'', manufacturer:'', startDate:'', endDate:'', pmVisitsPerYear:2, includesBreakdown:false, includesParts:false, includesConsumables:false, value:'', notes:'' };

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ contractType:'', status:'' });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contractsRes, clientsRes] = await Promise.all([
        contractAPI.getAll({ page, limit: 10, ...filters }),
        clientAPI.getAllSimple()
      ]);
      setContracts(contractsRes.data.data);
      setMeta(contractsRes.data.meta);
      setClients(clientsRes.data.data);
    } catch { toast.error('Failed to load contracts'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit = (c) => {
    setForm({ ...EMPTY, ...c, clientId: c.clientId?._id || c.clientId,
      startDate: c.startDate?.split('T')[0] || '', endDate: c.endDate?.split('T')[0] || '' });
    setModal({ open: true, mode: 'edit', data: c });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'create') { await contractAPI.create(form); toast.success('Contract created!'); }
      else { await contractAPI.update(modal.data._id, form); toast.success('Contract updated!'); }
      setModal({ open: false, mode: 'create', data: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const fld = (field) => ({ value: form[field] || '', onChange: e => setForm({ ...form, [field]: e.target.value }) });
  const chk = (field) => ({ checked: !!form[field], onChange: e => setForm({ ...form, [field]: e.target.checked }) });

  const getDaysLabel = (c) => {
    const d = daysFromNow(c.endDate);
    if (d < 0) return <span className="badge-red badge">Expired {Math.abs(d)}d ago</span>;
    if (d <= 7) return <span className="badge-red badge">🔴 {d}d left</span>;
    if (d <= 30) return <span className="badge-yellow badge">⚠️ {d}d left</span>;
    return <span className="text-xs text-gray-500">{d}d left</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">AMC/CMC Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} contracts</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Contract</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <select className="input w-auto" value={filters.contractType} onChange={e => setFilters({...filters, contractType: e.target.value})}>
            <option value="">All Types</option>
            <option value="AMC">AMC</option>
            <option value="CMC">CMC</option>
          </select>
          <select className="input w-auto" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={filters.expiringSoon === 'true'} onChange={e => setFilters({...filters, expiringSoon: e.target.checked ? 'true' : ''})} className="rounded" />
            Expiring in 30 days
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : contracts.length === 0 ? (
          <EmptyState icon="📋" title="No contracts" description="Create your first AMC/CMC contract" action={<button className="btn-primary" onClick={openCreate}>+ New Contract</button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Contract No</Th>
                  <Th>Client</Th>
                  <Th>Type</Th>
                  <Th>Instrument</Th>
                  <Th>Start</Th>
                  <Th>End / Expiry</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {contracts.map(c => (
                  <Tr key={c._id}>
                    <Td><span className="font-mono text-xs font-semibold text-primary-700">{c.contractNo}</span></Td>
                    <Td>
                      <div className="font-medium">{c.clientId?.companyName}</div>
                      <div className="text-xs text-gray-400">{c.clientId?.city}</div>
                    </Td>
                    <Td><span className={`badge ${c.contractType === 'AMC' ? 'badge-blue' : 'badge-purple'}`}>{c.contractType}</span></Td>
                    <Td><div>{c.instrumentType}</div><div className="text-xs text-gray-400">{c.instrumentModel}</div></Td>
                    <Td>{formatDate(c.startDate)}</Td>
                    <Td><div>{formatDate(c.endDate)}</div><div className="mt-0.5">{getDaysLabel(c)}</div></Td>
                    <Td><span className={statusBadgeClass(c.status)}>{c.status}</span></Td>
                    <Td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({open:false,mode:'create',data:null})} title={modal.mode === 'create' ? 'New Contract' : 'Edit Contract'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client <span className="text-red-500">*</span></label>
              <select className="input" {...fld('clientId')} required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Contract Type <span className="text-red-500">*</span></label>
              <select className="input" {...fld('contractType')} required>
                <option value="AMC">AMC (Annual Maintenance Contract)</option>
                <option value="CMC">CMC (Comprehensive Maintenance Contract)</option>
              </select>
            </div>
            <div>
              <label className="label">Instrument Type <span className="text-red-500">*</span></label>
              <select className="input" {...fld('instrumentType')} required>
                <option value="">Select instrument...</option>
                {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Model</label>
              <input className="input" placeholder="e.g. Agilent 1260" {...fld('instrumentModel')} />
            </div>
            <div>
              <label className="label">Serial No</label>
              <input className="input" {...fld('instrumentSerial')} />
            </div>
            <div>
              <label className="label">Manufacturer</label>
              <input className="input" {...fld('manufacturer')} />
            </div>
            <div>
              <label className="label">Start Date <span className="text-red-500">*</span></label>
              <input type="date" className="input" {...fld('startDate')} required />
            </div>
            <div>
              <label className="label">End Date <span className="text-red-500">*</span></label>
              <input type="date" className="input" {...fld('endDate')} required />
            </div>
            <div>
              <label className="label">PM Visits/Year</label>
              <input type="number" className="input" min="0" max="12" {...fld('pmVisitsPerYear')} />
            </div>
            <div>
              <label className="label">Contract Value (₹)</label>
              <input type="number" className="input" {...fld('value')} />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...chk('includesBreakdown')} className="rounded" /> Breakdown visits</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...chk('includesParts')} className="rounded" /> Spare parts</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...chk('includesConsumables')} className="rounded" /> Consumables</label>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} {...fld('notes')} />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'create' ? 'Create Contract' : 'Save Changes'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModal({open:false,mode:'create',data:null})}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
