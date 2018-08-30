var {io, Player, mongoose, chSelect, CustomLobby, escapeHtml} = require('./../../server.js');

module.exports.start = (socketid, socketpid, loggedin, token) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n, err) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']');console.log('[ERROR] ID:'+n+' Catch - '+err)};
  function gameStarted(data, infob, infop) {
    io.to(token+'-b').emit('custom game started', data, infob);
    io.to(token+'-p').emit('custom game started', data, infop)
  }

  function whichMap(mapid) {
    let map;
    switch(mapid) {
      case 1: map = 'Summoner\'s rift'; break;
      case 2: map = 'Howling abyss'; break;
      case 3: map = 'Twisted threeline'; break;
      case 4: map = 'Crystal scar'; break;
    }
    return(map);
  }

  function whichMode(modeid) {
    let mode;
    switch(modeid) {
      case 0: mode = 'Blind pick'; break;
      case 1: mode = 'Draft pick'; break;
      case 2: mode = 'All random'; break;
    }
    return(mode);
  }

  function joinThemToRooms(blue, purple, cb) {
    let ids = blue.concat(purple), bluetokens = [], purpletokens = [], summs_purple = {}, summs_blue = {};
    Player.find({'player.id': {$in: ids}}, 'player.id socketToken beforeGame').exec().then((res) => {
      res.forEach(function(index) {
        if (blue.includes(index.player.id)) {
          io.sockets.connected[index.socketToken].join(token+'-b'); io.sockets.connected[index.socketToken]['pregame_team'] = 'b';
          io.sockets.connected[index.socketToken]['chgametoken'] = token;
          summs_blue[index.player.id] = {'a': index.beforeGame.summonerspell1, 'b': index.beforeGame.summonerspell2};
        }
        else if (purple.includes(index.player.id)) {
          io.sockets.connected[index.socketToken].join(token+'-p'); io.sockets.connected[index.socketToken]['pregame_team'] = 'p';
          io.sockets.connected[index.socketToken]['chgametoken'] = token;
          summs_purple[index.player.id] = {'a': index.beforeGame.summonerspell1, 'b': index.beforeGame.summonerspell2};
        }
      })
      cb(summs_blue, summs_purple)
    }).catch((err) => {error('172721', err)});
  }

  if (loggedin) {

    CustomLobby.findById(token, 'status.king started type map status players').exec().then((res) => {

      if (parseInt(res.status.king) === parseInt(socketpid)) {

        if (res.started == false) {

          CustomLobby.findByIdAndUpdate(token, {$set: {'started': true}}).exec().then(() => {
            var crChS = new chSelect({
              token: token,
              team: {
                blue: res.status.online.blue,
                purple: res.status.online.purple,
                unready: res.status.online.blue.concat(res.status.online.purple)
              }
            });

            crChS.save().then(() => {
              let mapname = whichMap(res.map), modename = whichMode(res.type);
              let teamsizes = res.status.online.blue.length+' vs '+res.status.online.purple.length;

              let blue_ally = {}, purple_ally = {};
              for (i=0;i<res.status.online.purple.length;i++) {purple_ally[res.status.online.purple[i]] = res.players[res.status.online.purple[i]]}
              for (i=0;i<res.status.online.blue.length;i++) {blue_ally[res.status.online.blue[i]] = res.players[res.status.online.blue[i]]}

              joinThemToRooms(res.status.online.blue, res.status.online.purple, function(summsb, summsp) {
                console.log('[INFO] Lobby id: `'+token+'` started.')
                gameStarted(
                  {'map': mapname, 'mode': modename, 'teamsizes': teamsizes, 'gametype': 'Custom mode'},
                  {'ally': blue_ally, 'enemy': res.status.online.purple.length, 'summs': summsb},
                  {'ally': purple_ally, 'enemy': res.status.online.blue.length, 'summs': summsp}
                )

                require('../championselect/timers').start(token, res.map);
                io.to('logged users').emit('custom game info update', {'token': token, 'type': 7})
              })

            }).catch((err) => {error('662612', err)})

          }).catch((err) => {error('122271', err)})

        } else wrong('Game already started.')

      } else wrong('You are not the king to do that!')

    }).catch((err) => {error('282881', err)})

  } else wrong('You are not logged in')

}
