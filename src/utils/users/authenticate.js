const fs = require('fs');
const { generateUniqId } = require('./uniqueId');
const { generateToken, generateRefreshToken } = require('./generateToken');
const { InternalError } = require('./InternalError');
const { ValidationError } = require('./ValidationError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./../Schema/User');

const JWT_SECRET = process.env.JWT_SECRET ?? "secret-key";

const authSignup = async (req, res, next) => {
  const { email, password, username } = req.body;
  const passwordHash = await bcrypt.hash(password, 2);
  try {
    const newUserInDB = {
      username,
      email,
      password: passwordHash,
    }
    const userInDB = new User(newUserInDB);
    await userInDB.save();
    console.log("new user added ->", userInDB.userId);
    next();
  } catch (err) {
    console.log('db error ->', err);
    next(new ValidationError(err.message));
  }
}

const authLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const userInDB = await User.findOne({ email });
  if(!userInDB) {
    return next(new ValidationError('Credentials do not exist. Please try again.'));
  }
  const isMatch = await bcrypt.compare(password, userInDB.password);
  if(!isMatch) {
    return next(new ValidationError('Credentials do not exist. Please try again.'));
  }
  console.log('login detected by user ->', userInDB.userId);
  const token = generateToken(userInDB.userId);
  const refreshToken = generateRefreshToken(userInDB.userId);
  req.user = {
    email,
    username: userInDB.username,
    token,
    refreshToken,
    userId: userInDB.userId,
    participatedRooms: userInDB.participatedRooms
  },
  next();
}

const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization').split(' ')[1];
  try {
    const { user: userId } = jwt.verify(token, JWT_SECRET);
    req.user = { userId };
    next();
  } catch (err) {
    next(err);
  }
}

const authLogout = async (req, res, next) => {
  const { userId } = req.user;
  console.log(`${userId} loggedout`);
  next();
}

const authRefresh = async (req, res, next) => {
  try {
    const { user: userRefreshToken } = req.cookies;
    const { user: userId } = jwt.verify(userRefreshToken, JWT_SECRET);
    const newToken = generateToken(userId); // generate new access token
    req.newToken = newToken;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authSignup,
  authLogin,
  verifyToken,
  authLogout,
  authRefresh,
}