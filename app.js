const express = require("express");
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { ValidationError } = require("./src/utils/users/ValidationError");
const { TokenExpiredError } = require("jsonwebtoken");
const  { registerWebSocket } = require("./src/utils/messages/registerWebSocket");
const { userRouter } = require('./src/utils/users/userRouter');

// for mongoose
mongoose.connect(process.env.MONGODB_API ?? 'mongodb://localhost:27017/chatdb', () => {
  console.log('connected to chatdb');
}, (err) => {
  console.log('failed to connect', err);
});

const app = express();
// to support web sockets
const server = http.createServer(app);

const PORT = process.env.PORT ?? 3500; 

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,  // to allow to set cookies
  origin: ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:5173'],
}));

// common middleware for all routes
app.use((req, res, next) => {
  // add timestamp to request object
  req.timestamp = Date.now();
  console.log(req.method, 'request on ->', req.url, 'at', req.timestamp);
  // move to the next middleware / route handler, important to include
  next();
});

app.use(userRouter);

app.use((error, req, res, next) => { // common error handler for all routes
  if(error) {
    if(error instanceof ValidationError) {
      res.statusCode = 401;
    } else if(error instanceof TokenExpiredError) {
      res.statusCode = 403;
    } else {
      res.statusCode = 500;
    }
    res.send({ error: error.message });
  } else {
    next();
  }
});

// notice we r using server.listen and not app.listen
server.listen(PORT, () => {
  console.log('server started on port 3500');
});

registerWebSocket(server);