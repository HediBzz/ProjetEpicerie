import { useState } from 'react';
import { LogOut, Package, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';

type Tab = 'products' | 'orders';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Administration Épicerie</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 border-b border-blue-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-300 ${
              activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Package className="h-5 w-5" />
            <span>Produits</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-300 ${
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Commandes</span>
          </button>
        </div>

        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'orders' && <OrderManagement />}
      </div>
    </div>
  );
}
