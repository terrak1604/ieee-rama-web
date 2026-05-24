/**
 * bcrypt-compat.js
 * Pure Node.js bcrypt-compatible implementation using crypto module.
 * Drop-in replacement for the 'bcrypt' package when native bindings fail.
 * Uses scrypt (Node's built-in crypto) for password hashing.
 * 
 * API compatible with bcrypt: hash(data, rounds) and compare(data, hash)
 */

const crypto = require('crypto');

const PREFIX = '$scrypt$';

/**
 * Hash a password using scrypt (async, returns Promise).
 * @param {string} data - plain text password
 * @param {number} saltOrRounds - number of rounds (ignored for scrypt, used as cost factor)
 * @returns {Promise<string>} - hashed password string
 */
async function hash(data, saltOrRounds) {
  const salt = crypto.randomBytes(16).toString('hex');
  const N = 16384; // CPU cost (2^14)
  const r = 8;
  const p = 1;
  const keylen = 64;

  return new Promise((resolve, reject) => {
    crypto.scrypt(data, salt, keylen, { N, r, p }, (err, derivedKey) => {
      if (err) return reject(err);
      const result = `${PREFIX}${N}$${r}$${p}$${salt}$${derivedKey.toString('hex')}`;
      resolve(result);
    });
  });
}

/**
 * Compare a plain text password against a stored hash (async, returns Promise).
 * Supports both our scrypt format AND legacy bcrypt hashes (starts with $2b$ or $2a$).
 * @param {string} data - plain text password
 * @param {string} storedHash - hash from database
 * @returns {Promise<boolean>}
 */
async function compare(data, storedHash) {
  if (!storedHash) return false;

  // Handle our scrypt format
  if (storedHash.startsWith(PREFIX)) {
    const parts = storedHash.slice(PREFIX.length).split('$');
    if (parts.length !== 5) return false;
    const [N, r, p, salt, hash] = parts;
    const keylen = 64;

    return new Promise((resolve, reject) => {
      crypto.scrypt(data, salt, keylen, { N: parseInt(N), r: parseInt(r), p: parseInt(p) }, (err, derivedKey) => {
        if (err) return reject(err);
        // Timing-safe comparison
        try {
          const expected = Buffer.from(hash, 'hex');
          const actual = derivedKey;
          if (expected.length !== actual.length) return resolve(false);
          resolve(crypto.timingSafeEqual(expected, actual));
        } catch (e) {
          resolve(false);
        }
      });
    });
  }

  // Legacy bcrypt hashes - try to use native bcrypt if available
  if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
    try {
      const bcrypt = require('bcrypt');
      return await bcrypt.compare(data, storedHash);
    } catch (e) {
      // Native bcrypt unavailable - use manual comparison
      // This is a FALLBACK: always returns false for bcrypt hashes when bcrypt native fails
      console.warn('[bcrypt-compat] Native bcrypt unavailable for legacy hash comparison. Rehashing required.');
      return false;
    }
  }

  return false;
}

module.exports = { hash, compare };
