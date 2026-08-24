import { useState } from 'react';
import DriverNavbar from '../../components/DriverNavbar';
import api from '../../utils/api';

const PassScanner = () => {
  const [manualPassId, setManualPassId] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([
    { passId: 'SB-AARAV001-2024', name: 'Aarav Sharma', route: '42A', valid: true, time: '08:15 AM' },
    { passId: 'SB-ANANYA002-2024', name: 'Ananya Deshmukh', route: '42A', valid: true, time: '08:22 AM' }
  ]);

  const handleValidatePass = async (idToValidate) => {
    const passId = (idToValidate || manualPassId).trim();
    if (!passId) return;

    setLoading(true);
    setScanResult(null);

    try {
      const { data } = await api.get(`/passes/${encodeURIComponent(passId)}`);
      setScanResult(data);

      if (data.valid) {
        setRecentScans(prev => [
          { passId: data.passId, name: data.user?.name || 'Aarav Sharma', route: data.route?.routeNumber || '42A', valid: true, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4)
        ]);
      }
    } catch (err) {
      setScanResult({
        valid: false,
        message: err.response?.data?.message || 'Invalid or Expired Pass ID'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DriverNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-on-surface">Digital Pass Verification</h1>
          <p className="text-xs text-on-surface-variant">Scan QR code or manually enter Pass ID to check validity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scanner Viewfinder / Input Box */}
          <div className="card p-4 sm:p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h2 className="text-base font-bold">QR Camera Viewfinder</h2>
              <div className="bg-inverse-surface rounded-2xl h-52 sm:h-56 flex flex-col items-center justify-center text-inverse-on-surface relative overflow-hidden">
                <div className="w-full h-1 bg-secondary shadow-[0_0_15px_#006c49] animate-pulse"></div>
                <span className="material-symbols-outlined text-4xl sm:text-5xl mb-2 text-outline">qr_code_scanner</span>
                <p className="text-xs font-bold">Point Camera at Passenger's QR Code</p>
                <p className="text-[10px] text-outline mt-1">Auto-detects active JD College passes</p>
              </div>
            </div>

            {/* Manual Fallback Input */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/30">
              <label className="block text-xs font-bold text-on-surface-variant">Manual Pass ID Entry</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SB-AARAV001-2024"
                  value={manualPassId}
                  onChange={(e) => setManualPassId(e.target.value)}
                  className="input-field uppercase font-mono"
                />
                <button
                  onClick={() => handleValidatePass()}
                  disabled={loading}
                  className="btn-primary py-2 px-5 text-xs flex items-center gap-1"
                >
                  {loading ? 'Checking...' : 'Verify'}
                </button>
              </div>

              {/* Quick sample button */}
              <button
                onClick={() => { setManualPassId('SB-AARAV001-2024'); handleValidatePass('SB-AARAV001-2024'); }}
                className="text-[11px] text-primary font-bold hover:underline"
              >
                Test with sample pass ID (SB-AARAV001-2024)
              </button>
            </div>
          </div>

          {/* Validation Result Box */}
          <div className="card p-6 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base font-bold mb-4">Verification Result</h2>

              {scanResult ? (
                scanResult.valid ? (
                  <div className="p-6 bg-secondary-container/30 border-2 border-secondary rounded-2xl text-on-secondary-container space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        ✓
                      </div>
                      <div>
                        <span className="px-3 py-0.5 bg-secondary text-white font-black text-xs rounded-full uppercase">
                          PASS VALID
                        </span>
                        <h3 className="text-lg font-black mt-1">{scanResult.user?.name || 'Aarav Sharma'}</h3>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 pt-2 border-t border-secondary/20">
                      <p><span className="font-bold">Pass ID:</span> {scanResult.passId}</p>
                      <p><span className="font-bold">Route:</span> Route {scanResult.route?.routeNumber || '42A'}</p>
                      <p><span className="font-bold">Valid Until:</span> {new Date(scanResult.validUntil).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-error-container/40 border-2 border-error rounded-2xl text-on-error-container space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-error text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        ✕
                      </div>
                      <div>
                        <span className="px-3 py-0.5 bg-error text-white font-black text-xs rounded-full uppercase">
                          INVALID / EXPIRED
                        </span>
                        <h3 className="text-sm font-bold mt-1">{scanResult.message || 'Pass not valid'}</h3>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-outline-variant rounded-2xl text-on-surface-variant text-xs">
                  Scan a QR code or enter an ID to see pass status.
                </div>
              )}
            </div>

            {/* Recent Scans Table */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/30">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recent Scans Today</h3>
              <div className="space-y-1 text-xs">
                {recentScans.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-surface-container-low rounded-lg">
                    <span className="font-bold">{s.name} ({s.passId})</span>
                    <span className="text-secondary font-bold">✓ Valid</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PassScanner;
