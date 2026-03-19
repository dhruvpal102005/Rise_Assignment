import { startTcpServer } from './tcp';
import { startWsServer } from './ws';
import { ingester } from '@/lib/ingester';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

async function main() {
  logger.info('Starting Fleet Pulse Standalone Servers...');

  // Start Background Ingester
  ingester.start();

  // Start Servers
  const tcpServer = startTcpServer();
  const wsServer = startWsServer();

  // Graceful Shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    
    tcpServer.close();
    wsServer.close();
    await ingester.stop();
    await prisma.$disconnect();
    
    logger.info('Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error(err, 'Fatal error during server startup');
  process.exit(1);
});
