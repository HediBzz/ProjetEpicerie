/*
  # Fix Critical Security Issues
  
  This migration addresses severe security vulnerabilities in the application:
  
  ## Security Issues Fixed
  
  1. **Critical RLS Policy Vulnerabilities**
     - Previous policies used `USING (true)` allowing ANYONE to modify/delete products
     - Previous policies allowed ANYONE to view all orders and customer data
     - No authentication verification before sensitive operations
  
  2. **Session Management**
     - New `admin_sessions` table for secure session token management
     - Session tokens are generated server-side using cryptographic functions
     - Sessions expire after 24 hours for security
     - Tokens are validated before any admin operation
  
  3. **Admin Users Protection**
     - Restrict access to admin_users table (no public reading of admin data)
     - Only allow secure functions to query admin data
  
  4. **New Secure Functions**
     - `create_admin_session(admin_id)` - Creates a secure session token
     - `validate_admin_session(token)` - Validates and returns admin_id if valid
     - `delete_admin_session(token)` - Logs out admin by deleting session
     - `admin_authenticate(username, password)` - New secure authentication
     - `admin_create_product(...)` - Secure function to create products
     - `admin_update_product(...)` - Secure function to update products
     - `admin_delete_product(...)` - Secure function to delete products
  
  5. **Restrictive RLS Policies**
     - Products: Public can only SELECT (read), admins use secure functions for writes
     - Orders: Public can only INSERT (create orders), admins use secure functions to view/update
     - Order items: Public can only INSERT, admins use secure functions to view
     - Admin users: No direct access, only through secure functions
     - Admin sessions: Only accessible through secure functions
  
  ## Important Notes
  
  - All admin operations now require a valid session token
  - Session tokens must be passed to secure functions
  - Frontend will need to be updated to use new secure functions
  - Previous default admin password should be changed immediately
*/

-- Create admin_sessions table for secure session management
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_activity timestamptz DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Enable RLS on admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Drop all existing dangerous policies
DROP POLICY IF EXISTS "Allow insert products" ON products;
DROP POLICY IF EXISTS "Allow update products" ON products;
DROP POLICY IF EXISTS "Allow delete products" ON products;
DROP POLICY IF EXISTS "Allow view orders" ON orders;
DROP POLICY IF EXISTS "Allow update orders" ON orders;
DROP POLICY IF EXISTS "Allow view order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view own data" ON admin_users;

-- Secure Products policies - Public can only read
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  USING (true);

-- No direct INSERT/UPDATE/DELETE policies for products - must use secure functions

-- Secure Orders policies - Public can create, but not view others' orders
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE policies for orders - must use secure functions for admin access

-- Secure Order Items policies - Public can create only
CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Admin Users policies - No public access at all
CREATE POLICY "No direct access to admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "No direct access to admin users public"
  ON admin_users FOR SELECT
  TO anon
  USING (false);

-- Admin Sessions policies - No direct access
CREATE POLICY "No direct access to sessions"
  ON admin_sessions FOR ALL
  USING (false);

-- Function to create admin session with token
CREATE OR REPLACE FUNCTION create_admin_session(p_admin_id uuid)
RETURNS TABLE (
  session_token text,
  expires_at timestamptz
) AS $$
DECLARE
  v_token text;
  v_expires_at timestamptz;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := now() + interval '24 hours';
  
  -- Clean up expired sessions for this admin
  DELETE FROM admin_sessions 
  WHERE admin_id = p_admin_id AND expires_at < now();
  
  -- Create new session
  INSERT INTO admin_sessions (admin_id, session_token, expires_at)
  VALUES (p_admin_id, v_token, v_expires_at);
  
  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete session (logout)
CREATE OR REPLACE FUNCTION delete_admin_session(p_token text)
RETURNS boolean AS $$
BEGIN
  DELETE FROM admin_sessions WHERE session_token = p_token;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure admin functions for products
CREATE OR REPLACE FUNCTION admin_get_all_products(p_token text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  unit text,
  image_url text,
  in_stock boolean,
  stock_quantity integer,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  RETURN QUERY SELECT p.* FROM products p ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_create_product(
  p_token text,
  p_name text,
  p_description text,
  p_price numeric,
  p_unit text,
  p_image_url text,
  p_in_stock boolean,
  p_stock_quantity integer,
  p_tags text[]
)
RETURNS uuid AS $$
DECLARE
  v_product_id uuid;
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  INSERT INTO products (name, description, price, unit, image_url, in_stock, stock_quantity, tags)
  VALUES (p_name, p_description, p_price, p_unit, p_image_url, p_in_stock, p_stock_quantity, p_tags)
  RETURNING id INTO v_product_id;
  
  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_product(
  p_token text,
  p_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_unit text,
  p_image_url text,
  p_in_stock boolean,
  p_stock_quantity integer,
  p_tags text[]
)
RETURNS boolean AS $$
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  UPDATE products
  SET 
    name = p_name,
    description = p_description,
    price = p_price,
    unit = p_unit,
    image_url = p_image_url,
    in_stock = p_in_stock,
    stock_quantity = p_stock_quantity,
    tags = p_tags
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_product(
  p_token text,
  p_id uuid
)
RETURNS boolean AS $$
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  DELETE FROM products WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure admin functions for orders
CREATE OR REPLACE FUNCTION admin_get_all_orders(p_token text)
RETURNS TABLE (
  id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  delivery_address text,
  total_amount numeric,
  status text,
  notes text,
  created_at timestamptz
) AS $$
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  RETURN QUERY SELECT o.* FROM orders o ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_order_items(p_token text, p_order_id uuid)
RETURNS TABLE (
  id uuid,
  order_id uuid,
  product_id uuid,
  product_name text,
  product_price numeric,
  quantity integer,
  subtotal numeric
) AS $$
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  RETURN QUERY 
  SELECT oi.* 
  FROM order_items oi 
  WHERE oi.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_order_status(
  p_token text,
  p_order_id uuid,
  p_status text
)
RETURNS boolean AS $$
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  -- Validate status
  IF p_status NOT IN ('pending', 'confirmed', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  
  UPDATE orders
  SET status = p_status
  WHERE id = p_order_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate authenticate_admin with session support
DROP FUNCTION IF EXISTS authenticate_admin(text, text);

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
  
  -- Create session
  SELECT s.session_token, s.expires_at
  INTO v_token, v_expires_at
  FROM create_admin_session(v_admin_id) s;
  
  -- Return admin data with session
  RETURN QUERY SELECT v_admin_id, v_username, v_email, v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;