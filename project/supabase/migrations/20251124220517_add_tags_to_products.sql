/*
  # Add tags to products table

  1. Changes
    - Add `tags` column to `products` table
      - Type: text array (text[])
      - Nullable: true (products can have no tags)
      - Default: empty array
    
  2. Purpose
    - Allow admin to categorize products with tags
    - Enable filtering products by category in customer view
    - Examples: "Fruits", "Légumes", "Bio", "Promotion", etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'tags'
  ) THEN
    ALTER TABLE products ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;