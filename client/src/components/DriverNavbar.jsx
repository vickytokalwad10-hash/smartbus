import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DriverNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/driver/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/driver/trip',      label: 'Live Trip',  icon: 'alt_route' },
    { path: '/driver/scanner',   label: 'Scanner',    icon: 'qr_code_scanner' },
    { path: '/track',            label: 'Map',        icon: 'location_on' },
  ];

  return (
    <>
      <header className="bg-surface shadow-sm sticky top-0 z-40 border-b border-outline-variant/40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4 sm:gap-6">
            <NavLink to="/driver/dashboard" className="text-base sm:text-xl font-black text-tertiary tracking-tight flex items-center gap-1.5">
              <span>JD College</span>
              <span className="text-[10px] bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full font-bold">Driver</span>
            </NavLink>

            <nav className="hidden md:flex items-center gap-3">
              {navLinks.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-tertiary text-on-tertiary' : 'text-on-surface-variant hover:bg-surface-container'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container font-black text-xs sm:text-sm">
                {user?.name?.[0] || 'D'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-tight">{user?.name || 'Driver'}</p>
                <p className="text-[10px] text-on-surface-variant">ID: {user?.employeeId || 'DRV-001'}</p>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-1.5 sm:p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant/50 px-2 py-1.5 flex items-center justify-around z-40 shadow-lg pb-safe">
        {navLinks.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-tertiary font-black scale-105'
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

export default DriverNavbar;
