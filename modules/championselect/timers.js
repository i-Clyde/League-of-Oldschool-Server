var {io, Player, mongoose, CustomLobby, chSelect, escapeHtml} = require('../../server.js');

module.exports.start = (token, map) => {

    setTimeout(() => {
      chSelect.countDocuments({'token': token}).exec().then((n) => {
        if (n > 0) {
          chSelect.findOneAndUpdate({'token': token}, {$set: {'ready': true}}).exec().then(() => {
            io.to(token).emit('champion select ready', 'start', 90)
            setTimeout(() => {
              chSelect.findOne({'token': token}, 'layout').exec().then((is) => {

                if (is.layout == false) {

                  io.to(token).emit('champion select force submit');
                  io.to(token).emit('champion select layout phase');

                  setTimeout(() => {
                    chSelect.findOne({'token': token}, 'team.unready team.blue team.purple').exec().then((unready) => {
                      if (unready.team.unready.length > 0) {
                        let blue = unready.team.blue; purple = unready.team.purple;
                        let ids = blue.concat(purple);
                        Player.find({'player.id': {$in: ids}}, 'player.id socketToken').exec().then((leavethem) => {
                          leavethem.forEach(function(index) {
                            if (blue.includes(index.player.id)) {io.sockets.connected[index.socketToken].leave(token+'-b')}
                            else if (purple.includes(index.player.id)) {io.sockets.connected[index.socketToken].leave(token+'-p')}
                          })

                          CustomLobby.findByIdAndUpdate(token, {$set: {'started': false}}).exec();
                          io.in(token).emit('custom game force game stop', 'nick', 2, map);
                          io.to('logged users').emit('custom game info update', {'token': token, 'type': 6});
                          chSelect.findOne({'token': token}).remove().exec();
                        }).catch((err) => {console.log('[ERROR] '+err)});
                      }
                    })
                  }, 1000)
                }
              })
            }, 93000)
          }).catch((err) => {console.log('[ERROR] '+err)})
        }
      })
    }, 7200)

}
