import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import api from '../../utils/api';

const ROLES = [
  { id: 'student',  icon: 'school',               label: 'Student',    color: 'border-primary',   bg: 'bg-primary/5',   iconBg: 'bg-primary/10 text-primary' },
  { id: 'teacher',  icon: 'person',                label: 'Teacher',    color: 'border-secondary', bg: 'bg-secondary/5', iconBg: 'bg-secondary/10 text-secondary' },
  { id: 'driver',   icon: 'directions_bus',        label: 'Driver',     color: 'border-tertiary',  bg: 'bg-tertiary/5',  iconBg: 'bg-tertiary/10 text-tertiary' },
  { id: 'admin',    icon: 'admin_panel_settings',  label: 'Admin',      color: 'border-error',     bg: 'bg-error/5',     iconBg: 'bg-error/10 text-error' },
];

const DASHBOARDS = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  customer: '/teacher/dashboard',
  driver: '/driver/dashboard',
  admin: '/admin/dashboard'
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const initialTab = location.state?.tab === 'customer' ? 'teacher' : (location.state?.tab || 'student');

  const [tab, setTab] = useState(initialTab);
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', collegeName: 'JD College of Engineering & Technology', employeeId: '', studentId: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // If user becomes available (from background onAuthStateChange or successful login), redirect them automatically
  useEffect(() => {
    if (user && user.role) {
      navigate(DASHBOARDS[user.role] || '/teacher/dashboard');
    }
  }, [user, navigate]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password);
        const targetRole = res?.user?.role || tab;
        navigate(DASHBOARDS[targetRole] || '/teacher/dashboard');
      } else {
        try {
          const res = await api.post('/auth/signup', {
            name: form.name,
            email: form.email,
            password: form.password,
            role: tab,
            collegeName: form.collegeName,
            employeeId: form.employeeId,
            studentId: form.studentId,
            phone: form.phone
          });
          if (res.data?.user) {
            await login(form.email, form.password);
            navigate(DASHBOARDS[tab] || '/teacher/dashboard');
            return;
          }
        } catch (apiErr) {
          console.warn('Local signup:', apiErr.message);
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
              role: tab
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: form.name || form.email.split('@')[0],
            role: tab,
            email: form.email
          }).catch(() => {});
        }
        
        navigate(DASHBOARDS[tab] || '/teacher/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const demos = {
      student: { email: 'student@test.com', password: 'test123', name: 'Demo Student' },
      teacher: { email: 'teacher@test.com', password: 'test123', name: 'Demo Teacher' },
      customer: { email: 'teacher@test.com', password: 'test123', name: 'Demo Customer' },
      driver: { email: 'driver@test.com', password: 'test123', name: 'Demo Driver' },
      admin: { email: 'admin@test.com', password: 'test123', name: 'Demo Admin' },
    };
    setError(''); setLoading(true);
    try {
      const { email, password } = demos[role];
      const res = await login(email, password);
      const targetRole = res?.user?.role || role;
      navigate(DASHBOARDS[targetRole] || DASHBOARDS[role] || '/teacher/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const activeRole = ROLES.find(r => r.id === tab);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="bg-surface shadow-sm h-16 flex items-center px-4 sm:px-10" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(4rem + env(safe-area-inset-top))' }}>
        <button onClick={() => navigate('/')} className="text-base sm:text-lg font-black text-primary truncate">
          JD College Bus Pass Management
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-primary mb-2">JD College Portal Login</h1>
            <p className="text-body-md text-on-surface-variant">Select your role to access your bus pass dashboard</p>
          </div>

          {/* Role Selector Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => { setTab(role.id); setError(''); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  tab === role.id
                    ? `${role.color} ${role.bg} shadow-overlay scale-[1.02]`
                    : 'border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-card'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${role.iconBg}`}>
                  <span className="material-symbols-outlined">{role.icon}</span>
                </div>
                <p className="font-bold text-sm text-on-surface">{role.label}</p>
              </button>
            ))}
          </div>

          {/* Login/Signup Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-overlay border border-outline-variant p-8 max-w-lg mx-auto">
            {/* Mode Toggle */}
            <div className="flex bg-surface-container rounded-xl p-1 mb-6">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                    mode === m ? 'bg-primary text-on-primary shadow-card' : 'text-on-surface-variant'
                  }`}
                >
                  {m === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h2 className="text-headline-sm font-black mb-1">
              {mode === 'login' ? 'Welcome back' : `Join as ${activeRole?.label}`}
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-6">
              {mode === 'login' ? `Login to your ${activeRole?.label} account` : `Create your JD College account`}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-error-container rounded-xl text-error text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-on-surface-variant">Full Name</label>
                  <input name="name" value={form.name} onChange={handle} className="input-field" placeholder="Aarav Sharma / Prof. Rajesh" required />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1 text-on-surface-variant">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handle} className="input-field" placeholder="you@jdcoem.ac.in" required />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-on-surface-variant">Password</label>
                <input name="password" type="password" value={form.password} onChange={handle} className="input-field" placeholder="••••••••" required />
              </div>

              {/* Role-specific fields */}
              {mode === 'signup' && tab === 'student' && (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-on-surface-variant">College Name</label>
                    <input name="collegeName" value={form.collegeName} onChange={handle} className="input-field" placeholder="JD College of Engineering & Technology" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-on-surface-variant">Student ID</label>
                    <input name="studentId" value={form.studentId} onChange={handle} className="input-field" placeholder="JDC-STU-0001" />
                  </div>
                </>
              )}

              {mode === 'signup' && tab === 'teacher' && (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-on-surface-variant">College / Department</label>
                    <input name="collegeName" value={form.collegeName} onChange={handle} className="input-field" placeholder="JD College of Engineering & Technology" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-on-surface-variant">Faculty Employee ID</label>
                    <input name="employeeId" value={form.employeeId} onChange={handle} className="input-field" placeholder="JDC-FAC-101" />
                  </div>
                </>
              )}

              {mode === 'signup' && tab === 'driver' && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-on-surface-variant">Driver License / Employee ID</label>
                  <input name="employeeId" value={form.employeeId} onChange={handle} className="input-field" placeholder="DRV-001" />
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-on-surface-variant">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handle} className="input-field" placeholder="9876543210" />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-sm">login</span>
                )}
                {mode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>

            {/* Demo Quick Login */}
            <div className="mt-6 pt-6 border-t border-outline-variant">
              <p className="text-xs text-on-surface-variant text-center mb-3 font-semibold">Quick Demo Login</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => demoLogin(r.id)}
                    className="p-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">{r.icon}</span>
                    Demo {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
