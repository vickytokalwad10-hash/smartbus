import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import QRCodeCard from '../../components/QRCodeCard';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const BuyPass = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedRoute = searchParams.get('route') || '';

  const [step, setStep] = useState(1);
  const [routes, setRoutes] = useState([]);
  const [duration, setDuration] = useState('monthly');
  const [selectedRoute, setSelectedRoute] = useState(preselectedRoute);
  const [boardingPoint, setBoardingPoint] = useState('');
  const [destinationStop, setDestinationStop] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPass, setCreatedPass] = useState(null);

  useEffect(() => {
    supabase.from('routes').select('*').then(({ data, error }) => {
      if (error) {
        console.error(error);
        return;
      }
      setRoutes(data || []);
      if (data?.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0].id);
      }
    });
  }, []);

  const plans = [
    { id: 'daily', label: 'Daily Pass', price: 30, days: 1, desc: 'Unlimited rides on selected route for 24 hours' },
    { id: 'weekly', label: 'Weekly Pass', price: 150, days: 7, desc: 'Great for short projects or weekly commutes' },
    { id: 'monthly', label: 'Monthly Pass', price: 500, days: 30, desc: 'Best value for daily commuters. Save up to 40%', popular: true },
    { id: 'annual', label: 'Annual Pass', price: 2000, days: 365, desc: '365 days of hassle-free travel across the city' },
  ];

  const currentPlan = plans.find(p => p.id === duration) || plans[2];
  const activeRouteObj = routes.find(r => r.id === selectedRoute);

  const handleNextStep = () => {
    if (step === 2 && (!selectedRoute || !boardingPoint.trim() || !destinationStop.trim())) {
      setError('Please fill in boarding point and destination stop.');
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!user) throw new Error("Must be logged in");

      const passId = 'SB-PASS-' + Math.floor(Math.random() * 1000000);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + currentPlan.days);
      
      const payload = {
        pass_id: passId,
        user_id: user.id,
        route_id: selectedRoute,
        boarding_point: boardingPoint || 'Central Station',
        destination_stop: destinationStop || 'Terminal',
        duration,
        pass_type: 'general',
        status: 'active',
        valid_until: validUntil.toISOString(),
        amount: currentPlan.price,
        qr_data: `PASS:${passId}:USR:${user.id}:RT:${selectedRoute}`
      };
      
      const { data: passData, error: passError } = await supabase.from('passes').insert([payload]).select('*, route:routes(*)').single();
      if (passError) throw passError;
      
      // Also record payment
      await supabase.from('payments').insert([{
        user_id: user.id,
        amount: currentPlan.price,
        method: paymentMethod,
        status: 'completed',
        description: `Purchased ${duration} pass for Route ${activeRouteObj?.route_number || 'All'}`
      }]);

      setCreatedPass(passData);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomerNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          {[
            { num: 1, label: 'Select Plan' },
            { num: 2, label: 'Route Details' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'Confirmation' },
          ].map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= s.num ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                {s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step >= s.num ? 'text-primary' : 'text-on-surface-variant'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-error-container text-error rounded-xl text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined">error</span> {error}
          </div>
        )}

        {/* STEP 1: Select Plan */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black">Choose a Pass Plan</h1>
              <p className="text-xs text-on-surface-variant">Select the duration that best fits your travel needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map(p => (
                <div
                  key={p.id}
                  onClick={() => setDuration(p.id)}
                  className={`card p-6 cursor-pointer border-2 transition-all relative ${
                    duration === p.id ? 'border-primary bg-primary/5 shadow-overlay' : 'border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute top-4 right-4 bg-primary text-on-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-bold text-lg">{p.label}</h3>
                  <div className="my-3">
                    <span className="text-3xl font-black text-primary">₹{p.price}</span>
                    <span className="text-xs text-on-surface-variant"> / {p.days} {p.days === 1 ? 'day' : 'days'}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                Continue to Route Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Route Details */}
        {step === 2 && (
          <div className="space-y-6 card p-8">
            <div>
              <h1 className="text-2xl font-black">Route & Station Selection</h1>
              <p className="text-xs text-on-surface-variant">Specify your boarding point and destination stop</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-on-surface-variant">Select Route</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="input-field"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>Route {r.route_number} — {r.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-on-surface-variant">Boarding Stop</label>
                  <input
                    type="text"
                    placeholder="e.g. Central Station"
                    value={boardingPoint}
                    onChange={(e) => setBoardingPoint(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-on-surface-variant">Destination Stop</label>
                  <input
                    type="text"
                    placeholder="e.g. City Terminal"
                    value={destinationStop}
                    onChange={(e) => setDestinationStop(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Fare Summary Box */}
              <div className="p-4 bg-surface-container-low rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Selected Plan:</span>
                  <span className="font-bold">{currentPlan.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Selected Route:</span>
                  <span className="font-bold">Route {activeRouteObj?.route_number || 'All'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-outline-variant/30 text-sm font-black">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{currentPlan.price}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button onClick={handleNextStep} className="btn-primary flex items-center gap-2">
                Proceed to Payment <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 3 && (
          <div className="space-y-6 card p-8">
            <div>
              <h1 className="text-2xl font-black">Payment Checkout</h1>
              <p className="text-xs text-on-surface-variant">Simulated payment process (no real money charged)</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant">Select Payment Option</label>
                {['UPI', 'Card', 'Wallet'].map(m => (
                  <label key={m} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${
                    paymentMethod === m ? 'border-primary bg-primary/5 font-bold' : 'border-outline-variant/30'
                  }`}>
                    <input
                      type="radio"
                      name="payMethod"
                      value={m}
                      checked={paymentMethod === m}
                      onChange={() => setPaymentMethod(m)}
                    />
                    <span>{m === 'UPI' ? 'UPI (Google Pay / PhonePe / Paytm)' : m === 'Card' ? 'Credit / Debit Card' : 'SmartBus Wallet'}</span>
                  </label>
                ))}
              </div>

              {/* Price summary */}
              <div className="p-4 bg-surface-container rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-on-surface-variant">Total Payable</p>
                  <p className="text-2xl font-black text-primary">₹{currentPlan.price}</p>
                </div>
                <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                  Instant Confirmation
                </span>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">Back</button>
                <button type="submit" disabled={loading} className="btn-primary py-3 px-8 flex items-center gap-2">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined text-sm">lock</span>
                  )}
                  Pay ₹{currentPlan.price} Now
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && createdPass && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div>
              <h1 className="text-2xl font-black">Bus Pass Created Successfully!</h1>
              <p className="text-xs text-on-surface-variant mt-1">Your digital pass is active and ready for boarding.</p>
            </div>

            <div className="flex justify-center">
              <QRCodeCard pass={createdPass} />
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button onClick={() => navigate('/customer/profile')} className="btn-primary">
                View My Passes
              </button>
              <button onClick={() => navigate('/customer/dashboard')} className="btn-secondary">
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyPass;
