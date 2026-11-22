import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const QRCodeCard = ({ pass }) => {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const passId = pass?.passId || pass?.pass_id || pass?._id || pass?.id || 'JDC-PASS';
  const rawQr = pass?.qrData || pass?.qr_data || (pass ? JSON.stringify({ passId, userId: pass.user?._id || pass.user?.id || 'user' }) : '');

  useEffect(() => {
    if (!rawQr) return;
    QRCode.toDataURL(rawQr, { width: 160, margin: 1, color: { dark: '#003fb1', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [rawQr]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#003fb1' });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [420, 260] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 420, 260);
      pdf.save(`SmartBus-Pass-${passId}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    }
  };

  if (!pass) return null;

  const validUntilDate = pass.validUntil || pass.valid_until;
  const validUntil = validUntilDate
    ? new Date(validUntilDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Valid for Tenure';

  const routeNumber = pass.route?.routeNumber || pass.route?.route_number;
  const routeName = routeNumber ? `Route ${routeNumber}` : (pass.route?.name || 'JD College Route');
  const routeDetail = pass.route?.name && routeNumber ? pass.route.name : '';

  const remainingTaps = pass.remainingTaps != null
    ? pass.remainingTaps
    : (pass.totalTaps != null ? Math.max(0, pass.totalTaps - (pass.usedTaps || 0)) : 60);

  const rolloverTaps = pass.rolloverTapsIn || pass.rollover_taps_in || 0;
  const passType = pass.passType || pass.pass_type || 'teacher';
  const passTypeDisplay = passType === 'teacher' ? 'Faculty Transit Pass' : passType === 'student' ? 'Student Transit Pass' : 'General Transit Pass';
  const passStatus = (pass.status || 'active').toUpperCase();

  const userName = (typeof pass.user === 'object' && pass.user?.name)
    ? pass.user.name
    : (typeof pass.user === 'string' && !pass.user.match(/^[0-9a-fA-F]{24}$/) ? pass.user : 'Prof. Rajesh Kulkarni');

  return (
    <div className="space-y-4">
      {/* Pass Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm bg-gradient-to-br from-primary to-primary-container rounded-2xl p-6 text-on-primary overflow-hidden shadow-xl"
      >
        {/* Background bus icon */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined" style={{ fontSize: '160px' }}>directions_bus</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
              {passTypeDisplay}
            </p>
            <p className="text-xl font-bold mt-1">{userName}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
            {passId}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-end justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">route</span>
              <span className="text-sm font-semibold">{routeName}{routeDetail ? ` — ${routeDetail}` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span className="text-xs opacity-80">Valid until {validUntil}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">contactless</span>
              <span className="text-xs font-bold text-amber-200">
                {remainingTaps} taps left {rolloverTaps > 0 ? `(+${rolloverTaps} rollover)` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span>
              <span className="text-xs opacity-80 capitalize">{pass.duration || 'Monthly'} pass</span>
            </div>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <img src={qrDataUrl} alt="Pass QR Code" className="w-20 h-20" />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary-container status-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {passStatus}
            </span>
          </div>
          <span className="text-xs opacity-70">SmartBus AI Transit</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleDownload} className="btn-primary flex items-center gap-2 flex-1 justify-center">
          <span className="material-symbols-outlined text-sm">download</span>
          Download PDF
        </button>
        <button
          onClick={() => {
            if (qrDataUrl) {
              const a = document.createElement('a');
              a.href = qrDataUrl;
              a.download = `qr-${passId}.png`;
              a.click();
            }
          }}
          className="btn-secondary flex items-center gap-2 flex-1 justify-center"
        >
          <span className="material-symbols-outlined text-sm">qr_code</span>
          Save QR
        </button>
      </div>
    </div>
  );
};

export default QRCodeCard;
