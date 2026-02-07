/**
 * Script de migration des données Supabase vers PostgreSQL local
 *
 * Ce script:
 * 1. Se connecte à votre base Supabase
 * 2. Extrait toutes les données (products, orders, order_items, admin_users)
 * 3. Les importe dans votre PostgreSQL local
 *
 * Usage:
 *   npm install @supabase/supabase-js pg
 *   node database/migrate-from-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Client } = pg;

// Configuration Supabase (source)
const SUPABASE_URL = 'https://kfqxxvwhxgvgujxkmskp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcXh4dndoeGd2Z3VqeGttc2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODMwNDQsImV4cCI6MjA3NzM1OTA0NH0.v5oTVMYRTC08lyy1K-BPmBXyeT3_s1Hcs4Pd-TDdttI';

// Configuration PostgreSQL local (destination)
const PG_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'epicerie',
  user: 'epicerie_user',
  password: 'epicerie_password_2024'
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
  const pgClient = new Client(PG_CONFIG);

  try {
    console.log('🔌 Connexion à PostgreSQL local...');
    await pgClient.connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // ==========================================
    // 1. Migrer les admin_users
    // ==========================================
    console.log('👤 Migration des utilisateurs admin...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');

    if (adminError) {
      console.warn('⚠️  Erreur lors de la récupération des admin_users:', adminError.message);
    } else if (adminUsers && adminUsers.length > 0) {
      for (const admin of adminUsers) {
        await pgClient.query(
          `INSERT INTO admin_users (id, username, email, password_hash, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             username = EXCLUDED.username,
             email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             updated_at = EXCLUDED.updated_at`,
          [admin.id, admin.username, admin.email, admin.password_hash, admin.created_at, admin.updated_at]
        );
      }
      console.log(`✅ ${adminUsers.length} admin(s) migré(s)\n`);
    } else {
      console.log('ℹ️  Aucun admin à migrer\n');
    }

    // ==========================================
    // 2. Migrer les products
    // ==========================================
    console.log('📦 Migration des produits...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      console.warn('⚠️  Erreur lors de la récupération des products:', productsError.message);
    } else if (products && products.length > 0) {
      for (const product of products) {
        await pgClient.query(
          `INSERT INTO products (id, name, description, price, unit, image_url, in_stock, stock_quantity, tags, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             unit = EXCLUDED.unit,
             image_url = EXCLUDED.image_url,
             in_stock = EXCLUDED.in_stock,
             stock_quantity = EXCLUDED.stock_quantity,
             tags = EXCLUDED.tags,
             created_by = EXCLUDED.created_by,
             updated_at = EXCLUDED.updated_at`,
          [
            product.id,
            product.name,
            product.description,
            product.price,
            product.unit,
            product.image_url,
            product.in_stock,
            product.stock_quantity || 0,
            product.tags || [],
            product.created_by,
            product.created_at,
            product.updated_at
          ]
        );
      }
      console.log(`✅ ${products.length} produit(s) migré(s)\n`);
    } else {
      console.log('ℹ️  Aucun produit à migrer\n');
    }

    // ==========================================
    // 3. Migrer les orders
    // ==========================================
    console.log('🛒 Migration des commandes...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) {
      console.warn('⚠️  Erreur lors de la récupération des orders:', ordersError.message);
    } else if (orders && orders.length > 0) {
      for (const order of orders) {
        await pgClient.query(
          `INSERT INTO orders (id, customer_name, customer_email, customer_phone, delivery_address, total_amount, status, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             customer_name = EXCLUDED.customer_name,
             customer_email = EXCLUDED.customer_email,
             customer_phone = EXCLUDED.customer_phone,
             delivery_address = EXCLUDED.delivery_address,
             total_amount = EXCLUDED.total_amount,
             status = EXCLUDED.status,
             notes = EXCLUDED.notes`,
          [
            order.id,
            order.customer_name,
            order.customer_email,
            order.customer_phone,
            order.delivery_address,
            order.total_amount,
            order.status,
            order.notes,
            order.created_at
          ]
        );
      }
      console.log(`✅ ${orders.length} commande(s) migrée(s)\n`);
    } else {
      console.log('ℹ️  Aucune commande à migrer\n');
    }

    // ==========================================
    // 4. Migrer les order_items
    // ==========================================
    console.log('📝 Migration des articles de commande...');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*');

    if (itemsError) {
      console.warn('⚠️  Erreur lors de la récupération des order_items:', itemsError.message);
    } else if (orderItems && orderItems.length > 0) {
      // Désactiver temporairement le trigger pour éviter de diminuer le stock deux fois
      await pgClient.query('ALTER TABLE order_items DISABLE TRIGGER trigger_decrease_product_stock');

      for (const item of orderItems) {
        await pgClient.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             order_id = EXCLUDED.order_id,
             product_id = EXCLUDED.product_id,
             product_name = EXCLUDED.product_name,
             product_price = EXCLUDED.product_price,
             quantity = EXCLUDED.quantity,
             subtotal = EXCLUDED.subtotal`,
          [
            item.id,
            item.order_id,
            item.product_id,
            item.product_name,
            item.product_price,
            item.quantity,
            item.subtotal
          ]
        );
      }

      // Réactiver le trigger
      await pgClient.query('ALTER TABLE order_items ENABLE TRIGGER trigger_decrease_product_stock');

      console.log(`✅ ${orderItems.length} article(s) de commande migré(s)\n`);
    } else {
      console.log('ℹ️  Aucun article de commande à migrer\n');
    }

    console.log('🎉 Migration terminée avec succès!');
    console.log('\n📊 Résumé:');
    console.log(`   - Admins: ${adminUsers?.length || 0}`);
    console.log(`   - Produits: ${products?.length || 0}`);
    console.log(`   - Commandes: ${orders?.length || 0}`);
    console.log(`   - Articles: ${orderItems?.length || 0}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await pgClient.end();
    console.log('\n🔌 Déconnexion de PostgreSQL');
  }
}

// Exécuter la migration
migrate().catch(console.error);
