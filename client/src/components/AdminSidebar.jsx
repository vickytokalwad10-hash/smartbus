import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard',   icon: 'dashboard',          label: 'Overall Monitoring' },
    { path: '/admin/routes',      icon: 'route',              label: 'Routes' },
    { path: '/admin/fleet',       icon: 'directions_bus',     label: 'Fleet Tracking' },
    { path: '/admin/passes',      icon: 'confirmation_number', label: 'Passes' },
    { path: '/admin/predictions', icon: 'psychology',         label: 'AI Forecast' },
    { path: '/admin/reports',     icon: 'assessment',         label: 'Reports' },
    { path: '/admin/complaints',  icon: 'report_problem',     label: 'Complaints' },
  ];

  const bottomNavItems = [
    { path: '/admin/dashboard',   icon: 'dashboard',          label: 'Monitoring' },
    { path: '/admin/routes',      icon: 'route',              label: 'Routes' },
    { path: '/admin/fleet',       icon: 'directions_bus',     label: 'Fleet' },
    { path: '/admin/predictions', icon: 'psychology',         label: 'AI' },
    { path: '/admin/passes',      icon: 'confirmation_number', label: 'Passes' },
  ];

  return (
    <>
      {/* Mobile Top Header (hidden on md+) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-outline-variant/50 px-4 flex items-center justify-between z-40 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(4rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <div>
            <h1 className="text-base font-black text-primary leading-tight">JD College</h1>
            <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-xs">
            {user?.name?.[0] || 'A'}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-surface h-full flex flex-col p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-6 border-b border-outline-variant">
              <div>
                <h2 className="text-lg font-black text-primary">JD College</h2>
                <p className="text-xs text-on-surface-variant font-semibold">Admin Fleet Management</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map(({ path, icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'text-primary bg-primary/10 font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 border-t border-outline-variant space-y-2">
              <button
                onClick={() => { setDrawerOpen(false); logout(); navigate('/login'); }}
                className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 rounded-xl text-sm font-bold w-full transition-all"
              >
                <span className="material-symbols-outlined text-[22px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[260px] lg:w-[280px] bg-surface-container-low border-r border-outline-variant flex-col z-40">
        <div className="p-6">
          <h1 className="text-headline-sm font-black text-primary mb-1">JD College</h1>
          <p className="text-label-md text-on-surface-variant font-bold">Bus Pass Management</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-primary bg-surface-container-high border-r-4 border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 space-y-1 border-t border-outline-variant">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg text-sm transition-all w-full"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (hidden on md+) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant/50 px-2 py-1.5 flex items-center justify-around z-40 shadow-lg pb-safe">
        {bottomNavItems.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-primary font-black scale-105'
                  : 'text-on-surface-variant/70 font-medium hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px] leading-none mb-1">{icon}</span>
            <span className="text-[10px] tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default AdminSidebar;
