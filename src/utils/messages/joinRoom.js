const { ValidationError } = require('../users/ValidationError');
const { User } = require('./../Schema/User');
const { Room } = require('./../Schema/Room');

const joinRoom = async ({ roomId, userId, timestamp, username }) => {
  if(!userId) throw new ValidationError('user not found');
  const userInDB = await User.findById(userId);
  if(!userInDB) {
    throw new ValidationError('user not found');
  }
  if(!roomId) throw new Error('room not found');
  const roomInDB = await Room.findById(roomId);
  if(!roomInDB || roomInDB.isDM === true) throw new Error('room not found');
  const joiningMessage = {
    sentBy: { userId: '', username: '' },
    message: `${username} has joined the room!`,
    type: 'SYS',
    sentAt: timestamp,
    roomId,
  }
  if(roomInDB.members.includes(userId)) {
    throw new Error('user has already joined the room');
  }
  roomInDB.messages.push(joiningMessage);
  roomInDB.members.push(userId);
  userInDB.participatedRooms.push({ roomId, lastOpenedAt: timestamp });
  await userInDB.save();
  await roomInDB.save();
  return { 
    roomDetails: {
      roomName: roomInDB.roomName,
      createdAt: roomInDB.createdAt,
      lastUpdateAt: roomInDB.lastUpdateAt,
      createdBy: roomInDB.createdBy,
      members: roomInDB.members,
      messages: roomInDB.messages,
      roomId
    },
    joiningMessage
  }
}

module.exports = { 
  joinRoom
}