import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import QRCodeCard from '../../components/QRCodeCard';
import PassStatusChip from '../../components/PassStatusChip';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function PassDetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-outline-variant last:border-0">
      <span className="material-symbols-outlined text-primary text-xl mt-0.5">{icon}</span>
      <div>
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="text-body-md font-medium text-on-surface">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function StudentPass() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [passes, setPasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPasses = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.from('passes').select('*, route:routes(*)').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        const list = Array.isArray(data) ? data : [data];
        setPasses(list);
        // Auto-select the first active pass, else the first pass
        const active = list.find((p) => p.status === 'active') || list[0] || null;
        setSelectedPass(active);
      } catch (err) {
        setError('Failed to load passes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPasses();
  }, [user]);

  const isActive = selectedPass?.status === 'active';
  const routeName =
    selectedPass?.route?.name || selectedPass?.routeName || 'Route 42 – City Center Express';
  const boarding = selectedPass?.boarding_point || 'Main Gate';
  const destination = selectedPass?.destination_stop || 'City Center';
  const duration = selectedPass?.duration || 'Monthly';
  const validFrom = formatDate(selectedPass?.created_at);
  const validUntil = formatDate(selectedPass?.valid_until);
  const amountPaid = selectedPass?.amount ?? 500;

  return (
    <div className="flex bg-background min-h-screen">
      <StudentSidebar />
      <main className="w-full md:ml-[260px] lg:ml-[280px] min-h-screen p-4 sm:p-6 md:p-10 pt-20 md:pt-10 pb-24 md:pb-10 bg-surface-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">My Digital Pass</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Show this QR code to board your bus.
            </p>
          </div>
          <button
            onClick={() => navigate('/student/renew')}
            className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_card</span>
            Apply / Renew
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-60">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">
              progress_activity
            </span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && passes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 rounded-full bg-primary-container flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-6xl">
                card_membership
              </span>
            </div>
            <h3 className="text-headline-sm font-semibold text-on-surface mb-2">
              No Passes Found
            </h3>
            <p className="text-body-lg text-on-surface-variant text-center max-w-sm mb-6">
              You don't have any bus passes yet. Apply for your first pass to start riding!
            </p>
            <button
              onClick={() => navigate('/student/renew')}
              className="btn-primary flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_card</span>
              Apply for a Pass
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && passes.length > 0 && (
          <div className="grid grid-cols-12 gap-6">
            {/* QR Card + Details */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              {/* QRCodeCard */}
              <QRCodeCard pass={selectedPass} />

              {/* Pass Details */}
              <div className="card">
                <h3 className="text-title-md font-semibold text-on-surface mb-2">Pass Details</h3>
                <PassDetailRow icon="route" label="Route" value={routeName} />
                <PassDetailRow icon="location_on" label="Boarding Point" value={boarding} />
                <PassDetailRow icon="flag" label="Destination Stop" value={destination} />
                <PassDetailRow icon="timer" label="Duration" value={duration} />
                <PassDetailRow icon="calendar_today" label="Valid From" value={validFrom} />
                <PassDetailRow icon="event" label="Valid Until" value={validUntil} />
                <PassDetailRow
                  icon="currency_rupee"
                  label="Amount Paid"
                  value={`₹${amountPaid}`}
                />
              </div>
            </div>

            {/* All Passes List */}
            <div className="col-span-12 lg:col-span-7">
              <div className="card">
                <h3 className="text-title-lg font-semibold text-on-surface mb-4">All Passes</h3>
                <div className="flex flex-col gap-3">
                  {passes.map((p, i) => {
                    const isSelected = selectedPass?.id
                      ? selectedPass.id === p.id
                      : selectedPass?.pass_id === p.pass_id || i === 0;
                    const pRoute = p.route?.name || p.routeName || 'Route';
                    const pValidity = formatDate(p.valid_until);
                    return (
                      <button
                        key={p.id || p.pass_id || i}
                        onClick={() => setSelectedPass(p)}
                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-container/30 shadow'
                            : 'border-outline-variant hover:border-primary hover:bg-surface-container-low'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-primary' : 'bg-surface-container'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-xl ${
                              isSelected ? 'text-on-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            qr_code
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-label-md font-semibold text-on-surface truncate">
                              {p.pass_id || p.id || `Pass #${i + 1}`}
                            </span>
                            <PassStatusChip status={p.status} />
                          </div>
                          <p className="text-body-sm text-on-surface-variant truncate">{pRoute}</p>
                          <p className="text-body-sm text-on-surface-variant">
                            Valid until {pValidity}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pass usage info */}
                {selectedPass && (
                  <div className="mt-5 pt-4 border-t border-outline-variant">
                    <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-base text-secondary">
                        info
                      </span>
                      <span>
                        Present this QR code at the bus entry scanner. Keep it bright and
                        unobstructed.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Download / Share actions */}
              {selectedPass && isActive && (
                <div className="card mt-6">
                  <h3 className="text-title-md font-semibold text-on-surface mb-4">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-all text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-base">download</span>
                      Download PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-all text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-base">share</span>
                      Share Pass
                    </button>
                    <button
                      onClick={() => navigate('/student/renew')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-container text-primary hover:bg-primary hover:text-on-primary transition-all text-label-md font-medium"
                    >
                      <span className="material-symbols-outlined text-base">autorenew</span>
                      Renew Pass
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
