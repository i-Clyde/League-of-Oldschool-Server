var {io, Player, mongoose, chSelect, escapeHtml} = require('../../server.js');

module.exports.update = (socketid, socketpid, loggedin, team, token, data) => {

  if (loggedin) {

    if ((data.a != false) && (data.b != false)) {
      io.to(token+'-'+team).emit('champion select summoner spell update', {'who': socketpid, 'both': true, 'a': data.a, 'b': data.b})
      Player.findOneAndUpdate({'socketToken': socketid}, {$set: {'beforeGame.summonerspell1': data.a, 'beforeGame.summonerspell2': data.b}}).exec();
    } else if (data.a != false) {
      io.to(token+'-'+team).emit('champion select summoner spell update', {'who': socketpid, 'both': false, 'x': 'a', 'name': data.a})
      Player.findOneAndUpdate({'socketToken': socketid}, {$set: {'beforeGame.summonerspell1': data.a}}).exec();
    } else if (data.b != false) {
      io.to(token+'-'+team).emit('champion select summoner spell update', {'who': socketpid, 'both': false, 'x': 'b', 'name': data.b})
      Player.findOneAndUpdate({'socketToken': socketid}, {$set: {'beforeGame.summonerspell2': data.b}}).exec();
    }

  }

}
