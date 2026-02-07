const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image_url: string | null;
  in_stock: boolean;
  stock_quantity: number;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
}

class API {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async authenticateAdmin(username: string, password: string) {
    try {
      const data = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ token: this.token }),
      });
      this.token = null;
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Logout failed' };
    }
  }

  async getPublicProducts() {
    try {
      const data = await this.request('/api/products/public');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch products' };
    }
  }

  async getAllProducts() {
    try {
      const data = await this.request('/api/products');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch products' };
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    try {
      const data = await this.request('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create product' };
    }
  }

  async updateProduct(id: string, product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    try {
      const data = await this.request(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update product' };
    }
  }

  async deleteProduct(id: string) {
    try {
      const data = await this.request(`/api/products/${id}`, {
        method: 'DELETE',
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to delete product' };
    }
  }

  async getAllOrders() {
    try {
      const data = await this.request('/api/orders');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch orders' };
    }
  }

  async getOrderItems(orderId: string) {
    try {
      const data = await this.request(`/api/orders/${orderId}/items`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch order items' };
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const data = await this.request(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update order status' };
    }
  }

  async createOrder(order: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    delivery_address: string;
    items: Array<{
      product_id: string;
      product_name: string;
      product_price: number;
      quantity: number;
      subtotal: number;
    }>;
    total_amount: number;
    notes?: string;
  }) {
    try {
      const data = await this.request('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create order' };
    }
  }
}

export const api = new API();
