import React, { useState, useEffect, useCallback } from 'react';
import { invoiceAPI, clientAPI, quotationAPI } from '../api';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate, statusBadgeClass } from '../utils';
import toast from 'react-hot-toast';

const EMPTY_ITEM = { description:'', quantity:1, unit:'Nos', unitPrice:0, discount:0, amount:0, modelNo:'', hsnCode:'' };
const EMPTY = { clientId:'', quotationId:'', items:[{...EMPTY_ITEM}], gstPercent:18, taxType:'intra', invoiceDate:'', dueDate:'', poNumber:'', notes:'' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({open:false,mode:'create',data:null});
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, cRes] = await Promise.all([invoiceAPI.getAll({page,limit:10}), clientAPI.getAllSimple()]);
      setInvoices(iRes.data.data); setMeta(iRes.data.meta); setClients(cRes.data.data);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calcItem = (item) => { const base = item.quantity*item.unitPrice; return {...item, amount: Math.round((base - base*(item.discount||0)/100)*100)/100}; };
  const updateItem = (idx,f,v) => { const items=[...form.items]; items[idx]=calcItem({...items[idx],[f]:parseFloat(v)||v}); setForm({...form,items}); };
  const subtotal = form.items.reduce((s,i) => s+(i.amount||0),0);
  const gstAmount = subtotal*(form.gstPercent/100);
  const total = subtotal+gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {...form,subtotal,gstAmount,totalAmount:total,invoiceDate:form.invoiceDate||new Date().toISOString()};
      if (modal.mode==='create') { await invoiceAPI.create(payload); toast.success('Invoice created!'); }
      else { await invoiceAPI.update(modal.data._id,payload); toast.success('Invoice updated!'); }
      setModal({open:false,mode:'create',data:null}); fetchData();
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const handlePDF = async (id) => {
    setPdfLoading(p=>({...p,[id]:true}));
    try {
      const res = await invoiceAPI.generatePDF(id);
      const baseUrl = 'http://localhost:5000';
      const url = `${baseUrl}${res.data.data.downloadUrl}`;
      window.open(url, '_blank');
      toast.success('PDF generated!');
    } catch { toast.error('PDF generation failed'); }
    finally { setPdfLoading(p=>({...p,[id]:false})); }
  };

  const openCreate = () => { setForm({...EMPTY, invoiceDate:new Date().toISOString().split('T')[0]}); setModal({open:true,mode:'create',data:null}); };
  const openEdit = (inv) => { setForm({...EMPTY,...inv,clientId:inv.clientId?._id||inv.clientId,invoiceDate:inv.invoiceDate?.split('T')[0]||'',dueDate:inv.dueDate?.split('T')[0]||''}); setModal({open:true,mode:'edit',data:inv}); };

  const statusColor = (s) => ({paid:'badge-green',unpaid:'badge-red',partial:'badge-yellow',overdue:'badge-red'}[s]||'badge-gray');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Invoices</h1><p className="text-sm text-gray-500">{meta?.total||0} invoices</p></div>
        <button className="btn-primary" onClick={openCreate}>+ New Invoice</button>
      </div>
      <div className="card">
        {loading ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
        : invoices.length===0 ? <EmptyState icon="🧾" title="No invoices" action={<button className="btn-primary" onClick={openCreate}>+ New Invoice</button>} />
        : <>
          <Table>
            <Thead><tr><Th>Invoice No</Th><Th>Client</Th><Th>Amount</Th><Th>Date</Th><Th>Due Date</Th><Th>Status</Th><Th>Actions</Th></tr></Thead>
            <Tbody>
              {invoices.map(inv => (
                <Tr key={inv._id}>
                  <Td><span className="font-mono text-xs font-bold text-primary-700">{inv.invoiceNo}</span></Td>
                  <Td><div className="font-medium">{inv.clientId?.companyName}</div></Td>
                  <Td><span className="font-semibold">{formatCurrency(inv.totalAmount)}</span></Td>
                  <Td>{formatDate(inv.invoiceDate)}</Td>
                  <Td>{formatDate(inv.dueDate)}</Td>
                  <Td><span className={`badge ${statusColor(inv.status)}`}>{inv.status}</span></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(inv)}>Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handlePDF(inv._id)} disabled={pdfLoading[inv._id]}>{pdfLoading[inv._id]?'...':'⬇ PDF'}</button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination meta={meta} onPageChange={setPage} />
        </>}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({open:false,mode:'create',data:null})} title={modal.mode==='create'?'New Invoice':'Edit Invoice'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client <span className="text-red-500">*</span></label>
              <select className="input" value={form.clientId} onChange={e=>setForm({...form,clientId:e.target.value})} required>
                <option value="">Select client...</option>
                {clients.map(c=><option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Invoice Date</label>
              <input type="date" className="input" value={form.invoiceDate} onChange={e=>setForm({...form,invoiceDate:e.target.value})} />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
            </div>
            <div>
              <label className="label">PO Number</label>
              <input className="input" value={form.poNumber||''} onChange={e=>setForm({...form,poNumber:e.target.value})} placeholder="e.g. PO-2024-001 or NA" />
            </div>
            <div>
              <label className="label">Tax Type</label>
              <select className="input" value={form.taxType||'intra'} onChange={e=>setForm({...form,taxType:e.target.value})}>
                <option value="intra">Intra-State (CGST + SGST)</option>
                <option value="inter">Inter-State (IGST)</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status||'unpaid'} onChange={e=>setForm({...form,status:e.target.value})}>
                {['unpaid','paid','partial','overdue'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr><th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th><th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th><th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-16">Qty</th><th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-28">Unit Price</th><th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-28">Amount</th><th className="w-8"></th></tr>
              </thead>
              <tbody>
                {form.items.map((item,i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-400">{i+1}</td>
                    <td className="px-3 py-2"><input className="input py-1" value={item.description} onChange={e=>updateItem(i,'description',e.target.value)} required /></td>
                    <td className="px-3 py-2"><input type="number" className="input py-1" min="1" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="number" className="input py-1" min="0" value={item.unitPrice} onChange={e=>updateItem(i,'unitPrice',e.target.value)} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.amount)}</td>
                    <td className="px-3 py-2"><button type="button" onClick={()=>setForm({...form,items:form.items.filter((_,j)=>j!==i)})} className="text-red-400 hover:text-red-600">&times;</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 border-t border-gray-100"><button type="button" className="btn btn-secondary btn-sm" onClick={()=>setForm({...form,items:[...form.items,{...EMPTY_ITEM}]})}>+ Add Row</button></div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">GST</span>
                <div className="flex items-center gap-2">
                  <select className="input py-1 w-20 text-xs" value={form.gstPercent} onChange={e=>setForm({...form,gstPercent:parseInt(e.target.value)})}>
                    {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
                  </select>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-bold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>

          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving...':modal.mode==='create'?'Create Invoice':'Save Changes'}</button>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal({open:false,mode:'create',data:null})}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
