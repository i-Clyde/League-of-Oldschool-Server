var mongoose = require("mongoose");

var MatchHistorySchema = new mongoose.Schema({
  token: {
    type: String
  },
  forceEnd: {
    type: Boolean
  },
  victory: {
    type: String
  },
  blue: {
    type: mongoose.Schema.Types.Mixed
  },
  purple: {
    type: mongoose.Schema.Types.Mixed
  },
  settings: {}
});

var MatchHistory = mongoose.model('matchhistories', MatchHistorySchema);

module.exports = {
  MatchHistory: MatchHistory
};
