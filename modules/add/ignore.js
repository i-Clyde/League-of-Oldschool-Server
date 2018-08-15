var {io, Player, mongoose, gChat, escapeHtml} = require('../../server.js');

module.exports.add = (socketID, nick, loggedIn) => {
  function error(n) {io.to(socketID).emit('error', 'An error occured, please try again! [#' + n + ']')};
  function warning(msg) {io.to(socketID).emit('error', msg)};
  function success(msg) {io.to(socketID).emit('success', msg)};

  nick_c = nick.trim().toLowerCase();

  if (loggedIn) {

    Player.findOne({'socketToken': socketID}, 'player.id player.nickname.nick_trimed social.relations social.ignore').exec().then((s) => {

      if (s.player.nickname.nick_trimed != nick_c) {

        Player.countDocuments({'player.nickname.nick_trimed': nick_c}).exec().then((cd) => {

          if (cd > 0) {

            Player.findOne({'player.nickname.nick_trimed': nick_c}, 'player.id player.nickname.nick usertype').exec().then((t) => {

              if (!(t.usertype == 'admin')) {

                if (!s.social.ignore.includes(t.player.id)) {

                  if (s.social.relations.friends.includes(t.player.id)) require("../remove/friend").remove(socketID, t.player.id, s.player.id, loggedIn);

                  Player.findOneAndUpdate({'socketToken': socketID}, {$push: {'social.ignore': t.player.id}}, {new: true}).exec().then(() => {
                    io.to(socketID).emit('add ignore res', {'pid': t.player.id, 'nick': t.player.nickname.nick})
                    success('Successfully added new ignore.')
                  }).catch((err) => {error('238610')})

                } else warning('You are already ignore this player.')

              } else warning('You cannot ignore Administrator')

            }).catch((err) => {error('716290')})

          } else warning('There is no player named: '+escapeHtml(nick))

        }).catch((err) => {error('248710')})

      } else warning('You cannot ignore yourself, really.')

    }).catch((err) => {error('291802')})

  } else warning('It seems like you are not logged in... try relog')

}
