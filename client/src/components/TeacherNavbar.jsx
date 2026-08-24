import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TeacherNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/teacher/routes?query=${encodeURIComponent(search.trim())}`);
    }
  };

  const navLinks = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/teacher/routes',    label: 'Routes',    icon: 'route' },
    { path: '/teacher/buy-pass',  label: 'Buy Pass',  icon: 'add_card' },
    { path: '/track',             label: 'Live Bus',  icon: 'location_on' },
    { path: '/teacher/profile',   label: 'Profile',   icon: 'badge' },
  ];

  return (
    <>
      <header className="bg-surface shadow-sm sticky top-0 z-40 border-b border-outline-variant/40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4 sm:gap-8">
            <NavLink to="/teacher/dashboard" className="text-base sm:text-xl font-black text-primary tracking-tight flex items-center gap-1.5">
              <span>JD College</span>
              <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">Faculty</span>
            </NavLink>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `text-sm font-semibold transition-colors ${
                      isActive ? 'text-primary border-b-2 border-primary pb-1 font-bold' : 'text-on-surface-variant hover:text-primary'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xs md:max-w-md relative">
            <input
              type="text"
              placeholder="Search college routes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-full px-4 py-1.5 pl-9 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-base">
              search
            </span>
          </form>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs sm:text-sm">
                {user?.name?.[0] || 'T'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold leading-tight">{user?.name || 'Prof. Teacher'}</p>
                <p className="text-[10px] text-on-surface-variant">Faculty · JD College</p>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant/50 px-2 py-1.5 flex items-center justify-around z-40 shadow-lg pb-safe">
        {navLinks.map(({ path, label, icon }) => (
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

export default TeacherNavbar;
