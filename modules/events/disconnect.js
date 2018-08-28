var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.disconnected = (socketID, pNick, loggedIn, count, loggedInCount, socketIP, callback) => {
  function alertCGInvedLeft(token, pid) {io.to(token).emit('custom game invited left', pid)}

  // Casual operatons
  console.log('[INFO] New online players counter: '+count);
  io.to('logged users').emit('online users', {'online':count, 'loggedin':loggedInCount});

  // If logged in
  if (loggedIn) {
    Player.findOneAndUpdate({'socketToken': socketID}, {$set:{'social.status': 0}}, {upsert: true, new: true}).exec();
    Player.findOne({'socketToken': socketID}, 'player.id social.relations.friends social.description customGame', (err, his) => {
      if(err) console.log('[ERROR] There was an error while player was logging out [#1] - '+err);
      Player.find({'player.id': {$in:his.social.relations.friends}}, 'socketToken social.status customGame', (err, res) => {
        if (err) console.log('[ERROR] There was an error while player was logging out [#2] - '+err);
        friends = [];res.forEach((prop) => {if (prop.social.status != 0) friends.push(prop.socketToken)});
        friends.forEach((friend) => {
          io.to(friend).emit('friend updated status', {'id': his.player.id, 'status': 0, 'desc': (his.social.description != null)?escapeHtml(his.social.description):null})
        });

        if (his.customGame.inlobby) {
          require('../lobby/leave').leave(socketID, pNick, his.player.id, true, {'cGID': his.customGame.lobbyid, 'forcestop': true}, (cbres) => {
            callback({'wasinlobby': true, 'cGID': cbres.cGID})
          })
        }

        CustomLobby.find({'status.invites.pending': his.player.id}, '_id').exec().then((cLRes) => {
          if (cLRes) {
            cLRes.forEach(function(index) {
              CustomLobby.findByIdAndUpdate(index._id, {$pull: {'status.invites.pending': his.player.id}, $push: {'status.invites.declined': his.player.id}}).exec();
              alertCGInvedLeft(index._id, his.player.id);
            });
          }
        }).catch((err) => {console.log('[ERROR] '+err)});
      });
    });
  }

}
