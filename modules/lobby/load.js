var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

module.exports.load = (socketid, islogged) => {
  function success(msg) {io.to(socketid).emit('success', msg)};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (islogged) {

    CustomLobby.aggregate([
      {
        $lookup: {
          from: 'players',
          localField: 'createdby',
          foreignField: 'player.id',
          as: 'nick'
        }
      },
      {$unwind: '$nick'},
      {
        $project: {
          _id: 0,
          token: '$_id',
          name: '$name',
          map: '$map',
          teamsize: '$teamsize',
          password: {$cond: { if: {$ne: ['$password', null]}, then: true, else: false} },
          online: '$status.online.connected',
          createdby: '$nick.player.nickname.nick'
        }
      }
    ]).exec().then((res) => {
      io.to(socketid).emit('custom game list load res', res)
    }).catch((err) => {console.log(err)})

  } else wrong('It seems you\'re not logged in, cannot load custom games.')

}
