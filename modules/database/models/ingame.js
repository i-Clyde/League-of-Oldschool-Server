var mongoose = require("mongoose");

var InGameSchema = new mongoose.Schema({
  port: {
    type: Number
  },
  token: {
    type: String
  },
  forceEnd: {
    type: Boolean
  },
  victory: {
    type: String
  },
  ready: {
    type: mongoose.Schema.Types.Mixed
  },
  blue: {
    type: mongoose.Schema.Types.Mixed
  },
  purple: {
    type: mongoose.Schema.Types.Mixed
  },
  settings: {}
});

var InGame = mongoose.model('ingame', InGameSchema);

module.exports = {
  InGame: InGame
};
