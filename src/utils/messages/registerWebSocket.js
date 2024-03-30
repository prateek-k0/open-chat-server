const socketio = require('socket.io');
const { saveNewRoom } = require('./saveNewRoom');
const { saveMessage } = require('./saveMessage');
const { joinRoom } = require('./joinRoom');
const { User } = require('./../Schema/User');
const { Room } = require('./../Schema/Room');
const { saveNewDM } = require('./saveNewDM');

// Socket.io events
const CREATE_NEW_ROOM = 'createNewRoom';
const EMIT_ROOM_DATA = 'editRoomData';
const SYS_MESSAGE = 'sysMessage';
const CONNECT = 'connect';
const CONNECT_ERROR = 'connect_error';
const DISCONNECT = 'disconnect';
const JOIN_ROOM = 'join-room';
const LEAVE_ROOM = 'leave-room';
const SEND_MESSAGE = 'send-message';
const SEND_ROOM_ACKNOWLEDGEMENT = 'send-room-acknowledgement';
const CREATE_NEW_DM = 'create-new-dm';

const registerWebSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: process.env.ORIGIN_ALLOWED.split(', ') ?? ['http://127.0.0.1:5173'],
      credentials: true,
    }
  });

  io.use(async (socket, next) => {  // middleware to get the user in the current socket instance, through userId passed from the client
    const userId = socket.handshake.auth.userId;
    try {
      const user = await User.findById(userId);
      socket.user = user;
      socket.user.userId = user.userId;
      next();
    } catch(err) {
      next(err);  // will emit "connect_error" event to the client
    }
  });
  
  io.on(CONNECT, (socket) => {
    const { user } = socket;
    console.log('connection establisted', socket.id);
    console.log('user details: ', user.userId);
    // acknowledgement on connection
    socket.emit(SYS_MESSAGE, `${user.userId} has successfully connected`);
    // send rooms created by the user
    user.participatedRooms.forEach(({ roomId, lastOpenedAt }) => {
      Room.findById(roomId)
        .then((room) => {
          const roomObj = {
            roomName: room.roomName,
            createdAt: room.createdAt,
            lastUpdateAt: room.lastUpdateAt,
            createdBy: room.createdBy,
            members: room.members,
            messages: room.messages,
            roomId: room.roomId,
            isDM: room.isDM,
            lastOpenedAt
          };
          socket.emit(EMIT_ROOM_DATA, roomObj);
          socket.join(roomId);
        })
        .catch((err) => {
          console.log(err);
        });       
    });
    // create room event
    socket.on(CREATE_NEW_ROOM, async ({ roomName, timestamp, participatingUsers }, callback) => {
      try {
        const newRoomData = await saveNewRoom(user.userId, { roomName, timestamp, participatingUsers });
        const allConnectedSockets = await io.fetchSockets();
        for(const s of allConnectedSockets) {
          // emit for all members
          if(newRoomData.members.includes(s.user.userId)) {
            s.emit(EMIT_ROOM_DATA, newRoomData);
            s.join(newRoomData.roomId);
          }
        }
        callback(undefined, newRoomData);
      } catch (err) {
        callback({ error: err.message }, undefined);
      }
    });
    // create DM event
    socket.on(CREATE_NEW_DM, async({ toUserId, timestamp }, callback) => {
      try {
        const newDMData = await saveNewDM(user.userId, toUserId, timestamp);
        // the current socket is of the user.userId
        // for the other user, search in the sockets, if the socket is available, then emit it.
        const allConnectedSockets = await io.fetchSockets();
        for(const s of allConnectedSockets) {
          if(newDMData.members.includes(s.user.userId)) {
            s.emit(EMIT_ROOM_DATA, newDMData);
            s.join(newDMData.roomId);
          }
        }
        callback(undefined, newDMData);
      } catch (err) {
        callback({ error: err.message }, undefined);
      }
    })
    // send message event
    socket.on(SEND_MESSAGE, async({ message, roomId, timestamp }, callback) => {
      try {
        const newMessage = await saveMessage({ userId: user.userId, username: user.username, message, roomId, timestamp });
        // io.to(roomId).emit(SEND_MESSAGE, newMessage); // broadcast to entire room
        // since we are using pessimistic updates on the front end, we can skip sending the message to the socket
        socket.broadcast.to(roomId).emit(SEND_MESSAGE, newMessage); // broadcast to everyone in the room except the socket
        callback(undefined, newMessage);
      } catch (err) {
        console.log(err);
        callback({ error: err.message }, undefined);
      }
    })
    // join room event
    socket.on(JOIN_ROOM, async({ roomId }, callback) => {
      try {
        const { roomDetails, joiningMessage } = await joinRoom({ userId: user.userId, username: user.username, roomId, timestamp: Date.now() });
        socket.emit(EMIT_ROOM_DATA, roomDetails);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit(SEND_MESSAGE, joiningMessage);
        callback(undefined, roomDetails);
      } catch (err) {
        console.log(err);
        callback({ error: err.message }, undefined);
      }
    });
    // room opening ack event
    socket.on(SEND_ROOM_ACKNOWLEDGEMENT, async({ roomId, timestamp }, callback) => {
      try {
        const userInDB = await User.findById(user.userId);
        if(!userInDB) throw new ValidationError('user not found');
        userInDB.participatedRooms.forEach((room) => {
          if(room.roomId === roomId) {
            room.lastOpenedAt = timestamp;
          }
        });
        await userInDB.save();
        callback(undefined, { timestamp, message: `Room Opening Ack recieved for roomId: ${roomId}`})
      } catch (err) {
        console.log(err);
        callback({ error: err.message }, undefined);
      }
    })
    // disconnect event
    socket.on(DISCONNECT, () => {
      console.log('disconnected');
    })
  });
}

module.exports = {
  registerWebSocket
};