var {io, Player, bcrypt, mongoose, validator} = require('../../server.js');

module.exports.register = (data, socketid, socketip) => {
  function wrong(m = 'Something went wrong!') {
    io.to(`${socketid}`).emit('register response', {status: 'error', msg: m})}
  function error(code) {
    io.to(`${socketid}`).emit('register response', {status: 'error', msg: 'An error occurred while trying to register you, please try again. [#'+code+']'})}
  function success(nick) {
    io.to(`${socketid}`).emit('register response', {status: 'success', msg: 'Our system successfully registered your essence! Have fun! (You can log in now)'})
    console.log('[INFO] New player with login \''+nick+'\' registered!') // info about new player in server console
  }

  let NewLogin = data.login.trim().toLowerCase();
  var exist = Player.countDocuments({'player.login': NewLogin}).exec();
  exist.then((n) => {
    if (n == 0) {
      if ((data.password.length >= 6) && (data.password.length <= 28)) {
        if (data.password === data.cpassword) {
          var patternick = /^[a-zA-Z0-9]*$/;
          if ((patternick.test(data.login))) {
            if (validator.validate(data.email)) {
              var pid = Player.findOne({}, 'player.id', { sort: { 'player.id' : -1 } }).exec();
              pid.then((n) => {
                var NewPlayer = new Player({
                  player: {
                    id: ( (n == null) || (n == undefined) ) ? 1 : n.player.id+1,
                    login: NewLogin
                  },
                  playerPrivateData: {
                    email: data.email,
                    password: bcrypt.hashSync(data.password, 8)
                  },
                  playerInfo: {
                    accountFirstIP: socketip
                  },
                  socketToken: socketid
                });
                NewPlayer.save().then(() => {success(NewLogin)}).catch((err) => {error('000012')});
              }).catch((err) => {error('000011')})
            } else wrong('Something is wrong with your email address, our validate system highlighted this email as not valid!')
          } else wrong('Your username doesn\'t match with our patterns, please choose another one! '+data.login)
        } else wrong('Your passwords are different, please correct that!')
      } else wrong('Something is wrong with your password (Min: 6, Max: 28) chars!')
    } else wrong('This username is already taken, please choose another one!')
  }).catch((err) => {error('000010')})
}
