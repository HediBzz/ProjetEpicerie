import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'epicerie',
  user: process.env.DB_USER || 'epicerie_user',
  password: process.env.DB_PASSWORD || 'epicerie_password_2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL inattendue:', err);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
