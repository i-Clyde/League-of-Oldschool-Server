var mongoose = require("mongoose");

var LobbySchema = new mongoose.Schema({
  map: {type: Number, require: true},
  name: {type: String, require: true, trim: true, unique: true},
  password: {type: String, default: null},
  fastcode: {type: String, default: null},
  type: {type: Number, require: true},
  cheats: {type: Number, require: true},
  minions: {type: Number, require: true},
  cooldowns: {type: Number, require: true},
  teamsize: {type: Number, require: true},
  createdby: {type: Number, require: true},
  time: {type: Number, default: Date.now},
  players: {},
  status: {
    king: {type: Number, require: true},
    online: {
      connected: {type: Number, default: 1},
      purple: [Number],
      blue: [Number]
    },
    blocked: [Number],
    invites: {
      all: [Number],
      pending: [Number],
      accepted: [Number],
      declined: [Number],
    },
    allowed: {
      toinvite: [Number]
    }
  },
  started: {type: Boolean, default: false}
});

var CustomLobby = mongoose.model('lobbies', LobbySchema);

module.exports = {
  CustomLobby: CustomLobby
};
