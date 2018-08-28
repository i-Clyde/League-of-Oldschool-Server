var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.kick = (socketid, socketpid, islogged, data, callback) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {

    Player.findOne({'player.id': data.kickedid}, 'socketToken player.nickname.nick player.id customGame').exec().then((kickedres) => {

      if (kickedres.customGame.inlobby) {

        if (kickedres.customGame.lobbyid == data.token) {

          CustomLobby.findOne({'_id': data.token}, 'status.king').exec().then((whatsthe) => {

            if (whatsthe.status.king == socketpid) {

              require('./leave').leave(kickedres.socketToken, kickedres.player.nickname.nick, kickedres.player.id, true, {'cGID': data.token}, function (cbres) {

                if (cbres.success)
                {

                  CustomLobby.findOneAndUpdate(data.token, {$push: {'status.blocked': parseInt(data.kickedid)}}).exec().then(() => {

                    io.to(cbres.cGID).emit('custom game kicked', {'kickednick': kickedres.player.nickname.nick, 'kickedid': kickedres.player.id})
                    callback({'success': true, 'token': cbres.cGID, 'socketToken': kickedres.socketToken})

                  }).catch((err) => {error('444222');console.log('[ERROR] ID:444222 Catch - ', err)})

                }

              })

            } else wrong('You are not the king to do that!')

          }).catch((err) => {error('666172');console.log('[ERROR] ID:666172 Catch - ', err)})

        } else wrong('This player is not in your lobby.')

      } else wrong('This player is not in any lobby.')

    }).catch((err) => {error('661762');console.log('[ERROR] ID:661762 Catch - ', err)})

  } else wrong('You are not logged in, try relog!')

}
