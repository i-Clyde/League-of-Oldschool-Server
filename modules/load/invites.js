var {io, Player, mongoose} = require('../../server.js');

module.exports.load = (socketid) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  Player.findOne({'socketToken': socketid}, 'social.relations.pending').exec().then((r) => {

    var sent = r.social.relations.pending.sent;
    var requests = r.social.relations.pending.requests;

    sent.forEach((id) => {
      Player.findOne({'player.id': id}, 'player.nickname.nick').exec().then((n) => {
        io.to(socketid).emit('load invites res', {'type': 'sent', 'pid': id, 'nick': n.player.nickname.nick})
      }).catch((err) => {error('500110')})
    })

    requests.forEach((id) => {
      Player.findOne({'player.id': id}, 'player.nickname.nick').exec().then((n) => {
        io.to(socketid).emit('load invites res', {'type': 'req', 'pid': id, 'nick': n.player.nickname.nick})
      }).catch((err) => {error('500112')})
    })


  }).catch((err) => {error('500010')})

}
