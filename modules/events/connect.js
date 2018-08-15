var {io, Player, mongoose} = require('../../server.js');

module.exports.connected = (count) => {
  console.log('[INFO] New online players counter: '+count);
}
