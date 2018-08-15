var {io, Player, mongoose, gChat, escapeHtml} = require('../../server.js');

module.exports.send = (to, msg, socketid, pid, nickname) => {
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  if (to == 0) { // If this message is global (global chat)
    if ((msg.trim() != "") && (msg.length <= 255)) {
      if (pid != null) {
        var newMessage = new gChat({
          pid: pid,
          msg: escapeHtml(msg.trim()),
          date: Date.now()
        });
        newMessage.save().then(() => {
          io.to('global chat').emit('new message', {'cid': 0, 'msg': escapeHtml(msg), 'from': pid, 'date': Date.now(), 'fromnick': nickname});
        }).catch((err) => {error('100301')});
      }
    }
  } else { // If this message is not global

  }

}
