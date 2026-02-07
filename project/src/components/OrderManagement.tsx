import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { api, type Order, type OrderItem } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

export function OrderManagement() {
  const { getSessionToken } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);

    try {
      const { data, error } = await api.getAllOrders();

      if (!error && data) {
        setOrders(data);
      } else if (error) {
        console.error('Error loading orders:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }

    setLoading(false);
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await api.getOrderItems(orderId);

      if (!error && data) {
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, items: data } : order
          )
        );
      } else if (error) {
        console.error('Error loading order items:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    try {
      const { error } = await api.updateOrderStatus(orderId, status);

      if (!error) {
        loadOrders();
      } else {
        console.error('Error updating order status:', error);
        alert('Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      const order = orders.find((o) => o.id === orderId);
      if (order && !order.items) {
        loadOrderItems(orderId);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'confirmed':
        return <Package className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'completed':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Gestion des Commandes</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleOrderExpansion(order.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.customer_name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span>{getStatusLabel(order.status)}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Email: {order.customer_email}</p>
                    <p>Téléphone: {order.customer_phone}</p>
                    <p>
                      Commande passée le:{' '}
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {order.total_amount.toFixed(2)} €
                  </div>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Adresse de livraison</h4>
                    <p className="text-gray-700 whitespace-pre-line">{order.delivery_address}</p>
                  </div>

                  {order.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-gray-700">{order.notes}</p>
                    </div>
                  )}

                  {order.items && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Articles commandés</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-sm text-gray-600">
                              <th className="pb-2">Produit</th>
                              <th className="pb-2 text-right">Prix unitaire</th>
                              <th className="pb-2 text-right">Quantité</th>
                              <th className="pb-2 text-right">Sous-total</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {order.items.map((item) => (
                              <tr key={item.id} className="border-t border-gray-200">
                                <td className="py-2">{item.product_name}</td>
                                <td className="py-2 text-right">
                                  {item.product_price.toFixed(2)} €
                                </td>
                                <td className="py-2 text-right">{item.quantity}</td>
                                <td className="py-2 text-right font-medium">
                                  {item.subtotal.toFixed(2)} €
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'confirmed');
                          }}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Package className="h-4 w-4" />
                          <span>Confirmer</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'cancelled');
                          }}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Annuler</span>
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'completed');
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Marquer comme livrée</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">Aucune commande</div>
        )}
      </div>
    </div>
  );
}
