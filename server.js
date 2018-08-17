// Const variables
const mongodb_host = "mongodb://localhost:27017/oldSchoolLeague";module.exports.host = mongodb_host;
const io_server_port = 3000;

// Packages, (requires)
var validator = require("email-validator");
var bcrypt = require('bcryptjs');
var {mongoose, Player, db, gChat, escapeHtml} = require('./modules/database/connection');

db.once('open', function() {
  console.log('[INFO] Successfully connected to the database');
  console.log('[INFO] Server successfully started to listen');

  var connectCounter = 0;
  var loggedInCounter = 0;
  Player.update({}, {'social.status': 0}, {multi: true}, (err) => {if(err) console.log('[ERROR] There was an error trying to set offline status to everyone. - '+err)})

  var http = require('http').createServer().listen(io_server_port, function(){console.log("\n==========================\n Version: 0.3.7\n oldSchoolLeagueClientServer: is running @port: " + io_server_port + "\n Author: Mikołaj Chodorowski\n Press CTRL+C to end process \n==========================\n")});;
  var io = require('socket.io').listen(http);

  // Socket.IO Events handlers
  io.on('connection', function(socket) {

    // On connection stuff {
      connectCounter++;socket.loggedin = false;
      require("./modules/events/connect").connected(connectCounter, loggedInCounter);
    // };

    socket.on('disconnect', function() {
      socket.leave('global chat');
      connectCounter--;if(socket.loggedin) {
        socket.leave('logged users');
        loggedInCounter--}
      require("./modules/events/disconnect").disconnected(socket.id, socket.loggedin, connectCounter, loggedInCounter, socket.handshake.address);
    });

    // Handlers
      // Handle register request
      socket.on('register request', function(data) {
        require("./modules/auth/register").register(data, socket.id, socket.handshake.address);
      });

      // Handle login request
      socket.on('login request', function(data) {
        require("./modules/auth/login").auth(data.login, data.password, socket.id, function(res) {

          if (res.loggedin === true) {
            loggedInCounter++;
            io.to('logged users').emit('online users', {'online':connectCounter, 'loggedin':loggedInCounter});
            socket.login = res.login;
            socket.pid = res.id;
            socket.nickname = res.nick;
            socket.loggedin = res.loggedin;

            socket.join('logged users');
            socket.join('global chat');
          }

        });
      });

      // Handle check and set nickname request
      socket.on('check nickname request', function(data) {
        require("./modules/check/nickname").check(data, socket.id);
      });
      socket.on('set nickname request', function(data) {
        require("./modules/set/nickname").set(data, socket.id, function(res) {
          socket.nickname = res.nickname;
        });
      });

      // Handle icon set request
      socket.on('set icon request', function(data) {
        require("./modules/set/icon").set(data.iconid, socket.id, data.update);
      });

      // Handle message sent
      socket.on('send msg', function(data) {
        require("./modules/send/message").send(data.to, data.msg, socket.id, socket.pid, socket.nickname);
      });

      // Old messages request
      socket.on('load old messages', (pid) => {
        require("./modules/load/message").load(socket.id, pid);
      });

      // Handle friend request
      socket.on('add friend', (nick) => {
        require("./modules/add/friend").add(socket.id, nick, socket.loggedin);
      });

      // Handle remove friend request
      socket.on('remove friend request', (pid) => {
        require("./modules/remove/sentfriendrequest").remove(socket.id, pid, socket.pid, socket.loggedin);
      });

      // Handle friend request accept
      socket.on('set friend', (pid) => {
        require("./modules/set/friends").set(socket.id, pid, socket.pid, socket.loggedin);
      });

      // Handle friend request decline
      socket.on('decline friend', (pid) => {
        require("./modules/remove/friendrequest").remove(socket.id, pid, socket.pid, socket.loggedin);
      });

      // Handle load invites
      socket.on('load invites', () => {
        require("./modules/load/invites").load(socket.id);
      });

      // Handle load friends
      socket.on('load friends', () => {
        require("./modules/load/friends").load(socket.id);
      });

      // Handle load homepage
      socket.on('load homepage req', () => {
        require("./modules/load/homepage").load(socket.id, socket.loggedin);
      });

      // Handle description update
      socket.on('update description req', (data) => {
        require("./modules/update/description").update(socket.id, socket.loggedin, data.desc);
      });

      // Handle status update
      socket.on('update status req', (data) => {
        require("./modules/update/status").update(socket.id, socket.loggedin, data.status);
      });

      // Handle new ignore
      socket.on('add ignore', (data) => {
        require("./modules/add/ignore").add(socket.id, data.nick, socket.loggedin);
      });

      // Handle remove ignore
      socket.on('remove ignore', (data) => {
        require("./modules/remove/ignore").remove(socket.id, data.pid, socket.loggedin);
      });

      // Handle load ignores
      socket.on('load ignores', (data) => {
        require("./modules/load/ignores").load(socket.id, socket.loggedin);
      });

      // Remove friend
      socket.on('remove friend', (data) => {
        require("./modules/remove/friend").remove(socket.id, data.pid, socket.pid, socket.loggedin);
      })

      // Mark message as readed
      socket.on('mark messages as read', (data) => {
        require("./modules/set/messagereaded").set(socket.id, data.pid, socket.loggedin, data.specify);
      })

      // Ask for online counter
      socket.on('online users request', () => {
        io.to('logged users').emit('online users', {'online':connectCounter, 'loggedin':loggedInCounter});
      })

  });

  module.exports = {io, Player, bcrypt, mongoose, validator, gChat, escapeHtml};

});
