import net from 'net';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { eventBus, EVENTS } from '@/lib/events';

const PORT = 5000;

// Simple memory cache for registered IMEI IDs (to avoid DB lookup on every ping if needed)
// For this assignment, we'll fetch from DB or cache.
const registeredDevices = new Set<string>();

async function syncRegisteredDevices() {
  const devices = await prisma.device.findMany({ select: { imei: true } });
  registeredDevices.clear();
  devices.forEach(d => registeredDevices.add(d.imei));
  logger.info(`Loaded ${registeredDevices.size} registered devices from DB.`);
}

// Throttle map for "tracker:unknown" events
const lastUnknownEmit = new Map<string, number>();

export function startTcpServer() {
  const server = net.createServer((socket) => {
    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep partial line in buffer

      for (const line of lines) {
        const raw = line.trim();
        if (!raw) continue;

        try {
          // Protocol: PING,<imei>,<lat>,<lng>,<speed>,<ignition>
          const parts = raw.split(',');
          if (parts[0] !== 'PING' || parts.length < 6) {
            throw new Error('Malformed packet header or length');
          }

          const [, imei, latStr, lngStr, speedStr, ignitionStr] = parts;
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          const speed = parseFloat(speedStr);
          const ignition = ignitionStr === '1';

          if (isNaN(lat) || isNaN(lng) || isNaN(speed)) {
            throw new Error('Invalid numeric values');
          }

          // Check if registered
          if (!registeredDevices.has(imei)) {
            // Check throttle for unknown: max once every 5 seconds per IMEI
            const now = Date.now();
            const last = lastUnknownEmit.get(imei) || 0;
            if (now - last >= 5000) {
              lastUnknownEmit.set(imei, now);
              eventBus.emit(EVENTS.TRACKER_UNKNOWN, {
                event: 'tracker:unknown',
                data: { imei, status: 'UNREGISTERED_DEVICE' },
              });
            }
            continue;
          }

          // Valid packet and registered device
          const timestamp = new Date().toISOString();
          eventBus.emit(EVENTS.TRACKER_LIVE, {
            event: 'tracker:live',
            data: { imei, lat, lng, speed, ignition, timestamp },
          });

          logger.debug(`Ping received: ${imei} (${lat}, ${lng})`);
        } catch (err: any) {
          logger.error({ raw, error: err.message }, 'Packet processing failed');
        }
      }
    });

    socket.on('error', (err) => {
      logger.error(err, 'Socket error');
    });

    socket.on('end', () => {
      // Cleanly handled by client
    });
  });

  server.listen(PORT, '0.0.0.0', async () => {
    logger.info(`TCP Ingest Server listening on port ${PORT}`);
    await syncRegisteredDevices();
  });

  return server;
}
