/*
  # Seed Demo Data for DairyDash
*/

-- Insert demo apartments
INSERT INTO apartments (name, number_of_blocks, address, status) 
VALUES 
  ('Sunrise Apartments', 5, '123 Main Street, City Center', 'active'),
  ('Green Valley Complex', 8, '456 Park Avenue, Suburban Area', 'active'),
  ('Metro Heights', 12, '789 Central Road, Business District', 'active')
ON CONFLICT (name) DO NOTHING;

-- Insert demo customers
INSERT INTO customers (name, phone, apartment_id, block, floor, flat_no, address, status)
SELECT 
  'Raj Kumar', '9876543210', (SELECT id FROM apartments WHERE name = 'Sunrise Apartments' LIMIT 1), 'A', '1', '101', 'Sunrise Apartments', 'active'
ON CONFLICT (phone) DO NOTHING;

INSERT INTO customers (name, phone, apartment_id, block, floor, flat_no, address, status)
SELECT 
  'Priya Sharma', '9876543211', (SELECT id FROM apartments WHERE name = 'Sunrise Apartments' LIMIT 1), 'A', '2', '201', 'Sunrise Apartments', 'active'
ON CONFLICT (phone) DO NOTHING;

INSERT INTO customers (name, phone, apartment_id, block, floor, flat_no, address, status)
SELECT 
  'Amit Patel', '9876543212', (SELECT id FROM apartments WHERE name = 'Green Valley Complex' LIMIT 1), 'B', '1', '102', 'Green Valley Complex', 'active'
ON CONFLICT (phone) DO NOTHING;

INSERT INTO customers (name, phone, apartment_id, block, floor, flat_no, address, status)
SELECT 
  'Neha Verma', '9876543213', (SELECT id FROM apartments WHERE name = 'Green Valley Complex' LIMIT 1), 'B', '3', '301', 'Green Valley Complex', 'active'
ON CONFLICT (phone) DO NOTHING;

INSERT INTO customers (name, phone, apartment_id, block, floor, flat_no, address, status)
SELECT 
  'Vikram Singh', '9876543214', (SELECT id FROM apartments WHERE name = 'Metro Heights' LIMIT 1), 'C', '5', '501', 'Metro Heights', 'active'
ON CONFLICT (phone) DO NOTHING;

INSERT INTO customers (name, phone, apartment_id, block, floor, flat_no, address, status)
SELECT 
  'Anjali Gupta', '9876543215', (SELECT id FROM apartments WHERE name = 'Metro Heights' LIMIT 1), 'C', '6', '601', 'Metro Heights', 'active'
ON CONFLICT (phone) DO NOTHING;

-- Insert subscriptions
INSERT INTO subscriptions (customer_id, milk_type, default_qty, price_per_liter, is_active)
SELECT id, 'Regular', 2, 50, true FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE customer_id = c.id);

-- Insert demo deliveries
INSERT INTO deliveries (customer_id, delivery_date, quantity, status)
SELECT c.id, CURRENT_DATE - (d.n - 1), 2, CASE WHEN (d.n % 3) = 0 THEN 'skipped' ELSE 'delivered' END
FROM customers c, GENERATE_SERIES(1, 10) d(n)
WHERE NOT EXISTS (
  SELECT 1 FROM deliveries 
  WHERE customer_id = c.id AND delivery_date = CURRENT_DATE - (d.n - 1)
);
