var {io, Player, mongoose, gChat, escapeHtml} = require('../../server.js');

module.exports.add = (socketid, nick, loggedin) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};
  function warning(msg) {io.to(socketid).emit('error', msg)};
  function success(msg) {io.to(socketid).emit('success', msg)};

    if (loggedin) {

    nick = nick.trim().toLowerCase();
    var dc = Player.countDocuments({'player.nickname.nick_trimed': nick})
    dc.then((cn) => {
      if (cn > 0) {
        var askingq = Player.findOne({'socketToken': socketid}, 'player.id player.nickname.nick social.ignore social.relations.friends social.relations.pending').exec();

        askingq.then((asking) => {
          var askedq = Player.findOne({'player.nickname.nick_trimed': nick}, 'player.id player.nickname.nick social.ignore social.relations.pending social.status socketToken').exec();
        askedq.then((asked) => {

          var askedignores = asked.social.ignore;
          var askingignores = asking.social.ignore;
          if (!(asked.player.id == asking.player.id)) {
            if (!asking.social.relations.friends.includes(asked.player.id)) {
              if (!askedignores.includes(asking.player.id)) {
                if (!askingignores.includes(asked.player.id)) {
                  var askingPendings = asking.social.relations.pending.sent;
                  if (!askingPendings.includes(asked.player.id)) {
                    var askedPendings = asked.social.relations.pending.sent;
                    if (!askedPendings.includes(asking.player.id)) { // Asked didn't sent him any friend request.

                      Player.update({'player.id': asked.player.id}, {$push: {'social.relations.pending.requests': asking.player.id}}, {new: true}).catch((err) => {error('400211')}) // Asked
                      Player.update({'player.id': asking.player.id}, {$push: {'social.relations.pending.sent': asked.player.id}}, {new: true}).then(() => {
                        success('You sent a request to: '+asked.player.nickname.nick);
                        io.to(socketid).emit('add friend requests', {nick: asked.player.nickname.nick, pid: asked.player.id});

                        if (asked.social.status != 0) {
                          io.to(asked.socketToken).emit('info', asking.player.nickname.nick+' asked you for friendship!')
                          io.to(asked.socketToken).emit('new friend request', {'pid': asking.player.id, 'nick': asking.player.nickname.nick})
                        }
                      }).catch((err) => {error('400210')}) // Asking

                    } else if (askedPendings.includes(asking.player.id)) { // He already sent him request so make them friends!
                      require("./../set/friends").set(socketid, asked.player.id, asking.player.id, loggedin);
                    }
                  } else warning('You already asked him for friendship')
                } else warning('You cannot add this person while you are ignoring him!')
              } else warning('You cannot add this person!')
            } else warning('You are already friends')
          } else warning('Really, you want to ask yourself for friendship?')
        }).catch((err) => {error('400201 '+err)})
      }).catch((err) => {error('400200')})
      } else warning('There is no person called: '+escapeHtml(nick))
    }).catch((err) => {error('402200')})
  }

}
