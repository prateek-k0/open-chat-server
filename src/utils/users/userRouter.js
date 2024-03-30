const express = require('express');
const { authSignup, authLogin, verifyToken, authLogout, authRefresh } = require("./authenticate");
const { User } = require('../Schema/User');

const router = new express.Router();

router.post('/signup', authSignup, async (req, res) => {
  res.statusCode = 200;
  res.send({ message: `Signup successful for ${req.body.email}` });
});

router.post('/login', authLogin, (req, res) => {
  const { email, username, token, userId, refreshToken, participatedRooms } = req.user;
  res.statusCode = 200;
  res.cookie('user', refreshToken, { secure: true, httpOnly: true });
  res.send({ message: 'Login Success', user: { email, username, token, userId, participatedRooms } });
});

router.get('/logout', verifyToken, authLogout, (req, res) => {
  const { userId } = req.user;
  res.statusCode = 200;
  res.cookie('user', '', { secure: true, httpOnly: true, maxAge: 0 });  // remove cookie
  res.send({ message: 'Logout Success', user: userId });
});

router.get('/refresh', authRefresh, (req, res) => {
  res.statusCode = 200;
  res.send({ message: 'Refresh Success', token: req.newToken });
});

router.get('/test', verifyToken, (req, res) => {
  res.statusCode = 200;
  res.send({ message: 'Test Success' });
});

router.get('/users', verifyToken, async (req, res) => {
  const query = req.query.q;
  const users = await User.$where(`this.username.indexOf("${query}") !== -1`);
  res.statusCode = 200;
  res.send({ users: users.map((user) => ({ username: user.username, userId: user.userId })) });
});

router.get('/user', verifyToken, async (req, res) => {
  const queryId = req.query.id;
  const user = await User.findById(queryId);
  if(!user) {
    res.statusCode = 404;
    res.send({ message: `User not found with userId ${queryId}`});
  } else {
    res.statusCode = 200;
    res.send({ user: { userId: user.userId, username: user.username, email: user.email } });
  }
});

module.exports = {
  userRouter: router
};