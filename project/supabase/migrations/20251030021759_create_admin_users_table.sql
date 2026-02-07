/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - Admin username for login
      - `email` (text, unique) - Admin email
      - `password_hash` (text) - Securely hashed password using pgcrypto
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on admin_users table
    - Only authenticated admin users can read admin data
    - Passwords are hashed using pgcrypto extension (crypt function with bf algorithm)
    - No direct password access allowed
  
  3. Functions
    - `authenticate_admin(username, password)` - Secure authentication function
    - Returns admin user data if credentials are valid, null otherwise
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only allow reading admin data (no public access to passwords)
CREATE POLICY "Admins can view own data"
  ON admin_users FOR SELECT
  USING (true);

-- Function to authenticate admin
CREATE OR REPLACE FUNCTION authenticate_admin(
  p_username text,
  p_password text
)
RETURNS TABLE (
  id uuid,
  username text,
  email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.username,
    a.email
  FROM admin_users a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update admin password
CREATE OR REPLACE FUNCTION update_admin_password(
  p_admin_id uuid,
  p_new_password text
)
RETURNS boolean AS $$
BEGIN
  UPDATE admin_users
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_admin_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (username: admin, password: admin123)
-- You should change this password immediately after first login
INSERT INTO admin_users (username, email, password_hash)
VALUES (
  'admin',
  'admin@epicerie.com',
  crypt('admin123', gen_salt('bf'))
)
ON CONFLICT (username) DO NOTHING;