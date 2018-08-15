var {io, Player, mongoose} = require('../../server.js');

module.exports.set = (newicon, socketid, update) => {
  function success(icon) {io.to(socketid).emit('set icon response', {status: 'success', msg: 'Successfully set your new icon!', iconid: icon})};
  function wrong(m) {io.to(socketid).emit('set icon response', {status: 'error', msg: m})};
  function error(n) {io.to(socketid).emit('set icon response', {status: 'error', msg: 'An error occured, please try again! [#' + n + ']'})};

  if (((newicon >= 0) && (newicon <= 28)) || ((newicon >= 502) && (newicon <= 742))) {
    var checkisowned = Player.findOne({'socketToken': socketid}, 'player.id playerStats.profileicon.iconsOwned social.relations.friends social.status').exec();
    checkisowned.then((icons) => {
      if (icons.playerStats.profileicon.iconsOwned.includes(parseInt(newicon))) {
        var getUser = Player.findOneAndUpdate({'socketToken': socketid}, {$set:{'playerStats.profileicon.icon': newicon}}, {upsert: true, new: true}).exec();
        getUser.then(() => {
          success(newicon)
          if (update) {
            Player.find({'player.id': {$in:icons.social.relations.friends}}, 'socketToken social.status', (err, res) => {
              if (err) console.log('[ERROR] There was an error while player was updating icon [#2] - '+err);
              friends = [];res.forEach((prop) => {if (prop.social.status != 0) friends.push(prop.socketToken)});
              friends.forEach((friend) => {
                io.to(friend).emit('friend updated icon', {'id': icons.player.id, 'status': icons.social.status, 'icon': newicon})
              });
            });
          }
        }).catch((err) => {error('110004')})
      } else wrong('You do not own this icon, try with another!')
    }).catch((err) => error('11005'+err))
  } else wrong('This icon doesn\'t match with our database (access) icons. Please select another one!')

}
