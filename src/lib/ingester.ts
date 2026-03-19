import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { eventBus, EVENTS } from '@/lib/events';

interface LiveEvent {
  imei: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  timestamp: string;
}

class Ingester {
  private buffer: LiveEvent[] = [];
  private readonly maxBufferSize = 50;
  private readonly flushInterval = 5000;
  private flushTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    eventBus.on(EVENTS.TRACKER_LIVE, (event: { data: LiveEvent }) => {
      this.addToBuffer(event.data);
    });
  }

  private addToBuffer(data: LiveEvent) {
    this.buffer.push(data);
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  public start() {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    logger.info('Batch Ingester started.');
  }

  public get pendingCount() {
    return this.buffer.length;
  }

  private async flush() {
    if (this.isProcessing || this.buffer.length === 0) return;

    this.isProcessing = true;
    const itemsToProcess = [...this.buffer];
    this.buffer = [];

    try {
      await prisma.locationLog.createMany({
        data: itemsToProcess.map(item => ({
          imei: item.imei,
          lat: item.lat,
          lng: item.lng,
          speed: item.speed,
          ignition: item.ignition,
          timestamp: new Date(item.timestamp),
        })),
      });
      logger.info(`Batched ${itemsToProcess.length} location logs to DB.`);
    } catch (err) {
      logger.error(err, 'Failed to batch insert location logs');
      // Re-add to buffer for next attempt if needed, or handle failure
      this.buffer.unshift(...itemsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  public async stop() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush(); // Final flush
  }
}

export const ingester = new Ingester();
