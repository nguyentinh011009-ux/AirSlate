import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePeerConnection } from './hooks/usePeerConnection';
import { HostWorkspace } from './components/HostWorkspace';
import { PhoneController } from './components/PhoneController';
import { Stroke, Point } from './types';
import { Smartphone, Monitor, ArrowRight, Sparkles } from 'lucide-react';

export default function App() {
  // Query parameters parsing
  const params = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const queryRole = params.get('role');
  const queryRoom = params.get('room');

  // Generate or maintain Room PIN (6 digits)
  const [roomId, setRoomId] = useState<string>(() => {
    if (queryRoom && queryRoom.trim().length > 0) {
      return queryRoom.trim().toUpperCase();
    }
    const saved = localStorage.getItem('airslate_room_id');
    if (saved) return saved;
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('airslate_room_id', generated);
    return generated;
  });

  // Current Role: 'host' (PC) | 'phone' (Mobile Digitizer)
  const [role, setRole] = useState<'host' | 'phone'>(() => {
    if (queryRole === 'phone') return 'phone';
    if (queryRole === 'host') return 'host';
    // Auto-detect mobile devices
    if (typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      return 'phone';
    }
    return 'host';
  });

  // Manual PIN input state for phone landing page
  const [pinInput, setPinInput] = useState<string>('');
  const [hasEnteredRoom, setHasEnteredRoom] = useState<boolean>(() => Boolean(queryRoom));

  // Stroke state on Host Canvas
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);

  // Virtual cursor state
  const [virtualCursor, setVirtualCursor] = useState<{
    x: number;
    y: number;
    active: boolean;
    isLaser: boolean;
    lastClick?: 'left' | 'right';
  }>({
    x: 0.5,
    y: 0.5,
    active: false,
    isLaser: false,
  });

  // PDF / Presentation Slide state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 4;

  // Real-time Stroke Handlers
  const handleStrokeStart = useCallback((stroke: Stroke) => {
    setActiveStroke(stroke);
  }, []);

  const handleStrokePoint = useCallback((id: string, point: Point) => {
    setActiveStroke((prev) => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        points: [...prev.points, point],
      };
    });
  }, []);

  const handleStrokeEnd = useCallback((id: string) => {
    setActiveStroke((prev) => {
      if (prev && prev.id === id) {
        setStrokes((all) => [...all, prev]);
      }
      return null;
    });
  }, []);

  const handleCanvasClear = useCallback(() => {
    setStrokes([]);
    setActiveStroke(null);
  }, []);

  const handleCanvasUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  // Virtual Mouse Handlers
  const handleMouseMove = useCallback((dx: number, dy: number, x: number, y: number) => {
    setVirtualCursor({
      x,
      y,
      active: true,
      isLaser: false,
    });
  }, []);

  const handleMouseClick = useCallback((button: 'left' | 'right') => {
    setVirtualCursor((prev) => ({
      ...prev,
      lastClick: button,
    }));
    setTimeout(() => {
      setVirtualCursor((prev) => ({ ...prev, lastClick: undefined }));
    }, 300);
  }, []);

  const handleLaser = useCallback((x: number, y: number, active: boolean) => {
    setVirtualCursor({
      x,
      y,
      active,
      isLaser: true,
    });
  }, []);

  // Presentation Handlers
  const handlePageChange = useCallback((direction: 'next' | 'prev' | 'goto', pageNumber?: number) => {
    setCurrentPage((curr) => {
      if (direction === 'next') return Math.min(curr + 1, totalPages);
      if (direction === 'prev') return Math.max(curr - 1, 1);
      if (direction === 'goto' && pageNumber) return Math.min(Math.max(pageNumber, 1), totalPages);
      return curr;
    });
  }, [totalPages]);

  // Peer Connection
  const {
    isConnected,
    isPeerConnected,
    connectedPhones,
    connectionLatency,
    sendAction,
  } = usePeerConnection({
    role,
    roomId,
    onStrokeStart: handleStrokeStart,
    onStrokePoint: handleStrokePoint,
    onStrokeEnd: handleStrokeEnd,
    onCanvasClear: handleCanvasClear,
    onCanvasUndo: handleCanvasUndo,
    onMouseMove: handleMouseMove,
    onMouseClick: handleMouseClick,
    onLaser: handleLaser,
    onPageChange: handlePageChange,
  });

  // Keep URL updated with room without page refresh
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      url.searchParams.set('role', role);
      window.history.replaceState({}, '', url.toString());
    }
  }, [roomId, role]);

  // Join Room from PIN submit
  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length >= 4) {
      const clean = pinInput.trim().toUpperCase();
      setRoomId(clean);
      setHasEnteredRoom(true);
    }
  };

  // If Phone role and hasn't entered room PIN yet
  if (role === 'phone' && !hasEnteredRoom) {
    return (
      <div className="fixed inset-0 flex flex-col justify-between p-6 bg-slate-950 text-slate-100">
        <div className="text-center pt-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white mx-auto shadow-xl shadow-indigo-600/30 mb-4">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AirSlate Di Động</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Nhập mã PIN hiển thị trên màn hình máy tính để kết nối
          </p>
        </div>

        <form onSubmit={handleJoinPin} className="space-y-4 max-w-xs mx-auto w-full">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Mã PIN 6 số của máy tính
            </label>
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Ví dụ: 849201"
              autoFocus
              className="w-full text-center text-3xl font-mono tracking-widest py-3 px-4 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={pinInput.trim().length < 4}
            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-semibold text-sm flex items-center justify-center gap-2 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span>Kết Nối Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pb-4">
          <button
            onClick={() => {
              setRole('host');
              setHasEnteredRoom(true);
            }}
            className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4"
          >
            Chuyển sang chế độ Máy tính (Host Display)
          </button>
        </div>
      </div>
    );
  }

  // If Phone role
  if (role === 'phone') {
    return (
      <div className="relative w-full h-full">
        <PhoneController
          roomId={roomId}
          isConnected={isConnected}
          isPeerConnected={isPeerConnected}
          onSendAction={sendAction}
          currentPage={currentPage}
          totalPages={totalPages}
        />

        {/* Quick button to switch to PC Host view */}
        <button
          onClick={() => setRole('host')}
          className="fixed top-2 right-2 z-50 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          title="Chuyển sang màn hình máy tính"
        >
          <Monitor className="w-3 h-3" />
          <span className="hidden sm:inline">Chuyển sang PC</span>
        </button>
      </div>
    );
  }

  // Host PC View
  return (
    <div className="relative w-full h-full">
      <HostWorkspace
        roomId={roomId}
        connectedPhones={connectedPhones}
        connectionLatency={connectionLatency}
        isPeerConnected={isPeerConnected}
        onSendAction={sendAction}
        activeStroke={activeStroke}
        strokes={strokes}
        onUndo={handleCanvasUndo}
        onClear={handleCanvasClear}
        virtualCursor={virtualCursor}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(dir) => {
          handlePageChange(dir);
          sendAction({ type: 'pdf:page', direction: dir });
        }}
      />

      {/* Floating Role Switcher Pill for quick demo switching */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setRole('phone')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 text-xs font-medium text-slate-300 shadow-xl backdrop-blur-sm transition-all hover:scale-105"
          title="Chuyển giao diện sang bộ điều khiển điện thoại trên màn hình này"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Thử giao diện Điện thoại</span>
        </button>
      </div>
    </div>
  );
}
