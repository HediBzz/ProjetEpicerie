/**
 * Script pour ajouter des produits de démonstration à PostgreSQL
 *
 * Usage: node database/add-demo-products.js
 */

import pg from 'pg';
const { Client } = pg;

const PG_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'epicerie',
  user: 'epicerie_user',
  password: 'epicerie_password_2024'
};

const demoProducts = [
  { name: 'Coca-Cola', description: 'Boisson gazeuse rafraîchissante', price: 2.50, unit: 'bouteille 1.5L', stock_quantity: 50, tags: ['Boissons'] },
  { name: 'Pain de mie', description: 'Pain de mie moelleux tranché', price: 1.80, unit: 'paquet', stock_quantity: 30, tags: ['Autres'] },
  { name: 'Lait demi-écrémé', description: 'Lait frais demi-écrémé', price: 1.20, unit: 'litre', stock_quantity: 40, tags: ['Boissons'] },
  { name: 'Chips nature', description: 'Chips croustillantes salées', price: 2.00, unit: 'paquet 150g', stock_quantity: 60, tags: ['Salé'] },
  { name: 'Chocolat au lait', description: 'Tablette de chocolat au lait', price: 2.30, unit: 'tablette 200g', stock_quantity: 45, tags: ['Sucré'] },
  { name: 'Bière blonde', description: 'Bière blonde artisanale', price: 3.50, unit: 'bouteille 75cl', stock_quantity: 35, tags: ['Alcool', 'Boissons'] },
  { name: 'Pizza surgelée', description: 'Pizza 4 fromages surgelée', price: 4.50, unit: 'pièce', stock_quantity: 25, tags: ['Surgelé'] },
  { name: 'Eau minérale', description: 'Eau minérale naturelle', price: 0.80, unit: 'bouteille 1.5L', stock_quantity: 100, tags: ['Boissons'] },
  { name: 'Bonbons', description: 'Assortiment de bonbons', price: 3.00, unit: 'sachet 200g', stock_quantity: 40, tags: ['Sucré'] },
  { name: 'Glace vanille', description: 'Crème glacée vanille de Madagascar', price: 5.50, unit: 'pot 500ml', stock_quantity: 20, tags: ['Surgelé', 'Sucré'] },
  { name: 'Vin rouge', description: 'Vin rouge de table', price: 6.00, unit: 'bouteille 75cl', stock_quantity: 30, tags: ['Alcool'] },
  { name: 'Café moulu', description: 'Café arabica moulu', price: 4.20, unit: 'paquet 250g', stock_quantity: 35, tags: ['Boissons'] },
  { name: 'Cacahuètes', description: 'Cacahuètes grillées salées', price: 2.80, unit: 'sachet 200g', stock_quantity: 50, tags: ['Salé'] },
  { name: 'Shampooing', description: 'Shampooing cheveux normaux', price: 3.90, unit: 'flacon 250ml', stock_quantity: 25, tags: ['Parfum'] },
  { name: 'Gel douche', description: 'Gel douche parfum frais', price: 3.50, unit: 'flacon 250ml', stock_quantity: 30, tags: ['Parfum'] }
];

async function addDemoProducts() {
  const client = new Client(PG_CONFIG);

  try {
    console.log('🔌 Connexion à PostgreSQL local...');
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // Récupérer l'ID de l'admin par défaut
    const adminResult = await client.query(
      "SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1"
    );

    if (adminResult.rows.length === 0) {
      console.error('❌ Aucun utilisateur admin trouvé. Assurez-vous que la base est initialisée.');
      return;
    }

    const adminId = adminResult.rows[0].id;
    console.log('📦 Ajout des produits de démonstration...\n');

    let added = 0;
    let skipped = 0;

    for (const product of demoProducts) {
      try {
        // Vérifier si le produit existe déjà
        const existingProduct = await client.query(
          'SELECT id FROM products WHERE name = $1',
          [product.name]
        );

        if (existingProduct.rows.length > 0) {
          console.log(`⏭️  "${product.name}" existe déjà, ignoré`);
          skipped++;
          continue;
        }

        await client.query(
          `INSERT INTO products (name, description, price, unit, in_stock, stock_quantity, tags, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            product.name,
            product.description,
            product.price,
            product.unit,
            true,
            product.stock_quantity,
            product.tags,
            adminId
          ]
        );

        console.log(`✅ Ajouté: ${product.name} - ${product.price}€`);
        added++;
      } catch (error) {
        console.error(`❌ Erreur lors de l'ajout de "${product.name}":`, error.message);
      }
    }

    console.log('\n🎉 Terminé!');
    console.log(`📊 Résumé: ${added} produits ajoutés, ${skipped} déjà existants`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Assurez-vous que PostgreSQL est démarré:');
    console.error('   docker-compose up -d postgres');
  } finally {
    await client.end();
    console.log('\n🔌 Déconnexion de PostgreSQL');
  }
}

addDemoProducts().catch(console.error);
