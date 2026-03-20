-- Insert admin user
INSERT INTO users (email, role, password_hash) 
VALUES ('admin@fleetpulse.com', 'Admin', '$2a$10$nycSyJDyRrF3NQfix85ToO47aXvBZM70Z0LNMKxJ9a0s/.tFqjfe2')
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Insert customer user  
INSERT INTO users (email, role, password_hash)
VALUES ('customer@example.com', 'Customer', '$2a$10$nycSyJDyRrF3NQfix85ToO47aXvBZM70Z0LNMKxJ9a0s/.tFqjfe2')
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Get customer ID for device assignment
DO $$
DECLARE
  customer_uuid UUID;
BEGIN
  SELECT id INTO customer_uuid FROM users WHERE email = 'customer@example.com';
  
  -- Insert devices
  INSERT INTO devices (imei, vehicle_number, customer_id) VALUES
    ('354678901234561', 'MH-01-AB-1234', customer_uuid),
    ('354678901234562', 'MH-02-CD-5678', customer_uuid),
    ('354678901234563', 'MH-03-EF-9012', customer_uuid),
    ('354678901234564', 'DL-01-GH-3456', NULL),
    ('354678901234565', 'KA-05-IJ-7890', NULL)
  ON CONFLICT (imei) DO NOTHING;
END $$;

-- Show results
SELECT 'Users created:' as status;
SELECT email, role FROM users;

SELECT 'Devices created:' as status;
SELECT imei, vehicle_number FROM devices;
