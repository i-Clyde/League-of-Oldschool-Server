var {io, Player, mongoose} = require('../../server.js');

module.exports.set = (nick, socketid, callback) => {
  function success(newnick) {io.to(socketid).emit('set nickname response', {status: 'success', msg: 'Successfully set your nickname to: ' + newnick + '!', nick: newnick})};
  function wrong(m) {io.to(socketid).emit('set nickname response', {status: 'error', msg: m})};
  function error(n) {io.to(socketid).emit('set nickname response', {status: 'error', msg: 'An error occured, please try again! [#' + n + ']'})};

  nick = nick.trim();
  var trimed_nick = nick.trim().toLowerCase();
  var checknull = Player.findOne({socketToken: socketid}, 'player.nickname.nick_trimed').exec();
  checknull.then((res) => {
    if (res.player.nickname.nick_trimed == null) {
      var checkexist = Player.countDocuments({'player.nickname.nick_trimed': trimed_nick}).exec();
      checkexist.then((n) => {
        if (n<=0) {
          if ((nick.length >= 3) && (nick.length <= 20) && (nick != 'null')) {
            var pnc = /^[ a-zA-Z0-9]*$/;
            if (pnc.test(nick)) {
              var update = Player.findOneAndUpdate({socketToken: socketid}, {$set:{'player.nickname.nick': nick, 'player.nickname.nick_trimed': trimed_nick}}, {upsert: true, new: true}).exec();
              update.then(() => {
                callback({nickname: nick});
                success(nick);
              }).catch((err) => {error('100003')})
            } else wrong('Your nickname didn\'t pass our pattern check, choose another one!')
          } else wrong('Your nickname is probably too long or too short (Min: 3, Max: 20) chars!')
        } else wrong('This nickname is already taken, please choose another one!')
      }).catch((err) => {error('100002')})
    } else wrong('Our systems noticed you already have nickname, try relog!')
  }).catch((err) => {error('100001')})
}
