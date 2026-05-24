const db = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is required');

// ── Pure Node.js password hashing (no native modules needed) ──────────────
// Format: $scrypt$N$r$p$salt$hash
const SCRYPT_PREFIX = '$scrypt$';
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };
const SCRYPT_KEYLEN = 64;

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(plain, salt, SCRYPT_KEYLEN, SCRYPT_OPTS, (err, key) => {
      if (err) return reject(err);
      resolve(`${SCRYPT_PREFIX}${SCRYPT_OPTS.N}$${SCRYPT_OPTS.r}$${SCRYPT_OPTS.p}$${salt}$${key.toString('hex')}`);
    });
  });
}

function verifyPassword(plain, stored) {
  if (!stored || !plain) return Promise.resolve(false);

  // Our scrypt format
  if (stored.startsWith(SCRYPT_PREFIX)) {
    const parts = stored.slice(SCRYPT_PREFIX.length).split('$');
    if (parts.length !== 5) return Promise.resolve(false);
    const [N, r, p, salt, expectedHex] = parts;
    return new Promise((resolve, reject) => {
      crypto.scrypt(plain, salt, SCRYPT_KEYLEN, { N: +N, r: +r, p: +p }, (err, key) => {
        if (err) return reject(err);
        try {
          const expected = Buffer.from(expectedHex, 'hex');
          if (expected.length !== key.length) return resolve(false);
          resolve(crypto.timingSafeEqual(expected, key));
        } catch (e) { resolve(false); }
      });
    });
  }

  // Legacy bcrypt hashes ($2b$ or $2a$) — try native bcrypt, else fail gracefully
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return new Promise((resolve) => {
      try {
        const bcrypt = require('bcrypt');
        bcrypt.compare(plain, stored, (err, result) => {
          if (err) {
            console.warn('[auth] bcrypt.compare failed for legacy hash:', err.message);
            resolve(false);
          } else {
            resolve(result);
          }
        });
      } catch (e) {
        console.warn('[auth] native bcrypt unavailable:', e.message);
        resolve(false);
      }
    });
  }

  return Promise.resolve(false);
}

// ── Route Handlers ────────────────────────────────────────────────────────

const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    try {
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        // If it's a bcrypt hash and bcrypt is unavailable, suggest running reset-admin
        if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
          console.warn('[auth] Login failed for bcrypt hash — bcrypt native may be unavailable. Run: node backend/reset-admin.js');
          return res.status(401).json({ error: 'Invalid credentials. If this is the admin account, run: node backend/reset-admin.js to reset the password.' });
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol, capitulo: user.capitulo, nombre: user.nombre },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, capitulo: user.capitulo },
      });
    } catch (e) {
      console.error('[login]', e);
      res.status(500).json({ error: e.message });
    }
  });
};

const register = async (req, res) => {
  const { nombre, email, password, rol, capitulo } = req.body;
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (!['director_rama', 'director_capitulo'].includes(rol)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const hashed = await hashPassword(password);
    db.run(
      'INSERT INTO usuarios (nombre, email, password, rol, capitulo) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashed, rol, capitulo],
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const listUsers = (req, res) => {
  db.all(
    'SELECT id, nombre, email, rol, capitulo, created_at FROM usuarios ORDER BY created_at DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
};

const updateUserPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must have at least 6 characters' });
  }
  try {
    const hashed = await hashPassword(password);
    db.run('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'Password updated successfully' });
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateUsuario = (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, capitulo } = req.body;
  if (!nombre || !email || !rol) {
    return res.status(400).json({ error: 'Nombre, email y rol son requeridos' });
  }
  db.run(
    'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, capitulo = ? WHERE id = ?',
    [nombre, email, rol, capitulo, id],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email ya en uso' });
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User updated successfully' });
    }
  );
};

const deleteUsuario = (req, res) => {
  const { id } = req.params;
  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  db.run('DELETE FROM usuarios WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  });
};

module.exports = { login, register, listUsers, updateUserPassword, updateUsuario, deleteUsuario };
