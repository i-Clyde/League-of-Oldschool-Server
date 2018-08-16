var {io, Player, mongoose, gChat, escapeHtml} = require('../../server.js');

module.exports.send = (to, msg, socketid, pid, nickname) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};
  function wrong(msg) {io.to(socketid).emit('error', msg)};

  if ((msg.trim() != "") && (msg.length <= 255)) {
    if (pid != null) {
      if (to == 0) { // If this message is global (global chat)
        var newMessage = new gChat({
          pid: pid,
          msg: escapeHtml(msg.trim()),
          date: Date.now()
        });
        newMessage.save().then(() => {
          io.to('global chat').emit('new message', {'cid': 0, 'msg': escapeHtml(msg.trim()), 'from': pid, 'date': Date.now(), 'fromnick': nickname});
        }).catch((err) => {error('100301')});
      } else { // If this message is not global

        Player.findOne({'player.id': to}, 'socketToken social.status social.relations.friends').exec().then((rcv) => {

          if (rcv.social.relations.friends.includes(pid)) {

            let update = { $push: {} };
            update.$push['messageHistory.'+ to] = [{'you': true, 'msg': escapeHtml(msg.trim()), 'date': Date.now()}];
            Player.findOneAndUpdate({'socketToken': socketid}, update).exec().catch((err) => {error('127691'); console.log('[ERROR] Sending msg: '+err)});
            io.to(socketid).emit('new message', {'cid': to, 'msg': escapeHtml(msg.trim()), 'from': pid, 'date': Date.now(), 'fromnick': nickname})

            let rupdate = { $push: {} };
            rupdate.$push['messageHistory.'+ pid] = [{'you': false, 'msg': escapeHtml(msg.trim()), 'date': Date.now(), 'unread': true}];
            Player.findOneAndUpdate({'player.id': to}, rupdate).exec().catch((err) => {error('127692'); console.log('[ERROR] Sending msg: '+err)});

            if (rcv.social.status != 0) {
              io.to(rcv.socketToken).emit('new message', {'cid': pid, 'msg': escapeHtml(msg.trim()), 'from': pid, 'date': Date.now(), 'fromnick': nickname})
            }


          } else wrong('You can send messages only to your friends')

        })

      }
    }
  }
}
