var {io, Player, mongoose, gChat} = require('../../server.js');

module.exports.remove = (socketid, pid, islogged) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {
    Player.findOneAndUpdate({'socketToken': socketid}, {$pull: {'social.ignore': parseInt(pid)}}).exec().catch((err) => {error('516713')});
  }

}
