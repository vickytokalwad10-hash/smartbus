import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PassStatusChip from './PassStatusChip';

const QRCodeCard = ({ pass }) => {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!pass?.qr_data) return;
    QRCode.toDataURL(pass.qr_data, { width: 160, margin: 1, color: { dark: '#003fb1', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [pass]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#003fb1' });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [420, 260] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 420, 260);
    pdf.save(`SmartBus-Pass-${pass.pass_id}.pdf`);
  };

  if (!pass) return null;

  const validUntil = new Date(pass.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const routeName = pass.route?.route_number || 'Route';

  return (
    <div className="space-y-4">
      {/* Pass Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm bg-gradient-to-br from-primary to-primary-container rounded-2xl p-6 text-on-primary overflow-hidden shadow-xl"
      >
        {/* Background bus icon */}
        <div className="absolute -right-8 -bottom-8 opacity-10">
          <span className="material-symbols-outlined" style={{ fontSize: '160px' }}>directions_bus</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
              {pass.pass_type === 'student' ? 'Student Transit Pass' : 'General Transit Pass'}
            </p>
            <p className="text-xl font-bold mt-1">{pass.user?.name || 'Passenger'}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
            {pass.pass_id}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-end justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">route</span>
              <span className="text-sm font-semibold">{routeName} — {pass.route?.name || ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span className="text-xs opacity-80">Valid until {validUntil}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span>
              <span className="text-xs opacity-80 capitalize">{pass.duration} pass</span>
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
              {pass.status.toUpperCase()}
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
              a.download = `qr-${pass.pass_id}.png`;
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
