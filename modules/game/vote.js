var {io, mongoose, chSelect, escapeHtml} = require('../../server.js');

module.exports.declaration = (socketid, socketpid, loggedin, team, token, champion, last) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n, err) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']'); console.log('[ERROR]', err)};

  if (loggedin) {

    

  } else wrong('You are not logged in! Try relog.')

}
