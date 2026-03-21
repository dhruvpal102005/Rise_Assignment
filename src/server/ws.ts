import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import { verifyToken, UserPayload } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { eventBus, EVENTS } from '@/lib/events';
import { getDevicesByCustomerId } from '@/lib/queries';

const PORT = parseInt(process.env.WS_PORT || '8080', 10);

interface AuthenticatedSocket extends WebSocket {
  user?: UserPayload;
  assignedImeis?: Set<string>;
}

export async function startWsServer() {
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
      const customerDevices = await getDevicesByCustomerId(user.id);
      ws.assignedImeis = new Set(customerDevices.map((d) => d.imei));
    }

    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${user.email}`);
    });
  });

  // Listen for internal events and broadcast
  eventBus.on(EVENTS.TRACKER_LIVE, (event) => {
    console.log('📡 WS Server received TRACKER_LIVE:', event.data.imei);
    broadcast(event);
  });

  eventBus.on(EVENTS.TRACKER_UNKNOWN, (event) => {
    console.log('📡 WS Server received TRACKER_UNKNOWN:', event.data.imei);
    broadcast(event);
  });

  function broadcast(event: any) {
    const message = JSON.stringify(event);
    const imei = event.data.imei;
    console.log(`📢 Broadcasting to ${wss.clients.size} clients:`, imei);

    wss.clients.forEach((client: AuthenticatedSocket) => {
      if (client.readyState === WebSocket.OPEN && client.user) {
        // Admin sees all
        if (client.user.role === 'Admin') {
          console.log(`  ✅ Sending to Admin: ${client.user.email}`);
          client.send(message);
        } 
        // Customer sees only their IMEIs
        else if (client.user.role === 'Customer') {
          if (client.assignedImeis?.has(imei)) {
            console.log(`  ✅ Sending to Customer: ${client.user.email}`);
            client.send(message);
          }
        }
      }
    });
  }

  logger.info(`WebSocket Server listening on port ${PORT}`);
  return wss;
}
