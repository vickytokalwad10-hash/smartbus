import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sb_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If Supabase is reachable, sync session; otherwise fail gracefully
    try {
      supabase.auth.getSession()
        .then(({ data }) => {
          if (data?.session) {
            setSession(data.session);
            if (data.session.user) {
              const u = { ...data.session.user, ...data.session.user.user_metadata };
              setUser(u);
              localStorage.setItem('sb_user', JSON.stringify(u));
              fetchProfile(data.session.user);
            }
          }
        })
        .catch(err => {
          console.warn('Supabase getSession skipped/offline:', err?.message);
        });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          const u = { ...session.user, ...session.user.user_metadata };
          setUser(u);
          localStorage.setItem('sb_user', JSON.stringify(u));
          fetchProfile(session.user);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch (e) {
      console.warn('Supabase auth init error:', e);
    }
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (!error && data) {
        setUser(prev => {
          const updated = { ...prev, ...authUser, ...data, role: authUser.user_metadata?.role || data.role };
          localStorage.setItem('sb_user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
    }
  };

  const login = async (email, password) => {
    // 1. Try local Express + MongoDB backend
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.token && res.data?.user) {
        const u = res.data.user;
        localStorage.setItem('sb_token', res.data.token);
        localStorage.setItem('sb_user', JSON.stringify(u));
        setUser(u);
        return res.data;
      }
    } catch (apiErr) {
      console.warn('MongoDB API login failed, checking fallback:', apiErr.message);
    }

    // 2. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        const u = { ...data.user, ...data.user.user_metadata };
        localStorage.setItem('sb_user', JSON.stringify(u));
        setUser(u);
        fetchProfile(data.user);
        return data;
      }
    } catch (sbErr) {
      console.warn('Supabase login failed:', sbErr.message);
    }

    // 3. Fallback Demo Accounts (Guaranteed to work for offline / simple demo)
    const demoAccounts = {
      'student@test.com': { id: 'demo-student', name: 'Aarav Sharma', email: 'student@test.com', role: 'student', collegeName: 'JD College of Engineering & Technology', studentId: 'JDC-STU-8821' },
      'teacher@test.com': { id: 'demo-teacher', name: 'Prof. Rajesh Kulkarni', email: 'teacher@test.com', role: 'teacher', employeeId: 'JDC-FAC-101' },
      'faculty@test.com': { id: 'demo-teacher', name: 'Prof. Rajesh Kulkarni', email: 'faculty@test.com', role: 'teacher', employeeId: 'JDC-FAC-101' },
      'driver@test.com': { id: 'demo-driver', name: 'Sanjay Raut', email: 'driver@test.com', role: 'driver', employeeId: 'DRV-001' },
      'admin@test.com': { id: 'demo-admin', name: 'Rajesh Joshi', email: 'admin@test.com', role: 'admin' },
    };

    if (demoAccounts[email.toLowerCase()] && password === 'test123') {
      const u = demoAccounts[email.toLowerCase()];
      localStorage.setItem('sb_user', JSON.stringify(u));
      setUser(u);
      return { user: u };
    }

    throw new Error('Invalid email or password. Please verify credentials or use Quick Demo Login.');
  };

  const logout = async () => {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
