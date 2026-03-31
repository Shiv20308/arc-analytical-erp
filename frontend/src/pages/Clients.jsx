import React, { useState, useEffect, useCallback } from 'react';
import { clientAPI } from '../api';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import SearchFilter from '../components/ui/SearchFilter';
import EmptyState from '../components/ui/EmptyState';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';

const EMPTY_FORM = { companyName:'', contactPerson:'', designation:'', phone:'', altPhone:'', email:'', address:'', city:'', state:'', pincode:'', gst:'', notes:'' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientAPI.getAll({ page, limit: 10, search });
      setClients(res.data.data);
      setMeta(res.data.meta);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit = (c) => { setForm({ ...EMPTY_FORM, ...c }); setModal({ open: true, mode: 'edit', data: c }); };
  const closeModal = () => setModal({ open: false, mode: 'create', data: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await clientAPI.create(form);
        toast.success('Client created!');
      } else {
        await clientAPI.update(modal.data._id, form);
        toast.success('Client updated!');
      }
      closeModal();
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const F = (field, label, type = 'text', required = false, className = '') => (
    <div className={className}>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {type === 'textarea' ? (
        <textarea className="input" rows={3} value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })} />
      ) : (
        <input type={type} className="input" value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })} required={required} />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} total clients</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add Client</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <SearchFilter value={search} onChange={setSearch} placeholder="Search by name, contact, email..." />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : clients.length === 0 ? (
          <EmptyState icon="🏢" title="No clients yet" description="Add your first client to get started" action={<button className="btn-primary" onClick={openCreate}>+ Add Client</button>} />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Company</Th>
                  <Th>Contact Person</Th>
                  <Th>Phone</Th>
                  <Th>City</Th>
                  <Th>GST</Th>
                  <Th>Added</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {clients.map(c => (
                  <Tr key={c._id}>
                    <Td>
                      <div className="font-medium text-gray-900">{c.companyName}</div>
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </Td>
                    <Td>{c.contactPerson}<br/><span className="text-xs text-gray-400">{c.designation}</span></Td>
                    <Td>{c.phone}</Td>
                    <Td>{c.city}{c.state ? `, ${c.state}` : ''}</Td>
                    <Td><span className="text-xs text-gray-500">{c.gst || '-'}</span></Td>
                    <Td>{formatDate(c.createdAt)}</Td>
                    <Td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.mode === 'create' ? 'Add New Client' : 'Edit Client'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {F('companyName', 'Company Name', 'text', true)}
            {F('contactPerson', 'Contact Person', 'text', true)}
            {F('designation', 'Designation')}
            {F('phone', 'Phone', 'tel', true)}
            {F('altPhone', 'Alt. Phone', 'tel')}
            {F('email', 'Email', 'email')}
            {F('gst', 'GSTIN')}
            {F('pincode', 'Pincode')}
          </div>
          {F('address', 'Address', 'textarea')}
          <div className="grid grid-cols-2 gap-4">
            {F('city', 'City')}
            {F('state', 'State')}
          </div>
          {F('notes', 'Notes', 'textarea')}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'create' ? 'Create Client' : 'Save Changes'}</button>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
