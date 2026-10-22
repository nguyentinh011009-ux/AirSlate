import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  QrCode, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Trash2, 
  Download, 
  Smartphone, 
  Presentation, 
  PenTool, 
  Grid3X3, 
  Check,
  MousePointer
} from 'lucide-react';
import { Stroke, Point } from '../types';
import { drawStrokeOnCanvas } from '../utils/smoothing';
import { HostPairingModal } from './HostPairingModal';
import { PresentationViewer } from './PresentationViewer';

interface HostWorkspaceProps {
  roomId: string;
  connectedPhones: number;
  connectionLatency: number;
  isPeerConnected: boolean;
  onSendAction: (action: any) => void;
  // External stroke streams
  activeStroke: Stroke | null;
  strokes: Stroke[];
  onUndo: () => void;
  onClear: () => void;
  // Virtual mouse & laser
  virtualCursor: { x: number; y: number; active: boolean; isLaser: boolean; lastClick?: 'left' | 'right' };
  // PDF state
  currentPage: number;
  totalPages: number;
  onPageChange: (direction: 'next' | 'prev') => void;
}

export function HostWorkspace({
  roomId,
  connectedPhones,
  connectionLatency,
  isPeerConnected,
  onSendAction: _onSendAction,
  activeStroke,
  strokes,
  onUndo,
  onClear,
  virtualCursor,
  currentPage,
  totalPages,
  onPageChange,
}: HostWorkspaceProps) {
  const [showPairingModal, setShowPairingModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [canvasBg, setCanvasBg] = useState<'dark' | 'dots' | 'paper'>('dark');
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'presentation'>('whiteboard');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw canvas whenever strokes or activeStroke changes
  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Render historical strokes
    for (const stroke of strokes) {
      drawStrokeOnCanvas(ctx, stroke, w, h);
    }

    // Render ongoing live stroke in real-time
    if (activeStroke) {
      drawStrokeOnCanvas(ctx, activeStroke, w, h);
    }
  }, [strokes, activeStroke]);

  // Adjust canvas size to match container with DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      redrawAllStrokes();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [redrawAllStrokes]);

  useEffect(() => {
    redrawAllStrokes();
  }, [redrawAllStrokes]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Export Canvas as PNG
  const exportSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Background color
    ctx.fillStyle = canvasBg === 'paper' ? '#ffffff' : '#090d16';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const a = document.createElement('a');
    a.download = `AirSlate_BanVe_${Date.now()}.png`;
    a.href = exportCanvas.toDataURL('image/png');
    a.click();
  };

  const copyPhoneUrl = async () => {
    const url = `${window.location.origin}?room=${roomId}&role=phone`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Bar Header */}
      <header className="h-14 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between bg-slate-900/70 backdrop-blur-md z-30 shrink-0">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              A
            </div>
            <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
              AirSlate
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-800/70 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'whiteboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Bảng vẽ tự do</span>
            </button>
            <button
              onClick={() => setActiveTab('presentation')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'presentation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Trình chiếu PDF</span>
            </button>
          </div>
        </div>

        {/* Center Room PIN & Phone Connection Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPairingModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
            title="Nhấp để quét mã QR kết nối điện thoại"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-indigo-300">
              PIN: {roomId.slice(0, 3)} {roomId.slice(3)}
            </span>
          </button>

          <div 
            onClick={copyPhoneUrl}
            className="cursor-pointer hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 transition-colors"
            title="Nhấp để sao chép đường link mở trên điện thoại"
          >
            <Smartphone className={`w-3.5 h-3.5 ${connectedPhones > 0 ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{connectedPhones > 0 ? `${connectedPhones} Đã kết nối` : 'Chờ điện thoại...'}</span>
            {copiedLink && <Check className="w-3 h-3 text-emerald-400" />}
          </div>

          {connectedPhones > 0 && isPeerConnected && (
            <span className="hidden lg:inline text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              P2P WebRTC · {connectionLatency || 12}ms
            </span>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5">
          {/* Background switcher */}
          {activeTab === 'whiteboard' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setCanvasBg('dark')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  canvasBg === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Bảng đen tối giản"
              >
                <div className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-600" />
              </button>
              <button
                onClick={() => setCanvasBg('dots')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  canvasBg === 'dots' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Lưới điểm kỹ thuật"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCanvasBg('paper')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  canvasBg === 'paper' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Giấy trắng sáng"
              >
                <div className="w-3.5 h-3.5 rounded bg-white" />
              </button>
            </div>
          )}

          <button
            onClick={onUndo}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Hoàn tác nét vẽ (Undo)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClear}
            className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Xóa trắng bảng (Clear)"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={exportSnapshot}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tải ảnh bảng vẽ về máy tính (PNG)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div 
        ref={containerRef} 
        className={`relative flex-1 w-full h-full overflow-hidden transition-colors ${
          canvasBg === 'paper' && activeTab === 'whiteboard'
            ? 'bg-slate-100 text-slate-900'
            : canvasBg === 'dots' && activeTab === 'whiteboard'
            ? 'bg-[#0b101d] bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]'
            : 'bg-[#090d16]'
        }`}
      >
        {/* Background Presentation Slide Layer if in presentation mode */}
        {activeTab === 'presentation' && (
          <div className="absolute inset-0 z-0">
            <PresentationViewer
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}

        {/* Real-time Drawing Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full touch-canvas cursor-crosshair"
        />

        {/* Virtual Cursor / Laser Pointer from Phone */}
        {virtualCursor.active && (
          <div
            className="pointer-events-none fixed z-40 transition-transform duration-75 will-change-transform"
            style={{
              left: `${virtualCursor.x * 100}%`,
              top: `${virtualCursor.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {virtualCursor.isLaser ? (
              // Intense Glowing Laser Pointer
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-rose-500 shadow-[0_0_20px_6px_rgba(244,63,94,0.9)] animate-pulse" />
                <div className="absolute w-10 h-10 rounded-full border border-rose-400/50 animate-ping" />
                <div className="absolute w-2 h-2 rounded-full bg-white" />
              </div>
            ) : (
              // Virtual Mouse Pointer Cursor
              <div className="relative">
                <MousePointer className="w-6 h-6 text-indigo-400 fill-indigo-500 drop-shadow-[0_2px_8px_rgba(99,102,241,0.6)]" />
                {virtualCursor.lastClick && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Zero-state helper overlay if no strokes and no phone connected */}
        {strokes.length === 0 && !activeStroke && connectedPhones === 0 && activeTab === 'whiteboard' && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none text-center p-6">
            <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm max-w-md shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Bảng Vẽ Sẵn Sàng Nhận Tín Hiệu
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Quét mã QR bằng điện thoại của bạn để bắt đầu vẽ tay với cảm ứng lực, di chuột và lật trang PDF mượt mà.
              </p>
              <button
                onClick={() => setShowPairingModal(true)}
                className="pointer-events-auto px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                Mở Mã QR Kết Nối Điện Thoại
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pairing Modal */}
      <HostPairingModal
        roomId={roomId}
        connectedPhones={connectedPhones}
        isOpen={showPairingModal}
        onClose={() => setShowPairingModal(false)}
      />
    </div>
  );
}
