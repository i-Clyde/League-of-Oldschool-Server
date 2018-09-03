var {io, mongoose, Player, InGame, chSelect, escapeHtml} = require('../../server.js');

module.exports.load = (socketid, loggedin, token) => {

  if (loggedin) {
    InGame.findOne({'token': token}, 'ready').exec().then((res) => {
      io.to('in-'+token+'-game').emit('game load after relog res', res.ready)
    })
  }
}
