import 'dotenv/config';
import { startTcpServer } from './tcp';
import { startWsServer } from './ws';
import { ingester } from '@/lib/ingester';
import { logger } from '@/lib/logger';
import http from 'http';

async function main() {
  logger.info('Starting Fleet Pulse Standalone Servers...');

  // Start Background Ingester
  ingester.start();

  // Start Servers
  const tcpServer = await startTcpServer();
  const wsServer = await startWsServer();

  // Start HTTP health check server for Render
  const PORT = parseInt(process.env.PORT || '10000', 10);
  const healthServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      tcp_port: process.env.TCP_PORT || 5000,
      ws_port: process.env.WS_PORT || 8080,
      pending_logs: ingester.pendingCount
    }));
  });
  
  healthServer.listen(PORT, () => {
    logger.info(`HTTP Health Server listening on port ${PORT}`);
  });

  // Graceful Shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    
    tcpServer.close();
    wsServer.close();
    healthServer.close();
    await ingester.stop();
    
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
