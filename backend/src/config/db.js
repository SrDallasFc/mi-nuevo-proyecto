const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'pc_ad',
  password: process.env.DB_PASSWORD || 'moskitos',
  database: process.env.DB_NAME || 'pc_builder_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;