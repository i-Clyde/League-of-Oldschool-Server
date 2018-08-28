var {io, Player, mongoose, CustomLobby, escapeHtml} = require('./../../../server.js');

module.exports.reaction = (socketid, socketpid, loggedin, token) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n, err) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']');console.log('[ERROR] ID:'+n+' Catch - '+err)};

  if (loggedin) {

    CustomLobby.findById(token, 'status.invites.pending').exec().then((res) => {

      if (res.status.invites.pending.includes(parseInt(socketpid))) {

        CustomLobby.findByIdAndUpdate(token, {$pull: {'status.invites.pending': socketpid}, $push: {'status.invites.declined': socketpid}}).exec().then(() => {

          io.to(token).emit('custom game invited declined', socketpid)

        }).catch((err) => {error('282681', err)});

      } else wrong('You are not invited to this game')

    }).catch((err) => {error('282881', err)})

  } else wrong('You are not logged in')

}
