var {io, Player, mongoose, CustomLobby, escapeHtml} = require('./../../../server.js');

// data.friendspid
// data.token

// TO Friend: (from, token, map)
// TO lobby: (invated, from, pid)

module.exports.send = (socketid, socketpid, pNick, islogged, data) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n, err) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']'); console.log('[ERROR] ID:'+n+' Catch - '+err)};

  function sendtofriend(fmap) {
    Player.findOne({'player.id': data.friendspid}, 'player.nickname.nick social.status customGame.inlobby socketToken social.relations.friends').exec().then((cb) => {

      if (cb.social.relations.friends.includes(parseInt(socketpid))) {

        if (cb.customGame.inlobby == false) {

          if (cb.social.status != 0) {

            let map;
            switch(parseInt(fmap)) {
              case 1: map = "Summoner's rift"; break;
              case 2: map = "Howling abbys"; break;
              case 3: map = "Twisted threeline"; break;
              case 4: map = "Crystal scar"; break;
            }

            CustomLobby.findByIdAndUpdate(data.token, {$pull: {'status.invites.accepted': data.friendspid, 'status.invites.all': data.friendspid, 'status.invites.declined': data.friendspid, 'status.invites.pending': data.friendspid}}).exec().then(() => {
              CustomLobby.findByIdAndUpdate(data.token, {$push: {'status.invites.pending': data.friendspid, 'status.invites.all': data.friendspid}}).exec()
            })

            io.to(`${cb.socketToken}`).emit('custom game invitation', {'from': pNick, 'token': data.token, 'map': map});
            addtoinvitationlist(cb.player.nickname.nick, pNick, data.friendspid)

          } else wrong('This player is offline, try reopen the window')

        } else wrong('Friend is already in lobby, ask for leave!')

      } else wrong('This is not your friend, try reopen the window')

    }).catch((err) => {error('881823', err)});
  }

  function addtoinvitationlist(nick, fromwho, friendspid) {
    io.to(data.token).emit('custom game add new invitation', {'invated': nick, 'from': fromwho, 'pid': friendspid})
  }

  if (islogged) {

    CustomLobby.findById(data.token, 'status.allowed.toinvite status.king status.invites status.online map').exec().then((cb) => {

      if ( (cb.status.allowed.toinvite.includes(parseInt(socketpid))) || (cb.status.king == socketpid) ) {

        if (!cb.status.invites.pending.includes(parseInt(data.friendspid))) {

          if (!cb.status.invites.accepted.includes(parseInt(data.friendspid))) {

            let teamen = cb.status.online.blue.concat(cb.status.online.purple)

            if ( !teamen.includes(parseInt(data.friendspid)) ) {

              sendtofriend(cb.map)

            } else wrong('This friend is already in lobby')

          } else wrong('This friend is already in lobby')

        } else wrong('This friend is already invited')

      } else wrong('You are not authorized to do that.')

    }).catch((err) => {error('881825', err)});

  } else wrong('You are not logged in.')


}
