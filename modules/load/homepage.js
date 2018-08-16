var {io, Player, mongoose, gChat, escapeHtml} = require('../../server.js');

module.exports.load = (socketID, loggedIn) => {
  function error(n) {io.to(socketID).emit('error', 'An error occured, please try again! [#' + n + ']')};
  function warning(msg) {io.to(socketID).emit('error', msg)};

  if (loggedIn) {
    Player.findOne({'socketToken': socketID}, 'player.nickname.nick playerStats.profileicon.icon social.description messageHistory').exec().then((data) => {

      gChat.findOne({}, 'pid msg', { sort: { 'date' : -1 } }).exec().then((lastGlobalMSG) => {

        io.to(`${socketID}`).emit('load homepage', {'nickname': data.player.nickname.nick, 'description': data.social.description, 'icon': data.playerStats.profileicon.icon, 'lastGMSG': lastGlobalMSG, 'messageHistory': data.messageHistory})
        
      }).catch((err) => {error('237189'); console.log('[ERROR] Error while trying to get last Global Message: '+data.player.nickname.nick+' err: '+err)})

    }).catch((err) => {error('587100')})
  } else warning('It seems like you are not logged in... please try relog.')

}
