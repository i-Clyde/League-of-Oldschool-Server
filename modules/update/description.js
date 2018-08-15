var {io, Player, mongoose, escapeHtml} = require('../../server.js');

module.exports.update = (socketID, loggedIn, desc) => {
  if (loggedIn) {
    desc = desc.trim();
    if (desc == '') desc = null;
    if (desc == null || desc.length <= 32) {
      Player.findOne({'socketToken': socketID}, 'player.id social.relations.friends social.status', (err, his) => {
        if(err) console.log('[ERROR] There was an error while player was updating description [#1] - '+err);
        Player.find({'player.id': {$in:his.social.relations.friends}}, 'socketToken social.status', (err, res) => {
          if (err) console.log('[ERROR] There was an error while player was updating description [#2] - '+err);
          friends = [];res.forEach((prop) => {if (prop.social.status != 0) friends.push(prop.socketToken)});

          Player.findOneAndUpdate({'socketToken': socketID}, {$set: {'social.description': desc}}, {upsert: true, new: true}).exec().then(() => {
            io.to(socketID).emit('success', 'Your description has been updated!');
            friends.forEach((friend) => {
              io.to(friend).emit('friend updated description', {'id': his.player.id, 'status': his.social.status, 'desc': (desc != null)?escapeHtml(desc):null})
            });
          }).catch((err) => {io.to(socketID).emit('error', 'Your description could not be updated because of error. Try again')})
        });
      });
    } else io.to(socketID).emit('error', 'Your description could not be updated because is too long. (Max 32)')
  }
}
