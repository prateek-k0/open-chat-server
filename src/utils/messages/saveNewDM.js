const { ValidationError } = require('../users/ValidationError');
const { generateUniqId } = require('../users/uniqueId');
const { User } = require('./../Schema/User');
const { Room } = require('./../Schema/Room');

const saveNewDM = async(user1Id, user2Id, timestamp) => {
  if(!user1Id || !user2Id) throw new ValidationError('user not found');
  if(user1Id === user2Id) throw new ValidationError('cannot create DM for the same user!');
  const user1InDB = await User.findById(user1Id);
  const user2InDB = await User.findById(user2Id);
  if(!user1InDB || !user2InDB) {
    throw new ValidationError('user not found');
  }
  // see if there is already a DM with the given pair of users
  for(const { roomId } of user1InDB.participatedRooms) {
    const roomInDB = await Room.findById(roomId);
    if((user2InDB.participatedRooms.filter((room) => room.roomId === roomId)).length > 0 && roomInDB.isDM === true) {
      throw new ValidationError('DM Already present for the given pair of users');
    } 
  }
  const newDM = {
    roomName: '',
    createdAt: timestamp,
    createdBy: user1Id,
    members: [user1Id, user2Id],
    lastUpdateAt: timestamp,
    messages: [],
    isDM: true,
  }
  const newDMinDB = new Room(newDM);
  await newDMinDB.save();
  newDMinDB.messages.push({
    sentBy: { userId: '', username: '' },
    message: `${user1InDB.username} has created a DM with ${user2InDB.username}`,
    type: 'SYS',
    sentAt: timestamp,
    roomId: newDMinDB.roomId,
  })
  await newDMinDB.save();
  user1InDB.participatedRooms.push({ roomId: newDMinDB.roomId, lastOpenedAt: timestamp });
  user2InDB.participatedRooms.push({ roomId: newDMinDB.roomId, lastOpenedAt: timestamp });
  await user1InDB.save();
  await user2InDB.save();
  return {
    ...newDM,
    messages: newDMinDB.messages,
    lastUpdateAt: newDMinDB.lastUpdateAt,
    roomId: newDMinDB.roomId,
  };
}

module.exports = {
  saveNewDM
};