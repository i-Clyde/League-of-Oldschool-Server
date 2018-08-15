var mongoose = require("mongoose");

var LobbySchema = new mongoose.Schema({
  lobby: {
    id: {

    }
  }
});

var Lobby = mongoose.model('lobbies', LobbySchema);

module.exports = {
  Lobby: Lobby
};
