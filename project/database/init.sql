-- =============================================
-- Epicerie Database Initialization Script
-- PostgreSQL 16
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Sessions Table (for secure authentication)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_activity timestamptz DEFAULT now()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  unit text DEFAULT 'pièce',
  image_url text,
  in_stock boolean DEFAULT true,
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_price numeric(10, 2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create admin user with hashed password
CREATE OR REPLACE FUNCTION create_admin_user(
  p_username text,
  p_email text,
  p_password text
)
RETURNS uuid AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  INSERT INTO admin_users (username, email, password_hash)
  VALUES (
    p_username,
    p_email,
    crypt(p_password, gen_salt('bf'))
  )
  RETURNING id INTO v_admin_id;

  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql;

-- Function to authenticate admin and create session
CREATE OR REPLACE FUNCTION authenticate_admin(
  p_username text,
  p_password text
)
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  session_token text,
  expires_at timestamptz
) AS $$
DECLARE
  v_admin_id uuid;
  v_username text;
  v_email text;
  v_token text;
  v_expires_at timestamptz;
BEGIN
  -- Authenticate
  SELECT a.id, a.username, a.email
  INTO v_admin_id, v_username, v_email
  FROM admin_users a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash);

  -- If authentication failed, return nothing
  IF v_admin_id IS NULL THEN
    RETURN;
  END IF;

  -- Generate session token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := now() + interval '24 hours';

  -- Clean up expired sessions for this admin
  DELETE FROM admin_sessions
  WHERE admin_id = v_admin_id AND expires_at < now();

  -- Create new session
  INSERT INTO admin_sessions (admin_id, session_token, expires_at)
  VALUES (v_admin_id, v_token, v_expires_at);

  -- Return admin data with session
  RETURN QUERY SELECT v_admin_id, v_username, v_email, v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Function to validate session and return admin_id
CREATE OR REPLACE FUNCTION validate_admin_session(p_token text)
RETURNS uuid AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Find valid session
  SELECT admin_id INTO v_admin_id
  FROM admin_sessions
  WHERE session_token = p_token
    AND expires_at > now();

  -- Update last activity if session found
  IF v_admin_id IS NOT NULL THEN
    UPDATE admin_sessions
    SET last_activity = now()
    WHERE session_token = p_token;
  END IF;

  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete session (logout)
CREATE OR REPLACE FUNCTION delete_admin_session(p_token text)
RETURNS boolean AS $$
BEGIN
  DELETE FROM admin_sessions WHERE session_token = p_token;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to decrease stock when order is placed
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_product_record RECORD;
BEGIN
  -- Get product info
  SELECT id, stock_quantity, name INTO v_product_record
  FROM products
  WHERE id = NEW.product_id;

  -- Check if product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with id % does not exist', NEW.product_id;
  END IF;

  -- Check if enough stock is available
  IF v_product_record.stock_quantity < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
      v_product_record.name, v_product_record.stock_quantity, NEW.quantity;
  END IF;

  -- Decrease the stock
  UPDATE products
  SET
    stock_quantity = stock_quantity - NEW.quantity,
    in_stock = CASE WHEN stock_quantity - NEW.quantity <= 0 THEN false ELSE true END
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to restore stock if order is cancelled
CREATE OR REPLACE FUNCTION restore_product_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  v_order_item RECORD;
BEGIN
  -- Only restore stock if order status changed to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Restore stock for all items in this order
    FOR v_order_item IN
      SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id
    LOOP
      UPDATE products
      SET
        stock_quantity = stock_quantity + v_order_item.quantity,
        in_stock = true
      WHERE id = v_order_item.product_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for products updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_users updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically decrease stock when order items are inserted
DROP TRIGGER IF EXISTS trigger_decrease_product_stock ON order_items;
CREATE TRIGGER trigger_decrease_product_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

-- Trigger to restore stock when order is cancelled
DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_product_stock_on_cancel();

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO admin_users (username, email, password_hash)
VALUES (
  'admin',
  'admin@epicerie.com',
  crypt('admin123', gen_salt('bf'))
)
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- DEMO PRODUCTS
-- =============================================

-- Insert demo products
INSERT INTO products (name, description, price, unit, image_url, in_stock, stock_quantity, tags, created_by)
SELECT
  name, description, price, unit, image_url, in_stock, stock_quantity, tags,
  (SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1)
FROM (VALUES
  ('Coca-Cola', 'Boisson gazeuse rafraîchissante', 2.50, 'bouteille 1.5L', NULL, true, 50, ARRAY['Boissons']::text[]),
  ('Pain de mie', 'Pain de mie moelleux tranché', 1.80, 'paquet', NULL, true, 30, ARRAY['Autres']::text[]),
  ('Lait demi-écrémé', 'Lait frais demi-écrémé', 1.20, 'litre', NULL, true, 40, ARRAY['Boissons']::text[]),
  ('Chips nature', 'Chips croustillantes salées', 2.00, 'paquet 150g', NULL, true, 60, ARRAY['Salé']::text[]),
  ('Chocolat au lait', 'Tablette de chocolat au lait', 2.30, 'tablette 200g', NULL, true, 45, ARRAY['Sucré']::text[]),
  ('Bière blonde', 'Bière blonde artisanale', 3.50, 'bouteille 75cl', NULL, true, 35, ARRAY['Alcool', 'Boissons']::text[]),
  ('Pizza surgelée', 'Pizza 4 fromages surgelée', 4.50, 'pièce', NULL, true, 25, ARRAY['Surgelé']::text[]),
  ('Eau minérale', 'Eau minérale naturelle', 0.80, 'bouteille 1.5L', NULL, true, 100, ARRAY['Boissons']::text[]),
  ('Bonbons', 'Assortiment de bonbons', 3.00, 'sachet 200g', NULL, true, 40, ARRAY['Sucré']::text[]),
  ('Glace vanille', 'Crème glacée vanille de Madagascar', 5.50, 'pot 500ml', NULL, true, 20, ARRAY['Surgelé', 'Sucré']::text[]),
  ('Vin rouge', 'Vin rouge de table', 6.00, 'bouteille 75cl', NULL, true, 30, ARRAY['Alcool']::text[]),
  ('Café moulu', 'Café arabica moulu', 4.20, 'paquet 250g', NULL, true, 35, ARRAY['Boissons']::text[]),
  ('Cacahuètes', 'Cacahuètes grillées salées', 2.80, 'sachet 200g', NULL, true, 50, ARRAY['Salé']::text[]),
  ('Shampooing', 'Shampooing cheveux normaux', 3.90, 'flacon 250ml', NULL, true, 25, ARRAY['Parfum']::text[]),
  ('Gel douche', 'Gel douche parfum frais', 3.50, 'flacon 250ml', NULL, true, 30, ARRAY['Parfum']::text[])
) AS demo(name, description, price, unit, image_url, in_stock, stock_quantity, tags)
ON CONFLICT DO NOTHING;

-- =============================================
-- CLEANUP FUNCTION (Optional)
-- =============================================

-- Function to clean up expired sessions (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
