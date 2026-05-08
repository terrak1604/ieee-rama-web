const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

if (process.env.NODE_ENV === 'production' && JWT_SECRET.includes('change')) {
  throw new Error('JWT_SECRET must be changed in production');
}

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          rol: user.rol,
          capitulo: user.capitulo,
          nombre: user.nombre,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          capitulo: user.capitulo,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
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
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO usuarios (nombre, email, password, rol, capitulo) VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, hashedPassword, rol, capitulo],
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listUsers = (req, res) => {
  db.all(
    `SELECT id, nombre, email, rol, capitulo, created_at
     FROM usuarios
     ORDER BY created_at DESC`,
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
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Password updated successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, register, listUsers, updateUserPassword };
