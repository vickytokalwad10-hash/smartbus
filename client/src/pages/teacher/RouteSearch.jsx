import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TeacherNavbar from '../../components/TeacherNavbar';
import SeatOccupancyBar from '../../components/SeatOccupancyBar';
import { supabase } from '../../utils/supabaseClient';

const RouteSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRoutes(initialQuery);
  }, [initialQuery]);

  const fetchRoutes = async (q) => {
    setLoading(true);
    try {
      let req = supabase.from('routes').select('*');
      if (q) {
        req = req.or(`route_number.ilike.%${q}%,name.ilike.%${q}%`);
      }
      const { data, error } = await req;
      if (error) throw error;
      
      // Also fetch stops to search if needed, but ilike covers basics
      setRoutes(data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRoutes(query);
  };

  const filteredRoutes = routes.filter(r => {
    if (filter === 'electric') return r.route_number?.includes('EV') || r.name?.toLowerCase().includes('electric') || r.name?.toLowerCase().includes('eco');
    if (filter === 'express') return r.name?.toLowerCase().includes('express') || r.frequency?.includes('10');
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TeacherNavbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface">
              {initialQuery ? `Search Results for "${initialQuery}"` : 'JD College Bus Routes'}
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Showing {filteredRoutes.length} active campus routes
            </p>
          </div>

          {/* Inline Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md w-full">
            <input
              type="text"
              placeholder="Search by route number, stop, or station..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 border-b border-outline-variant/30 pb-4">
          {[
            { id: 'all', label: 'All Campus Routes' },
            { id: 'electric', label: '⚡ EV Fleet' },
            { id: 'express', label: '🚀 Campus Express' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-on-surface-variant font-semibold">Searching routes...</p>
          </div>
        ) : filteredRoutes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map(route => (
              <div key={route.id} className="card p-6 border-l-4 border-primary hover:shadow-overlay transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-primary text-on-primary font-black rounded-lg text-lg">
                      Route {route.route_number}
                    </span>
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                      ₹{route.base_fare || 20} Base Fare
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-on-surface mb-1 truncate">{route.name}</h3>
                  <p className="text-xs text-on-surface-variant mb-4">
                    Operating: {route.start_time || '06:00'} - {route.end_time || '22:00'} · Frequency: {route.frequency || 'Every 15 mins'}
                  </p>

                  {/* Stops list */}
                  <div className="space-y-1 bg-surface-container-low p-3 rounded-lg text-xs">
                    <p className="font-bold text-on-surface mb-1">Key Stops ({route.stops?.length || 0}):</p>
                    <p className="text-on-surface-variant truncate">
                      {route.stops?.map(s => s.name).join(' → ') || 'Sitabuldi → JD College'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                  <SeatOccupancyBar current={Math.floor(Math.random() * 30) + 15} capacity={50} />

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/track?route=${route.id}`)}
                      className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">map</span> Track Live
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/buy-pass?route=${route.id}`)}
                      className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">confirmation_number</span> Faculty Pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center card p-10 max-w-md mx-auto space-y-4">
            <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
            <h3 className="text-lg font-bold">No Routes Found</h3>
            <p className="text-xs text-on-surface-variant">We couldn't find any route matching "{query}".</p>
            <button onClick={() => { setQuery(''); fetchRoutes(''); }} className="btn-secondary text-xs">
              View All Campus Routes
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RouteSearch;
