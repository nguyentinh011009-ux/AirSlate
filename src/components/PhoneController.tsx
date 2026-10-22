import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Highlighter, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  MousePointer, 
  Presentation, 
  ChevronLeft, 
  ChevronRight, 
  CircleDot, 
  Wifi, 
  Sliders,
  Check
} from 'lucide-react';
import { ToolType, Point, Stroke } from '../types';
import { drawStrokeOnCanvas } from '../utils/smoothing';

interface PhoneControllerProps {
  roomId: string;
  isConnected: boolean;
  isPeerConnected: boolean;
  onSendAction: (action: any) => void;
  currentPage: number;
  totalPages: number;
}

const PRESET_COLORS = [
  { name: 'Trắng', hex: '#ffffff' },
  { name: 'Vàng chanh', hex: '#facc15' },
  { name: 'Đỏ tươi', hex: '#ef4444' },
  { name: 'Xanh dương', hex: '#3b82f6' },
  { name: 'Xanh ngọc', hex: '#10b981' },
];

const STROKE_SIZES = [
  { label: 'Mảnh', val: 3 },
  { label: 'Vừa', val: 6 },
  { label: 'Đậm', val: 12 },
];

export function PhoneController({
  roomId,
  isConnected,
  isPeerConnected,
  onSendAction,
  currentPage,
  totalPages,
}: PhoneControllerProps) {
  // Navigation / Workspace Mode
  const [mode, setMode] = useState<'draw' | 'trackpad' | 'pdf'>('draw');

  // Drawing Tools
  const [selectedTool, setSelectedTool] = useState<ToolType>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [selectedSize, setSelectedSize] = useState<number>(6);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pressureDetected, setPressureDetected] = useState<boolean>(false);

  // Laser Pointer in Trackpad mode
  const [isLaserActive, setIsLaserActive] = useState<boolean>(false);

  // References for local preview canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const localStrokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Trackpad gesture memory
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  // Trigger brief haptic feedback if supported
  const triggerHaptic = useCallback((ms = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Redraw phone local canvas
  const redrawLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    for (const stroke of localStrokesRef.current) {
      drawStrokeOnCanvas(ctx, stroke, w, h);
    }
    if (currentStrokeRef.current) {
      drawStrokeOnCanvas(ctx, currentStrokeRef.current, w, h);
    }
  }, []);

  // Resize local canvas to match phone screen
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      redrawLocalCanvas();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [redrawLocalCanvas]);

  // Pointer Down (Start Drawing)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const pressure = e.pressure || 0.5;

    if (e.pressure > 0 && e.pressure !== 0.5) {
      setPressureDetected(true);
    }

    const point: Point = { x, y, pressure, time: Date.now() };
    const strokeId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const stroke: Stroke = {
      id: strokeId,
      points: [point],
      color: selectedTool === 'eraser' ? '#000000' : selectedColor,
      size: selectedSize,
      tool: selectedTool,
      opacity: selectedTool === 'highlighter' ? 0.35 : 1.0,
    };

    currentStrokeRef.current = stroke;
    redrawLocalCanvas();

    // Stream to PC immediately
    onSendAction({
      type: 'stroke:start',
      stroke,
    });
  };

  // Pointer Move (Stream coordinates continuously)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const pressure = e.pressure || 0.5;

    const point: Point = { x, y, pressure, time: Date.now() };
    currentStrokeRef.current.points.push(point);
    redrawLocalCanvas();

    // Stream point to PC
    onSendAction({
      type: 'stroke:point',
      id: currentStrokeRef.current.id,
      point,
    });
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    if (currentStrokeRef.current) {
      localStrokesRef.current.push(currentStrokeRef.current);
      onSendAction({
        type: 'stroke:end',
        id: currentStrokeRef.current.id,
      });
      currentStrokeRef.current = null;
      redrawLocalCanvas();
    }
  };

  // Clear Canvas
  const handleClear = () => {
    triggerHaptic(25);
    localStrokesRef.current = [];
    currentStrokeRef.current = null;
    redrawLocalCanvas();
    onSendAction({ type: 'canvas:clear' });
  };

  // Undo Stroke
  const handleUndo = () => {
    triggerHaptic(15);
    if (localStrokesRef.current.length > 0) {
      localStrokesRef.current.pop();
      redrawLocalCanvas();
    }
    onSendAction({ type: 'canvas:undo' });
  };

  // Trackpad Pointer Events
  const handleTrackpadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    lastTouchPosRef.current = { x: e.clientX, y: e.clientY };
    touchStartTimeRef.current = Date.now();

    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    if (isLaserActive) {
      onSendAction({ type: 'mouse:laser', x: nx, y: ny, active: true });
    }
  };

  const handleTrackpadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lastTouchPosRef.current) return;

    const dx = e.clientX - lastTouchPosRef.current.x;
    const dy = e.clientY - lastTouchPosRef.current.y;
    lastTouchPosRef.current = { x: e.clientX, y: e.clientY };

    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (isLaserActive) {
      onSendAction({ type: 'mouse:laser', x: nx, y: ny, active: true });
    } else {
      onSendAction({ type: 'mouse:move', dx, dy, x: nx, y: ny });
    }
  };

  const handleTrackpadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    const duration = Date.now() - touchStartTimeRef.current;
    if (duration < 250 && !isLaserActive) {
      // Tap click
      triggerHaptic(10);
      onSendAction({ type: 'mouse:click', button: 'left' });
    }

    if (isLaserActive) {
      onSendAction({ type: 'mouse:laser', x: 0, y: 0, active: false });
    }
    lastTouchPosRef.current = null;
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-slate-100 overflow-hidden touch-canvas select-none">
      {/* Top Mobile Bar */}
      <div className="h-12 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-900/90 backdrop-blur-md shrink-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
            A
          </div>
          <span className="font-semibold text-xs tracking-tight text-white">
            Bảng Vẽ Di Động
          </span>
          <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            PIN {roomId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pressureDetected && (
            <span className="text-[10px] font-medium text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
              Lực ấn OK
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {isPeerConnected ? 'P2P Siêu tốc' : isConnected ? 'Đã nối' : 'Đang tìm...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Touch Interaction Surface */}
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
        {mode === 'draw' && (
          <>
            {/* Visual Guide Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Drawing Surface */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="absolute inset-0 w-full h-full touch-canvas cursor-crosshair z-10"
            />

            {/* Tip guide overlay when empty */}
            {localStrokesRef.current.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500 text-xs gap-1.5">
                <PenTool className="w-8 h-8 text-indigo-500/40" />
                <span>Viết hoặc vẽ trực tiếp trên màn hình này</span>
                <span className="text-[10px] text-slate-600">Hỗ trợ bút cảm ứng & cảm ứng ngón tay</span>
              </div>
            )}
          </>
        )}

        {mode === 'trackpad' && (
          <div
            onPointerDown={handleTrackpadPointerDown}
            onPointerMove={handleTrackpadPointerMove}
            onPointerUp={handleTrackpadPointerUp}
            onPointerCancel={handleTrackpadPointerUp}
            className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 bg-slate-900/60 active:bg-slate-900/80 transition-colors z-10 touch-canvas"
          >
            <div className="text-center text-xs text-slate-400 pointer-events-none">
              Rê ngón tay để di chuyển con trỏ chuột trên PC · Chạm nhẹ để nhấp chuột
            </div>

            {/* Center Trackpad Visual Cue */}
            <div className="w-32 h-32 rounded-3xl border border-dashed border-indigo-500/30 flex items-center justify-center mx-auto pointer-events-none">
              <MousePointer className="w-8 h-8 text-indigo-400/50" />
            </div>

            {/* Bottom Trackpad Buttons */}
            <div className="grid grid-cols-2 gap-3 pointer-events-auto">
              <button
                onClick={() => {
                  triggerHaptic(15);
                  onSendAction({ type: 'mouse:click', button: 'left' });
                }}
                className="h-14 rounded-2xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 transition-all flex items-center justify-center shadow-lg"
              >
                Chuột Trái
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  onSendAction({ type: 'mouse:click', button: 'right' });
                }}
                className="h-14 rounded-2xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 transition-all flex items-center justify-center shadow-lg"
              >
                Chuột Phải
              </button>
            </div>
          </div>
        )}

        {mode === 'pdf' && (
          <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 bg-slate-900/80 z-10">
            {/* Top Slide Info */}
            <div className="text-center py-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                Điều Khiển Trình Chiếu
              </span>
              <div className="text-4xl font-extrabold font-mono text-white mt-1">
                {currentPage} <span className="text-lg text-slate-500 font-normal">/ {totalPages}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Màn hình PC sẽ chuyển trang đồng thời
              </p>
            </div>

            {/* Giant Prev / Next Flip Buttons for One-Hand Thumb Reach */}
            <div className="grid grid-cols-2 gap-4 my-auto">
              <button
                onClick={() => {
                  triggerHaptic(20);
                  onSendAction({ type: 'pdf:page', direction: 'prev' });
                }}
                disabled={currentPage <= 1}
                className="h-32 rounded-3xl bg-slate-800/90 active:bg-slate-700 disabled:opacity-30 border border-slate-700/80 flex flex-col items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all"
              >
                <ChevronLeft className="w-10 h-10 text-indigo-400" />
                <span className="text-sm font-bold text-white">Trang Trước</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  onSendAction({ type: 'pdf:page', direction: 'next' });
                }}
                disabled={currentPage >= totalPages}
                className="h-32 rounded-3xl bg-indigo-600 active:bg-indigo-500 disabled:opacity-30 flex flex-col items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all"
              >
                <ChevronRight className="w-10 h-10 text-white" />
                <span className="text-sm font-bold text-white">Trang Tiếp</span>
              </button>
            </div>

            {/* Quick Action to switch to pen drawing */}
            <button
              onClick={() => setMode('draw')}
              className="w-full h-12 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2"
            >
              <PenTool className="w-4 h-4 text-indigo-400" />
              <span>Chuyển sang Bút để vẽ chú thích lên Slide</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Color & Size Panel Drawer (When Opened) */}
      {showColorPicker && mode === 'draw' && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-30 animate-slide-up shadow-2xl">
          {/* Colors */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">Màu bút vẽ</div>
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    triggerHaptic(10);
                    setSelectedColor(c.hex);
                    if (selectedTool === 'eraser') setSelectedTool('pen');
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
                    selectedColor === c.hex && selectedTool !== 'eraser' ? 'ring-2 ring-indigo-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor === c.hex && selectedTool !== 'eraser' && (
                    <Check className={`w-4 h-4 ${c.hex === '#ffffff' || c.hex === '#facc15' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">Độ dày nét</div>
            <div className="grid grid-cols-3 gap-2">
              {STROKE_SIZES.map((s) => (
                <button
                  key={s.val}
                  onClick={() => {
                    triggerHaptic(10);
                    setSelectedSize(s.val);
                  }}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    selectedSize === s.val
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s.label} ({s.val}px)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Thumb Tool Dock (Thumb Zone Ergonomics, min 48px hitboxes) */}
      <div className="bg-slate-900/95 border-t border-slate-800/90 px-3 py-2 z-40 backdrop-blur-md">
        {mode === 'draw' && (
          <div className="flex items-center justify-between gap-1 mb-2 pb-2 border-b border-slate-800">
            {/* Pen Tool */}
            <button
              onClick={() => {
                triggerHaptic(10);
                setSelectedTool('pen');
              }}
              className={`flex-1 min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                selectedTool === 'pen'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Bút viết</span>
            </button>

            {/* Highlighter Tool */}
            <button
              onClick={() => {
                triggerHaptic(10);
                setSelectedTool('highlighter');
              }}
              className={`flex-1 min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                selectedTool === 'highlighter'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Highlighter className="w-4 h-4" />
              <span>Dạ quang</span>
            </button>

            {/* Quick Eraser */}
            <button
              onClick={() => {
                triggerHaptic(10);
                setSelectedTool('eraser');
              }}
              className={`flex-1 min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                selectedTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span>Tẩy xóa</span>
            </button>

            {/* Color & Size Adjuster */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`w-11 min-h-[44px] rounded-xl flex items-center justify-center transition-colors ${
                showColorPicker ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-slate-800 text-slate-300'
              }`}
              title="Màu sắc & độ dày"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Undo */}
            <button
              onClick={handleUndo}
              className="w-11 min-h-[44px] rounded-xl bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              title="Hoàn tác (Undo)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Clear */}
            <button
              onClick={handleClear}
              className="w-11 min-h-[44px] rounded-xl bg-slate-800 active:bg-rose-600/20 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-colors"
              title="Xóa toàn bộ (Clear)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Laser toggle in trackpad mode */}
        {mode === 'trackpad' && (
          <div className="mb-2 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Chế độ con trỏ laser:</span>
            <button
              onClick={() => {
                triggerHaptic(15);
                setIsLaserActive(!isLaserActive);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isLaserActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CircleDot className="w-4 h-4" />
              <span>{isLaserActive ? 'Tia Laser Đang BẬT' : 'Bật Laser Pointer'}</span>
            </button>
          </div>
        )}

        {/* Workspace Mode Switcher (Stylus / Trackpad / PDF) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              triggerHaptic(10);
              setMode('draw');
            }}
            className={`min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              mode === 'draw'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bút vẽ</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(10);
              setMode('trackpad');
            }}
            className={`min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              mode === 'trackpad'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chuột</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(10);
              setMode('pdf');
            }}
            className={`min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              mode === 'pdf'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Slide PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
