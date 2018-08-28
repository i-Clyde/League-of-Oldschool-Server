var {io, Player, mongoose, CustomLobby, escapeHtml} = require('./../../../server.js');

module.exports.toggle = (socketid, socketpid, islogged, permmited) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {
    Player.findOne({'socketToken': socketid}, 'customGame').exec().then((player) => {

      if (player.customGame.inlobby) {

        CustomLobby.findOne({'_id': player.customGame.lobbyid}, 'status.king status.allowed.toinvite').exec().then((lobby) => {

          if (parseInt(lobby.status.king) === parseInt(socketpid)) {

            if (lobby.status.allowed.toinvite.includes(parseInt(permmited))) { // Pull

              CustomLobby.update({'_id': player.customGame.lobbyid}, {$pull: {'status.allowed.toinvite': permmited}}).exec().then(() => {

                io.to(player.customGame.lobbyid).emit('custom game new perms', {'king': socketpid, 'toggleto': 0, 'allowedid': permmited})

              }).catch((err) => {error('882352');console.log('[ERROR] ID:882352 Catch -', err)})

            } else { // Push

              CustomLobby.update({'_id': player.customGame.lobbyid}, {$push: {'status.allowed.toinvite': permmited}}).exec().then(() => {

                io.to(player.customGame.lobbyid).emit('custom game new perms', {'king': socketpid, 'toggleto': 1, 'allowedid': permmited})

              }).catch((err) => {error('882353');console.log('[ERROR] ID:882353 Catch -', err)})

            }


          } else wrong('You are not the king to do that!')

        }).catch((err) => {error('189472');console.log('[ERROR] ID:189472 Catch -', err)})

      } else wrong('You are not in lobby, try relog!')

    }).catch((err) => {error('616168');console.log('[ERROR] ID:616168 Catch -', err)})

  } else warning('You are not logged in, try relog!')

}
