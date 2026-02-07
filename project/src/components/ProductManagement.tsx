import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Package, PackageX } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ProductManagement() {
  const { getSessionToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'pièce',
    image_url: '',
    stock_quantity: '100',
    in_stock: true,
    tags: [] as string[],
  });

  const commonTags = ['Boissons', 'Alcool', 'Sucré', 'Salé', 'Surgelé', 'Parfum', 'Autres'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const token = getSessionToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_get_all_products', {
        p_token: token,
      });

      if (!error && data) {
        setProducts(data);
      } else if (error) {
        console.error('Error loading products:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }

    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getSessionToken();

    if (!token) return;

    try {
      const { error } = await supabase.rpc('admin_create_product', {
        p_token: token,
        p_name: formData.name,
        p_description: formData.description,
        p_price: parseFloat(formData.price),
        p_unit: formData.unit,
        p_image_url: formData.image_url || null,
        p_stock_quantity: parseInt(formData.stock_quantity) || 0,
        p_in_stock: formData.in_stock,
        p_tags: formData.tags,
      });

      if (!error) {
        setShowAddForm(false);
        setFormData({ name: '', description: '', price: '', unit: 'pièce', image_url: '', stock_quantity: '100', in_stock: true, tags: [] });
        loadProducts();
      } else {
        console.error('Error adding product:', error);
        alert('Erreur lors de l\'ajout du produit');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  const handleUpdate = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const token = getSessionToken();
    if (!token) return;

    try {
      const { error } = await supabase.rpc('admin_update_product', {
        p_token: token,
        p_id: id,
        p_name: product.name,
        p_description: product.description,
        p_price: product.price,
        p_unit: product.unit,
        p_image_url: product.image_url || null,
        p_stock_quantity: product.stock_quantity,
        p_in_stock: product.in_stock,
        p_tags: product.tags || [],
      });

      if (!error) {
        setEditingId(null);
        loadProducts();
      } else {
        console.error('Error updating product:', error);
        alert('Erreur lors de la mise à jour du produit');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Erreur lors de la mise à jour du produit');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    const token = getSessionToken();
    if (!token) return;

    try {
      const { error } = await supabase.rpc('admin_delete_product', {
        p_token: token,
        p_id: id,
      });

      if (!error) {
        loadProducts();
      } else {
        console.error('Error deleting product:', error);
        alert('Erreur lors de la suppression du produit');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const toggleStock = async (id: string, currentStatus: boolean) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const token = getSessionToken();
    if (!token) return;

    try {
      const { error } = await supabase.rpc('admin_update_product', {
        p_token: token,
        p_id: id,
        p_name: product.name,
        p_description: product.description,
        p_price: product.price,
        p_unit: product.unit,
        p_image_url: product.image_url || null,
        p_stock_quantity: product.stock_quantity,
        p_in_stock: !currentStatus,
        p_tags: product.tags || [],
      });

      if (!error) {
        loadProducts();
      } else {
        console.error('Error toggling stock:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Gestion des Produits</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Nouveau Produit</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unité</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pièce">pièce</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="mL">mL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantité en stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Image</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Étiquettes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {commonTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (formData.tags.includes(tag)) {
                        setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
                      } else {
                        setFormData({ ...formData, tags: [...formData.tags, tag] });
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-gray-600">Sélectionnées:</span>
                  {formData.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="in_stock"
                checked={formData.in_stock}
                onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="in_stock" className="text-sm font-medium text-gray-700">
                En stock
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name: '', description: '', price: '', unit: 'pièce', image_url: '', stock_quantity: '100', in_stock: true, tags: [] });
                }}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Annuler</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Étiquettes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                      <textarea
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500">{product.description}</div>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <span className="text-gray-900">{product.price.toFixed(2)} €</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <select
                      value={product.unit}
                      onChange={(e) => updateProduct(product.id, 'unit', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="pièce">pièce</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="mL">mL</option>
                    </select>
                  ) : (
                    <span className="text-gray-700">{product.unit}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      min="0"
                      value={product.stock_quantity}
                      onChange={(e) => updateProduct(product.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">{product.stock_quantity}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {commonTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const currentTags = product.tags || [];
                              if (currentTags.includes(tag)) {
                                updateProduct(product.id, 'tags', currentTags.filter((t) => t !== tag));
                              } else {
                                updateProduct(product.id, 'tags', [...currentTags, tag]);
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                              (product.tags || []).includes(tag)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {product.tags && product.tags.length > 0 ? (
                        product.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Aucune</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.in_stock
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.in_stock ? 'En stock' : 'Indisponible'}
                    </span>
                    <button
                      onClick={() => toggleStock(product.id, product.in_stock)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        product.in_stock
                          ? 'bg-red-100 hover:bg-red-200 text-red-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                      title={product.in_stock ? 'Marquer indisponible' : 'Marquer en stock'}
                    >
                      {product.in_stock ? (
                        <PackageX className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === product.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdate(product.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          loadProducts();
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(product.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">Aucun produit</div>
        )}
      </div>
    </div>
  );
}
