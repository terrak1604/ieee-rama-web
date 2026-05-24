/**
 * reset-admin.js
 * 
 * Script de emergencia para restaurar el usuario administrador.
 * Ejecutar con: node backend/reset-admin.js
 * 
 * Crea o actualiza el usuario admin@ieee-unmsm.org con password admin123
 * usando scrypt (Node.js nativo, sin dependencias nativas).
 */

const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

const PREFIX = '$scrypt$';

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const N = 16384;
  const r = 8;
  const p = 1;
  const keylen = 64;

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N, r, p }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${PREFIX}${N}$${r}$${p}$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('IEEE Portal - Reset Admin User');
  console.log('Database:', DB_PATH);
  console.log('');

  const hash = await hashPassword('admin123');
  console.log('Generated hash for admin123');

  db.serialize(() => {
    // Create table if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        capitulo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin exists
    db.get('SELECT id FROM usuarios WHERE email = ?', ['admin@ieee-unmsm.org'], (err, row) => {
      if (err) {
        console.error('DB error:', err.message);
        db.close();
        process.exit(1);
      }

      if (row) {
        // Update existing admin password
        db.run(
          'UPDATE usuarios SET password = ? WHERE email = ?',
          [hash, 'admin@ieee-unmsm.org'],
          function(err2) {
            if (err2) {
              console.error('Update failed:', err2.message);
            } else {
              console.log('Admin password UPDATED successfully!');
              console.log('Email:    admin@ieee-unmsm.org');
              console.log('Password: admin123');
            }
            db.close();
          }
        );
      } else {
        // Create new admin
        db.run(
          'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
          ['Admin IEEE', 'admin@ieee-unmsm.org', hash, 'director_rama'],
          function(err2) {
            if (err2) {
              console.error('Insert failed:', err2.message);
            } else {
              console.log('Admin user CREATED successfully!');
              console.log('Email:    admin@ieee-unmsm.org');
              console.log('Password: admin123');
            }
            db.close();
          }
        );
      }
    });
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
