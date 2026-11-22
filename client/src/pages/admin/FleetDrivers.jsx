import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import SeatOccupancyBar from '../../components/SeatOccupancyBar';
import { supabase } from '../../utils/supabaseClient';
import api from '../../utils/api';

const FleetDrivers = () => {
  const [tab, setTab] = useState('buses'); // 'buses' | 'drivers'
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showBusModal, setShowBusModal] = useState(false);
  const [busForm, setBusForm] = useState({ busNumber: '', registrationPlate: '', capacity: 50, type: 'Diesel', route: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let bList = [], dList = [], rList = [];

      // 1. Try local MongoDB API
      try {
        const [bRes, dRes, rRes] = await Promise.all([
          api.get('/buses'),
          api.get('/users?role=driver'),
          api.get('/routes')
        ]);
        if (bRes.data) bList = bRes.data;
        if (dRes.data) dList = dRes.data;
        if (rRes.data) rList = rRes.data;
      } catch (apiErr) {
        console.warn('API fleet/drivers fallback:', apiErr.message);
      }

      // 2. Try Supabase fallback
      if (bList.length === 0 || dList.length === 0) {
        try {
          const [bRes, dRes, rRes] = await Promise.all([
            supabase.from('buses').select('*, route:routes(*)'),
            supabase.from('profiles').select('*').eq('role', 'driver'),
            supabase.from('routes').select('*')
          ]);
          if (bList.length === 0 && bRes.data) bList = bRes.data;
          if (dList.length === 0 && dRes.data) dList = dRes.data;
          if (rList.length === 0 && rRes.data) rList = rRes.data;
        } catch (sbErr) {}
      }

      setBuses(bList);
      setDrivers(dList);
      setRoutes(rList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      // 1. Try local MongoDB API
      try {
        await api.post('/buses', {
          busNumber: busForm.busNumber,
          registrationPlate: busForm.registrationPlate || busForm.busNumber,
          capacity: Number(busForm.capacity),
          type: busForm.type,
          route: busForm.route || null
        });
        setShowBusModal(false);
        setBusForm({ busNumber: '', registrationPlate: '', capacity: 50, type: 'Diesel', route: '' });
        fetchData();
        return;
      } catch (apiErr) {
        console.warn('API create bus fallback:', apiErr.message);
      }

      await supabase.from('buses').insert([{
        bus_number: busForm.busNumber,
        registration_plate: busForm.registrationPlate || busForm.busNumber,
        capacity: busForm.capacity,
        type: busForm.type,
        route_id: busForm.route || null,
        status: 'active',
        current_occupancy: 0
      }]);
      setShowBusModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <h1 className="text-base sm:text-xl font-bold text-on-surface">Fleet & Drivers</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowBusModal(true)} className="btn-primary text-xs py-2 px-3 sm:px-4">
              + Add Bus
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Sub Navigation */}
          <div className="flex border-b border-outline-variant/30 gap-6">
            <button
              onClick={() => setTab('buses')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                tab === 'buses' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            >
              Bus Fleet ({buses.length})
            </button>
            <button
              onClick={() => setTab('drivers')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                tab === 'drivers' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            >
              Registered Drivers ({drivers.length})
            </button>
          </div>

          {/* BUSES TAB */}
          {tab === 'buses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buses.map(bus => (
                <div key={bus._id || bus.id} className="card p-5 space-y-4 border-l-4 border-primary">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-1 bg-surface-container font-black text-xs rounded text-primary">
                        {bus.bus_number || bus.busNumber}
                      </span>
                      <p className="text-xs text-on-surface-variant mt-1">Plate: {bus.registration_plate || bus.registrationPlate || 'N/A'}</p>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      bus.type === 'Electric' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                    }`}>
                      {bus.type}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-on-surface-variant">Assigned Route:</p>
                    <p className="text-sm font-bold text-on-surface">{bus.route?.name || 'Unassigned'}</p>
                  </div>

                  <SeatOccupancyBar current={bus.current_occupancy || bus.currentOccupancy || 0} capacity={bus.capacity || 50} />

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-outline-variant/30">
                    <span className="text-on-surface-variant">Status: <strong className="text-secondary capitalize">{bus.status}</strong></span>
                    <span className="text-on-surface-variant">Cap: {bus.capacity} seats</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DRIVERS TAB */}
          {tab === 'drivers' && (
            <div className="card overflow-hidden">
              <div className="p-4 bg-surface-container-low font-bold text-sm">Active Driver Directory</div>
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map(d => (
                      <tr key={d._id || d.id}>
                        <td className="font-bold">{d.name}</td>
                        <td className="font-mono text-xs text-primary">{d.employee_id || d.employeeId || 'DRV-001'}</td>
                        <td>{d.email}</td>
                        <td>{d.phone || '9876543210'}</td>
                        <td>
                          <span className="px-2.5 py-1 bg-secondary/10 text-secondary font-bold text-xs rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Bus Modal */}
      {showBusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold">Add Bus to Fleet</h2>
            <form onSubmit={handleCreateBus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Bus Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH-01-AB-4201"
                  value={busForm.busNumber}
                  onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Vehicle Type</label>
                <select
                  value={busForm.type}
                  onChange={(e) => setBusForm({ ...busForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="Electric">⚡ Electric</option>
                  <option value="Diesel">⛽ Diesel</option>
                  <option value="Hybrid">🌱 Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Seating Capacity</label>
                <input
                  type="number"
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({ ...busForm, capacity: Number(e.target.value) })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Assign to Route</label>
                <select
                  value={busForm.route}
                  onChange={(e) => setBusForm({ ...busForm, route: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r._id || r.id} value={r._id || r.id}>Route {r.routeNumber || r.route_number} — {r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBusModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Add Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetDrivers;
