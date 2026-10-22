import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, Copy, Check, ExternalLink, X, Wifi } from 'lucide-react';

interface HostPairingModalProps {
  roomId: string;
  connectedPhones: number;
  isOpen: boolean;
  onClose: () => void;
  onSwitchToPhone?: () => void;
}

export function HostPairingModal({
  roomId,
  connectedPhones,
  isOpen,
  onClose,
  onSwitchToPhone,
}: HostPairingModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const phoneUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?room=${roomId}&role=phone`
    : '';

  useEffect(() => {
    if (!phoneUrl) return;
    QRCode.toDataURL(phoneUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR:', err));
  }, [phoneUrl]);

  if (!isOpen) return null;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(phoneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Kết Nối Điện Thoại</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Dùng camera điện thoại quét mã QR hoặc truy cập đường link để biến điện thoại thành bảng vẽ cảm ứng lực
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-6">
          <div className="p-3 bg-white rounded-2xl shadow-md">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Mã QR kết nối phòng ${roomId}`}
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                <QrCode className="w-10 h-10 animate-pulse" />
              </div>
            )}
          </div>

          {/* Room PIN Code */}
          <div className="mt-4 flex flex-col items-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mã PIN Kết Nối Nhanh</span>
            <div className="mt-1 px-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-2xl font-mono font-bold tracking-widest text-indigo-400">
              {roomId.slice(0, 3)} {roomId.slice(3)}
            </div>
          </div>
        </div>

        {/* Connection Status indicator */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${connectedPhones > 0 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
            <span>
              {connectedPhones > 0 
                ? `Đã liên kết ${connectedPhones} thiết bị điện thoại`
                : 'Đang đợi điện thoại quét mã...'}
            </span>
          </div>
          {connectedPhones > 0 && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Sẵn sàng
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={phoneUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate focus:outline-none"
            />
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã chép' : 'Sao chép link'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={phoneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mở tab mới</span>
            </a>

            {onSwitchToPhone && (
              <button
                onClick={() => {
                  onClose();
                  onSwitchToPhone();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-colors text-center"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Thử ngay trên tab này</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
