import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Use noServer mode so we safely control which upgrade requests we handle
const wss = new WebSocketServer({ noServer: true });

interface ClientInfo {
  ws: WebSocket;
  role: 'host' | 'phone';
  roomId: string;
  deviceName?: string;
}

const clientMap = new Map<WebSocket, ClientInfo>();

interface RoomState {
  host?: WebSocket;
  phones: Set<WebSocket>;
}
const rooms = new Map<string, RoomState>();

// Handle WebSocket upgrade manually to prevent conflicts with Vite
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Handle WebSocket connections on /ws or / (fallback)
    if (pathname === '/ws' || pathname === '/') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (e) {
    socket.destroy();
  }
});

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string | Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type, roomId } = msg;

      if (type === 'join') {
        const role: 'host' | 'phone' = msg.role;
        const targetRoom = (roomId || 'default').toUpperCase().trim();
        
        clientMap.set(ws, {
          ws,
          role,
          roomId: targetRoom,
          deviceName: msg.deviceName || (role === 'host' ? 'Máy tính' : 'Điện thoại'),
        });

        let room = rooms.get(targetRoom);
        if (!room) {
          room = { phones: new Set() };
          rooms.set(targetRoom, room);
        }

        if (role === 'host') {
          room.host = ws;
          ws.send(JSON.stringify({
            type: 'room:joined',
            role: 'host',
            roomId: targetRoom,
            connectedPhones: room.phones.size,
          }));
        } else {
          room.phones.add(ws);
          ws.send(JSON.stringify({
            type: 'room:joined',
            role: 'phone',
            roomId: targetRoom,
            hostConnected: Boolean(room.host && room.host.readyState === WebSocket.OPEN),
          }));

          if (room.host && room.host.readyState === WebSocket.OPEN) {
            room.host.send(JSON.stringify({
              type: 'phone:connected',
              deviceName: msg.deviceName || 'Điện thoại',
              connectedPhones: room.phones.size,
            }));
          }
        }
        return;
      }

      const client = clientMap.get(ws);
      if (!client) return;

      const room = rooms.get(client.roomId);
      if (!room) return;

      // Relay phone actions to host
      if (client.role === 'phone') {
        if (room.host && room.host.readyState === WebSocket.OPEN) {
          room.host.send(data.toString());
        }
      } 
      // Relay host actions to phones
      else if (client.role === 'host') {
        for (const phone of room.phones) {
          if (phone.readyState === WebSocket.OPEN) {
            phone.send(data.toString());
          }
        }
      }

    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    const client = clientMap.get(ws);
    if (client) {
      const room = rooms.get(client.roomId);
      if (room) {
        if (client.role === 'host' && room.host === ws) {
          room.host = undefined;
          for (const phone of room.phones) {
            if (phone.readyState === WebSocket.OPEN) {
              phone.send(JSON.stringify({ type: 'host:disconnected' }));
            }
          }
        } else if (client.role === 'phone') {
          room.phones.delete(ws);
          if (room.host && room.host.readyState === WebSocket.OPEN) {
            room.host.send(JSON.stringify({
              type: 'phone:disconnected',
              connectedPhones: room.phones.size,
            }));
          }
        }

        if (!room.host && room.phones.size === 0) {
          rooms.delete(client.roomId);
        }
      }
      clientMap.delete(ws);
    }
  });

  ws.on('ping', () => ws.pong());
});

// Redirect any request to /main.tsx directly to /src/main.tsx
app.get('/main.tsx', (_req, res) => {
  res.redirect('/src/main.tsx');
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AirSlate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
