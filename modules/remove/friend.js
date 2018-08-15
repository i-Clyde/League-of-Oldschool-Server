var {io, Player, mongoose, gChat} = require('../../server.js');

module.exports.remove = (socketId, pID, socketPID, isLogged) => {
  function error(n) {io.to(socketId).emit('error', 'An error occured, please try again! [#' + n + ']')};
  function warning(msg) {io.to(socketId).emit('error', msg)};
  function info(msg) {io.to(socketId).emit('info', msg)};
  function success() {io.to(socketId).emit('remove friend res', pID)};

  if (isLogged) {

    if (socketPID != pID) {

      Player.findOne({'socketToken': socketId}, 'social.relations.friends').exec().then((s) => {

        if (s.social.relations.friends.includes(parseInt(pID))) {

          Player.findOne({'player.id': pID}, 'socketToken player.nickname.nick social.status').exec().then((t) => {

            Player.findOneAndUpdate({'player.id': pID}, {$pull: {'social.relations.friends': socketPID}}).exec();
            var remove = Player.findOneAndUpdate({'socketToken': socketId}, {$pull: {'social.relations.friends': pID}}).exec();
            remove.then(() => {

              if (t.social.status != 0) io.to(t.socketToken).emit('friend removed you', {'pid': socketPID});
              info('Successfully removed \''+t.player.nickname.nick+'\' from your friend list!');success();

            }).catch((err) => {error('276196')})

          }).catch((err) => {error('716591')})

        } else warning('This person is not your friend, try relog.')

      }).catch((err) => {error('723819')})

    } else warning('You cannot remove yourself from friendlist, really.')

  } else warning('It seems like you are not logged in... try relog.')

}
