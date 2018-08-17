var {io, Player, mongoose} = require('../../server.js');

module.exports.connected = (count, loggedInCount) => {
  console.log('[INFO] New online players counter: '+count);
  io.to('logged users').emit('online users', {'online':count, 'loggedin':loggedInCount});
}
