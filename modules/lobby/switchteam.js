var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.switch = (socketid, socketpid, islogged) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {

    Player.findOne({'socketToken': socketid}, 'customGame').exec().then((res) => {

      if (res.customGame.inlobby) {
        CustomLobby.findById(res.customGame.lobbyid, 'status.online teamsize').exec().then((cGRes) => {

          if ((cGRes.status.online.purple.length <= cGRes.teamsize+1) || (cGRes.status.online.purple.length <= cGRes.teamsize+1)) {

            let fromteam, toteam, pullteam = {}, pushteam = {}, pullteama, pushteama;

            if (cGRes.status.online.purple.includes(socketpid)) {fromteam = 'red'; pullteama = 'purple'; pushteama = 'blue'; toteam = 'blue'}
            if (cGRes.status.online.blue.includes(socketpid)) {fromteam = 'blue'; pullteama = 'blue'; pushteama = 'purple'; toteam = 'red'}

            pushteam['status.online.'+pushteama] = socketpid;
            pullteam['status.online.'+pullteama] = socketpid;

            CustomLobby.update({'_id': res.customGame.lobbyid}, {$pull: pullteam, $push: pushteam}).exec().then(() => {

            io.to(res.customGame.lobbyid).emit('custom game switch team res', {'fromteam': fromteam, 'toteam': toteam, 'pid': socketpid})

            }).catch((err) => {error('127619');console.log('[ERROR] ID:127619 Catch: ', err)})

          } else wrong('This team is full!')

        }).catch((err) => {error('512567');console.log('[ERROR] ID:512567 Catch: ', err)})

      } else wrong('You are not in lobby. Try relog!')

    }).catch((err) => {error('663356');console.log('[ERROR] ID:663356 Catch: ', err)})

  }

}
