/*
  # Update Product Functions to Support Created By
  
  1. Changes
    - Update `admin_get_all_products` to return `created_by` field
    - Update `admin_create_product` to set `created_by` to the authenticated admin
  
  2. Security
    - Products now track which admin created them
    - Created by field is automatically set based on the session token
*/

-- Drop and recreate admin_get_all_products to include created_by
DROP FUNCTION IF EXISTS admin_get_all_products(text);

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
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Validate session
  IF validate_admin_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  RETURN QUERY SELECT p.id, p.name, p.description, p.price, p.unit, p.image_url, p.in_stock, p.stock_quantity, p.tags, p.created_by, p.created_at, p.updated_at FROM products p ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate admin_create_product to set created_by
DROP FUNCTION IF EXISTS admin_create_product(text, text, text, numeric, text, text, boolean, integer, text[]);

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
  v_admin_id uuid;
BEGIN
  -- Validate session and get admin_id
  v_admin_id := validate_admin_session(p_token);
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  INSERT INTO products (name, description, price, unit, image_url, in_stock, stock_quantity, tags, created_by)
  VALUES (p_name, p_description, p_price, p_unit, p_image_url, p_in_stock, p_stock_quantity, p_tags, v_admin_id)
  RETURNING id INTO v_product_id;
  
  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;