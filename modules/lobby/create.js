var {io, Player, mongoose, CustomLobby, escapeHtml} = require('../../server.js');

// Data: (map, name, password, fastcode, settings: {mode, cheats, minions, cooldowns, teamsize})

module.exports.create = (socketid, socketpid, pNick, islogged, data, cb) => {
  function response(type, msg, data=null, eID=null) {io.to(socketid).emit('custom game create res', {'type': type, 'msg': msg, 'info': data, 'eID': eID})};
  function wrong(msg) {io.to(socketid).emit('error', msg)};
  function info(msg) {io.to(socketid).emit('info', msg)};
  function error(n) {io.to(socketid).emit('error', 'An error occured, please try again! [#' + n + ']')};

  // Check if he's logged in -> online -> owner of any room -> and his name, password, fastcode are correct then check settings if isn't null (if is, set default)
  // If everything is correct (true) -> Create new lobby collection -> Get id of this collection -> Set the creator as owner of room and connected -> Export join to new id
  // -> Emit customlist update (prepand)

  function check(callback) {
    if (!islogged) {wrong('It seems you are not logged in try relog!'); callback({'response': false}); return false} // Is not logged in
    if (!((data.map >= 1) && (data.map <= 4))) {wrong('Selected map is not valid'); callback({'response': false}); return false} // Check map valid
    if (!((data.name.trim().length >= 3) && (data.name.trim().length <= 32))) {wrong("Your name isn't valid (length) - (Min 1, Max 32)"); callback({'response': false}); return false} // Wrong name length

    if (!(((data.password.length >= 1) && (data.password.length <= 24)) || (data.password.length == 0))) {
      wrong("Your password isn't valid (length) - (Max 24)"); callback({'response': false}); return false} // Wrong name length
    if (!(((data.fastcode.length >= 1) && (data.fastcode.length <= 12)) || (data.fastcode.length == 0))) {
      wrong("Your Fastcode isn't valid (length) - (Max 12)" ); callback({'response': false}); return false} // Wrong name length

    if (!((data.settings.mode >= 0) && (data.settings.mode <= 2))) {info("Could not read Select mode setting. Loading default: Blind Pick"); data.settings.mode = 0}; // Valid mode
    if (!((data.settings.cheats >= 0) && (data.settings.cheats <= 1))) {info("Could not read Cheats setting. Loading default: Off"); data.settings.cheats = 1}; // Valid cheats
    if (!((data.settings.minions >= 0) && (data.settings.minions <= 1))) {info("Could not read Minions setting. Loading default: On"); data.settings.minions = 0}; // Valid minions
    if (!((data.settings.cooldowns >= 0) && (data.settings.cooldowns <= 1))) {info("Could not read Cooldowns setting. Loading default: On"); data.settings.cooldowns = 0}; // Valid
    if (!((data.settings.teamsize >= 0) && (data.settings.teamsize <= 5))) {info("Could not read Team size setting. Loading default: 5"); data.settings.teamsize = 4}; //

    Player.findOne({'socketToken': socketid}, 'social.status customGame.inlooby customGame.isloobyking').exec().then(function(res) {

      if (res.social.status == 0) {wrong('You need to be online?! Try relog.'); callback({'response': false}); return false} // Is not online
      if (res.customGame.inlooby == true) {wrong('You are already in lobby? Try relog.'); callback({'response': false}); return false} // Is in lobby

      callback({'response': true}); return true;

    }).catch((err) => {callback({'response': false}); error('578162'); return false})
  }

  check(function(res) {
    if (res.response) {
      CustomLobby.countDocuments({'name': escapeHtml(data.name)}).exec().then(function(nameCounts) {

        if (nameCounts == 0) {

          CustomLobby.findOne({'fastcode': 'p'+socketpid+'-'+data.fastcode}, 'fastcode').exec().then((fastlast) => {
            if (!fastlast) {

            let firstplayer = {}
            firstplayer[socketpid] = pNick;

            let NewCustomGame = new CustomLobby({
              map: data.map,
              name: escapeHtml(data.name.trim()),
              password: (data.password.length > 0)?data.password:null,
              fastcode: (data.fastcode.length > 0)?'p'+socketpid+'-'+data.fastcode:null,
              type: data.settings.mode,
              cheats: data.settings.cheats,
              minions: data.settings.minions,
              cooldowns: data.settings.cooldowns,
              teamsize: data.settings.teamsize,
              createdby: socketpid,
              players: firstplayer,
              status: {
                king: socketpid
              }
            });

            NewCustomGame.save().then(() => {
              let gameID = NewCustomGame._id;
              require('./join').kingjoin(socketid, socketpid, gameID, function(re) {
                if (re) {
                  response('success', 'Custom game successfully created!', {'cGID': gameID})
                  cb({'success': true, 'cGID': gameID});

                  let psswd; if (data.password.length > 0) psswd = true; else psswd = false;
                  io.to('logged users').emit('custom game info update', {'token': data.cGID, 'type': 8, newroom: {'token': gameID, 'name': NewCustomGame.name, 'map': NewCustomGame.map, 'teamsize': NewCustomGame.teamsize, 'password': psswd, 'online': 1, 'createdby': pNick}})
                }
              })
            }).catch((err) => {response('error', 'Something went wrong, while trying to create game! (please, try again later)', 1); console.log(err)});

            } else response('error', 'Your last lobby is still using this fastcode, try with another!')
          }).catch((err) => {response('error', 'An error occured, please try again! [#F28812]')});

        } else {response('error', 'This name already exist, choose another!', 0)}
      }).catch((err) => {response('error', 'An error occured, please try again! [#237164]')});
    } else response('error', null);
  });

}

// _id: 0,
// token: '$_id',
// name: '$name',
// map: '$map',
// teamsize: '$teamsize',
// password: {$cond: { if: {$ne: ['$password', null]}, then: true, else: false} },
// online: '$status.online.connected',
// createdby: '$nick.player.nickname.nick'
