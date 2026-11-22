import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { supabase } from '../../utils/supabaseClient';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const [form, setForm] = useState({
    routeNumber: '',
    name: '',
    frequency: 'Every 15 mins',
    startTime: '06:00',
    endTime: '22:00',
    baseFare: 20,
    stops: [
      { name: 'Central Station', order: 1, lat: 19.0760, lng: 72.8777 },
      { name: 'Terminal', order: 2, lat: 19.0900, lng: 72.8900 }
    ]
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: true });
      if (error) console.error(error);
      setRoutes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setForm({
      routeNumber: '',
      name: '',
      frequency: 'Every 15 mins',
      startTime: '06:00',
      endTime: '22:00',
      baseFare: 20,
      stops: [
        { name: 'Central Station', order: 1, lat: 19.0760, lng: 72.8777 },
        { name: 'Terminal', order: 2, lat: 19.0900, lng: 72.8900 }
      ]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (route) => {
    setEditingRoute(route);
    setForm({
      routeNumber: route.route_number || route.routeNumber || '',
      name: route.name,
      frequency: route.frequency || 'Every 15 mins',
      startTime: route.start_time || route.startTime || '06:00',
      endTime: route.end_time || route.endTime || '22:00',
      baseFare: route.base_fare || route.baseFare || 20,
      stops: route.stops?.length > 0 ? route.stops : [
        { name: 'Central Station', order: 1, lat: 19.0760, lng: 72.8777 }
      ]
    });
    setShowModal(true);
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        route_number: form.routeNumber,
        name: form.name,
        frequency: form.frequency,
        start_time: form.startTime,
        end_time: form.endTime,
        base_fare: form.baseFare,
        stops: form.stops
      };
      if (editingRoute) {
        await supabase.from('routes').update(payload).eq('id', editingRoute.id);
      } else {
        await supabase.from('routes').insert([payload]);
      }
      setShowModal(false);
      fetchRoutes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await supabase.from('routes').delete().eq('id', id);
      fetchRoutes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStop = () => {
    setForm(prev => ({
      ...prev,
      stops: [...prev.stops, { name: '', order: prev.stops.length + 1, lat: 19.0800, lng: 72.8800 }]
    }));
  };

  const handleStopChange = (index, field, value) => {
    setForm(prev => {
      const newStops = [...prev.stops];
      newStops[index][field] = value;
      return { ...prev, stops: newStops };
    });
  };

  const handleRemoveStop = (index) => {
    setForm(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <h1 className="text-base sm:text-xl font-bold text-on-surface">Route Management</h1>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 sm:px-4">
            <span className="material-symbols-outlined text-sm">add</span> New Route
          </button>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          <div className="card overflow-hidden">
            <div className="p-4 bg-surface-container-low font-bold text-sm flex justify-between items-center">
              <span>Active Transit Routes ({routes.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Route #</th>
                    <th>Route Name</th>
                    <th>Stops Count</th>
                    <th>Frequency</th>
                    <th>Operating Hours</th>
                    <th>Base Fare</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(r => (
                    <tr key={r.id}>
                      <td className="font-black text-primary">Route {r.route_number || r.routeNumber}</td>
                      <td className="font-bold">{r.name}</td>
                      <td>{r.stops?.length || 0} stops</td>
                      <td>{r.frequency || 'Every 15 mins'}</td>
                      <td>{r.start_time || r.startTime || '06:00'} - {r.end_time || r.endTime || '22:00'}</td>
                      <td className="font-bold text-secondary">₹{r.base_fare || r.baseFare || 20}</td>
                      <td className="space-x-2">
                        <button onClick={() => handleOpenEdit(r)} className="px-3 py-1 bg-primary/10 text-primary rounded font-bold text-xs hover:bg-primary/20">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteRoute(r.id)} className="px-3 py-1 bg-error/10 text-error rounded font-bold text-xs hover:bg-error/20">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add / Edit Route Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{editingRoute ? 'Edit Route' : 'Create New Route'}</h2>

            <form onSubmit={handleSaveRoute} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Route Number</label>
                  <input
                    type="text"
                    value={form.routeNumber}
                    onChange={(e) => setForm({ ...form, routeNumber: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 42A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Base Fare (₹)</label>
                  <input
                    type="number"
                    value={form.baseFare}
                    onChange={(e) => setForm({ ...form, baseFare: Number(e.target.value) })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Route Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. University Express"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Frequency</label>
                  <input
                    type="text"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="input-field"
                    placeholder="Every 15 mins"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="input-field"
                    placeholder="06:00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">End Time</label>
                  <input
                    type="text"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="input-field"
                    placeholder="22:00"
                  />
                </div>
              </div>

              {/* Stops Section */}
              <div className="space-y-3 pt-2 border-t border-outline-variant/30">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-on-surface-variant">Stops Sequence</label>
                  <button type="button" onClick={handleAddStop} className="text-xs font-bold text-primary hover:underline">
                    + Add Stop
                  </button>
                </div>

                {form.stops.map((stop, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-on-surface-variant w-6">#{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Stop Name"
                      value={stop.name}
                      onChange={(e) => handleStopChange(idx, 'name', e.target.value)}
                      className="input-field flex-1"
                      required
                    />
                    <button type="button" onClick={() => handleRemoveStop(idx)} className="text-error font-bold text-xs p-2">
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
