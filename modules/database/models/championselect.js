var mongoose = require("mongoose");

var championSelectSchema = new mongoose.Schema({
  token: {type: String, require: true, unique: true},
  team: {
    blue: {},
    purple: {},
    ready: [],
    unready: []
  },
  champions: {
    taken: {
      purple: [],
      blue: []
    },
    set: {}
  },
  ready: {type: Boolean, default: false},
  layout: {type: Boolean, default: false},
  started: {type: Boolean, default: false},
  bans: {}
});

var chSelect = mongoose.model('championSelects', championSelectSchema);

module.exports = {
  chSelect: chSelect
};
