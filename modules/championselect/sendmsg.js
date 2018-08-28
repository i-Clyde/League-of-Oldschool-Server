var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.send = (socketid, pNick, socketpid, islogged, team, msg) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {

    if (msg !== null && typeof msg === 'object') {

      Player.findOne({'socketToken': socketid}, 'customGame').exec().then((res) => {
        if (res.customGame.inlobby) {if (team) {io.to(res.customGame.lobbyid+'-'+team).emit('champion select new message', {'pid': socketpid, 'nickname': '<i>'+pNick, 'msg': 'joined to the room</i>'})}}
      }).catch((err) => {error('177272')})

    } else {

      msg = msg.trim();

      if ((msg.length <= 128) && (msg.length > 0) ) {

        Player.findOne({'socketToken': socketid}, 'customGame').exec().then((res) => {

          if (res.customGame.inlobby) {

            if (team) {

              io.to(res.customGame.lobbyid+'-'+team).emit('champion select new message', {'pid': socketpid, 'nickname': pNick+':', 'msg': escapeHtml(msg)})

            } else wrong('You are not in champion select')

          } else wrong('You are not in lobby')

        }).catch((err) => {error('177272')})

      } else wrong('Your message is too long or too short!')

    }

  } else wrong('You are not logged in!')

}
