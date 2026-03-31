import React, { useState, useEffect } from 'react';
import { settingsAPI, userAPI, excelAPI, authAPI } from '../api';
import { downloadBlob } from '../utils';
import toast from 'react-hot-toast';

const Tab = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{children}</button>
);

export default function Settings() {
  const [tab, setTab] = useState('company');
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [newUser, setNewUser] = useState({ name:'', email:'', password:'', role:'sales', phone:'' });
  const [addingUser, setAddingUser] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    Promise.all([settingsAPI.get(), userAPI.getAll()])
      .then(([sRes, uRes]) => { setSettings(sRes.data.data || {}); setUsers(uRes.data.data || []); })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      if (logoFile) {
        const fd = new FormData(); fd.append('logo', logoFile);
        const res = await settingsAPI.uploadLogo(fd);
        setSettings(s => ({ ...s, logoPath: res.data.data.logoPath }));
      }
      toast.success('Settings saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const addUser = async (e) => {
    e.preventDefault(); setAddingUser(true);
    try {
      await authAPI.register(newUser);
      toast.success('User added!');
      setNewUser({ name:'', email:'', password:'', role:'sales', phone:'' });
      setShowAddUser(false);
      const res = await userAPI.getAll();
      setUsers(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAddingUser(false); }
  };

  const toggleUser = async (id, isActive) => {
    try {
      if (!isActive) await userAPI.deactivate(id);
      else await userAPI.update(id, { isActive: true });
      const res = await userAPI.getAll();
      setUsers(res.data.data);
      toast.success('User updated!');
    } catch { toast.error('Failed'); }
  };

  const exportClients = async () => {
    try {
      const res = await excelAPI.exportClients();
      downloadBlob(res.data, 'clients.xlsx');
      toast.success('Clients exported!');
    } catch { toast.error('Export failed'); }
  };

  const exportContracts = async () => {
    try {
      const res = await excelAPI.exportContracts();
      downloadBlob(res.data, 'contracts.xlsx');
      toast.success('Contracts exported!');
    } catch { toast.error('Export failed'); }
  };

  const importClients = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('excel', file);
    try {
      const res = await excelAPI.importClients(fd);
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
    e.target.value = '';
  };

  const F = (field, label, type='text', placeholder='') => (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={settings[field]||''} onChange={e => setSettings({...settings,[field]:e.target.value})} placeholder={placeholder} />
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Settings</h1>
        {tab !== 'users' && tab !== 'excel' && (
          <button className="btn-primary" onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : '💾 Save Settings'}</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
        {[['company','🏢 Company'],['billing','🏦 Bank & GST'],['documents','📄 Document'],['users','👥 Users'],['excel','📊 Excel']].map(([key,label]) => (
          <Tab key={key} active={tab===key} onClick={() => setTab(key)}>{label}</Tab>
        ))}
      </div>

      {/* Company Tab */}
      {tab === 'company' && (
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Company Information</h2>
          {/* Logo upload */}
          <div>
            <label className="label">Company Logo</label>
            <div className="flex items-center gap-4">
              {settings.logoPath && <img src={`http://localhost:5000${settings.logoPath}`} alt="Logo" className="h-16 w-16 object-contain rounded-lg border border-gray-200 p-1" />}
              <label className="btn btn-secondary cursor-pointer">
                📁 Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files[0])} />
              </label>
              {logoFile && <span className="text-sm text-green-600">✓ {logoFile.name} ready to save</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {F('companyName', 'Company Name', 'text', 'Arc Analytical')}
            {F('tagline', 'Tagline / Slogan')}
            {F('phone', 'Primary Phone')}
            {F('altPhone', 'Alternate Phone')}
            {F('email', 'Company Email', 'email')}
            {F('website', 'Website')}
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={settings.address||''} onChange={e => setSettings({...settings,address:e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {F('city','City')} {F('state','State')} {F('pincode','Pincode')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {F('quotationPrefix','Quotation Prefix','text','QT')}
            {F('invoicePrefix','Invoice Prefix','text','INV')}
            {F('contractPrefix','Contract Prefix','text','CON')}
          </div>
        </div>
      )}

      {/* Bank & GST Tab */}
      {tab === 'billing' && (
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Tax & Bank Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {F('gst','GSTIN')} {F('pan','PAN Number')}
            {F('bankName','Bank Name')} {F('accountNo','Account Number')}
            {F('swiftCode','SWIFT/SHIFT Code')} {F('ieCode','IE Code')}
            {F('ifsc','IFSC Code')} {F('accountHolder','Account Holder')}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Document Templates & Terms</h2>
          <div>
            <label className="label">Quotation Terms & Conditions</label>
            <textarea className="input" rows={6} value={settings.quotationTerms||''} onChange={e => setSettings({...settings,quotationTerms:e.target.value})} placeholder="Enter default terms for quotations..." />
          </div>
          <div>
            <label className="label">Invoice Terms / Footer Note</label>
            <textarea className="input" rows={4} value={settings.invoiceTerms||''} onChange={e => setSettings({...settings,invoiceTerms:e.target.value})} />
          </div>
          <div>
            <label className="label">Email Signature</label>
            <textarea className="input" rows={4} value={settings.emailSignature||''} onChange={e => setSettings({...settings,emailSignature:e.target.value})} />
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Team Members</h2>
              <button className="btn-primary btn-sm" onClick={() => setShowAddUser(v => !v)}>+ Add User</button>
            </div>

            {showAddUser && (
              <form onSubmit={addUser} className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">Add New User</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Name</label><input className="input" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} required /></div>
                  <div><label className="label">Email</label><input type="email" className="input" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} required /></div>
                  <div><label className="label">Password</label><input type="password" className="input" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} required minLength={6} /></div>
                  <div><label className="label">Role</label>
                    <select className="input" value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}>
                      <option value="sales">Sales</option>
                      <option value="engineer">Engineer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div><label className="label">Phone</label><input className="input" value={newUser.phone} onChange={e=>setNewUser({...newUser,phone:e.target.value})} /></div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary btn-sm" disabled={addingUser}>{addingUser?'Adding...':'Add User'}</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddUser(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-gray-100">
              {users.map(u => (
                <div key={u._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">{u.name?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <div className="font-medium text-sm">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${u.role==='admin'?'badge-purple':u.role==='engineer'?'badge-blue':'badge-green'}`}>{u.role}</span>
                    <span className={`badge ${u.isActive?'badge-green':'badge-gray'}`}>{u.isActive?'Active':'Inactive'}</span>
                    <button className={`btn btn-sm ${u.isActive?'btn-danger':'btn-secondary'}`} onClick={() => toggleUser(u._id, !u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Excel Tab */}
      {tab === 'excel' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Export Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-medium text-sm mb-1">Export Clients</div>
                <div className="text-xs text-gray-500 mb-3">Download all active clients as Excel</div>
                <button className="btn-primary btn-sm w-full justify-center" onClick={exportClients}>⬇ Download Clients.xlsx</button>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium text-sm mb-1">Export Contracts</div>
                <div className="text-xs text-gray-500 mb-3">Download all AMC/CMC contracts</div>
                <button className="btn-primary btn-sm w-full justify-center" onClick={exportContracts}>⬇ Download Contracts.xlsx</button>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="section-title mb-4">Import Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">📥</div>
                <div className="font-medium text-sm mb-1">Import Clients</div>
                <div className="text-xs text-gray-500 mb-3">Upload Excel with columns: Company Name, Contact Person, Phone, Email, City, State, GST, Address</div>
                <label className="btn btn-secondary btn-sm cursor-pointer w-full justify-center">
                  📁 Choose Excel File
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importClients} />
                </label>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
              <strong>Import Template:</strong> Your Excel file header row should have: Company Name, Contact Person, Phone, Email, Address, City, State, GST
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
