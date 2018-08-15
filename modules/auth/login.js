var {io, Player, bcrypt, mongoose, escapeHtml} = require('../../server.js');

// Run full check
module.exports.auth = (username, password, socketid, callback) => {
  username = username.trim().toLowerCase();
  function wrong() {io.to(socketid).emit('login response', {status: 'error', msg: 'Incorrect login or password, try again!'})};
  function error(n) {io.to(socketid).emit('login response', {status: 'error', msg: 'An error occured while authorization, try again! [#' + n + ']'})};

  var query = Player.countDocuments({'player.login': username}).exec();
  query.then((n) => {
    if (n>0) {
      if ( (password.length >= 6) && (password.length <= 28) ) {
        var gp = Player.findOne({'player.login': username}, 'playerPrivateData.password').exec();
        gp.then((p) => {
          bcrypt.compare(password, p.playerPrivateData.password, function(err, judge) {
            if (err) error('000004'); else {
            if (judge) {
              var updateToken = Player.findOneAndUpdate({'player.login': username}, {$set:{socketToken: socketid, 'social.status': 1}}, {upsert: true, new: true}).exec();
              updateToken.then(() => {
                var data = Player.findOne({'player.login': username}, 'player.login player.nickname.nick playerStats.profileicon.icon player.id social.description social.relations.friends playerStats.profileicon.iconsOwned').exec();
                data.then((data) => {

                  callback({'login': data.player.login, 'id': data.player.id, 'nick': data.player.nickname.nick, 'loggedin': true});

                  io.to(`${socketid}`).emit('login response', {
                    status: 'success',
                    msg: 'Successfully logged in!',
                    login: data.player.login,
                    nickname: data.player.nickname.nick,
                    id: data.player.id,
                    icon: data.playerStats.profileicon.icon,
                    ownedIcons: data.playerStats.profileicon.iconsOwned,
                    friendsid: data.social.relations.friends,
                    socketToken: socketid
                  });

                  Player.find({'player.id': {$in:data.social.relations.friends}}, 'socketToken social.status', (err, res) => {
                    if (err) console.log('[ERROR] There was an error while player was logging in [#1] - '+err);
                    friends = [];res.forEach((prop) => {if (prop.social.status != 0) friends.push(prop.socketToken)});
                    friends.forEach((friend) => {
                      io.to(friend).emit('friend updated status', {'id': data.player.id, 'status': 1, 'desc': (data.social.description == null)?null:escapeHtml(data.social.description)})
                    });
                  });
                }).catch((err) => {error('000003')})
              }).catch((err) => {error('000005'+err)})
            } else wrong()}
          })
        }).catch((err) => {error('000002')})
      } else wrong()
    } else wrong()
  }).catch((err) => {error('000001')});
}
