var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.join = (socketid, viafastcode=false, viainvite=false, socketpid, pNick, islogged, data, cb) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']'); io.to(socketid).emit('custom game moved', {'status': false})};

  if (islogged) {
    CustomLobby.findOne({'_id': data.token}, 'password status name map type cheats minions cooldowns teamsize players started').exec().then((res) => {
      function join(ispsswd=false) {

        let blueTeam = res.status.online.blue;
        let purpleTeam = res.status.online.purple;
        let invites = res.status.invites.all;
        let connected = blueTeam.concat(purpleTeam).concat(invites);

          Player.find({'player.id': {$in: connected}}, 'player.id player.nickname.nick playerStats.profileicon.icon').exec().then((nicksets) => {

            let preparenicksets = {}; nicksets.forEach(function(index) {
              preparenicksets[index.player.id] = {};
              preparenicksets[index.player.id]['nick'] = index.player.nickname.nick;
              preparenicksets[index.player.id]['icon'] = index.playerStats.profileicon.icon;
            })

            Player.findOne({'socketToken': socketid}, 'playerStats.profileicon.icon customGame player.nickname.nick player.id').exec().then((aboutme) => {
              if (!aboutme.customGame.inlobby) {
                if (res.status.online.connected < ((res.teamsize)+1*2)) {
                  var joined, newconnected = res.status.online.connected+1;
                  let addplayer = {}; addplayer['players.'+socketpid] = pNick;

                  CustomLobby.update({'_id': data.token}, addplayer).exec();
                  if ((blueTeam.length > purpleTeam.length) && (blueTeam.length <= (parseInt(res.teamsize)+1))) {
                  joined=0; CustomLobby.update({'_id': data.token}, {$push: {'status.online.purple': socketpid}, $set: {'status.online.connected': newconnected}}).exec()
                  } else { joined=1; CustomLobby.update({'_id': data.token}, {$push: {'status.online.blue': socketpid}, $set: {'status.online.connected': newconnected}}).exec()}

                  if (res.status.invites.all.includes(socketpid)) {
                    io.to(data.token).emit('custom game invited accepted', socketpid)
                    CustomLobby.findByIdAndUpdate(data.token, {$pull: {'status.invites.accepted': socketpid, 'status.invites.all': socketpid, 'status.invites.declined': socketpid, 'status.invites.pending': socketpid}}).exec().then(() => {
                      CustomLobby.findByIdAndUpdate(data.token, {$push: {'status.invites.accepted': socketpid, 'status.invites.all': socketpid}}).exec()
                    })
                  }

                  io.to(`${socketid}`).emit('custom game moved',
                    {
                      'status': true,
                      'nicksets': preparenicksets,
                      'map': res.map,
                      'king': res.status.king,
                      'blue': blueTeam,
                      'purple': purpleTeam,
                      'connected': res.status.online.connected,
                      'name': res.name,
                      'type': res.type,
                      'cheats': res.cheats,
                      'minions': res.minions,
                      'cooldowns': res.cooldowns,
                      'teamsize': res.teamsize,
                      'ispsswd': ispsswd,
                      'gametoken': data.token,
                      'players': res.players,
                      'invites': res.status.invites,
                      'myteam': joined
                    }
                  )

                  Player.findOneAndUpdate({'socketToken': socketid}, {$set: {'customGame.inlobby': true, 'customGame.lobbyid': data.token}}).exec();

                  cb({'success': true, 'token': data.token})
                  io.to(data.token).emit('custom game player joined', {'nick': aboutme.player.nickname.nick, 'pid': aboutme.player.id, 'team': joined, 'iconid': aboutme.playerStats.profileicon.icon})
                  io.to('logged users').emit('custom game info update', {'token': data.token, 'type': 1})
                } else wrong('Room is full!')
              } else wrong('You are already in room, try reload!')
            }).catch((err) => {error('661142');console.log('[ERROR] '+err)})
          }).catch((err) => {error('238172')})
        }

        if (!res.started) {
          if (!res.status.blocked.includes(socketpid) || viainvite) {
            if ((res.password != null) && (viafastcode === false) && (viainvite === false)) {
              // if (isNaN(data.password)) wrong('This room is protected, please join with password');
              if (data.password === res.password) join(true); else wrong('Wrong password')
            } else join();
          } else wrong('You are not allowed to join this lobby, you need direct invite');
        } else wrong('Game already started!')

      }).catch((err) => {error('751290'); console.log(err)})

  } else wrong('It seems you are not logged in, try relog!')

}

module.exports.kingjoin = (socketid, pID, cGID, cb) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  Player.update({'socketToken': socketid}, {$set: {'customGame.inlobby': true, 'customGame.lobbyid': cGID}}).exec().then(() => {
    CustomLobby.findByIdAndUpdate(cGID, { $push: {'status.online.blue': pID}}).exec().then(() => {
      cb(true);
      // io.to(cGID).emit('custom game player joined', {'pID': pID});
    }).catch((err) => {error('817246');console.log(err, '\n')})
  }).catch((err) => {error('578628')});

}
