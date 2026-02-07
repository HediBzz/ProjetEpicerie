/*
  # Add Created By to Products
  
  1. Changes
    - Add `created_by` column to products table
    - References admin_users table
    - Update all existing products to be owned by the 'morgan' admin user
  
  2. Security
    - Products now track which admin created them
    - Maintains referential integrity with admin_users
*/

-- Add created_by column to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE products ADD COLUMN created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update all existing products to be owned by 'morgan' admin user
UPDATE products
SET created_by = (
  SELECT id FROM admin_users WHERE username = 'morgan' LIMIT 1
)
WHERE created_by IS NULL;