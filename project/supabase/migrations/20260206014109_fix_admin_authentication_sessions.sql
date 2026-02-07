/*
  # Fix Admin Authentication System
  
  1. New Tables
    - `admin_sessions` - Store active admin sessions
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key to admin_users)
      - `session_token` (text, unique) - Session token
      - `expires_at` (timestamptz) - Session expiration
      - `created_at` (timestamptz) - Session creation time
  
  2. Functions
    - `authenticate_admin` - Updated to create session and return token
    - `delete_admin_session` - Delete a session by token
    - `cleanup_expired_sessions` - Remove expired sessions
  
  3. Security
    - Enable RLS on admin_sessions
    - Sessions expire after 7 days
    - Old sessions are automatically cleaned up
*/

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Allow reading sessions
CREATE POLICY "Allow read admin_sessions"
  ON admin_sessions FOR SELECT
  USING (true);

-- Allow inserting sessions
CREATE POLICY "Allow insert admin_sessions"
  ON admin_sessions FOR INSERT
  WITH CHECK (true);

-- Allow deleting sessions
CREATE POLICY "Allow delete admin_sessions"
  ON admin_sessions FOR DELETE
  USING (true);

-- Update authenticate_admin function to create session
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
  v_expires timestamptz;
BEGIN
  -- Authenticate user
  SELECT a.id, a.username, a.email
  INTO v_admin_id, v_username, v_email
  FROM admin_users a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash);
  
  -- If authentication failed, return empty
  IF v_admin_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate session token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := now() + interval '7 days';
  
  -- Create session
  INSERT INTO admin_sessions (admin_id, session_token, expires_at)
  VALUES (v_admin_id, v_token, v_expires);
  
  -- Return admin data with session
  RETURN QUERY
  SELECT v_admin_id, v_username, v_email, v_token, v_expires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete session
CREATE OR REPLACE FUNCTION delete_admin_session(
  p_token text
)
RETURNS boolean AS $$
BEGIN
  DELETE FROM admin_sessions
  WHERE session_token = p_token;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify and get admin from session
CREATE OR REPLACE FUNCTION verify_admin_session(
  p_token text
)
RETURNS TABLE (
  id uuid,
  username text,
  email text
) AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM admin_sessions
  WHERE expires_at < now();
  
  -- Return admin if session is valid
  RETURN QUERY
  SELECT a.id, a.username, a.email
  FROM admin_sessions s
  JOIN admin_users a ON a.id = s.admin_id
  WHERE s.session_token = p_token
    AND s.expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM admin_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;