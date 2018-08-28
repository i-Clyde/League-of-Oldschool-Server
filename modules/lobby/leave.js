var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.leave = (socketid, pNick, socketpid, islogged, data, cb) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {

    Player.findOne({'socketToken': socketid}, 'customGame').exec().then((iscus) => {

      if (iscus.customGame.inlobby) {

        Player.update({'socketToken': socketid}, {$set: {'customGame.inlobby': false, 'customGame.lobbyid': null}}).exec().then(() => {

          CustomLobby.findById(iscus.customGame.lobbyid, 'status started').exec().then((res) => {
            if (res.status.online.connected > 1) {
              var pull = {}, teamcolor;

              if (res.status.online.blue.includes(socketpid)) {pull['status.online.blue'] = socketpid; teamcolor = 'blue'};
              if (res.status.online.purple.includes(socketpid)) {pull['status.online.purple'] = socketpid; teamcolor = 'red'};
              if (res.status.allowed.toinvite.includes(socketpid)) pull['status.allowed.toinvite'] = socketpid;
              if (res.status.king == socketpid) {
                Player.findOne({'customGame.lobbyid': data.cGID}, 'player.id').exec().then((newking) => {
                  CustomLobby.findByIdAndUpdate(data.cGID, {$set: {'status.king': newking.player.id}}).exec()
                  io.to(data.cGID).emit('custom game new king', {'newkingid': newking.player.id, 'oldkingid': socketpid, 'how': 1})
                })
              }
              if (res.status.invites.accepted.includes(socketpid)) {
                CustomLobby.findByIdAndUpdate(data.cGID, {$pull: {'status.invites.accepted': socketpid}, $push: {'status.invites.declined': socketpid}}).exec()
                io.to(data.cGID).emit('custom game invited left', socketpid)
              }

              if (res.started) {
                let blue = res.status.online.blue; purple = res.status.online.purple;
                let ids = blue.concat(purple), socketindex = ids.indexOf(socketpid); ids.splice(socketindex, 1);
                Player.find({'player.id': {$in: ids}}, 'player.id socketToken').exec().then((leavethem) => {
                  leavethem.forEach(function(index) {
                    if (blue.includes(index.player.id)) {io.sockets.connected[index.socketToken].leave(data.cGID+'-b')}
                    else if (purple.includes(index.player.id)) {io.sockets.connected[index.socketToken].leave(data.cGID+'-p')}
                  })
                }).catch((err) => {error('551551'), console.log(err)});

                CustomLobby.findByIdAndUpdate(data.cGID, {$set: {'started': false}}).exec();
                io.in(data.cGID).emit('custom game force game stop', pNick);
                io.to('logged users').emit('custom game info update', {'token': data.cGID, 'type': 6});
              }

              let newconnected = res.status.online.connected-1;
              CustomLobby.findByIdAndUpdate(data.cGID, {$pull: pull}).exec()
              CustomLobby.findByIdAndUpdate(data.cGID, {$set: {'status.online.connected': newconnected}}).exec()
              cb({'success': true, 'cGID': data.cGID});
              io.to('logged users').emit('custom game info update', {'token': data.cGID, 'type': 2})
              io.to(data.cGID).emit('custom game player left', {'nick': pNick, 'pid': socketpid, 'teamcolor': teamcolor, 'started': res.started})
            } else {
              cb({'success': true, 'cGID': data.cGID});
              io.to('logged users').emit('custom game info update', {'token': data.cGID, 'type': 9})
              CustomLobby.findByIdAndRemove(data.cGID).exec();
            }

          })
        }).catch((err) => {error('957888')})

      } else wrong('You are not in lobby')

    }).catch((err) => {error('716262')})

  } else wrong('You are not logged in!')

}
