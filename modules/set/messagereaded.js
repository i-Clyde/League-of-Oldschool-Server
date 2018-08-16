var {io, Player, mongoose} = require('../../server.js');

module.exports.set = (socketID, pID, loggedIn) => {

  if (loggedIn) {

    let unsetq = {};
    let query = 'messageHistory.'+ pID;
    Player.findOne({'socketToken': socketID}, query).exec().then((res) => {

      let msgs = res.messageHistory.get(pID);

      for (let i = 0, len = msgs.length; i < len; i++) {
        if (!isNaN(msgs[i]['unread']) && msgs[i]['unread'] === true) unsetq['messageHistory.'+ pID +'.'+ i +'.unread'] = '';
      }

      Player.update({'socketToken': socketID}, {$unset: unsetq } ).exec().catch((err) => {console.log(err)});

    })

  }

}
