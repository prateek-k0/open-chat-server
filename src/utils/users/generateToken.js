const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET ?? "secret-key";

const generateToken = (userId) => jwt.sign({ user: userId }, JWT_SECRET, { expiresIn: '1d' });

const generateRefreshToken = (userId) => jwt.sign({ user: userId }, JWT_SECRET, { expiresIn: '7d' });

module.exports = { 
  generateToken,
  generateRefreshToken
}