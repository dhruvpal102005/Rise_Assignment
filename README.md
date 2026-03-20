# FleetPulse - Real-Time GPS Fleet Tracking Backend

A high-performance backend system for real-time GPS fleet tracking with IoT device ingestion over TCP and live updates via WebSocket.

## Architecture Overview

```
IoT Device (TCP) → TCP Server (port 5000) → Event Bus → WebSocket Server (port 8080) → Dashboard
                                          ↓
                                    PostgreSQL Database
                                          ↑
                                    HTTP API (port 3000)
```

### Data Flow

1. **TCP Ingestion**: IoT devices connect via TCP and stream location pings
2. **Event Broadcasting**: Valid pings are immediately broadcast to WebSocket clients
3. **Batch Persistence**: Location data is batched and written to PostgreSQL asynchronously
4. **HTTP API**: RESTful endpoints for device management and historical queries

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Local Development

1. **Clone and install dependencies**:
```bash
git clone <repo-url>
cd fleetpulse
make install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

3. **Setup database**:
```bash
make setup
# This will: install deps → push schema → seed test data
```

4. **Start servers** (requires 2 terminals):

Terminal 1 - HTTP API + WebSocket:
```bash
make dev
```

Terminal 2 - TCP Server:
```bash
make server
```

### Environment Variables

Required variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing (256-bit recommended)
- `TCP_PORT`: TCP server port (default: 5000)
- `WS_PORT`: WebSocket server port (default: 8080)
- `PORT`: HTTP API port (default: 3000)

## Database Schema & Index Strategy

### Tables

1. **users**: Authentication and role management
   - Primary key: `id` (UUID)
   - Unique index: `email`

2. **devices**: Registered IoT devices
   - Primary key: `imei` (15-char string)
   - Indexes:
     - `imei`: Primary lookup for TCP packet validation (most frequent query)
     - `customer_id`: Filter devices by customer for role-based access

3. **location_logs**: GPS location history
   - Primary key: `id` (UUID)
   - Indexes:
     - `imei`: Filter logs by device
     - `timestamp`: Time-range queries for history endpoint
     - `(imei, timestamp)`: Composite index for `/devices/:imei/history` queries

### Index Rationale

- **IMEI indexes**: Every TCP packet requires IMEI lookup for validation (50 req/sec under load)
- **Timestamp index**: History queries always filter by time range
- **Composite (imei, timestamp)**: Optimizes the most common query pattern: "last 100 logs for device X"
- **Customer ID index**: Role-based filtering for Customer users

## TCP → Database Strategy

### Approach: Event-Driven with Async Batch Writes

**Why not synchronous writes?**
- 50 devices × 1 ping/sec = 50 DB writes/sec
- Synchronous writes would block TCP server and add latency to WebSocket broadcasts

**Our approach:**

1. **Immediate validation**: TCP server validates IMEI against in-memory device cache
2. **Instant broadcast**: Valid pings are immediately emitted to WebSocket clients
3. **Async batching**: Location data is queued and batch-inserted every 1 second
4. **Graceful shutdown**: On SIGTERM, flush pending queue before exit

**Tradeoffs:**
- ✅ Low latency for real-time updates (< 10ms)
- ✅ High throughput (handles 100+ pings/sec)
- ✅ Reduced DB load (batch inserts vs individual)
- ⚠️ Potential data loss if process crashes before batch flush (mitigated by graceful shutdown)

**Alternative considered**: Write-through cache with immediate DB writes
- Rejected due to latency impact on WebSocket broadcasts

## API Endpoints

### Authentication

**POST /auth/token**
- Generate test JWT tokens
- Body: `{ "email": "user@example.com", "role": "Admin" | "Customer" }`
- Returns: `{ "token": "jwt-string" }`

### Devices

**GET /devices** (Admin only)
- List all registered devices
- Returns: Array of device objects

**GET /devices/:imei/history** (Admin or device owner)
- Last 100 location logs for a device
- Returns: Array of location log objects

### Health

**GET /health**
- System health check
- Returns: `{ "status": "ok", "pending_count": 0, "uptime_seconds": 123 }`

## WebSocket Protocol

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8080?token=<jwt>');
```

### Events

**tracker:live** - Real-time location update
```json
{
  "event": "tracker:live",
  "data": {
    "imei": "354678901234561",
    "lat": 18.5204,
    "lng": 73.8567,
    "speed": 42.5,
    "ignition": true,
    "timestamp": "2025-03-19T10:30:00.000Z"
  }
}
```

**tracker:unknown** - Unregistered device (throttled: max once per 5 sec per IMEI)
```json
{
  "event": "tracker:unknown",
  "data": {
    "imei": "000000000000000",
    "status": "UNREGISTERED_DEVICE"
  }
}
```

## Testing

### Manual TCP Test

```bash
npm run test:tcp
```

### Stress Test

```bash
npm run test:stress
```

Simulates:
- 50 concurrent TCP connections
- 1 ping/second per connection
- 60 second duration
- Mix of valid/invalid/unregistered IMEIs

## Deployment

### Railway (Recommended)

Railway supports both TCP and PostgreSQL out of the box.

1. Create new project on Railway
2. Add PostgreSQL database
3. Deploy from GitHub
4. Set environment variables
5. TCP and HTTP ports are automatically exposed

### Environment Variables for Production

```
DATABASE_URL=<railway-postgres-url>
JWT_SECRET=<strong-random-string>
TCP_PORT=5000
WS_PORT=8080
PORT=3000
NODE_ENV=production
```

## Test Credentials

After running `make setup`, use these credentials:

**Admin User:**
- Email: `admin@fleetpulse.com`
- Password: `password123`
- Access: All devices

**Customer User:**
- Email: `customer@example.com`
- Password: `password123`
- Access: 3 assigned devices (IMEIs ending in 561, 562, 563)

**Registered Devices:**
- `354678901234561` (assigned to customer)
- `354678901234562` (assigned to customer)
- `354678901234563` (assigned to customer)
- `354678901234564` (unassigned)
- `354678901234565` (unassigned)

## Known Limitations

1. **In-memory device cache**: Device list is loaded on startup. New devices require server restart.
2. **Single instance**: Current implementation doesn't support horizontal scaling (WebSocket state is in-memory).
3. **Batch write window**: Up to 1 second delay between TCP ping and DB persistence.
4. **No authentication on TCP**: Devices are validated by IMEI only, no encryption or auth.

## Future Improvements

- Redis pub/sub for multi-instance WebSocket scaling
- Device cache invalidation via database triggers
- TLS encryption for TCP connections
- Configurable batch write intervals
- Prometheus metrics for monitoring
- Rate limiting per device

## License

MIT
