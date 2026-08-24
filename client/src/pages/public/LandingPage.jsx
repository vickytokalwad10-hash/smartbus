import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const handleTrack = () => navigate(user ? '/track' : '/login');
  const handlePass = () => navigate(user ? `/${user.role === 'customer' ? 'teacher' : user.role}/dashboard` : '/login');

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <header className="bg-surface shadow-sm sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <nav className="flex justify-between items-center px-4 sm:px-10 w-full max-w-[1440px] mx-auto h-16 sm:h-20">
          <div className="flex items-center gap-8">
            <span className="text-xl md:text-2xl font-black text-primary cursor-pointer tracking-tight" onClick={() => navigate('/')}>
              JD College Bus Pass Management
            </span>
            <div className="hidden md:flex gap-6 items-center">
              <a href="#features" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Features</a>
              <a href="#map" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Routes</a>
              <a href="#about" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Portals</a>
              <a href="#footer" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <button onClick={() => navigate(`/${user.role === 'customer' ? 'teacher' : user.role}/dashboard`)} className="btn-primary">
                Go to Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-lg text-primary text-sm font-semibold hover:bg-surface-container-high transition-all">
                  Login
                </button>
                <button onClick={() => navigate('/login')} className="btn-primary">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-4 md:px-10 pt-8">
          {/* Gradient background */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-surface to-secondary/5"></div>

          <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-1 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">school</span>
              JD College of Engineering & Technology · Transit Portal
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-black text-primary leading-tight">
              JD College Bus Pass &<br />
              <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                Live Tracking System
              </span>
            </h1>

            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto font-semibold">
              Comprehensive College Bus Pass Management and Live Tracking. Overall monitoring for administrators from college administratives, with dedicated portals for Students, Teachers, and Drivers.
            </p>

            {/* Search Bar */}
            <div className="mt-8 w-full max-w-3xl mx-auto">
              <div className="bg-surface-container-lowest p-2 rounded-xl shadow-xl flex flex-col md:flex-row gap-2 border border-outline-variant">
                <div className="flex-1 flex items-center gap-3 px-4 border-b md:border-b-0 md:border-r border-outline-variant py-2">
                  <span className="material-symbols-outlined text-outline">search</span>
                  <input
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm placeholder:text-outline"
                    placeholder="Search JD College route (e.g. Route 42A Campus Express)"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 p-1">
                  <button onClick={handleTrack} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container transition-all active:scale-95">
                    <span className="material-symbols-outlined text-sm">map</span>
                    Track Bus
                  </button>
                  <button onClick={handlePass} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 border-2 border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary-fixed transition-all active:scale-95">
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    Get Bus Pass
                  </button>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="mt-8 w-full max-w-5xl mx-auto hidden lg:block">
              <div className="relative h-56">
                <div className="absolute left-4 bottom-0 w-64 bg-white/80 backdrop-blur-md rounded-xl border border-white/20 p-4 shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-sm">directions_bus</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Route 42A (JD Campus)</p>
                      <p className="text-xs text-secondary">On Schedule</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-2/3 rounded-full"></div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">Arriving at JD Gate in 3 mins</p>
                </div>

                <div className="absolute right-4 top-0 w-72 bg-primary/10 backdrop-blur-xl rounded-xl border border-primary/20 p-4 shadow-lg rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-primary">Student Pass Active</p>
                      <p className="text-xs text-on-surface-variant">JDC-AARAV001-2024 · Semester</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-secondary status-pulse"></div>
                  </div>
                  <div className="bg-white rounded-lg p-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">qr_code_2</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold">Aarav Sharma</p>
                      <p className="text-xs text-on-surface-variant">JD College Student</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-4 md:px-10 max-w-[1440px] mx-auto">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-headline-lg font-black text-on-surface mb-2">Campus Transit Features</h2>
            <p className="text-body-md text-on-surface-variant font-semibold">Designed specifically for JD College Students & Faculty.</p>
          </div>
          <div className="grid grid-cols-12 gap-6">
            {/* Feature 1 */}
            <div className="col-span-12 md:col-span-7 lg:col-span-4 p-6 bg-white rounded-xl shadow-card border border-outline-variant hover:shadow-overlay transition-all group overflow-hidden relative cursor-pointer" onClick={handlePass}>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-primary text-4xl mb-4 block">contactless</span>
                <h3 className="text-headline-sm font-black mb-2">Digital QR Bus Pass</h3>
                <p className="text-body-sm text-on-surface-variant mb-4">Instant digital pass generation for Students (50% concession) & Teachers (30% concession). Scan QR code on entry.</p>
                <span className="text-label-md text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Apply for Pass <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            </div>

            {/* Feature 2 — Wide */}
            <div className="col-span-12 md:col-span-5 lg:col-span-8 p-6 bg-primary text-on-primary rounded-xl shadow-lg relative overflow-hidden cursor-pointer" onClick={handleTrack}>
              <div className="relative z-10 max-w-md">
                <span className="material-symbols-outlined text-on-primary text-4xl mb-4 block">location_on</span>
                <h3 className="text-headline-sm font-black mb-2">Live Bus GPS Telemetry</h3>
                <p className="text-body-sm opacity-80 mb-4">Track JD College buses in real-time across Sitabuldi, Dharampeth, Wardha Road, and MIHAN routes with live seat occupancy display.</p>
                <div className="flex gap-3">
                  <div className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">Real-time GPS</div>
                  <div className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">Seat Occupancy</div>
                </div>
              </div>
              <div className="absolute top-0 right-0 h-full w-1/3 opacity-20">
                <div className="w-full h-full bg-gradient-to-l from-white/30 to-transparent"></div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-span-12 md:col-span-6 p-6 bg-surface-container-high rounded-xl border border-outline-variant relative overflow-hidden group cursor-pointer">
              <span className="material-symbols-outlined text-primary text-4xl mb-4 block">auto_schedule</span>
              <h3 className="text-headline-sm font-black mb-2">AI Demand Management</h3>
              <p className="text-body-sm text-on-surface-variant mb-4">AI prediction engine forecasts student rush hours during morning lecture times and automatically suggests relief bus shifts.</p>
              <div className="flex items-end h-20 gap-1 mt-2">
                {[40, 60, 90, 75, 55, 100, 30].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t group-hover:bg-primary/40 transition-all" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-span-12 md:col-span-6 p-6 bg-surface-container-low rounded-xl border border-outline-variant flex flex-col justify-between cursor-pointer">
              <div>
                <span className="material-symbols-outlined text-secondary text-4xl mb-4 block">refresh</span>
                <h3 className="text-headline-sm font-black mb-2">One-Tap Pass Renewal</h3>
                <p className="text-body-sm text-on-surface-variant">Seamless semester & monthly pass renewal via UPI, Cards, or Wallet with instant PDF receipt download.</p>
              </div>
              <div className="mt-6 p-3 bg-white rounded-xl border border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">credit_card</span>
                  </div>
                  <span className="text-xs font-bold">UPI Auto-pay</span>
                </div>
                <div className="w-12 h-6 bg-secondary-container rounded-full relative flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-secondary rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role Cards — Student, Teacher, Driver, Admin */}
        <section id="about" className="py-16 bg-surface-container-lowest">
          <div className="px-4 md:px-10 max-w-[1440px] mx-auto">
            <h2 className="text-headline-lg font-black text-center mb-2">JD College Portal Portals</h2>
            <p className="text-body-md text-on-surface-variant text-center mb-10">Dedicated login portals for every member of JD College</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { role: 'student', icon: 'school', label: 'Student', desc: '50% concession bus pass, semester renewal, digital QR card', color: 'border-primary', bg: 'bg-primary/5', iconColor: 'text-primary' },
                { role: 'teacher', icon: 'person', label: 'Teacher / Faculty', desc: 'Faculty bus pass with 30% concession, route search, saved passes', color: 'border-secondary', bg: 'bg-secondary/5', iconColor: 'text-secondary' },
                { role: 'driver', icon: 'directions_bus', label: 'Driver', desc: 'Start shift, scan pass QR code, live seat occupancy & GPS', color: 'border-tertiary', bg: 'bg-tertiary/5', iconColor: 'text-tertiary' },
                { role: 'admin', icon: 'admin_panel_settings', label: 'Admin', desc: 'Overall monitoring for college administratives, fleet map, AI demand heatmap, route management', color: 'border-error', bg: 'bg-error/5', iconColor: 'text-error' },
              ].map(({ role, icon, label, desc, color, bg, iconColor }) => (
                <button
                  key={role}
                  onClick={() => navigate('/login', { state: { tab: role } })}
                  className={`p-6 rounded-xl border-2 ${color} ${bg} text-left hover:shadow-overlay transition-all hover:-translate-y-1 group`}
                >
                  <span className={`material-symbols-outlined text-4xl mb-4 block ${iconColor}`}>{icon}</span>
                  <h3 className="text-headline-sm font-black mb-2">{label}</h3>
                  <p className="text-body-sm text-on-surface-variant mb-3">{desc}</p>
                  <span className={`text-xs font-bold ${iconColor} flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                    Login as {label} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Live Map Preview */}
        <section id="map" className="py-16">
          <div className="px-4 md:px-10 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-headline-lg font-black">JD College Live Fleet Map</h2>
              <p className="text-body-lg text-on-surface-variant">Every JD College bus is equipped with real-time GPS telemetry. Track live bus locations, seat availability, and ETAs directly on the interactive map.</p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl border-l-4 border-secondary">
                  <span className="material-symbols-outlined text-secondary">people</span>
                  <div>
                    <p className="text-xs font-bold">Route 42A (JD Campus Express) — Moderate Occupancy</p>
                    <p className="text-xs text-on-surface-variant">18 seats available · 3 mins from Dharampeth</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl border-l-4 border-primary">
                  <span className="material-symbols-outlined text-primary">eco</span>
                  <div>
                    <p className="text-xs font-bold">MH-31 EV Fleet Status</p>
                    <p className="text-xs text-on-surface-variant">Zero-emission electric buses serving JD College campus</p>
                  </div>
                </div>
              </div>
              <button onClick={handleTrack} className="btn-primary flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-sm">map</span>
                Open Live Campus Map
              </button>
            </div>
            <div className="relative h-80 bg-surface-variant rounded-2xl overflow-hidden shadow-inner border border-outline-variant flex items-center justify-center">
              <div className="text-center space-y-2 p-8">
                <span className="material-symbols-outlined text-primary text-5xl block">map</span>
                <p className="text-sm font-semibold text-on-surface">JD College Interactive Live Map</p>
                <p className="text-xs text-on-surface-variant">Campus & Nagpur routes via Leaflet.js</p>
                <button onClick={handleTrack} className="btn-primary text-xs mt-2">Open Map →</button>
              </div>
              <div className="absolute top-6 left-8 bg-secondary text-on-secondary text-xs px-3 py-1 rounded-lg font-bold shadow-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">directions_bus</span> 42A JD Campus
              </div>
              <div className="absolute bottom-12 right-10 bg-tertiary text-on-tertiary text-xs px-3 py-1 rounded-lg font-bold shadow-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">directions_bus</span> 101 Metro
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 md:px-10 text-center bg-primary text-on-primary relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-5xl font-black">Ready to commute to<br />JD College?</h2>
            <p className="text-body-lg opacity-80">Log in with your college credentials to generate your digital bus pass instantly.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <button onClick={() => navigate('/login')} className="bg-white text-primary px-8 py-4 rounded-xl font-black text-sm shadow-xl hover:bg-surface-container-low transition-all active:scale-95">
                Login to Portal
              </button>
              <button onClick={handleTrack} className="bg-primary-container text-on-primary px-8 py-4 rounded-xl font-black text-sm border border-white/20 shadow-xl hover:opacity-90 transition-all active:scale-95">
                Track Bus Live
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="bg-surface-container-highest border-t border-outline-variant">
        <div className="w-full py-8 px-10 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1440px] mx-auto">
          <div className="space-y-4">
            <span className="text-xl font-black text-primary">JD College Bus Pass Management</span>
            <p className="text-body-sm text-on-surface-variant">Official transit portal for JD College of Engineering & Technology, Nagpur.</p>
          </div>
          {[
            { title: 'College Routes', links: ['JD Campus Express (42A)', 'Nagpur Metro Circular (101)', 'Futala Lake Shuttle (52B)', 'MIHAN IT Express (EV-22)'] },
            { title: 'Support', links: ['Help Center', 'Report a Delay', 'Lost & Found', 'Contact Transport Cell'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Accessibility', 'Cookie Settings'] },
          ].map(({ title, links }) => (
            <div key={title} className="space-y-3">
              <h4 className="text-xs font-black text-primary uppercase tracking-wider">{title}</h4>
              <ul className="space-y-2">
                {links.map(l => <li key={l}><a href="#" className="text-body-sm text-on-surface-variant hover:text-primary transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-[1440px] mx-auto px-10 py-4 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-on-surface-variant opacity-70">© 2024 JD College of Engineering & Technology. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="text-xs text-on-surface-variant">Campus Bus Fleet Status: Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
