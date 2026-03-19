import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import { verifyToken, UserPayload } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { eventBus, EVENTS } from '@/lib/events';
import { prisma } from '@/lib/prisma';

const PORT = 8080;

interface AuthenticatedSocket extends WebSocket {
  user?: UserPayload;
  assignedImeis?: Set<string>;
}

export function startWsServer() {
  const wss = new WebSocketServer({ port: PORT });

  wss.on('connection', async (ws: AuthenticatedSocket, req) => {
    const { query } = parse(req.url || '', true);
    const token = query.token as string;

    const user = token ? verifyToken(token) : null;
    if (!user) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    ws.user = user;
    logger.info(`WebSocket client connected: ${user.email} (${user.role})`);

    // Cache assigned IMEIs for Customers
    if (user.role === 'Customer') {
      const devices = await prisma.device.findMany({
        where: { customerId: user.id },
        select: { imei: true },
      });
      ws.assignedImeis = new Set(devices.map(d => d.imei));
    }

    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${user.email}`);
    });
  });

  // Listen for internal events and broadcast
  eventBus.on(EVENTS.TRACKER_LIVE, (event) => {
    broadcast(event);
  });

  eventBus.on(EVENTS.TRACKER_UNKNOWN, (event) => {
    broadcast(event);
  });

  function broadcast(event: any) {
    const message = JSON.stringify(event);
    const imei = event.data.imei;

    wss.clients.forEach((client: AuthenticatedSocket) => {
      if (client.readyState === WebSocket.OPEN && client.user) {
        // Admin sees all
        if (client.user.role === 'Admin') {
          client.send(message);
        } 
        // Customer sees only their IMEIs
        else if (client.user.role === 'Customer') {
          if (client.assignedImeis?.has(imei)) {
            client.send(message);
          }
        }
      }
    });
  }

  logger.info(`WebSocket Server listening on port ${PORT}`);
  return wss;
}
