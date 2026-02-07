import express from 'express';
import cors from 'cors';
import pool, { query } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API running' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await query(
      'SELECT * FROM authenticate_admin($1, $2)',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    await query('SELECT delete_admin_session($1)', [token]);
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/products/public', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, description, price, unit, image_url, in_stock, stock_quantity, tags, created_at, updated_at FROM products WHERE in_stock = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const adminId = await query('SELECT validate_admin_session($1) as admin_id', [token]);

    if (!adminId.rows[0]?.admin_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const result = await query('SELECT * FROM products ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { name, description, price, unit, image_url, in_stock, stock_quantity, tags } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const adminId = await query('SELECT validate_admin_session($1) as admin_id', [token]);

    if (!adminId.rows[0]?.admin_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const result = await query(
      `INSERT INTO products (name, description, price, unit, image_url, in_stock, stock_quantity, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [name, description, price, unit, image_url, in_stock, stock_quantity, tags || [], adminId.rows[0].admin_id]
    );

    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.params;
  const { name, description, price, unit, image_url, in_stock, stock_quantity, tags } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const adminId = await query('SELECT validate_admin_session($1) as admin_id', [token]);

    if (!adminId.rows[0]?.admin_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    await query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, unit = $4, image_url = $5,
           in_stock = $6, stock_quantity = $7, tags = $8
       WHERE id = $9`,
      [name, description, price, unit, image_url, in_stock, stock_quantity, tags || [], id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const adminId = await query('SELECT validate_admin_session($1) as admin_id', [token]);

    if (!adminId.rows[0]?.admin_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/api/orders', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const adminId = await query('SELECT validate_admin_session($1) as admin_id', [token]);

    if (!adminId.rows[0]?.admin_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id/items', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const adminId = await query('SELECT validate_admin_session($1) as admin_id', [token]);

    if (!adminId.rows[0]?.admin_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const result = await query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.params;
  const { status } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const adminId = await query('SELECT validate_admin_session($1) as admin_id', [token]);

    if (!adminId.rows[0]?.admin_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_email, customer_phone, delivery_address, items, total_amount, notes } = req.body;

  if (!customer_name || !customer_email || !customer_phone || !delivery_address || !items || !total_amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, delivery_address, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [customer_name, customer_email, customer_phone, delivery_address, total_amount, notes || '']
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.product_id, item.product_name, item.product_price, item.quantity, item.subtotal]
      );
    }

    await client.query('COMMIT');
    res.json({ id: orderId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  } finally {
    client.release();
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend API listening on port ${PORT}`);
});
