const { ValidationError } = require('../users/ValidationError');
const { generateUniqId } = require('../users/uniqueId');
const { User } = require('./../Schema/User');
const { Room } = require('./../Schema/Room');

const saveMessage = async ({ userId, username, message, roomId, timestamp }) => {
  if(!userId) throw new ValidationError('user not found');
  const userInDB = await User.findById(userId);
  if(!userInDB) {
    throw new ValidationError('user not found');
  }
  if(!roomId) throw new Error('room not found');
  const roomInDB = await Room.findById(roomId);
  if(!roomInDB) throw new Error('room not found');
  const newMessage = {
    sentBy: { userId, username },
    message,
    type: 'text',
    sentAt: timestamp,
    roomId,
  }
  roomInDB.messages.push(newMessage);
  await roomInDB.save();
  return newMessage;
}

module.exports = {
  saveMessage
}