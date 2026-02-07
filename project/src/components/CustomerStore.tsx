import { useState, useEffect } from 'react';
import { Store, MapPin, Clock, Phone } from 'lucide-react';
import { api, type Product } from '../lib/api';

export function CustomerStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string>('Tous');

  const storeImages = [
    '/img_0035.jpg',
    '/img_0036.jpg',
    '/img_0038.jpg',
    '/img_0039.jpg',
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % storeImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await api.getPublicProducts();

    if (!error && data) {
      setProducts(data);
      setFilteredProducts(data);
    }
    setLoading(false);
  };

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    products.forEach((product) => {
      if (product.tags) {
        product.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTag(tag);
    if (tag === 'Tous') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((product) => product.tags && product.tags.includes(tag)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-blue-600 text-lg font-medium">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="relative h-auto min-h-[400px] md:min-h-[600px] text-white overflow-hidden">
        <div className="absolute inset-0">
          {storeImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentImageIndex
                  ? 'translate-x-0 opacity-100'
                  : index === (currentImageIndex - 1 + storeImages.length) % storeImages.length
                  ? '-translate-x-full opacity-0'
                  : 'translate-x-full opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Épicerie ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-blue-800/70"></div>
            </div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-12 text-center">
          <div className="space-y-4 md:space-y-8 py-4 md:py-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-full animate-bounce-slow">
              <Store className="h-7 w-7 md:h-10 md:w-10 text-white" />
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold animate-fade-in">Mon Épicerie</h1>
            <p className="text-base md:text-xl lg:text-2xl text-blue-100 animate-fade-in-delay px-4">
              Produits frais et de qualité pour votre quotidien
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mt-6 md:mt-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 transform hover:scale-105 transition-all duration-300 hover:bg-white/20">
                <MapPin className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-blue-100" />
                <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2">Adresse</h3>
                <p className="text-xs md:text-sm text-blue-100">2 Pl. Flandrin</p>
                <p className="text-xs md:text-sm text-blue-100">38480 Le Pont-de-Beauvoisin</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 transform hover:scale-105 transition-all duration-300 hover:bg-white/20">
                <Clock className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-blue-100" />
                <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2">Horaires</h3>
                <p className="text-xs md:text-sm text-blue-100">Lun - Jeu : 14h - 1h</p>
                <p className="text-xs md:text-sm text-blue-100">Ven - Sam : 14h - 2h</p>
                <p className="text-xs md:text-sm text-blue-100">Dim : 16h - 11h</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 transform hover:scale-105 transition-all duration-300 hover:bg-white/20">
                <Phone className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-blue-100" />
                <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2">Contact</h3>
                <p className="text-xs md:text-sm text-blue-100">06 26 18 43 21</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 transform hover:scale-105 transition-all duration-300 hover:bg-white/20 md:col-span-3">
                <Phone className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-blue-100" />
                <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2">Click & Collect</h3>
                <p className="text-xs md:text-sm text-blue-100">
                  Service disponible dans plusieurs points de retrait autour de l'épicerie.
                </p>
                <p className="text-xs md:text-sm text-blue-100 mt-1">
                  Pour connaître les points disponibles et réserver votre commande,
                  merci de nous contacter par téléphone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Nos Produits</h2>
          <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-12">
          <button
            onClick={() => handleTagFilter('Tous')}
            className={`px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
              selectedTag === 'Tous'
                ? 'bg-blue-600 text-white scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tous
          </button>
          {getAllTags().map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className={`px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun produit dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-32 sm:h-48 md:h-56 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-32 sm:h-48 md:h-56 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Store className="h-10 w-10 md:h-16 md:w-16 text-blue-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-blue-600 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                  {product.stock_quantity}
                </div>
              </div>

              <div className="p-3 md:p-6">
                <h3 className="font-bold text-sm md:text-xl text-gray-900 mb-1 md:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4 line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-baseline justify-between mb-2 md:mb-4">
                  <div>
                    <span className="text-lg md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      {product.price.toFixed(2)}
                    </span>
                    <span className="text-sm md:text-lg font-semibold text-gray-700 ml-0.5 md:ml-1">€</span>
                  </div>
                  <span className="text-xs md:text-sm text-gray-500 font-medium px-2 py-0.5 md:px-3 md:py-1 bg-gray-100 rounded-full">
                    / {product.unit}
                  </span>
                </div>

                <div className="pt-2 md:pt-4 border-t border-gray-100">
                  <div className="inline-flex items-center text-xs md:text-sm text-blue-600 font-medium">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-600 rounded-full mr-1.5 md:mr-2 animate-pulse"></div>
                    <span className="hidden sm:inline">Disponible en magasin</span>
                    <span className="sm:hidden">Disponible</span>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-20">
            <Store className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-medium">Aucun produit disponible pour le moment</p>
            <p className="text-gray-400 mt-2">Revenez bientôt pour découvrir nos nouveautés</p>
          </div>
        )}
      </main>

      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center justify-center md:justify-start">
                <Store className="h-5 w-5 mr-2 text-blue-400" />
                Mon Épicerie
              </h3>
              <p className="text-gray-400 text-sm">
                Votre épicerie de quartier pour des produits frais et de qualité à Pont de Beauvoisin
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Horaires</h3>
              <p className="text-gray-400 text-sm mb-1">Lundi - Jeudi: 14h00 - 01h00</p>
              <p className="text-gray-400 text-sm mb-1">Vendredi - Samedi: 14h00 - 02h00</p>
              <p className="text-gray-400 text-sm">Dimanche: 16h00 - 01h00</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <p className="text-gray-400 text-sm mb-1">📍 2 Pl. Flandrin, 38480 Le Pont-de-Beauvoisin</p>
              <p className="text-gray-400 text-sm mb-1">📞 06 26 18 43 21</p>
              <p className="text-gray-400 text-sm">👻 nightshop.p2b38</p>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Hédi Bouazza. Tous droits réservés.</p>
            <p className="mt-2"><a href="mailto:hedib2003@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">hedib2003@gmail.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
