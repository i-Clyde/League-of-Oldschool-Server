var {io, Player, mongoose, gChat} = require('../../server.js');

// pID - User who send socketPID request

module.exports.set = (socketID, pID, socketPID, isLogged) => {
  function error(n) {io.to(socketID).emit('error', 'An error occured, please try again! [#' + n + ']')};
  function warning(msg) {io.to(socketID).emit('error', msg)};
  function success(msg) {io.to(socketID).emit('success', msg)};

  if (isLogged) {

    Player.findOne({'player.id': pID}, 'socketToken player.nickname.nick social.status social.description playerStats.profileicon.icon social.relations.pending.sent', (err, asker) => {
      if (err) error('929001');
      else if (asker.social.relations.pending.sent.includes(socketPID)) {
        Player.findOne({'player.id': socketPID}, 'socketToken player.nickname.nick social.status social.description playerStats.profileicon.icon social.relations.pending.requests', (err, asked) => {
          if (err) error('929002');
          else if (asked.social.relations.pending.requests.includes(parseInt(pID))) {

            Player.findOneAndUpdate({'player.id': pID}, {$pull: {'social.relations.pending.sent': socketPID}, $push: {'social.relations.friends': socketPID}}).exec().catch((err) => {error('929003')})
            Player.findOneAndUpdate({'player.id': socketPID}, {$pull: {'social.relations.pending.requests': pID}, $push: {'social.relations.friends': pID}}).exec().catch((err) => {error('929004')})

            if (asker.social.status != 0) {
              io.to(asker.socketToken).emit('success', asked.player.nickname.nick+' accepted your friendship request!');
              io.to(asker.socketToken).emit('friend request accepted', {'pid': socketPID, 'nickname': asked.player.nickname.nick, 'socialstatus': asked.social.status, 'iconid': asked.playerStats.profileicon.icon, 'description': asked.social.description})
              io.to(asker.socketToken).emit('cancelled friend request', {'pid': asked.player.id})
            }
            if (asked.social.status != 0) {
              io.to(asked.socketToken).emit('success', asker.player.nickname.nick+' is your new friend!');
              io.to(asked.socketToken).emit('friend request accepted', {'pid': pID, 'nickname': asker.player.nickname.nick, 'socialstatus': asker.social.status, 'iconid': asker.playerStats.profileicon.icon, 'description': asker.social.description})
              io.to(asked.socketToken).emit('declined friend request', {'pid': asker.player.id})
            }

          } else warning('There was an error, the request may be outdated. (Try relog)')
        })
      } else warning('There was an error, the request may be outdated. (Try relog)')
    })

  } else warning('You are not fully authenticated. (Try relog)')

}
