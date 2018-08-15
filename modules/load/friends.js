var {io, Player, mongoose} = require('../../server.js');

module.exports.load = (socketid) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  Player.findOne({'socketToken': socketid}, 'social.relations.friends').exec().then((r) => {

    var friends = r.social.relations.friends;

    friends.forEach((id) => {
      Player.findOne({'player.id': id}, 'social.description social.status playerStats.profileicon.icon player.nickname.nick').exec().then((n) => {
        io.to(socketid).emit('load friends res', {'description': n.social.description, 'pid': id, 'socialstatus': n.social.status, 'iconid': n.playerStats.profileicon.icon, 'nickname': n.player.nickname.nick})
      }).catch((err) => {error('500110')})
    })

  }).catch((err) => {error('500010')})

}
