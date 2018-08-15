var mongoose = require("mongoose");

var GlobalChatSchema = new mongoose.Schema({
  pid: {
    type: Number
  },
  msg: {
    type: String,
    trim: true
  },
  date: {
    type: Number
  }
});

var gChat = mongoose.model('globalchat', GlobalChatSchema);

module.exports = {
  gChat: gChat
};
