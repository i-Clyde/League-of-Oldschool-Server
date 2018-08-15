var {io, Player, mongoose} = require('../../server.js');

module.exports.check = (nick, socketid) => {
  function success(newnick) {io.to(socketid).emit('check nickname response', {status: 'success', msg: 'The nickname \''+newnick+'\' is available (right now)!'})};
  function wrong(m) {io.to(socketid).emit('check nickname response', {status: 'error', msg: m})};
  function error(n) {io.to(socketid).emit('check nickname response', {status: 'error', msg: 'An error occured, please try again! [#' + n + ']'})};

  var trimed_nick = nick.trim().toLowerCase();
  var checknull = Player.findOne({socketToken: socketid}, 'player.nickname.nick_trimed').exec();
  checknull.then((res) => {
    if (res.player.nickname.nick_trimed == null) {
      var checkexist = Player.countDocuments({'player.nickname.nick_trimed': trimed_nick}).exec();
      checkexist.then((n) => {
        if ((n<=0)) {
          if ((nick.length >= 3) && (nick.length <= 20) && (nick != 'null')) {
            var pnc = /^[ a-zA-Z0-9]*$/;
            if (pnc.test(nick)) {
              success(nick);
            } else wrong('Your nickname didn\'t pass our pattern check, choose another one!')
          } else wrong('Your nickname is probably too long or too short (Min: 3, Max: 20) chars!')
        } else wrong('This nickname is already taken, please choose another one!')
      }).catch((err) => {error('100002')})
    } else wrong('Our systems noticed you already have nickname, try relog!')
  }).catch((err) => {error('100001')})
}
