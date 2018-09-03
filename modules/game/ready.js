var {io, mongoose, chSelect, escapeHtml} = require('../../server.js');

module.exports.declaration = (socketid, socketpid, loggedin, team, token, champion, last) => {

  if (loggedin) io.to(token+'-'+team).emit('champion select new declarate', champion, socketpid, last);

}
