-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  imei VARCHAR(15) PRIMARY KEY,
  vehicle_number VARCHAR(50),
  customer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS location_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imei VARCHAR(15) NOT NULL REFERENCES devices(imei),
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  speed DECIMAL(6, 2) NOT NULL,
  ignition BOOLEAN NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS devices_imei_idx ON devices(imei);
CREATE INDEX IF NOT EXISTS devices_customer_idx ON devices(customer_id);
CREATE INDEX IF NOT EXISTS location_logs_imei_idx ON location_logs(imei);
CREATE INDEX IF NOT EXISTS location_logs_timestamp_idx ON location_logs(timestamp);
CREATE INDEX IF NOT EXISTS location_logs_imei_timestamp_idx ON location_logs(imei, timestamp);
