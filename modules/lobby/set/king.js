var {io, Player, mongoose, CustomLobby, escapeHtml} = require('./../../../server.js');

module.exports.renounce = (socketid, socketpid, islogged, newking) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {
    Player.findOne({'socketToken': socketid}, 'customGame').exec().then((player) => {

      if (player.customGame.inlobby) {

        CustomLobby.findOne({'_id': player.customGame.lobbyid}, 'status.king').exec().then((old) => {

          if (parseInt(old.status.king) === parseInt(socketpid)) {

            CustomLobby.update({'_id': player.customGame.lobbyid}, {$set: {'status.king': newking}}).exec().then(() => {

              io.to(player.customGame.lobbyid).emit('custom game new king', {'newkingid': newking, 'oldkingid': socketpid, 'how': 0})

            }).catch((err) => {error('857812');console.log('[ERROR] ID:857812 Catch -', err)})

          } else wrong('You are not the king to do that!')

        }).catch((err) => {error('686882');console.log('[ERROR] ID:686882 Catch -', err)})

      } else wrong('You are not in lobby, try relog!')

    }).catch((err) => {error('681724');console.log('[ERROR] ID:681724 Catch -', err)})

  } else warning('You are not logged in, try relog!')

}
