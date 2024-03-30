const mongoose = require('mongoose');

const roomDetails = new mongoose.Schema({
  roomId: {
    type: String,
  },
  lastOpenedAt: {
    type: Number
  }
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
  },
  participatedRooms: {
    // type: [mongoose.SchemaTypes.ObjectId],
    type: [roomDetails],
    default: () => [],
  },
  joinedAt: {
    type: Number,
    default: () => Date.now(),
  },
});

UserSchema.virtual('userId').get(function() {
  return this._id.toString();
});

module.exports = {
  User: mongoose.model("User", UserSchema)
}