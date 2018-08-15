var {io, Player, mongoose, escapeHtml} = require('../../server.js');

module.exports.disconnected = (socketID, loggedIn, count, loggedInCount, socketIP) => {

  // Casual operatons
  console.log('[INFO] New online players counter: '+count);

  // If logged in
  if (loggedIn) {
    Player.findOneAndUpdate({'socketToken': socketID}, {$set:{'social.status': 0}}, {upsert: true, new: true}).exec();
    Player.findOne({'socketToken': socketID}, 'player.id social.relations.friends social.description', (err, his) => {
      if(err) console.log('[ERROR] There was an error while player was logging out [#1] - '+err);
      Player.find({'player.id': {$in:his.social.relations.friends}}, 'socketToken social.status', (err, res) => {
        if (err) console.log('[ERROR] There was an error while player was logging out [#2] - '+err);
        friends = [];res.forEach((prop) => {if (prop.social.status != 0) friends.push(prop.socketToken)});
        friends.forEach((friend) => {
          io.to(friend).emit('friend updated status', {'id': his.player.id, 'status': 0, 'desc': (his.social.description != null)?escapeHtml(his.social.description):null})
        });
      });
    });
  }

}
