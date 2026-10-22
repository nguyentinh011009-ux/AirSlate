import { useEffect, useRef, useState, useCallback } from 'react';
import { Point, Stroke, SocketMessage } from '../types';

interface UsePeerConnectionProps {
  role: 'host' | 'phone';
  roomId: string;
  onStrokeStart?: (stroke: Stroke) => void;
  onStrokePoint?: (id: string, point: Point) => void;
  onStrokeEnd?: (id: string) => void;
  onCanvasClear?: () => void;
  onCanvasUndo?: () => void;
  onMouseMove?: (dx: number, dy: number, x: number, y: number) => void;
  onMouseClick?: (button: 'left' | 'right') => void;
  onLaser?: (x: number, y: number, active: boolean) => void;
  onPageChange?: (direction: 'next' | 'prev' | 'goto', pageNumber?: number) => void;
}

export function usePeerConnection({
  role,
  roomId,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  onCanvasClear,
  onCanvasUndo,
  onMouseMove,
  onMouseClick,
  onLaser,
  onPageChange,
}: UsePeerConnectionProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const [connectedPhones, setConnectedPhones] = useState<number>(0);
  const [connectionLatency, setConnectionLatency] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Keep callback refs fresh
  const callbacksRef = useRef({
    onStrokeStart,
    onStrokePoint,
    onStrokeEnd,
    onCanvasClear,
    onCanvasUndo,
    onMouseMove,
    onMouseClick,
    onLaser,
    onPageChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStrokeStart,
      onStrokePoint,
      onStrokeEnd,
      onCanvasClear,
      onCanvasUndo,
      onMouseMove,
      onMouseClick,
      onLaser,
      onPageChange,
    };
  });

  // Handle incoming parsed message from either WebRTC or WebSocket
  const handleIncomingMessage = useCallback((msg: SocketMessage) => {
    switch (msg.type) {
      case 'stroke:start':
        callbacksRef.current.onStrokeStart?.(msg.stroke);
        break;
      case 'stroke:point':
        callbacksRef.current.onStrokePoint?.(msg.id, msg.point);
        break;
      case 'stroke:end':
        callbacksRef.current.onStrokeEnd?.(msg.id);
        break;
      case 'canvas:clear':
        callbacksRef.current.onCanvasClear?.();
        break;
      case 'canvas:undo':
        callbacksRef.current.onCanvasUndo?.();
        break;
      case 'mouse:move':
        callbacksRef.current.onMouseMove?.(msg.dx, msg.dy, msg.x, msg.y);
        break;
      case 'mouse:click':
        callbacksRef.current.onMouseClick?.(msg.button);
        break;
      case 'mouse:laser':
        callbacksRef.current.onLaser?.(msg.x, msg.y, msg.active);
        break;
      case 'pdf:page':
        callbacksRef.current.onPageChange?.(msg.direction, msg.pageNumber);
        break;
      case 'phone:connected':
        setConnectedPhones(msg.connectedPhones);
        break;
      case 'phone:disconnected':
        setConnectedPhones(msg.connectedPhones);
        break;
    }
  }, []);

  // WebRTC Setup
  const setupWebRTC = useCallback((isInitiator: boolean) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      peerConnRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'webrtc:signal',
              roomId,
              data: { candidate: event.candidate },
            })
          );
        }
      };

      if (isInitiator) {
        // Host creates data channel
        const dc = pc.createDataChannel('airslate-data', { ordered: false });
        dataChannelRef.current = dc;

        dc.onopen = () => {
          setIsPeerConnected(true);
        };
        dc.onclose = () => {
          setIsPeerConnected(false);
        };
        dc.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            handleIncomingMessage(data);
          } catch (err) {
            console.error('Error parsing DataChannel message', err);
          }
        };

        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer);
          wsRef.current?.send(
            JSON.stringify({
              type: 'webrtc:signal',
              roomId,
              data: { offer },
            })
          );
        });
      } else {
        // Phone receives data channel
        pc.ondatachannel = (event) => {
          const dc = event.channel;
          dataChannelRef.current = dc;
          dc.onopen = () => {
            setIsPeerConnected(true);
          };
          dc.onclose = () => {
            setIsPeerConnected(false);
          };
          dc.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              handleIncomingMessage(data);
            } catch (err) {
              console.error('Error parsing DataChannel message', err);
            }
          };
        };
      }
    } catch (e) {
      console.warn('WebRTC peer connection unsupported or failed, relying on WebSocket relay', e);
    }
  }, [roomId, handleIncomingMessage]);

  // Connect WebSocket
  useEffect(() => {
    if (!roomId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join room
      ws.send(
        JSON.stringify({
          type: 'join',
          role,
          roomId,
          deviceName: role === 'host' ? 'Máy tính Host' : navigator.userAgent.includes('Mobile') ? 'Điện thoại di động' : 'Thiết bị phụ',
        })
      );

      if (role === 'host') {
        // Initialize WebRTC as initiator once ready
        setupWebRTC(true);
      }
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'webrtc:signal' && msg.data) {
          const pc = peerConnRef.current;
          if (msg.data.offer) {
            if (!pc) setupWebRTC(false);
            const currentPc = peerConnRef.current;
            if (currentPc) {
              await currentPc.setRemoteDescription(new RTCSessionDescription(msg.data.offer));
              const answer = await currentPc.createAnswer();
              await currentPc.setLocalDescription(answer);
              ws.send(
                JSON.stringify({
                  type: 'webrtc:signal',
                  roomId,
                  data: { answer },
                })
              );
            }
          } else if (msg.data.answer && pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.data.answer));
          } else if (msg.data.candidate && pc) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.data.candidate));
          }
          return;
        }

        // Process application action message
        handleIncomingMessage(msg);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsPeerConnected(false);
    };

    // Periodic ping for latency measurement
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const start = performance.now();
        ws.send(JSON.stringify({ type: 'ping' }));
        setConnectionLatency(Math.round(performance.now() - start));
      }
    }, 5000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
      dataChannelRef.current?.close();
      peerConnRef.current?.close();
    };
  }, [role, roomId, handleIncomingMessage, setupWebRTC]);

  // Unified send function (prefers DataChannel if available for sub-10ms latency, falls back to WebSocket)
  const sendAction = useCallback((payload: any) => {
    const raw = JSON.stringify({ ...payload, roomId });

    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(raw);
        return;
      } catch (e) {
        // fall back to ws
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(raw);
    }
  }, [roomId]);

  return {
    isConnected,
    isPeerConnected,
    connectedPhones,
    connectionLatency,
    sendAction,
  };
}
