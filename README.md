# Fleet Pulse - GPS Tracking Backend

Fleet Pulse is a high-performance backend system for real-time GPS fleet tracking. It handles high-frequency TCP pings from IoT devices, broadcasts live updates via WebSockets, and provides a management dashboard and API.

## Architecture Overview

```text
IoT Device (TCP:5000) ──▶ TCP Server ──▶ Event Bus (Internal) ──▶ WebSocket (8080) ──▶ Dashboard
                               │                                     │
                               └────────▶ Batch Ingester ────────────┘
                                            │
                                            ▼
                                        PostgreSQL (Prisma)
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- `nc` (Netcat) for manual testing (optional)

### Quick Start
1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Spin up PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

3. **Initialize Database**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Run the Servers**:
   ```bash
   # Terminal 1: Next.js (Dashboard & API)
   npm run dev

   # Terminal 2: Standalone TCP & WS Server
   npm run server
   ```

## Design Decisions

### 1. TCP to DB: The Batching Approach
To handle the "Tier 2" load (50 concurrent 1s pings), we decouple the ingestion from the persistence.
- **Ingestion**: Pings are parsed and immediately emitted over an internal **Event Bus**. This ensures WebSocket clients get updates within milliseconds.
- **Persistence**: A **Batch Ingester** buffers incoming logs in memory. It flushes them to PostgreSQL using `createMany` every 5 seconds or when the buffer reaches 50 items. This drastically reduces DB IOPS and prevents connection exhaustion during stress tests.

### 2. Indexing Strategy
- `Device(imei)`: Indexed for fast lookups during ingestion validation and history queries.
- `LocationLog(imei)`: Indexed to speed up history retrieval for specific vehicles.
- `LocationLog(timestamp)`: Indexed for time-range queries and ordering (e.g., "last 100 logs").

### 3. Role-Based Isolation
- **Admins**: Granted full access to all device broadcasts via a global WebSocket subscription.
- **Customers**: On connection, their assigned IMEIs are cached in the socket session. The server filters the broadcast stream to ensure they only receive pings for their own vehicles.

## Known Limitations
- **Horizontal Scaling**: Currently uses an in-memory `EventEmitter`. For multi-node deployments, a Redis Pub/Sub layer would be required.
- **Auth Simulation**: `/api/auth/token` is a convenience endpoint for testing; real production would integrate with a proper identity provider.

## Environment Variables
See [.env.example](.env.example) for required keys.
