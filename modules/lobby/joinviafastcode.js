var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.join = (socketid, socketpid, pNick, islogged, fastcode, callback) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  CustomLobby.findOne({'fastcode': fastcode}, '_id').exec().then((fastcheck) => {

    if (fastcheck) {

      require('./join').join(socketid, true, false, socketpid, pNick, islogged, {'token': fastcheck._id}, function (cb) {

        if (cb.success)
        {

          io.to(`${socketid}`).emit('fastcode secret response', 'success')
          success('Fastcode accepted, connecting...')
          callback({'token': cb.token, 'success': true})

        }

      })

    } else wrong('Wrong fastcode, try again with another!')

  }).catch((err) => {error('172662');console.log('[ERROR] ID:172662 Catch -', err)})

}
