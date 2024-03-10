const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    name: String,
    messages: [{ username: String, message: String, createdAt: Date }],
  });

const Chatroom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = Chatroom;
