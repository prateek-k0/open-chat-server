const mongoose = require('mongoose');

const messageSender = new mongoose.Schema({
  userId: {
    type: String,
  },
  username: {
    type: String
  },
})

const messageSchema = new mongoose.Schema({
  sentBy: {
    // type: mongoose.SchemaTypes.ObjectId,
    type: messageSender,
  },
  message: {
    type: String,
  },
  roomId: {
    type: String,
  },
  type: {
    type: String,
    default: "text",
  },
  sentAt: {
    type: Number,
    default: () => Date.now(),
  }
})

const RoomSchema = new mongoose.Schema({
  roomName: {
    type: String
  },
  createdAt: {
    type: Number,
    default: () => Date.now(),
  },
  lastUpdateAt: {
    type: Number,
    default: () => Date.now(),
  },
  createdBy: {
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
  },
  members: {
    // type: [mongoose.SchemaTypes.ObjectId],
    type: [String],
  },
  messages: {
    type: [messageSchema],
    default: () => [],
  },
  isDM: {
    type: Boolean,
    deafult: false,
  }
});

RoomSchema.virtual('roomId').get(function() {
  return this._id.toString();
});

RoomSchema.pre('save', function(next) {
  this.lastUpdateAt = Date.now();
  next();
})

module.exports = {
  Room: mongoose.model("Room", RoomSchema)
};