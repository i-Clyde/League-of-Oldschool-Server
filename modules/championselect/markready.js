var {io, Player, CustomLobby, mongoose, InGame, MatchHistory, chSelect, escapeHtml} = require('../../server.js');

module.exports.ready = (socketid, socketpid, loggedin, team, token, champion) => {

  function checkThisChampion(champ) {
    var champlist = ["Aatrox","Ahri","Akali","Alistar","Amumu","Anivia","Annie","Ashe","Azir","Blitzcrank","Brand","Braum","Caitlyn","Cassiopeia","Chogath","Corki","Darius","Diana","Draven","DrMundo","Elise","Evelynn","Ezreal","FiddleSticks","Fiora","Fizz","Galio","Gangplank","Garen","Gnar","Gragas","Graves","Hecarim","Heimerdinger","Irelia","Janna","JarvanIV","Jax","Jayce","Jinx","Kalista","Karma","Karthus","Kassadin","Katarina","Kayle","Kennen","Khazix","KogMaw","Leblanc","LeeSin","Leona","Lissandra","Lucian","Lulu","Lux","Malphite","Malzahar","Maokai","MasterYi","MissFortune","MonkeyKing","Mordekaiser","Morgana","Nami","Nasus","Nautilus","Nidalee","Nocturne","Nunu","Olaf","Orianna","Pantheon","Poppy","Quinn","Rammus","Renekton","Rengar","Riven","Rumble","Ryze","Sejuani","Shaco","Shen","Shyvana","Singed","Sion","Sivir","Skarner","Sona","Soraka","Swain","Syndra","Talon","Taric","Teemo","Thresh","Tristana","Trundle","Tryndamere","TwistedFate","Twitch","Udyr","Urgot","Varus","Vayne","Veigar","Velkoz","Vi","Viktor","Vladimir","Volibear","Warwick","Xerath","XinZhao","Yasuo","Yorick","Zac","Zed","Ziggs","Zilean","Zyra"];

    return(champlist.includes(champ))

  }

  String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
  }

  if (loggedin && checkThisChampion(champion)) {

    let fullteam;
    if (team == 'b') fullteam = 'blue'; else fullteam = 'purple';

    chSelect.findOne({'token': token}, 'champions.taken.'+fullteam+' team.'+fullteam+' team.unready team.ready').exec().then((res) => {

      if (!res.team.ready.includes(socketpid) && res.team.unready.includes(socketpid)) {

        if ((res.champions.taken === null) || !res.champions.taken[fullteam].includes(champion)) {

          let prepare = {}; prepare['champions.taken.'+fullteam] = champion; prepare['team.ready'] = socketpid; prepare['champions.set.'+socketpid] = champion;
          chSelect.update({'token': token}, {$pull: {'team.unready': socketpid}, $push: prepare}).exec().then(() => {

            let nonum = res.team[fullteam].indexOf(socketpid)

            io.to(token+'-'+team).emit('champion select new ready', socketpid, false)
            io.to(token+'-'+((team == 'b')?'p':'b')).emit('champion select new ready', nonum, true)
            io.to(`${socketid}`).emit('champion select new ready', champion, 'success')
            io.to(`${socketid}`).emit('champion select header update', 'WAIT FOR OTHER PLAYERS')

            if (res.team.unready.length === 1) {
              chSelect.update({'token': token}, {$set: {'layout': true}}).exec().then(() => {
                io.to(token).emit('champion select layout phase')
                io.to(token).emit('champion select header update', 'CHOOSE YOU LAYOUT')

                setTimeout(() => {
                  io.to(token).emit('champion select header update', 'PREPARE FOR A BATTLE')

                  chSelect.findOne({'token': token}, 'champions token team.blue team.purple').exec().then((preA) => { var gametoken = preA.token; //////////////
                    CustomLobby.findOne({'_id': token}, 'map cheats minions cooldowns players status.online').exec().then((preB) => { /////////////////////
                      var map;switch(preB.map) {
                        case 1: map=1; break;
                        case 2: map=12; break;
                        case 3: map=10; break;
                        case 4: map=8; break;
                      }
                      var ids = preB.status.online.purple.concat(preB.status.online.blue);
                      Player.find({'player.id': {$in: ids}}, 'player.id player.nickname.nick playerStats.profileicon.icon beforeGame socketToken').exec().then((preC) => { ////////////////////

                        var gameInfo = {
                          "players": [],
                          "game": {
                            "map": map,
                            "gameMode": "LeagueSandbox-Default"
                          },
                          "gameInfo": {
                            "MANACOSTS_ENABLED": (preB.cooldowns == 0)?true:false,
                            "COOLDOWNS_ENABLED": (preB.cooldowns == 0)?true:false,
                            "CHEATS_ENABLED": (preB.cheats == 0)?true:false,
                            "MINION_SPAWNS_ENABLED": (preB.minions == 0)?true:false,
                            "CONTENT_PATH": "../../../.."
                          }
                        };

                        var defaultRunes = {
                            "1": 5245,
                            "2": 5245,
                            "3": 5245,
                            "4": 5245,
                            "5": 5245,
                            "6": 5245,
                            "7": 5245,
                            "8": 5245,
                            "9": 5245,
                            "10": 5317,
                            "11": 5317,
                            "12": 5317,
                            "13": 5317,
                            "14": 5317,
                            "15": 5317,
                            "16": 5317,
                            "17": 5317,
                            "18": 5317,
                            "19": 5289,
                            "20": 5289,
                            "21": 5289,
                            "22": 5289,
                            "23": 5289,
                            "24": 5289,
                            "25": 5289,
                            "26": 5289,
                            "27": 5289,
                            "28": 5335,
                            "29": 5335,
                            "30": 5335
                        }
                        var gamepid = 0, gamePIDtoDB = {};
                        var statementBlue = {}, gPB=0;
                        var statementPurple = {}, gPP=0;
                        var votes = {};
                        // load blue
                        preC.forEach(function(index) {
                          if (preB.status.online.blue.includes(index.player.id)) {
                            io.to(`${index.socketToken}`).emit('game ready your gamepid', gamepid);
                            // console.log('BLUE: GAMEPID OF '+index.player.nickname.nick+' IS:'+ gamepid);

                            gameInfo['players'].push({
                              "rank": "BRONZE",
                              "name": index.player.nickname.nick,
                              "champion": preA.champions.set[index.player.id][0],
                              "team": ((preB.status.online.purple.includes(index.player.id))?'PURPLE':'BLUE'),
                              "skin": 1,
                              "summoner1": "Summoner"+index.beforeGame.summonerspell1,
                              "summoner2": "Summoner"+index.beforeGame.summonerspell2,
                              "ribbon": 1,
                              "icon": index.playerStats.profileicon.icon,
                              "runes": defaultRunes
                            });

                            statementBlue[gPB] = {
                              'playerid': index.player.id,
                              'nick': index.player.nickname.nick,
                              'champion': preA.champions.set[index.player.id][0],
                              'ssA': index.beforeGame.summonerspell1,
                              'ssB': index.beforeGame.summonerspell2,
                              'level': 1,
                              'kills': 0,
                              'deaths': 0,
                              'assists': 0,
                              'items': []
                            };

                            votes[gamepid] = false;
                            io.sockets.connected[socketid].gamePID = gamepid;

                            Player.update({'player.id': index.player.id}, {$set: {'playerInfo.ingamePrivate.gamePID': gamepid}}).exec();
                            gamePIDtoDB[gamepid] = {champion: preA.champions.set[index.player.id][0], pid: index.player.id, status: false, team: 'blue'};
                            gamepid++;gPB++;
                          }
                        });

                        // load purple
                        preC.forEach(function(index) {
                          if (preB.status.online.purple.includes(index.player.id)) {
                            io.to(`${index.socketToken}`).emit('game ready your gamepid', gamepid);
                            // console.log('PURPLE: GAMEPID OF '+index.player.nickname.nick+' IS:'+ gamepid);

                            gameInfo['players'].push({
                              "rank": "BRONZE",
                              "name": index.player.nickname.nick,
                              "champion": preA.champions.set[index.player.id][0],
                              "team": ((preB.status.online.purple.includes(index.player.id))?'PURPLE':'BLUE'),
                              "skin": 1,
                              "summoner1": "Summoner"+index.beforeGame.summonerspell1,
                              "summoner2": "Summoner"+index.beforeGame.summonerspell2,
                              "ribbon": 1,
                              "icon": index.playerStats.profileicon.icon,
                              "runes": defaultRunes
                            });

                            statementPurple[gPP] = {
                              'playerid': index.player.id,
                              'nick': index.player.nickname.nick,
                              'champion': preA.champions.set[index.player.id][0],
                              'ssA': index.beforeGame.summonerspell1,
                              'ssB': index.beforeGame.summonerspell2,
                              'level': 1,
                              'kills': 0,
                              'deaths': 0,
                              'assists': 0,
                              'minions': 0,
                              'items': []
                            };

                            votes[gamepid] = false;
                            io.sockets.connected[socketid].gamePID = gamepid;

                            Player.update({'player.id': index.player.id}, {$set: {'playerInfo.ingamePrivate.gamePID': gamepid}}).exec();
                            gamePIDtoDB[gamepid] = {champion: preA.champions.set[index.player.id][0], pid: index.player.id, status: false, team: 'purple'};
                            gamepid++;gPP++;
                          }
                        })

                        var json = JSON.stringify(gameInfo);
                        var execFile = require('child_process').execFile, fs = require('fs');

                        var args = [];
                        args[2] = "--port";

                        InGame.aggregate([
                          {$project: {_id: 0, port: '$port'}}
                        ]).exec().then((portobj) => {
                          var portarr = []; portobj.forEach(function(i) { portarr.push(i.port) });
                          if (portarr.length > 0) {
                            for (i=0;i<50;i++) {
                              let nowport = parseInt(((i < 10)?'230'+i:'23'+i));
                              if (!(portarr.includes(nowport))) {
                                args[3] = parseInt(((i < 10)?'230'+i:'23'+i));
                                break;
                              }
                            }
                          } else args[3] = 2300;

                          if (typeof args[3] != 'number') {

                            //// TODO: Send to clients that and destroy lobby

                            console.log('All ports are unavailable')
                          } else {
                            fs.writeFile('C:/lol420/GameServer/GameServerConsole/bin/Debug/net472/Settings/GameInfo.json', json, {encoding:'utf8', flag:'w'}, function(err) {
                              if (err) console.log(err);
                              execFile("C:/lol420/GameServer/GameServerConsole/bin/Debug/net472/GameServerConsole.exe", args, {cwd: 'C:/lol420/GameServer/GameServerConsole/bin/Debug/net472', stdio: 'ignore',  maxBuffer: 1024 * 100000}, function (err) {if (err) {return console.log(err)}});
                              var NewGame = new InGame({
                                port: args[3],
                                token: token,
                                forceEnd: true,
                                victory: null,
                                ready: gamePIDtoDB,
                                'votes': votes,
                                purple: statementPurple,
                                blue: statementBlue,
                                settings: {'map': preB.map, 'manacosts': preB.cooldowns, 'minions': preB.minions, 'cooldowns': preB.cooldowns, 'cheats': preB.cheats, 'bluesize': preB.status.online.blue.length, 'purplesize': preB.status.online.purple.length}
                              });
                              NewGame.save().catch((err) => {console.log('[ERROR] '+err)});
                              var NewMatchHistory = new MatchHistory({
                                token: token,
                                forceEnd: true,
                                victory: null,
                                purple: statementPurple,
                                blue: statementBlue,
                                settings: {'map': preB.map, 'manacosts': preB.cooldowns, 'minions': preB.minions, 'cooldowns': preB.cooldowns, 'cheats': preB.cheats, 'bluesize': preB.status.online.blue.length, 'purplesize': preB.status.online.purple.length}
                              });
                              NewMatchHistory.save().catch((err) => {console.log('[ERROR] '+err)});

                              io.in(token).clients((error, socketIds) => {
                                if (error) throw error;
                                socketIds.forEach(socketId => {  io.sockets.connected[socketId].join('in-'+token+'-game');
                                                                 io.sockets.connected[socketId].leave(token);
                                                                 Player.findOneAndUpdate({'socketToken': socketId}, {$set: {'customGame.inlobby': false, 'customGame.lobbyid': null, 'playerInfo.ingamePrivate.isconnected': false, 'playerInfo.ingamePrivate.port': args[3], 'playerInfo.ingame.ingameToken': token}}).exec();
                                                              })
                              });
                              io.in(token+'-p').clients((error, socketIds) => {
                                if (error) throw error;
                                socketIds.forEach(socketId => io.sockets.connected[socketId].leave(token+'-p'));
                              });
                              io.in(token+'-b').clients((error, socketIds) => {
                                if (error) throw error;
                                socketIds.forEach(socketId => io.sockets.connected[socketId].leave(token+'-b'));
                              });

                              setTimeout(() => {
                                io.to('in-'+token+'-game').emit('game successfully started info', gamePIDtoDB)
                                CustomLobby.findOneAndRemove({'_id': token}).exec();
                                chSelect.findOneAndRemove({'token': token}).exec();
                              }, 2500)
                            });
                            setTimeout(() => {
                              console.log('[GAME-SERVER #'+args[3]+']', 'Game #'+args[3]+' killed!')
                              io.of('/game-server').to(args[3]).emit("Try close", true)
                            }, 900000)
                          }

                        }).catch((err) => console.log(err))

                      }).catch((err) => {console.log(err)})

                    }).catch((err) => {console.log(err)})

                  }).catch((err) => {console.log(err)})

                }, 11000)
              })

            }

          }).catch((err) => {console.log(err)})

        } else io.to(`${socketid}`).emit('error', 'This champion is already taken or unavailable, please choose another!')

      } else io.to(`${socketid}`).emit('error', 'You are already ready!')

    }).catch((err) => {console.log(err)})
  } // else io.to(`${socketid}`).emit('error', 'Unknown champion, try with another one!')
}
