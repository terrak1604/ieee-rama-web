/**
 * reset-admin.js — Restaurar usuario admin
 * Ejecutar desde la carpeta del proyecto:
 *   node backend/reset-admin.js
 */

const path = require('path');
const crypto = require('crypto');

// sqlite3 está instalado en backend/node_modules
const sqlite3 = require(path.join(__dirname, 'node_modules', 'sqlite3')).verbose();

require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
console.log('[reset-admin] DB:', DB_PATH);

const db = new sqlite3.Database(DB_PATH);

const PREFIX = '$scrypt$';
const OPTS = { N: 16384, r: 8, p: 1 };

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(plain, salt, 64, OPTS, (err, key) => {
      if (err) return reject(err);
      resolve(`${PREFIX}${OPTS.N}$${OPTS.r}$${OPTS.p}$${salt}$${key.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('');
  console.log('=== IEEE Portal – Reset Admin User ===');

  const hash = await hashPassword('admin123');

  db.serialize(() => {
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

    db.get('SELECT id, password FROM usuarios WHERE email = ?', ['admin@ieee-unmsm.org'], (err, row) => {
      if (err) {
        console.error('Error:', err.message);
        db.close(); process.exit(1);
      }

      if (row) {
        db.run('UPDATE usuarios SET password = ?, nombre = ?, rol = ? WHERE email = ?',
          [hash, 'Admin IEEE', 'director_rama', 'admin@ieee-unmsm.org'],
          function(e) {
            if (e) { console.error('Update failed:', e.message); }
            else {
              console.log('');
              console.log('Admin password UPDATED!');
              console.log('  Email:    admin@ieee-unmsm.org');
              console.log('  Password: admin123');
              console.log('');
            }
            db.close();
          }
        );
      } else {
        db.run('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
          ['Admin IEEE', 'admin@ieee-unmsm.org', hash, 'director_rama'],
          function(e) {
            if (e) { console.error('Insert failed:', e.message); }
            else {
              console.log('');
              console.log('Admin user CREATED!');
              console.log('  Email:    admin@ieee-unmsm.org');
              console.log('  Password: admin123');
              console.log('');
            }
            db.close();
          }
        );
      }
    });
  });
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
