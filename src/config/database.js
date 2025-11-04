const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones usando DATABASE_URL de Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para Neon
  },
  max: 20, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // tiempo de espera para obtener conexión
});

// Función para ejecutar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Función para obtener un cliente del pool (para transacciones)
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Wrapper para logging
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  client.release = () => {
    delete client.lastQuery;
    return release.apply(client);
  };
  
  return client;
};

// Función para cerrar el pool
const closePool = async () => {
  await pool.end();
};

// Función para verificar conexión
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connected successfully:', result.rows[0].current_time);
    console.log('📊 Database version:', result.rows[0].db_version.split(' ')[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  query,
  getClient,
  closePool,
  testConnection,
  pool
};