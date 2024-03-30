const { ValidationError } = require('../users/ValidationError');
const { generateUniqId } = require('../users/uniqueId');
const { User } = require('./../Schema/User');
const { Room } = require('./../Schema/Room');

const saveNewRoom = async (userId, { roomName, timestamp, participatingUsers }) => {
  const creatingUser = await User.findById(userId);
  if(!creatingUser) throw new ValidationError('user not found');
  const newRoom = {
    roomName,
    createdAt: timestamp,
    createdBy: userId,
    members: participatingUsers,
    lastUpdateAt: timestamp,
    messages: [],
    isDM: false,
  }
  if(!participatingUsers || participatingUsers.length === 0) throw new ValidationError('users not found');
  for(let user of participatingUsers) {
    const userInDB = await User.findById(user);
    if(!userInDB) {
      throw new ValidationError('user not found');
    }
  }
  const newRoomInDB = new Room(newRoom)
  await newRoomInDB.save();
  newRoomInDB.messages.push({
    sentBy: { userId: '', username: '' },
    message: `${creatingUser.username} has created a room "${roomName}"`,
    type: 'SYS',
    sentAt: timestamp,
    roomId: newRoomInDB.roomId,
  });
  await newRoomInDB.save();
  for(let user of participatingUsers) {
    const userInDB = await User.findById(user);
    userInDB.participatedRooms.push({ roomId: newRoomInDB.roomId, lastOpenedAt: timestamp });
    await userInDB.save();
  }
  return {
    ...newRoom,
    messages: newRoomInDB.messages,
    lastUpdateAt: newRoomInDB.lastUpdateAt,
    roomId: newRoomInDB.roomId,
  };
}

module.exports = {
  saveNewRoom
}