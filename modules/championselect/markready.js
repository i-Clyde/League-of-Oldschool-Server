var {io, Player, CustomLobby, mongoose, chSelect, escapeHtml} = require('../../server.js');

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

                  chSelect.findOne({'token': token}, 'champions token').exec().then((preA) => { var gametoken = preA.token; //////////////
                    CustomLobby.findOne({'_id': token}, 'map cheats minions cooldowns players status.online').exec().then((preB) => { /////////////////////
                      var map;switch(preB.map) {
                        case 1: map=1; break;
                        case 2: map=12; break;
                        case 3: map=10; break;
                        case 4: map=8; break;
                      }
                      var ids = preB.status.online.purple.concat(preB.status.online.blue);
                      Player.find({'player.id': {$in: ids}}, 'player.id player.nickname.nick playerStats.profileicon.icon beforeGame.').exec().then((preC) => { ////////////////////

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
                            // "BLOWFISH": gametoken,
                            "BLOWFISH": "18WUOhi6KZsTtldTsizvHg==",
                            "CONTENT_PATH": "C:/Users/iClyde/Desktop/LOM/GameServer/GameServerApp/Content"
                          }
                        };

                        // load blue
                        preC.forEach(function(index) {
                          let teamx = ((preB.status.online.purple.includes(index.player.id))?'purple':'blue');

                          gameInfo['players'].push({
                            "rank": "BRONZE",
                            "name": index.player.nickname.nick,
                            "champion": preA.champions.taken[teamx][index.player.id],
                            "team": ((preB.status.online.purple.includes(index.player.id))?'PURPLE':'BLUE'),
                            "skin": 1,
                            "summoner1": "Summoner"+index.beforeGame.summonerspell1,
                            "summoner2": "Summoner"+index.beforeGame.summonerspell2,
                            "ribbon": 1,
                            "icon": index.playerStats.profileicon.icon,
                            "runes": {
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
                          });
                        });

                        // load purple
                        // preC.forEach(function(index) {
                        //   gameInfo[players].push({
                        //     "rank": "BRONZE",
                        //     "name": index.player.nickname.nick,
                        //     "champion": preA.champions.taken[],
                        //     "team": "BLUE",
                        //     "skin": 0,
                        //     "summoner1": "SummonerHeal",
                        //     "summoner2": "SummonerFlash",
                        //     "ribbon": 2,
                        //     "icon": 0,
                        //     "runes": {
                        //         "1": 5245,
                        //         "2": 5245,
                        //         "3": 5245,
                        //         "4": 5245,
                        //         "5": 5245,
                        //         "6": 5245,
                        //         "7": 5245,
                        //         "8": 5245,
                        //         "9": 5245,
                        //         "10": 5317,
                        //         "11": 5317,
                        //         "12": 5317,
                        //         "13": 5317,
                        //         "14": 5317,
                        //         "15": 5317,
                        //         "16": 5317,
                        //         "17": 5317,
                        //         "18": 5317,
                        //         "19": 5289,
                        //         "20": 5289,
                        //         "21": 5289,
                        //         "22": 5289,
                        //         "23": 5289,
                        //         "24": 5289,
                        //         "25": 5289,
                        //         "26": 5289,
                        //         "27": 5289,
                        //         "28": 5335,
                        //         "29": 5335,
                        //         "30": 5335
                        //     }
                        //   })
                        // })


                        var json = JSON.stringify(gameInfo); var fs = require('fs');
                        fs.writeFile('./Settings/GameInfo.json', json, {encoding:'utf8',flag:'w'}, function(err) {
                          if (err) console.log(err);
                          console.log('saved');
                          console.log(json);
                        });

                        require('child_process').spawn("C:/Users/iClyde/Desktop/LOM/GameServer-xx/GameServerApp/bin/Release/GameServerApp.exe", { stdio: 'ignore' }, function (err, stdout, stderr) {
                            if (err) {return console.log(err)}
                            console.log(stdout);
                        });

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
