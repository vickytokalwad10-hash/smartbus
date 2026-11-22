import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const DURATION_OPTIONS = [
  { id: 'weekly', label: 'Weekly', price: 150, icon: 'calendar_view_week', days: 7, taps: 14 },
  { id: 'monthly', label: 'Monthly', price: 500, icon: 'calendar_month', days: 30, taps: 60 },
  { id: 'semester', label: 'Semester', price: 1200, icon: 'school', days: 120, taps: 240 },
  { id: 'annual', label: 'Annual', price: 2000, icon: 'event_available', days: 365, taps: 730 },
];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: 'smartphone' },
  { id: 'card', label: 'Debit / Credit Card', icon: 'credit_card' },
  { id: 'wallet', label: 'SmartBus Wallet', icon: 'account_balance_wallet' },
];

const CONCESSION_RATE = 0.5; // 50%

export default function StudentRenew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [routes, setRoutes] = useState([]);
  const [routeLoading, setRouteLoading] = useState(true);

  const [selectedRoute, setSelectedRoute] = useState('');
  const [boardingPoint, setBoardingPoint] = useState('');
  const [destinationStop, setDestinationStop] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [idFile, setIdFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Pass Rollover
  const [rolloverDays, setRolloverDays] = useState(0);
  const [rolloverTaps, setRolloverTaps] = useState(0);
  const [linkedPreviousPassId, setLinkedPreviousPassId] = useState(null);

  const currentDuration = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
  const basePrice = currentDuration?.price || 500;
  const discount = Math.round(basePrice * CONCESSION_RATE);
  const finalAmount = basePrice - discount;

  const routeStops = routes.find((r) => (r._id || r.id) === selectedRoute)?.stops || [];

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        // 1. Try MongoDB API
        try {
          const res = await api.get('/routes');
          if (res.data && res.data.length > 0) {
            setRoutes(res.data);
            if (!selectedRoute) setSelectedRoute(res.data[0]._id || res.data[0].id);
            setRouteLoading(false);
            return;
          }
        } catch (apiErr) {
          console.warn('API routes fetch fallback:', apiErr.message);
        }

        const { data, error } = await supabase.from('routes').select('*');
        if (error) throw error;
        setRoutes(data || []);
        if (data?.length > 0 && !selectedRoute) setSelectedRoute(data[0].id);
      } catch {
        setRoutes([]);
      } finally {
        setRouteLoading(false);
      }
    };
    fetchRoutes();
  }, []);
  
  // Check for tap rollover from previous pass tenure
  useEffect(() => {
    const checkRollover = async () => {
      if (!user) return;
      try {
        // 1. Try MongoDB API preview
        try {
          const res = await api.get('/passes/rollover-preview');
          if (res.data) {
            const elig = res.data.eligibleTaps || 0;
            setRolloverTaps(elig);
            setLinkedPreviousPassId(res.data.previousPass?.passId || null);
            if (elig > 0) return;
          }
        } catch (apiErr) {
          console.warn('API rollover check failed:', apiErr.message);
        }

        // 2. Fallback Supabase check
        const { data } = await supabase
          .from('passes')
          .select('id, valid_until, rollover_days_out, rollover_claimed')
          .eq('user_id', user.id)
          .order('valid_until', { ascending: false })
          .limit(1)
          .single();
          
        if (data) {
          const endDate = new Date(data.valid_until);
          const now = new Date();
          let rDays = 0;
          if (endDate > now) {
            rDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          } else if (data.rollover_days_out > 0 && !data.rollover_claimed) {
            rDays = data.rollover_days_out;
          }
          if (selectedDuration === 'weekly') rDays = Math.min(rDays, 7);
          else if (selectedDuration === 'monthly') rDays = Math.min(rDays, 15);
          else rDays = 0;
          
          if (rDays > 0) {
            setRolloverDays(rDays);
            setRolloverTaps(rDays * 2);
            setLinkedPreviousPassId(data.id);
          } else {
            setRolloverDays(0);
            setRolloverTaps(0);
            setLinkedPreviousPassId(null);
          }
        }
      } catch (err) {
        setRolloverDays(0);
        setRolloverTaps(0);
        setLinkedPreviousPassId(null);
      }
    };
    checkRollover();
  }, [user, selectedDuration]);

  const validate = () => {
    const errs = {};
    if (!selectedRoute) errs.route = 'Please select a route.';
    if (!boardingPoint.trim()) errs.boardingPoint = 'Boarding point is required.';
    if (!destinationStop.trim()) errs.destinationStop = 'Destination stop is required.';
    if (!idFile) errs.idFile = 'Student ID card is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      if (!user) throw new Error("Must be logged in");
      
      // 1. Try local MongoDB Express API
      try {
        const res = await api.post('/passes', {
          routeId: selectedRoute,
          boardingPoint,
          destinationStop,
          duration: selectedDuration,
          paymentMethod: paymentMethod.toUpperCase()
        });
        if (res.data) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/student/pass');
          }, 2000);
          return;
        }
      } catch (apiErr) {
        console.warn('API pass create failed, trying Supabase fallback:', apiErr.message);
      }

      // 2. Supabase fallback
      const passId = 'SB-STUDENT-' + Math.floor(Math.random() * 1000000);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (currentDuration?.days || 30) + rolloverDays);

      const formData = {
        pass_id: passId,
        user_id: user.id,
        route_id: selectedRoute,
        boarding_point: boardingPoint,
        destination_stop: destinationStop,
        duration: selectedDuration,
        pass_type: 'student',
        status: 'active',
        valid_until: validUntil.toISOString(),
        amount: finalAmount,
        qr_data: `PASS:${passId}:USR:${user.id}:RT:${selectedRoute}`,
        rollover_days_in: rolloverDays,
        linked_previous_pass_id: linkedPreviousPassId
      };
      
      const { error: passError } = await supabase.from('passes').insert([formData]);
      if (passError) throw passError;
      
      if (linkedPreviousPassId && rolloverDays > 0) {
        await supabase.from('passes').update({ rollover_claimed: true }).eq('id', linkedPreviousPassId);
      }
      
      await supabase.from('payments').insert([{
        user_id: user.id,
        amount: finalAmount,
        method: paymentMethod,
        status: 'completed',
        description: `Purchased ${selectedDuration} student pass`
      }]);

      setSuccess(true);
      setTimeout(() => {
        navigate('/student/pass');
      }, 2000);
    } catch (err) {
      setErrors({ api: err.message || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setIdFile(file);
  };

  if (success) {
    return (
      <div className="flex bg-background min-h-screen">
        <StudentSidebar />
        <main className="w-full md:ml-[260px] lg:ml-[280px] min-h-screen p-4 sm:p-6 md:p-10 pt-20 md:pt-10 pb-24 md:pb-10 bg-surface-container flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="material-symbols-outlined text-secondary text-5xl">
                check_circle
              </span>
            </div>
            <h2 className="text-headline-md font-black text-on-surface mb-2">
              Pass Created Successfully!
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Your digital pass is ready. Redirecting to your passes...
            </p>
            <button
              onClick={() => navigate('/student/pass')}
              className="btn-primary"
            >
              View My Pass Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-background min-h-screen">
      <StudentSidebar />
      <main className="w-full md:ml-[260px] lg:ml-[280px] min-h-screen p-4 sm:p-6 md:p-10 pt-20 md:pt-10 pb-24 md:pb-10 bg-surface-container">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-primary">Apply / Renew Pass</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Fill in the details below to get your JD College bus pass.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Form Fields */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              {/* API Error */}
              {errors.api && (
                <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center gap-3">
                  <span className="material-symbols-outlined">error</span>
                  <span>{errors.api}</span>
                </div>
              )}

              {/* Route & Stops */}
              <div className="card">
                <h3 className="text-title-md font-semibold text-on-surface mb-4">
                  Route Information
                </h3>

                {/* Route Dropdown */}
                <div className="mb-4">
                  <label className="text-label-md font-medium text-on-surface mb-1.5 block">
                    Route <span className="text-error">*</span>
                  </label>
                  {routeLoading ? (
                    <div className="input-field flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-base">
                        progress_activity
                      </span>
                      Loading routes…
                    </div>
                  ) : (
                    <select
                      value={selectedRoute}
                      onChange={(e) => {
                        setSelectedRoute(e.target.value);
                        setErrors((prev) => ({ ...prev, route: '' }));
                      }}
                      className={`input-field w-full ${errors.route ? 'border-error' : ''}`}
                    >
                      <option value="">— Select a route —</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.route_number}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.route && (
                    <p className="text-label-sm text-error mt-1">{errors.route}</p>
                  )}
                </div>

                {/* Boarding Point */}
                <div className="mb-4">
                  <label className="text-label-md font-medium text-on-surface mb-1.5 block">
                    Boarding Point <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={boardingPoint}
                    onChange={(e) => {
                      setBoardingPoint(e.target.value);
                      setErrors((prev) => ({ ...prev, boardingPoint: '' }));
                    }}
                    placeholder="e.g. Main Gate, Hostel Block A"
                    className={`input-field w-full ${errors.boardingPoint ? 'border-error' : ''}`}
                    list={routeStops.length > 0 ? 'boarding-stops' : undefined}
                  />
                  {routeStops.length > 0 && (
                    <datalist id="boarding-stops">
                      {routeStops.map((s, i) => (
                        <option key={i} value={s.name || s} />
                      ))}
                    </datalist>
                  )}
                  {errors.boardingPoint && (
                    <p className="text-label-sm text-error mt-1">{errors.boardingPoint}</p>
                  )}
                </div>

                {/* Destination Stop */}
                <div>
                  <label className="text-label-md font-medium text-on-surface mb-1.5 block">
                    Destination Stop <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={destinationStop}
                    onChange={(e) => {
                      setDestinationStop(e.target.value);
                      setErrors((prev) => ({ ...prev, destinationStop: '' }));
                    }}
                    placeholder="e.g. City Center, Railway Station"
                    className={`input-field w-full ${
                      errors.destinationStop ? 'border-error' : ''
                    }`}
                    list={routeStops.length > 0 ? 'destination-stops' : undefined}
                  />
                  {routeStops.length > 0 && (
                    <datalist id="destination-stops">
                      {routeStops.map((s, i) => (
                        <option key={i} value={s.name || s} />
                      ))}
                    </datalist>
                  )}
                  {errors.destinationStop && (
                    <p className="text-label-sm text-error mt-1">{errors.destinationStop}</p>
                  )}
                </div>
              </div>

              {/* Duration Selector */}
              <div className="card">
                <h3 className="text-title-md font-semibold text-on-surface mb-4">
                  Pass Duration
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DURATION_OPTIONS.map((opt) => {
                    const selected = selectedDuration === opt.id;
                    const discounted = Math.round(opt.price * (1 - CONCESSION_RATE));
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedDuration(opt.id)}
                        className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                          selected
                            ? 'border-primary bg-primary-container/30 shadow'
                            : 'border-outline-variant hover:border-primary hover:bg-surface-container-low'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-3xl mb-2 ${
                            selected ? 'text-primary' : 'text-on-surface-variant'
                          }`}
                        >
                          {opt.icon}
                        </span>
                        <span
                          className={`text-label-md font-semibold ${
                            selected ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-body-sm text-on-surface-variant line-through mt-0.5">
                          ₹{opt.price}
                        </span>
                        <span className="text-label-md font-bold text-secondary">
                          ₹{discounted}
                        </span>
                        {selected && (
                          <span className="mt-1 text-label-sm bg-primary text-on-primary px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Concession notice */}
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary-container/40 border border-secondary">
                  <span className="material-symbols-outlined text-secondary text-xl">school</span>
                  <span className="text-body-sm text-secondary font-medium">
                    Student concession applied: <strong>50% off!</strong> You save{' '}
                    <strong>₹{discount}</strong> on this pass.
                  </span>
                </div>
              </div>

              {/* Student ID Upload */}
              <div className="card">
                <h3 className="text-title-md font-semibold text-on-surface mb-4">
                  Student Verification
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-3">
                  Upload a clear photo of your current student ID card for verification.
                </p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center cursor-pointer transition-all ${
                    idFile
                      ? 'border-secondary bg-secondary-container/20'
                      : errors.idFile
                      ? 'border-error bg-error-container/20'
                      : 'border-outline-variant hover:border-primary hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-5xl mb-2 ${
                      idFile ? 'text-secondary' : 'text-on-surface-variant'
                    }`}
                  >
                    {idFile ? 'check_circle' : 'upload_file'}
                  </span>
                  <p className="text-label-md font-medium text-on-surface">
                    {idFile ? idFile.name : 'Click to upload Student ID'}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {idFile
                      ? `${(idFile.size / 1024).toFixed(1)} KB — Tap to replace`
                      : 'PNG, JPG, PDF up to 5 MB'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {errors.idFile && (
                  <p className="text-label-sm text-error mt-1">{errors.idFile}</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="card">
                <h3 className="text-title-md font-semibold text-on-surface mb-4">
                  Payment Method
                </h3>
                <div className="flex flex-col gap-3">
                  {PAYMENT_METHODS.map((pm) => (
                    <label
                      key={pm.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === pm.id
                          ? 'border-primary bg-primary-container/20'
                          : 'border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="accent-primary w-4 h-4"
                      />
                      <span
                        className={`material-symbols-outlined ${
                          paymentMethod === pm.id ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {pm.icon}
                      </span>
                      <span className="text-label-lg font-medium text-on-surface">{pm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Fee Summary */}
            <div className="col-span-12 lg:col-span-4">
              <div className="card sticky top-6">
                <h3 className="text-title-md font-semibold text-on-surface mb-5">Fee Summary</h3>

                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex justify-between text-body-md text-on-surface">
                    <span>Base Price ({currentDuration?.label})</span>
                    <span>₹{basePrice}</span>
                  </div>
                  <div className="flex justify-between text-body-md text-secondary font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">school</span>
                      Student Concession (50%)
                    </span>
                    <span>- ₹{discount}</span>
                  </div>
                  <div className="flex justify-between text-body-md text-on-surface">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">contactless</span>
                      Tap Allotment
                    </span>
                    <span className="font-bold text-primary">
                      {currentDuration?.taps || 60} {rolloverTaps > 0 ? `+ ${rolloverTaps} rollover` : ''} = {(currentDuration?.taps || 60) + (rolloverTaps || 0)} Taps
                    </span>
                  </div>
                  <div className="border-t border-outline-variant pt-3 flex justify-between text-title-md font-bold text-on-surface">
                    <span>Final Amount</span>
                    <span className="text-primary">₹{finalAmount}</span>
                  </div>
                </div>

                {/* Savings callout */}
                <div className="px-3 py-2 rounded-lg bg-secondary-container text-secondary text-label-md font-medium text-center mb-5">
                  🎓 You save ₹{discount} with student concession!
                </div>

                {/* Summary bullets */}
                <div className="flex flex-col gap-2 text-body-sm text-on-surface-variant mb-6">
                  {rolloverTaps > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs">
                      <span className="material-symbols-outlined text-base text-emerald-600">autorenew</span>
                      <span>+{rolloverTaps} Unused Taps Rollover carried forward from your previous tenure!</span>
                    </div>
                  )}
                  {rolloverDays > 0 && !rolloverTaps && (
                    <div className="flex items-center gap-2 text-secondary font-bold">
                      <span className="material-symbols-outlined text-base">redeem</span>
                      <span>+{rolloverDays} Rollover Days Applied from previous pass!</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">
                      check_circle
                    </span>
                    <span>Digital QR pass, no physical card needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">
                      check_circle
                    </span>
                    <span>Instant activation on payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">
                      check_circle
                    </span>
                    <span>Renew anytime from the app</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">
                        progress_activity
                      </span>
                      Processing…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">payment</span>
                      Apply &amp; Pay ₹{finalAmount}
                    </>
                  )}
                </button>
                <p className="text-label-sm text-on-surface-variant text-center mt-3">
                  🔒 Secured by SmartBus Payment Gateway
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
