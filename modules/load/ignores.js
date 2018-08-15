var {io, Player, mongoose} = require('../../server.js');

module.exports.load = (socketid, loggedin) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (loggedin) {

    Player.findOne({'socketToken': socketid}, 'social.ignore').exec().then((r) => {

      Player.find({'player.id': {$in:r.social.ignore}}, 'player.nickname.nick player.id', (err, res) => {
        if (err) console.log('[ERROR] There was an error while player was updating description [#2] - '+err);

        res.forEach((prop) => {
          io.to(socketid).emit('load ignore res', {'pid': prop.player.id, 'nick': prop.player.nickname.nick})
        });

      });

    }).catch((err) => {error('500010')})

  }

}
