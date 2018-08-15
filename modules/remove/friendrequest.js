var {io, Player, mongoose, gChat} = require('../../server.js');

module.exports.remove = (socketid, pid, socketpid, islogged) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {
    Player.update({'socketToken': socketid}, {$pull: {'social.relations.pending.requests': pid}}).catch((err) => {error('306190')});
    Player.update({'player.id': pid}, {$pull: {'social.relations.pending.sent': socketpid}}).catch((err) => {error('306191')});

    Player.findOne({'player.id': pid}, 'socketToken social.status', (err, r) => {
      if (err) error('306192')
      else if (r.social.status != 0) io.to(r.socketToken).emit('declined friend request', {'pid': socketpid})
    })
  }

}
