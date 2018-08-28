var {io, Player, mongoose, CustomLobby, escapeHtml} = require('./../../../server.js');

module.exports.reaction = (socketid, socketpid, pNick, loggedin, token, callback) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n, err) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']');console.log('[ERROR] ID:'+n+' Catch - '+err)};
  function cberror(tokenx) {io.to(tokenx).emit('custom game invited declined', socketpid)}

  if (loggedin) {

    CustomLobby.findById(token, 'status.online.connected teamsize status.invites.pending').exec().then((res) => {

      if (res.status.invites.pending.includes(parseInt(socketpid))) {

        if (res.status.online.connected < ((parseInt(res.teamsize)+1)*2)) {

          CustomLobby.findByIdAndUpdate(token, {$pull: {'status.invites.pending': socketpid}, $push: {'status.invites.accepted': socketpid}}).exec().then(() => {

            io.to(token).emit('custom game invited accepted', socketpid)
            require('../join').join(socketid, true, true, socketpid, pNick, loggedin, {'token': token}, (cb) => {
              if (!cb.success) {cberror(cb.token)};
              if (cb.success) {callback({'success': true, 'token': cb.token})};
            });

          }).catch((err) => {error('282681', err)});

        } else {
          wrong('This room is full!')
          CustomLobby.findByIdAndUpdate(token, {$pull: {'status.invites.pending': socketpid}, $push: {'status.invites.declined': socketpid}}).exec().then(() => {
            io.to(token).emit('custom game invited declined', socketpid)
          })

        }

      } else wrong('You are not invited to this game')

    }).catch((err) => {error('282881', err)})

  } else wrong('You are not logged in')

}
