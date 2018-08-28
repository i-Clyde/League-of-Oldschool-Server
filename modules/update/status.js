var {io, Player, mongoose, escapeHtml} = require('../../server.js');

module.exports.update = (socketID, loggedIn, status, desc=null) => {
  if (loggedIn) {

    Player.findOne({'socketToken': socketID}, 'player.id social.relations.friends social.description customGame.inlobby', (err, his) => {
      if(err) console.log('[ERROR] There was an error while player was updating description [#1] - '+err);
      Player.find({'player.id': {$in:his.social.relations.friends}}, 'socketToken social.status', (err, res) => {
        if (err) console.log('[ERROR] There was an error while player was updating description [#2] - '+err);
        friends = [];res.forEach((prop) => {if (prop.social.status != 0) friends.push(prop.socketToken)});

        if ((status == 1) || (status == 2)) {

          Player.findOneAndUpdate({'socketToken': socketID}, {$set: {'social.status': status}}, {upsert: true, new: true}).exec().then(() => {
            friends.forEach((friend) => {
              io.to(friend).emit('friend updated status', {'id': his.player.id, 'status': status, 'desc': (his.social.description != null)?escapeHtml(his.social.description):null})
            });
          });

        } else if (status == 3) {friends.forEach((friend) => {
          if (desc == 'Creating lobby') {io.to(friend).emit('friend updated status', {'id': his.player.id, 'status': 1, 'desc': 'Creating lobby'})}
          else {
            Player.findOneAndUpdate({'socketToken': socketID}, {$set: {'social.status': 3, 'social.desc_three': escapeHtml(desc)}}).exec();
            io.to(friend).emit('friend updated status', {'id': his.player.id, 'status': 3, 'desc': escapeHtml(desc)})
          }
        })}
      });
    });


  }
}
