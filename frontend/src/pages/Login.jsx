import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: 'admin@arcanalytical.com', password: 'admin123', phone: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await authAPI.signup({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/';
      toast.success('Account created! Welcome to Arc Analytical ERP.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  const f = (field) => ({ value: form[field] || '', onChange: e => setForm({ ...form, [field]: e.target.value }) });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', background: '#1d4ed8', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '900', color: 'white', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(29,78,216,0.4)' }}>A</div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>Arc Analytical</h1>
          <p style={{ color: '#93c5fd', fontSize: '13px', margin: 0 }}>ERP Management System</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {[['login', 'Sign In'], ['signup', 'Create Account']].map(([key, label]) => (
              <button key={key} onClick={() => { setMode(key); setForm({ name:'', email: key==='login'?'admin@arcanalytical.com':'', password: key==='login'?'admin123':'', phone:'', confirmPassword:'' }); }}
                style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all .15s',
                  background: mode === key ? 'white' : 'transparent',
                  color: mode === key ? '#1e3a8a' : '#64748b',
                  boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                }}>{label}</button>
            ))}
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label className="label">Email Address</label>
                <input type="email" className="input" {...f('email')} placeholder="you@arcanalytical.com" required autoComplete="email" />
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="input" {...f('password')} placeholder="••••••••" required style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '18px', fontSize: '14px' }}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
              <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px', fontSize: '11px', color: '#1e40af' }}>
                <p style={{ fontWeight: '700', marginBottom: '4px' }}>Demo Credentials</p>
                <p>Admin: admin@arcanalytical.com / admin123</p>
                <p>Engineer: rajesh@arcanalytical.com / engineer123</p>
                <p>Sales: priya@arcanalytical.com / sales123</p>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: '13px' }}>
                <label className="label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" className="input" {...f('name')} placeholder="Lekh Singh" required />
              </div>
              <div style={{ marginBottom: '13px' }}>
                <label className="label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" className="input" {...f('email')} placeholder="you@company.com" required />
              </div>
              <div style={{ marginBottom: '13px' }}>
                <label className="label">Phone</label>
                <input type="tel" className="input" {...f('phone')} placeholder="+91 98765 43210" />
              </div>
              <div style={{ marginBottom: '13px' }}>
                <label className="label">Password <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="input" {...f('password')} placeholder="Min 6 characters" required style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label className="label">Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                <input type={showPass ? 'text' : 'password'} className="input" {...f('confirmPassword')} placeholder="Re-enter password" required />
              </div>
              <div style={{ padding: '10px 12px', background: '#fefce8', borderRadius: '7px', fontSize: '11.5px', color: '#92400e', marginTop: '10px', marginBottom: '4px' }}>
                <strong>Note:</strong> The first account registered gets Admin role. Subsequent accounts get Sales role (admin can change this in Settings).
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '14px', fontSize: '14px' }}>
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>
            </form>
          )}
        </div>
        <p style={{ textAlign: 'center', color: '#475569', fontSize: '11px', marginTop: '16px' }}>© 2024 Arc Analytical. All rights reserved.</p>
      </div>
    </div>
  );
}
