/*
  # Add Stock Quantity Management

  1. Changes
    - Add `stock_quantity` column to products table
    - Update existing products to have a default quantity
    - Create function to decrease stock when orders are placed
    - Create trigger to automatically update stock on new orders
  
  2. New Features
    - Track exact inventory quantities
    - Automatically decrease stock when orders are placed
    - Prevent orders when stock is insufficient
*/

-- Add stock_quantity column to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0);
  END IF;
END $$;

-- Update existing products to have a default stock quantity
UPDATE products SET stock_quantity = 100 WHERE stock_quantity = 0 OR stock_quantity IS NULL;

-- Function to decrease stock quantity when order is placed
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

-- Create trigger to automatically decrease stock when order items are inserted
DROP TRIGGER IF EXISTS trigger_decrease_product_stock ON order_items;
CREATE TRIGGER trigger_decrease_product_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

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

-- Create trigger to restore stock when order is cancelled
DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_product_stock_on_cancel();