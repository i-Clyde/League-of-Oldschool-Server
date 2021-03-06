const host = require('./../../server.js').host;
var mongoose = require('mongoose');

mongoose.connect(host, {useNewUrlParser: true});

// Mongoose connection
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MONGOOSE Connection error:'));

// Include needed models and schema
var Player = require("./models/player").Player;
var gChat = require("./models/globalchat").gChat;
var CustomLobby = require("./models/lobby").CustomLobby;
var chSelect = require("./models/championselect").chSelect;
var InGame = require("./models/ingame").InGame;
var MatchHistory = require("./models/matchhistory").MatchHistory;

var escapeHtml = (text) => {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

module.exports = {mongoose, Player, CustomLobby, MatchHistory, InGame, chSelect, gChat, db, escapeHtml}
