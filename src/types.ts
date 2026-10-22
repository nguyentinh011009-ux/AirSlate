export type ToolType = 'pen' | 'highlighter' | 'eraser';

export type AppMode = 'draw' | 'trackpad' | 'pdf';

export interface Point {
  x: number; // Normalized 0.0 to 1.0 (relative to canvas width)
  y: number; // Normalized 0.0 to 1.0 (relative to canvas height)
  pressure: number; // 0.0 to 1.0
  time: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  tool: ToolType;
  opacity: number;
}

export interface MouseEventPayload {
  dx: number;
  dy: number;
  x?: number;
  y?: number;
  type?: 'left' | 'right' | 'move';
}

export interface PDFPresentationState {
  currentPage: number;
  totalPages: number;
  title: string;
}

export type SocketMessage =
  | { type: 'join'; role: 'host' | 'phone'; roomId: string; deviceName?: string }
  | { type: 'room:joined'; role: 'host' | 'phone'; roomId: string; hostConnected?: boolean; connectedPhones?: number }
  | { type: 'phone:connected'; deviceName: string; connectedPhones: number }
  | { type: 'phone:disconnected'; connectedPhones: number }
  | { type: 'host:disconnected' }
  | { type: 'stroke:start'; stroke: Stroke }
  | { type: 'stroke:point'; id: string; point: Point }
  | { type: 'stroke:end'; id: string }
  | { type: 'canvas:clear' }
  | { type: 'canvas:undo' }
  | { type: 'mouse:move'; dx: number; dy: number; x: number; y: number }
  | { type: 'mouse:click'; button: 'left' | 'right' }
  | { type: 'mouse:laser'; x: number; y: number; active: boolean }
  | { type: 'pdf:page'; direction: 'next' | 'prev' | 'goto'; pageNumber?: number }
  | { type: 'pdf:state'; state: PDFPresentationState }
  | { type: 'webrtc:signal'; data: any };
