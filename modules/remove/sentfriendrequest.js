var {io, Player, mongoose, gChat} = require('../../server.js');

module.exports.remove = (socketid, pid, socketpid, islogged) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {
    Player.update({'socketToken': socketid}, {$pull: {'social.relations.pending.sent': pid}}).catch((err) => {error('308190')});
    Player.update({'player.id': pid}, {$pull: {'social.relations.pending.requests': socketpid}}).catch((err) => {error('308191')});

    Player.findOne({'player.id': pid}, 'socketToken social.status', (err, r) => {
      if (err) error('307193')
      if (r.social.status != 0) io.to(r.socketToken).emit('cancelled friend request', {'pid': socketpid})
    })
  }

}
