// Const variables
const mongodb_host = "mongodb://localhost:27017/oldSchoolLeague";module.exports.host = mongodb_host;
const io_server_port = 3000;

// Packages, (requires)
var pjson = require('./package.json');
var validator = require("email-validator");
var bcrypt = require('bcryptjs');
var colors = require('colors');
var {mongoose, Player, db, gChat, InGame, MatchHistory, CustomLobby, chSelect, escapeHtml} = require('./modules/database/connection');

db.once('open', function() {

  var connectCounter = 0;
  var loggedInCounter = 0;
  Player.update({}, {'social.status': 0, 'customGame.inlobby': false, 'customGame.lobbyid': null, 'desc_three': null, 'playerInfo.ingamePrivate.port': null, 'playerInfo.ingamePrivate.isconnected': null, 'playerInfo.ingamePrivate.gamePID': null, 'playerInfo.ingame.ingameToken': null}, {multi: true}, (err) => {if(err) console.log('[ERROR] There was an error trying to set offline status to everyone. - '+err)})
  CustomLobby.find({}).remove().exec();
  chSelect.find({}).remove().exec();
  InGame.find({}).remove().exec();
  MatchHistory.find({'forceEnd': true}).remove().exec();

  var http = require('http').createServer().listen(io_server_port, function(){console.log("[INFO] Server successfully started to listen".cyan)});;
  var io = require('socket.io').listen(http);

  console.log('=========================='.rainbow);
  console.log('Version:'.green, pjson.version.yellow);
  console.log('Server port:'.green, colors.yellow(io_server_port));
  console.log('Author:'.green, 'Mikołaj Chodorowski'.yellow);
  console.log('Press CTRL+C to end process'.white);
  console.log('=========================='.rainbow, '\n');
  console.log('[INFO] Successfully connected to the database'.cyan);

  // Socket.IO Events handlers
  io.on('connection', function(socket) {
    socket.on('connecl', () => {
      // On connection stuff {
        socket.loggedin = false; connectCounter++;
        require("./modules/events/connect").connected(connectCounter, loggedInCounter);
      // };

      socket.on('disconnect', function() {
        socket.leave('global chat');
        connectCounter--;if(socket.loggedin) {
          socket.leave('logged users');
          loggedInCounter--}
        require("./modules/events/disconnect").disconnected(socket.id, (socket.loggedin?socket.nickname:null), socket.loggedin, connectCounter, loggedInCounter, socket.handshake.address, (cbres) => {
          if (cbres.wasinlobby) {socket.leave(cbres.cGID); socket.leave(cbres.cGID+'-p'); socket.leave(cbres.cGID+'-b')};
        });
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

            if (res.isingame) {socket.join('in-'+res.gametokenif+'-game')}
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
        require("./modules/update/status").update(socket.id, socket.loggedin, data.status, data.desc);
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
      });

      // Mark message as readed
      socket.on('mark messages as read', (data) => {
        require("./modules/set/messagereaded").set(socket.id, data.pid, socket.loggedin, data.specify);
      });

      // Ask for online counter
      socket.on('online users request', () => {
        io.to('logged users').emit('online users', {'online':connectCounter, 'loggedin':loggedInCounter});
      });

      // Create new custom lobby
      socket.on('custom game create', (data) => {
        require("./modules/lobby/create").create(socket.id, socket.pid, socket.nickname, socket.loggedin, data, function(res) {
          if (res.success) socket.join(res.cGID)
        });
      });

      // Leave lobby
      socket.on('custom game leave', (data) => {
        require("./modules/lobby/leave").leave(socket.id, socket.nickname, socket.pid, socket.loggedin, data, function(res) {
          if (res.success) socket.leave(res.cGID)
        });
      });

      // Load custom games
      socket.on('custom game list load', () => {
        require("./modules/lobby/load").load(socket.id, socket.loggedin)
      });

      // Join custom games
      socket.on('custom game join', (data) => {
        require("./modules/lobby/join").join(socket.id, false, false, socket.pid, socket.nickname, socket.loggedin, data, function(res) {
          if (res.success) socket.join(res.token)
        })
      });

      // Switch teams in lobby
      socket.on('custom game switch team', (data) => {
        require("./modules/lobby/switchteam").switch(socket.id, socket.pid, socket.loggedin);
      });

      // Let him touch your crown in lobby
      socket.on('custom game renounce crown', (newking) => {
        require("./modules/lobby/set/king").renounce(socket.id, socket.pid, socket.loggedin, newking);
      });

      // Kick player from lobby
      socket.on('custom game kick player', (data) => {
        require("./modules/lobby/kick").kick(socket.id, socket.pid, socket.loggedin, data, function(res) {
          if (res.success) io.sockets.connected[res.socketToken].leave(res.token)
        });
      });

      // Join via fastcode
      socket.on('custom game join via fastcode', (fastcode) => {
        require("./modules/lobby/joinviafastcode").join(socket.id, socket.pid, socket.nickname, socket.loggedin, fastcode, function (res) {
          if (res.success) socket.join(res.token)
        });
      });

      // Send custom game message
      socket.on('custom game send message', (msg) => {
        require("./modules/lobby/sendmsg").send(socket.id, socket.nickname, socket.pid, socket.loggedin, msg)
      });

      // Allow to invite in custom
      socket.on('custom game allow to invite', (permmited) => {
        require("./modules/lobby/set/inviteperm").toggle(socket.id, socket.pid, socket.loggedin, permmited)
      });

      // Send invite to custom
      socket.on('custom game send new invate', (data) => {
        require("./modules/lobby/invite/send").send(socket.id, socket.pid, socket.nickname, socket.loggedin, data)
      });

      // User accepted invitation
      socket.on('custom game invitation accept', (token) => {
        require("./modules/lobby/invite/accept").reaction(socket.id, socket.pid, socket.nickname, socket.loggedin, token, (cb) => {
          if (cb.success) socket.join(cb.token)
        })
      });

      // User declined invitation
      socket.on('custom game invitation decline', (token) => {
        require("./modules/lobby/invite/decline").reaction(socket.id, socket.pid, socket.loggedin, token)
      });

      // Start custom game
      socket.on('custom game start', (token) => {
        require("./modules/lobby/start").start(socket.id, socket.pid, socket.loggedin, token)
      });

      // Send champion select message
      socket.on('champion select send message', (msg) => {
        require("./modules/championselect/sendmsg").send(socket.id, socket.nickname, socket.pid, socket.loggedin, socket.pregame_team, msg)
      });

      // Champion select declaration
      socket.on('champion select declarate', (champion, last) => {
        require("./modules/championselect/declaration").declaration(socket.id, socket.pid, socket.loggedin, socket.pregame_team, socket.chgametoken, champion, last)
      });

      // Champion select spell update
      socket.on('summoner spell update', (data) => {
        require("./modules/championselect/summonerspell").update(socket.id, socket.pid, socket.loggedin, socket.pregame_team, socket.chgametoken, data)
      });

      // Champion select try lock in
      socket.on('champion select try lock in', (champion) => {
        require("./modules/championselect/markready").ready(socket.id, socket.pid, socket.loggedin, socket.pregame_team, socket.chgametoken, champion)
      });

      // Load game data after relog
      socket.on('game load after relog', (gid) => {
        require("./modules/game/loadinfo").load(socket.id, socket.loggedin, gid)
      });

      // Void the game!
      socket.on('game void vote', () => {
        require("./modules/game/vote").togglevote(socket.id, socket.loggedin, socket.gamePID)
      })
    })
  });

  function game_server_prefix(port) {return('[GAME-SERVER #'+port+']')}
  io.of('/game-server').on('connection', function(game) {
    game.on('game server set port', (data) => {
      console.log(game_server_prefix(data), 'Game started!');
      InGame.findOne({port: data}, 'token').exec().then((gID) => {
        io.to('in-'+gID.token+'-game').emit('game successfully started', data);
      })
      game.port = data; game.join(game.port);
      game.lifetime = 0; game.lifetimeIntercal = setInterval(() => {game.times++; io.of('/game-server').to(game.port).emit("renew connection", true)}, 10000);
      // require("./modules/game/ready").ready(socket.id, socket.pid, socket.loggedin, socket.pregame_team, socket.chgametoken, champion)
    })

    game.on('game server game successfully end', (data) => {
      console.log(data);
      InGame.findOne({port: game.port}, 'token').exec().then((gID) => {
        InGame.findOneAndUpdate({port: game.port}, {$set: {'forceEnd': false, 'victory': data}}).exec().then(() => {

          MatchHistory.findOneAndUpdate({'token': data.token}, {$set: {'forceEnd': false, 'victory': data}}).exec();
          io.to('in-'+gID.token+'-game').emit('Game successfully ended destroyed: '+data); // Here send data with all stuff after game

        }).catch((err) => {console.log('[ERROR] '+err)});
      }).catch((err) => {console.log('[ERROR] '+err)});
    })

    game.on('game server new ready', function(gamePID) {console.log(game_server_prefix(game.port), 'New ready with id '+ gamePID)}) // Returns gamePID;
    game.on('game server new disconnected', function(gamePID) {console.log(game_server_prefix(game.port), 'New disconnected with id '+ gamePID)}) // Returns gamePID;
    game.on('game server new reconnected', function(gamePID) {console.log(game_server_prefix(game.port), 'New reconnected with id '+ gamePID)}) // Returns gamePID;
    game.on('game server level up', function(gamePID) {console.log(game_server_prefix(game.port), 'New leveled up player '+ gamePID)}) // Returns gamePID;
    game.on('game server minon killed', function(gamePID) {console.log(game_server_prefix(game.port), 'Killer of the minion '+ gamePID)}) // Returns gamePID;
    game.on('game server new kill', function(gamePID) {console.log(game_server_prefix(game.port), 'Killer of the minion '+ gamePID)}) // Returns gamePID;
    game.on('game server new death', function(gamePID) {console.log(game_server_prefix(game.port), 'Killer of the minion '+ gamePID)}) // Returns gamePID;

    game.on('game server info', (data) => {console.log(game_server_prefix(game.port), data)});
    game.on('disconnect', function() {
      InGame.findOne({port: game.port}, 'token forceEnd').exec().then((gID) => {
        if (gID.forceEnd) {
          MatchHistory.findOneAndRemove({'token': gID.token}).exec();
          io.to('in-'+gID.token+'-game').emit('Game force ended')};
          InGame.findOneAndRemove({port: game.port}).exec().catch((err) => {console.log('[ERROR] '+err)});
      }).catch((err) => {console.log('[ERROR] '+err)});
      // InGame.findOneAndRemove({port: game.port}).exec()
      console.log(game_server_prefix(game.port), 'Game ended!');
      game.leave(game.port), clearInterval(game.lifetimeIntercal)
    })

  })

  module.exports = {io, Player, bcrypt, mongoose, validator, MatchHistory, InGame, gChat, chSelect, CustomLobby, escapeHtml};

});

process.stdin.resume();

function exitHandler(options, exitCode) {
    if (options.cleanup) {
      console.log('[INFO] Server closed'.yellow)
      mongoose.connection.close();
    }
    if (options.exit) process.exit();
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
