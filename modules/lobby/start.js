var {io, Player, mongoose, CustomLobby, escapeHtml} = require('./../../server.js');

module.exports.start = (socketid, socketpid, loggedin, token) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n, err) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']');console.log('[ERROR] ID:'+n+' Catch - '+err)};
  function gameStarted(data) {io.to(token).emit('custom game started', data)}

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

  function joinThemToRooms(blue, purple) {
    let ids = blue.concat(purple), bluetokens = [], purpletokens = [];
    Player.find({'player.id': {$in: ids}}, 'player.id socketToken').exec().then((res) => {
      res.forEach(function(index) {
        if (blue.includes(index.player.id)) {io.sockets.connected[index.socketToken].join(token+'-b'); io.sockets.connected[index.socketToken]['pregame_team'] = 'b'}
        else if (purple.includes(index.player.id)) {io.sockets.connected[index.socketToken].join(token+'-p'); io.sockets.connected[index.socketToken]['pregame_team'] = 'p'}
      })
    }).catch((err) => {error('172721', err)});
  }

  if (loggedin) {

    CustomLobby.findById(token, 'status.king started type map status.online.purple status.online.blue').exec().then((res) => {

      if (parseInt(res.status.king) === parseInt(socketpid)) {

        if (res.started == false) {

          CustomLobby.findByIdAndUpdate(token, {$set: {'started': true}}).exec().then(() => {
            console.log('[INFO] Lobby id: `'+token+'` started.')
            let mapname = whichMap(res.map), modename = whichMode(res.type);
            let teamsizes = res.status.online.blue.length+' vs '+res.status.online.purple.length;

            joinThemToRooms(res.status.online.blue, res.status.online.purple)
            gameStarted({'map': mapname, 'mode': modename, 'teamsizes': teamsizes, 'gametype': 'Custom mode'})
            io.to('logged users').emit('custom game info update', {'token': token, 'type': 7})
          }).catch((err) => {error('122271', err)})

        } else wrong('Game already started.')

      } else wrong('You are not the king to do that!')

    }).catch((err) => {error('282881', err)})

  } else wrong('You are not logged in')

}
