var {io, Player, mongoose, gChat, escapeHtml} = require('../../server.js');

module.exports.load = (socketid, pid) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (pid == 0) {

    var agch = gChat.aggregate([
      {
        $sort: {
          _id: -1
        }
      },
      {
        $limit: 40
      },
      {
        $lookup: {
          from: 'players',
          localField: 'pid',
          foreignField: 'player.id',
          as: 'nick'
        }
      },
      {
        $unwind: '$nick'
      },
      {
        $project: {
          _id: null,
          pid: '$pid',
          msg: '$msg',
          date: '$date',
          nickname: '$nick.player.nickname.nick'
        }
      },
      {
        $sort: {
          date: 1
        }
      }
    ]).exec();

    agch.then(agh => {
      io.to(socketid).emit('load old message res', agh);
    }).catch(err => {error('101320')})

  } else {

    io.to(socketid).emit('load old message res', null);

  }

}
